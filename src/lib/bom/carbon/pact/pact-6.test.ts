/**
 * PACT V3 Phase 6 — host auth stub + List/Get footprints + Events.
 * Run: npm run test:bom:pact:6
 */

import assert from "node:assert/strict";
import {
  clearBomLocal,
  newEntityId,
  updateBomLocal,
} from "@/lib/bom/local-store";
import type { BomItem, Product } from "@/lib/bom/types";
import {
  ensureCarbonLibrary,
  localApproveCalculation,
  localApproveMapping,
  localRunCalculation,
  localUpsertMapping,
} from "../index";
import {
  buildCompanyUrn,
  buildCustomProductUrn,
  createManualIdentityMapping,
  localExportPactV3,
  listExchanges,
  toProductFootprint,
  validateProductFootprintSchema,
} from "./index";

import {
  hasScope,
  issueClientCredentialsToken,
  PACT_HOST_DEFAULT_CLIENT_ID,
  PACT_HOST_DEFAULT_CLIENT_SECRET,
  requireBearerAuth,
} from "./host/auth";
import {
  getHostedProductFootprint,
  listHostedProductFootprints,
} from "./host/catalog";
import {
  fetchPeerAccessToken,
  getPeerFootprint,
  listPeerFootprints,
} from "./host/client";
import { acceptHostEvent } from "./host/events";
import { GET as getFootprint } from "@/app/3/footprints/[id]/route";
import { GET as listFootprints } from "@/app/3/footprints/route";
import { POST as postEvent } from "@/app/3/events/route";
import { POST as postToken } from "@/app/auth/token/route";

const companyId = "co-pact-6";
clearBomLocal(companyId);

const { factors } = ensureCarbonLibrary(companyId);
const steel = factors.find((f) => f.factorCode === "STEEL_CRUDE");
assert.ok(steel, "demo steel factor");

const productId = newEntityId("prod");
const bomId = "bom-pact-6";
const rootId = newEntityId("item");
const steelId = newEntityId("item");
const now = new Date().toISOString();

const product: Product = {
  id: productId,
  companyId,
  productNumber: "WIDGET-PACT-6",
  name: "PACT 6 Widget",
  description: "Host surface demo product",
  category: "machinery",
  declaredUnit: "piece",
  status: "active",
  createdAt: now,
  updatedAt: now,
};

function item(
  partial: Partial<BomItem> & {
    id: string;
    partNumber: string;
    parentItemId: string | null;
  }
): BomItem {
  return {
    companyId,
    bomId,
    description: partial.partNumber,
    itemType: "material",
    quantity: 1,
    unit: "kg",
    scrapRate: 0,
    yieldRate: 1,
    sequenceNo: 0,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

updateBomLocal(companyId, (s) => ({
  ...s,
  products: [...s.products, product],
  items: [
    item({
      id: rootId,
      partNumber: "WIDGET-PACT-6",
      parentItemId: null,
      itemType: "product",
      unit: "piece",
      quantity: 1,
    }),
    item({
      id: steelId,
      partNumber: "STEEL_CRUDE",
      parentItemId: rootId,
      quantity: 2,
      sequenceNo: 1,
    }),
  ],
}));

const mapping = localUpsertMapping(companyId, {
  bomItemId: steelId,
  emissionFactorId: steel!.id,
  confidence: 0.9,
  status: "suggested",
});
localApproveMapping(companyId, mapping.id);

const calc = localRunCalculation(companyId, {
  bomId,
  productId,
  requireApproved: true,
});
assert.equal(calc.status, "completed");

// Unapproved → export gates fail
const blocked = toProductFootprint({
  companyId,
  companyName: "Qlimwelt Demo",
  calculation: calc,
  product,
  companyIds: [buildCompanyUrn("custom", "qlimwelt")],
  productIds: [buildCustomProductUrn("qlimwelt", product.productNumber)],
});
assert.equal(blocked.ok, false);
assert.ok(
  blocked.ok === false &&
    blocked.result.issues.some((i) => i.path === "approvalStatus")
);

const approved = localApproveCalculation(companyId, calc.id, {
  approvedBy: "reviewer-6",
});
assert.equal(approved.approvalStatus, "approved");

// Still missing persisted identity mappings for orchestration path
createManualIdentityMapping(companyId, {
  scheme: "company",
  value: "qlimwelt",
  urn: buildCompanyUrn("custom", "qlimwelt"),
  status: "confirmed",
});
createManualIdentityMapping(companyId, {
  productId,
  scheme: "custom",
  value: product.productNumber,
  urn: buildCustomProductUrn("qlimwelt", product.productNumber),
  status: "confirmed",
});

const mapped = toProductFootprint({
  companyId,
  companyName: "Qlimwelt Demo",
  calculation: approved,
  product,
});
assert.equal(mapped.ok, true, JSON.stringify(mapped));
if (mapped.ok) {
  const schema = validateProductFootprintSchema(mapped.footprint);
  assert.equal(schema.ok, true, JSON.stringify(schema.issues));
  assert.equal(mapped.footprint.status, "Active");
  assert.equal(mapped.footprint.pcf.declaredUnitOfMeasurement, "piece");
  assert.ok(Number(mapped.footprint.pcf.pcfExcludingBiogenicUptake) > 0);
}

const bundle = localExportPactV3(companyId, approved.id, {
  companyName: "Qlimwelt Demo",
  idempotencyKey: `pact-6-export-${approved.id}`,
});
assert.ok(bundle.footprint.id);
assert.equal(bundle.schema.ok, true);
assert.equal(bundle.semantics.ok, true);

const again = localExportPactV3(companyId, approved.id, {
  companyName: "Qlimwelt Demo",
  idempotencyKey: `pact-6-export-${approved.id}`,
});
assert.equal(again.exchangeId, bundle.exchangeId, "idempotent exchange");

const exports = listExchanges(companyId, { kind: "export" });
assert.ok(exports.some((e) => e.id === bundle.exchangeId && e.status === "completed"));


async function main() {
  // Auth stub
  const denied = requireBearerAuth(null);
  assert.equal(denied.ok, false);
  let threw = false;
  try {
    issueClientCredentialsToken({ clientId: "nope", clientSecret: "nope" });
  } catch {
    threw = true;
  }
  assert.equal(threw, true);

  const token = issueClientCredentialsToken({
    clientId: PACT_HOST_DEFAULT_CLIENT_ID,
    clientSecret: PACT_HOST_DEFAULT_CLIENT_SECRET,
    companyId,
  });
  const auth = requireBearerAuth(`Bearer ${token.access_token}`);
  assert.equal(auth.ok, true);
  if (auth.ok) {
    assert.equal(auth.claims.companyId, companyId);
    assert.equal(hasScope(auth.claims, "footprint:list"), true);
  }

  const listed = listHostedProductFootprints(companyId);
  assert.ok(listed.some((f) => f.id === bundle.footprint.id));
  const one = getHostedProductFootprint(companyId, bundle.footprint.id);
  assert.ok(one);
  assert.equal(one!.id, bundle.footprint.id);

  const peerToken = await fetchPeerAccessToken({
    tokenUrl: "local:",
    clientId: PACT_HOST_DEFAULT_CLIENT_ID,
    clientSecret: PACT_HOST_DEFAULT_CLIENT_SECRET,
    companyId,
  });
  const peerList = await listPeerFootprints(
    { baseUrl: `local:${companyId}`, accessToken: peerToken.access_token },
    { status: "Active" }
  );
  assert.ok(peerList.some((f) => f.id === bundle.footprint.id));
  const peerOne = await getPeerFootprint(
    { baseUrl: `local:${companyId}`, accessToken: peerToken.access_token },
    bundle.footprint.id
  );
  assert.equal(peerOne?.id, bundle.footprint.id);

  const accepted = acceptHostEvent(companyId, {
    type: "org.wbcsd.pathfinder.ProductFootprintRequest.Created.v1",
    id: "evt-pact-6-1",
    source: "//test/pact-6",
    specversion: "1.0",
    data: { productIds: [buildCustomProductUrn("qlimwelt", product.productNumber)] },
  });
  assert.equal(accepted.kind, "event_request_created");
  assert.ok(
    listExchanges(companyId, { kind: "event_request_created" }).some(
      (e) => e.id === accepted.exchangeId && e.status === "completed"
    )
  );

  const tokenRes = await postToken(
    new Request("http://localhost/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: PACT_HOST_DEFAULT_CLIENT_ID,
        client_secret: PACT_HOST_DEFAULT_CLIENT_SECRET,
        company_id: companyId,
      }),
    })
  );
  assert.equal(tokenRes.status, 200);
  const tokenJson = (await tokenRes.json()) as { access_token: string };

  const unauth = await listFootprints(
    new Request("http://localhost/3/footprints", { method: "GET" })
  );
  assert.equal(unauth.status, 401);

  const listRes = await listFootprints(
    new Request("http://localhost/3/footprints?status=Active", {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    })
  );
  assert.equal(listRes.status, 200);
  const listJson = (await listRes.json()) as { data: Array<{ id: string }> };
  assert.ok(listJson.data.some((f) => f.id === bundle.footprint.id));

  const getRes = await getFootprint(
    new Request(`http://localhost/3/footprints/${bundle.footprint.id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    }),
    { params: Promise.resolve({ id: bundle.footprint.id }) }
  );
  assert.equal(getRes.status, 200);

  const missing = await getFootprint(
    new Request("http://localhost/3/footprints/00000000-0000-4000-8000-000000000099", {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    }),
    { params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000099" }) }
  );
  assert.equal(missing.status, 404);

  const eventRes = await postEvent(
    new Request("http://localhost/3/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        "Content-Type": "application/cloudevents+json",
      },
      body: JSON.stringify({
        type: "org.wbcsd.pathfinder.ProductFootprint.Published.v1",
        id: "evt-pact-6-pub",
        source: "//test/pact-6",
        specversion: "1.0",
        data: { pfIds: [bundle.footprint.id] },
      }),
    })
  );
  assert.equal(eventRes.status, 200);

  console.log("pact-6.test.ts: all assertions passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
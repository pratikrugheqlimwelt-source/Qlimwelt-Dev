/**
 * PACT V3 Phase 5 — identity confirm/reject + exchange/record listing.
 * Run: npm run test:bom:pact:5
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clearBomLocal,
  newEntityId,
  updateBomLocal,
} from "@/lib/bom/local-store";
import type { BomItem, Product } from "@/lib/bom/types";
import {
  buildCustomProductUrn,
  confirmIdentityMapping,
  createManualIdentityMapping,
  listIdentityMappings,
  localImportPactV3,
  localListPactExchanges,
  localListSupplierPcfRecords,
  rejectIdentityMapping,
} from "./index";

const here = dirname(fileURLToPath(import.meta.url));
const companyId = "co-pact-5";
clearBomLocal(companyId);

const productId = newEntityId("prod");
const bomId = "bom-pact-5";
const rootId = newEntityId("item");
const steelId = newEntityId("item");
const now = new Date().toISOString();
const productUrn = buildCustomProductUrn("qlimwelt", "PN-500");

updateBomLocal(companyId, (s) => ({
  ...s,
  products: [
    ...s.products,
    {
      id: productId,
      companyId,
      productNumber: "PN-500",
      name: "Phase 5 demo",
      description: null,
      category: "machinery",
      declaredUnit: "piece",
      status: "active",
      createdAt: now,
      updatedAt: now,
    } as Product,
  ],
  items: [
    {
      id: rootId,
      companyId,
      bomId,
      parentItemId: null,
      partNumber: "PN-500",
      description: "root",
      itemType: "product",
      quantity: 1,
      unit: "piece",
      scrapRate: 0,
      yieldRate: 1,
      sequenceNo: 0,
      createdAt: now,
      updatedAt: now,
    } as BomItem,
    {
      id: steelId,
      companyId,
      bomId,
      parentItemId: rootId,
      partNumber: "STEEL-5",
      description: "steel",
      itemType: "material",
      quantity: 2,
      unit: "kg",
      scrapRate: 0,
      yieldRate: 1,
      sequenceNo: 1,
      createdAt: now,
      updatedAt: now,
    } as BomItem,
  ],
}));

const candidate = createManualIdentityMapping(companyId, {
  productId,
  bomItemId: steelId,
  scheme: "custom",
  value: "STEEL-5-CAND",
  urn: buildCustomProductUrn("qlimwelt", "STEEL-5-CAND"),
  status: "candidate",
});
assert.equal(candidate.status, "candidate");

const confirmed = confirmIdentityMapping(companyId, candidate.id);
assert.equal(confirmed.status, "confirmed");
assert.equal(confirmed.bomItemId, steelId);

const other = createManualIdentityMapping(companyId, {
  productId,
  bomItemId: steelId,
  scheme: "custom",
  value: "STEEL-5-REJ",
  urn: buildCustomProductUrn("qlimwelt", "STEEL-5-REJ"),
  status: "candidate",
});
const rejected = rejectIdentityMapping(companyId, other.id);
assert.equal(rejected.status, "rejected");

const listed = listIdentityMappings(companyId, { productId });
assert.ok(listed.some((m) => m.id === confirmed.id && m.status === "confirmed"));
assert.ok(listed.some((m) => m.id === rejected.id && m.status === "rejected"));

createManualIdentityMapping(companyId, {
  productId,
  bomItemId: steelId,
  scheme: "custom",
  value: "PN-500",
  urn: productUrn,
  status: "confirmed",
});

const fixture = JSON.parse(
  readFileSync(join(here, "fixtures/product-footprint-valid.json"), "utf8")
) as Record<string, unknown>;
fixture.id = "11111111-1111-4111-8111-111111111115";
fixture.productIds = [productUrn];
fixture.companyIds = ["urn:pathfinder:company:custom:example-gmbh"];

const imported = localImportPactV3(companyId, fixture, {
  idempotencyKey: "pact-5-import-1",
});
assert.ok(imported.record.id);
assert.equal(imported.schema.ok, true);

const records = localListSupplierPcfRecords(companyId);
assert.ok(records.some((r) => r.id === imported.record.id));

const exchanges = localListPactExchanges(companyId);
assert.ok(exchanges.some((e) => e.id === imported.exchangeId && e.kind === "import"));
assert.equal(
  localListPactExchanges(companyId, { direction: "inbound" }).length >= 1,
  true
);

console.log("pact-5 tests passed");

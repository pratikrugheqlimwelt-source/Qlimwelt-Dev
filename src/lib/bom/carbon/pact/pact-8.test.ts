/**
 * PACT V3 Phase 8 — DB mappers + API→DB→local persist fallback.
 * Run: npm run test:bom:pact:8
 */

import assert from "node:assert/strict";
import {
  mapPactEndpoint,
  mapPactExchange,
  mapProductIdentityMapping,
  mapSupplierPcfRecord,
} from "./db-service";
import {
  persistCreateProductIdentityMapping,
  persistListPactExchanges,
  persistListProductIdentityMappings,
  persistListSupplierPcfRecords,
} from "./persist";
import { clearBomLocal, newEntityId } from "@/lib/bom/local-store";
import {
  localCreatePactExchange,
  localCreateSupplierPcfRecord,
} from "./store";
import { buildCustomProductUrn } from "./identity/urn";
import type { ExportAuthContext } from "@/lib/export/auth";

const companyId = "co-pact-8";

function failingCtx(): ExportAuthContext {
  const failingFrom = () => ({
    select: () => ({
      eq: () => ({
        order: async () => ({ data: null, error: { message: "relation missing" } }),
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: { message: "relation missing" },
          }),
          order: async () => ({
            data: null,
            error: { message: "relation missing" },
          }),
          single: async () => ({
            data: null,
            error: { message: "relation missing" },
          }),
        }),
        maybeSingle: async () => ({
          data: null,
          error: { message: "relation missing" },
        }),
        single: async () => ({
          data: null,
          error: { message: "relation missing" },
        }),
      }),
    }),
    insert: () => ({
      select: () => ({
        single: async () => ({
          data: null,
          error: { message: "relation missing" },
        }),
      }),
    }),
    update: () => ({
      eq: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({
              data: null,
              error: { message: "relation missing" },
            }),
          }),
        }),
      }),
    }),
    upsert: () => ({
      select: () => ({
        single: async () => ({
          data: null,
          error: { message: "relation missing" },
        }),
      }),
    }),
  });

  return {
    supabase: { from: failingFrom } as unknown as ExportAuthContext["supabase"],
    userId: "user-pact-8",
    email: "pact8@example.com",
    companyId,
    role: "admin",
  };
}

async function main() {
  clearBomLocal(companyId);
  const now = new Date().toISOString();

  // ─── Mapper round-trips ──────────────────────────────────────────────────

  {
    const endpoint = mapPactEndpoint({
      id: "ep-1",
      company_id: companyId,
      name: "Peer A",
      base_url: "https://peer.example/3",
      protocol_version: "3.0.3",
      auth_type: "oauth2_client_credentials",
      client_id: "cid",
      client_secret_ref: "vault:peer-a",
      status: "active",
      last_success_at: null,
      last_error: null,
      created_at: now,
      updated_at: now,
    });
    assert.equal(endpoint.baseUrl, "https://peer.example/3");
    assert.equal(endpoint.clientSecretRef, "vault:peer-a");
    assert.equal(endpoint.companyId, companyId);
    assert.equal(endpoint.authType, "oauth2_client_credentials");
  }

  {
    const urn = buildCustomProductUrn("qlimwelt", "PN-800");
    const mapping = mapProductIdentityMapping({
      id: "map-1",
      company_id: companyId,
      product_id: "prod-1",
      bom_item_id: null,
      scheme: "custom",
      value: "PN-800",
      urn,
      status: "confirmed",
      confidence: 0.9,
      source: "manual",
      created_at: now,
      updated_at: now,
    });
    assert.equal(mapping.productId, "prod-1");
    assert.equal(mapping.urn, urn);
    assert.equal(mapping.confidence, 0.9);
    assert.equal(mapping.scheme, "custom");
  }

  {
    const record = mapSupplierPcfRecord({
      id: "rec-1",
      company_id: companyId,
      supplier_id: null,
      product_identity_urns: ["urn:pathfinder:product:custom:x"],
      declared_unit: "kg",
      declared_unit_amount: 1,
      pcf_excluding_biogenic: 2.5,
      pcf_including_biogenic: 2.7,
      reference_period_start: "2024-01-01",
      reference_period_end: "2024-12-31",
      validity_period_start: null,
      validity_period_end: null,
      geography: "DE",
      cross_sectoral_standards: ["GHG Protocol Product Standard"],
      secondary_emission_factor_sources: [{ name: "ecoinvent" }],
      verification_json: { covered: false },
      dqi_json: null,
      pact_spec_version: "3.0.0",
      raw_payload: { id: "fp-1" },
      status: "received",
      mapped_bom_item_id: null,
      resulting_factor_id: null,
      resulting_mapping_id: null,
      pact_exchange_id: "ex-1",
      created_at: now,
      updated_at: now,
    });
    assert.equal(record.pcfExcludingBiogenic, 2.5);
    assert.deepEqual(record.productIdentityUrns, [
      "urn:pathfinder:product:custom:x",
    ]);
    assert.equal(record.pactExchangeId, "ex-1");
    assert.equal(record.secondaryEmissionFactorSources[0]?.name, "ecoinvent");
  }

  {
    const exchange = mapPactExchange({
      id: "ex-1",
      company_id: companyId,
      direction: "inbound",
      kind: "import",
      endpoint_id: null,
      idempotency_key: "import:fp-1",
      correlation_id: null,
      request_id: null,
      status: "completed",
      http_status: 200,
      error_code: null,
      error_detail: null,
      footprint_id: "fp-1",
      calculation_id: null,
      supplier_pcf_record_id: "rec-1",
      request_payload: { id: "fp-1" },
      response_payload: { recordId: "rec-1" },
      created_at: now,
      completed_at: now,
    });
    assert.equal(exchange.idempotencyKey, "import:fp-1");
    assert.equal(exchange.supplierPcfRecordId, "rec-1");
    assert.equal(exchange.httpStatus, 200);
    assert.equal(exchange.completedAt, now);
  }

  // ─── Persist fallback when DB unavailable ────────────────────────────────

  const ctx = failingCtx();

  localCreatePactExchange(companyId, {
    direction: "outbound",
    kind: "export",
    idempotencyKey: "export:calc-8",
    calculationId: newEntityId("calc"),
    status: "completed",
  });

  localCreateSupplierPcfRecord(companyId, {
    productIdentityUrns: [buildCustomProductUrn("qlimwelt", "PN-800")],
    declaredUnit: "kg",
    pcfExcludingBiogenic: 1.1,
    crossSectoralStandards: [],
    secondaryEmissionFactorSources: [],
    rawPayload: { id: "fp-local" },
    status: "received",
  });

  const exchanges = await persistListPactExchanges(ctx);
  assert.ok(
    exchanges.some((e) => e.idempotencyKey === "export:calc-8"),
    "list exchanges falls back to local"
  );

  const records = await persistListSupplierPcfRecords(ctx);
  assert.ok(records.length >= 1, "list records falls back to local");

  const mapping = await persistCreateProductIdentityMapping(ctx, {
    productId: newEntityId("prod"),
    scheme: "custom",
    value: "PN-800",
    urn: buildCustomProductUrn("qlimwelt", "PN-800"),
    status: "confirmed",
    source: "manual",
  });
  assert.equal(mapping.value, "PN-800");
  assert.equal(mapping.status, "confirmed");

  const listed = await persistListProductIdentityMappings(ctx, {
    productId: mapping.productId!,
  });
  assert.equal(listed.length, 1);
  assert.equal(listed[0]!.id, mapping.id);

  console.log("pact-8 tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

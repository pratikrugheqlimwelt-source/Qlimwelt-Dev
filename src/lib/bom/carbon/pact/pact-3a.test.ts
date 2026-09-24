/**
 * PACT V3 Phase 3a — types, local store, stubs.
 * Run: npm run test:bom:pact
 */

import assert from "node:assert/strict";
import { clearBomLocal } from "../../local-store";
import {
  beginExchange,
  buildCompanyUrn,
  buildCustomProductUrn,
  completeExchange,
  createManualIdentityMapping,
  findExactConfirmedByUrn,
  fromProductFootprint,
  listExchanges,
  localCreatePactEndpoint,
  localCreateSupplierPcfRecord,
  localListPactEndpoints,
  localListSupplierPcfRecords,
  parsePactUrn,
  PACT_SPEC_VERSION,
  toProductFootprint,
  validateProductFootprintSchema,
} from "./index";

const companyId = "co-pact-3a";

clearBomLocal(companyId);

assert.equal(PACT_SPEC_VERSION, "3.0.3", "pinned protocol version");

const endpoint = localCreatePactEndpoint(companyId, {
  name: "peer-demo",
  baseUrl: "https://example.invalid/pact",
  clientId: "demo-client",
  clientSecretRef: "env:PACT_PEER_SECRET",
});
assert.equal(endpoint.protocolVersion, "3.0.3");
assert.equal(localListPactEndpoints(companyId).length, 1);

const productUrn = buildCustomProductUrn("qlimwelt", "PN-100");
const companyUrn = buildCompanyUrn("custom", "acme");
assert.ok(productUrn.startsWith("urn:pathfinder:product:"));
assert.equal(parsePactUrn(companyUrn).kind, "company");

const mapping = createManualIdentityMapping(companyId, {
  productId: "prod-1",
  scheme: "custom",
  value: "PN-100",
  urn: productUrn,
  status: "confirmed",
});
assert.equal(findExactConfirmedByUrn(companyId, productUrn)?.id, mapping.id);

const exchange1 = beginExchange(companyId, {
  direction: "outbound",
  kind: "export",
  idempotencyKey: "export-calc-1",
  calculationId: "calc-1",
});
const exchange2 = beginExchange(companyId, {
  direction: "outbound",
  kind: "export",
  idempotencyKey: "export-calc-1",
  calculationId: "calc-1",
});
assert.equal(exchange1.id, exchange2.id, "idempotent exchange create");
assert.equal(listExchanges(companyId).length, 1);

const done = completeExchange(companyId, exchange1.id, {
  status: "completed",
  httpStatus: 200,
  footprintId: "fp-1",
  responsePayload: { ok: true },
});
assert.equal(done.status, "completed");
assert.ok(done.completedAt);

const record = localCreateSupplierPcfRecord(companyId, {
  productIdentityUrns: [productUrn],
  declaredUnit: "kilogram",
  pcfExcludingBiogenic: 1.2,
  rawPayload: { id: "fp-inbound-1" },
  status: "received",
});
assert.equal(localListSupplierPcfRecords(companyId).length, 1);
assert.equal(record.pactSpecVersion, "3.0.0");

const schema = validateProductFootprintSchema({});
assert.equal(schema.ok, false);
assert.equal(schema.issues[0]?.category, "SCHEMA_INVALID");

let mapperThrew = false;
try {
  toProductFootprint({ companyId, calculationId: "calc-1" });
} catch {
  mapperThrew = true;
}
assert.equal(mapperThrew, true, "export mapper stub throws");

let importThrew = false;
try {
  fromProductFootprint({ companyId, payload: {} });
} catch {
  importThrew = true;
}
assert.equal(importThrew, true, "import mapper stub throws");

console.log("pact-3a.test.ts: all assertions passed");

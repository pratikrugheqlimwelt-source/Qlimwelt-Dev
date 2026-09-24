/**
 * PACT V3 Phase 7 — product PCF summary helpers.
 * Run: npm run test:bom:pact:7
 */

import assert from "node:assert/strict";
import { buildProductPcfSummary } from "./summary";
import type { BomItem } from "../../types";
import type { CarbonMapping, PcfCalculation } from "../types";
import type {
  PactExchange,
  ProductIdentityMapping,
  SupplierPcfRecord,
} from "./types";

const now = new Date().toISOString();

const items: BomItem[] = [
  {
    id: "root",
    companyId: "co",
    bomId: "bom",
    parentItemId: null,
    partNumber: "WIDGET",
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
    id: "steel",
    companyId: "co",
    bomId: "bom",
    parentItemId: "root",
    partNumber: "STEEL",
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
  {
    id: "paint",
    companyId: "co",
    bomId: "bom",
    parentItemId: "root",
    partNumber: "PAINT",
    description: "paint",
    itemType: "material",
    quantity: 0.1,
    unit: "kg",
    scrapRate: 0,
    yieldRate: 1,
    sequenceNo: 2,
    createdAt: now,
    updatedAt: now,
  } as BomItem,
];

const empty = buildProductPcfSummary({
  items,
  mappings: [],
  calculations: [],
  supplierRecords: [],
  identityMappings: [],
  exchanges: [],
});
assert.equal(empty.totalKgco2e, null);
assert.equal(empty.mappableItemCount, 2);
assert.equal(empty.coveragePercent, 0);
assert.equal(empty.pactConnection, "not_configured");

const mappings: CarbonMapping[] = [
  {
    id: "map-1",
    companyId: "co",
    bomItemId: "steel",
    emissionFactorId: "ef-1",
    method: "qty_x_ef",
    confidence: 0.9,
    status: "approved",
    createdAt: now,
    updatedAt: now,
  },
];

const calcs: PcfCalculation[] = [
  {
    id: "calc-1",
    companyId: "co",
    productId: "prod",
    bomId: "bom",
    assessmentId: null,
    status: "completed",
    totalKgco2e: 12.3456,
    declaredUnit: "piece",
    methodology: "bom_recursive_v1",
    warnings: [],
    createdAt: now,
    approvalStatus: "approved",
    isStale: false,
  } as PcfCalculation,
];

const supplierRecords: SupplierPcfRecord[] = [
  {
    id: "rec-1",
    companyId: "co",
    productIdentityUrns: ["urn:pathfinder:product:custom:qlimwelt:STEEL"],
    crossSectoralStandards: [],
    secondaryEmissionFactorSources: [],
    pactSpecVersion: "3.0.0",
    rawPayload: {},
    status: "received",
    createdAt: now,
    updatedAt: now,
  } as SupplierPcfRecord,
  {
    id: "rec-2",
    companyId: "co",
    productIdentityUrns: ["urn:pathfinder:product:custom:qlimwelt:PAINT"],
    crossSectoralStandards: [],
    secondaryEmissionFactorSources: [],
    pactSpecVersion: "3.0.0",
    rawPayload: {},
    status: "accepted",
    createdAt: now,
    updatedAt: now,
  } as SupplierPcfRecord,
];

const identities: ProductIdentityMapping[] = [
  {
    id: "id-1",
    companyId: "co",
    productId: "prod",
    scheme: "custom",
    value: "WIDGET",
    urn: "urn:pathfinder:product:custom:qlimwelt:WIDGET",
    status: "confirmed",
    source: "manual",
    createdAt: now,
    updatedAt: now,
  },
];

const exchanges: PactExchange[] = [
  {
    id: "ex-1",
    companyId: "co",
    direction: "outbound",
    kind: "export",
    idempotencyKey: "export-1",
    status: "completed",
    createdAt: now,
    completedAt: now,
  } as PactExchange,
];

const summary = buildProductPcfSummary({
  items,
  mappings,
  calculations: calcs,
  supplierRecords,
  identityMappings: identities,
  exchanges,
});

assert.equal(summary.totalKgco2e, 12.3456);
assert.equal(summary.declaredUnit, "piece");
assert.equal(summary.calculationId, "calc-1");
assert.equal(summary.coveragePercent, 50); // 1 of 2 mappable
assert.equal(summary.supplierRecordsPending, 1);
assert.equal(summary.supplierRecordsAccepted, 1);
assert.equal(summary.identityMappingsConfirmed, 1);
assert.equal(summary.exchangeCount, 1);
assert.equal(summary.pactConnection, "export_ready");
assert.match(summary.pactConnectionLabel, /Export-ready/i);

console.log("pact-7.test.ts: all assertions passed");

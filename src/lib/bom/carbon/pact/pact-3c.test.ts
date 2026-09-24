/**
 * PACT V3 Phase 3c — export mapper + orchestration.
 * Run: npm run test:bom:pact:3c
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

const companyId = "co-pact-3c";
clearBomLocal(companyId);

const { factors } = ensureCarbonLibrary(companyId);
const steel = factors.find((f) => f.factorCode === "STEEL_CRUDE");
assert.ok(steel, "demo steel factor");

const productId = newEntityId("prod");
const bomId = "bom-pact-3c";
const rootId = newEntityId("item");
const steelId = newEntityId("item");
const now = new Date().toISOString();

const product: Product = {
  id: productId,
  companyId,
  productNumber: "WIDGET-PACT-3C",
  name: "PACT 3c Widget",
  description: "Export mapper demo product",
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
      partNumber: "WIDGET-PACT-3C",
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
  approvedBy: "reviewer-3c",
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
  idempotencyKey: `test-export-${approved.id}`,
});
assert.ok(bundle.footprint.id);
assert.equal(bundle.schema.ok, true);
assert.equal(bundle.semantics.ok, true);

const again = localExportPactV3(companyId, approved.id, {
  companyName: "Qlimwelt Demo",
  idempotencyKey: `test-export-${approved.id}`,
});
assert.equal(again.exchangeId, bundle.exchangeId, "idempotent exchange");

const exports = listExchanges(companyId, { kind: "export" });
assert.ok(exports.some((e) => e.id === bundle.exchangeId && e.status === "completed"));

console.log("pact-3c.test.ts: all assertions passed");

/**
 * PACT V3 Phase 4 — import ProductFootprint + accept → supplier_pcf EF.
 * Run: npm run test:bom:pact:4
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
  buildCompanyUrn,
  buildCustomProductUrn,
  createManualIdentityMapping,
  localAcceptSupplierPcfRecord,
  localImportPactV3,
  localListSupplierPcfRecords,
  localRejectSupplierPcfRecord,
} from "./index";
import { loadBomLocal } from "@/lib/bom/local-store";

const here = dirname(fileURLToPath(import.meta.url));
const companyId = "co-pact-4";
clearBomLocal(companyId);

const productId = newEntityId("prod");
const bomId = "bom-pact-4";
const rootId = newEntityId("item");
const steelId = newEntityId("item");
const now = new Date().toISOString();

const productUrn = buildCustomProductUrn("qlimwelt", "PN-100");
const companyUrn = buildCompanyUrn("custom", "example-gmbh");

const product: Product = {
  id: productId,
  companyId,
  productNumber: "PN-100",
  name: "Steel Bracket PN-100",
  description: "Import demo",
  category: "machinery",
  declaredUnit: "piece",
  status: "active",
  createdAt: now,
  updatedAt: now,
};

updateBomLocal(companyId, (s) => ({
  ...s,
  products: [...s.products, product],
  items: [
    {
      id: rootId,
      companyId,
      bomId,
      parentItemId: null,
      partNumber: "PN-100",
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
      partNumber: "STEEL",
      description: "steel",
      itemType: "material",
      quantity: 1,
      unit: "kg",
      scrapRate: 0,
      yieldRate: 1,
      sequenceNo: 1,
      createdAt: now,
      updatedAt: now,
    } as BomItem,
  ],
}));

createManualIdentityMapping(companyId, {
  productId,
  bomItemId: steelId,
  scheme: "custom",
  value: "PN-100",
  urn: productUrn,
  status: "confirmed",
});

const fixture = JSON.parse(
  readFileSync(join(here, "fixtures/product-footprint-valid.json"), "utf8")
);
// Align fixture URNs with confirmed mapping
fixture.productIds = [productUrn];
fixture.companyIds = [companyUrn];

const imported = localImportPactV3(companyId, fixture, {
  idempotencyKey: `import-test-${fixture.id}`,
});
assert.equal(imported.schema.ok, true);
assert.equal(imported.record.status, "mapped");
assert.equal(imported.record.mappedBomItemId, steelId);
assert.ok(
  imported.candidates.some((c) => c.status === "confirmed" && c.bomItemId === steelId)
);
assert.equal(localListSupplierPcfRecords(companyId).length, 1);

const again = localImportPactV3(companyId, fixture, {
  idempotencyKey: `import-test-${fixture.id}`,
});
assert.equal(again.exchangeId, imported.exchangeId, "idempotent import exchange");

const accepted = localAcceptSupplierPcfRecord(companyId, imported.record.id, {
  bomItemId: steelId,
  acceptedBy: "reviewer-4",
});
assert.equal(accepted.status, "accepted");
assert.ok(accepted.resultingFactorId);
assert.ok(accepted.resultingMappingId);

const state = loadBomLocal(companyId);
const factor = state.emissionFactors.find((f) => f.id === accepted.resultingFactorId);
const mapping = state.carbonMappings.find((m) => m.id === accepted.resultingMappingId);
assert.ok(factor);
assert.equal(factor!.category, "supplier_pcf");
assert.equal(factor!.valueKgco2e, 1.234);
assert.ok(mapping);
assert.equal(mapping!.method, "supplier_pcf");
assert.equal(mapping!.status, "approved");
assert.equal(mapping!.bomItemId, steelId);

// Reject path on a fresh import
const fixture2 = { ...fixture, id: "a1b1225a-bd44-4c8e-861d-079e4e1dfd70" };
const imported2 = localImportPactV3(companyId, fixture2, {
  idempotencyKey: `import-test-${fixture2.id}`,
});
const rejected = localRejectSupplierPcfRecord(companyId, imported2.record.id);
assert.equal(rejected.status, "rejected");

console.log("pact-4.test.ts: all assertions passed");

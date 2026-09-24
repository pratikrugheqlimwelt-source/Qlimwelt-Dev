/**
 * BOM Phase 1D analytics tests — run: npm run test:bom:analytics
 */
import { clearBomLocal, newEntityId, updateBomLocal } from "@/lib/bom/local-store";
import type { BomItem } from "@/lib/bom/types";
import {
  buildBomAnalytics,
  compareCalculations,
  ensureCarbonLibrary,
  localApproveMapping,
  localCompareCalculations,
  localGetBomAnalytics,
  localRunCalculation,
  localUpsertMapping,
} from "./index";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const companyId = "co-1d-test";
clearBomLocal(companyId);

const { factors } = ensureCarbonLibrary(companyId);
const steel = factors.find((f) => f.factorCode === "STEEL_CRUDE");
const alu = factors.find((f) => f.factorCode === "ALU_PRIMARY");
assert(steel && alu, "steel and aluminium factors");

const bomId = "bom-1d";
const rootId = newEntityId("item");
const steelId = newEntityId("item");
const aluId = newEntityId("item");
const now = new Date().toISOString();

function item(
  partial: Partial<BomItem> & { id: string; partNumber: string; parentItemId: string | null }
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
  items: [
    item({
      id: rootId,
      partNumber: "PROD",
      parentItemId: null,
      itemType: "product",
      unit: "piece",
      quantity: 1,
    }),
    item({ id: steelId, partNumber: "STEEL_CRUDE", parentItemId: rootId, quantity: 2, sequenceNo: 1 }),
    item({ id: aluId, partNumber: "ALU_PRIMARY", parentItemId: rootId, quantity: 0.5, sequenceNo: 2 }),
  ],
}));

const mSteel = localUpsertMapping(companyId, {
  bomItemId: steelId,
  emissionFactorId: steel!.id,
  confidence: 0.9,
  status: "suggested",
});
const mAlu = localUpsertMapping(companyId, {
  bomItemId: aluId,
  emissionFactorId: alu!.id,
  confidence: 0.85,
  status: "suggested",
});
localApproveMapping(companyId, mSteel.id);
localApproveMapping(companyId, mAlu.id);

const calcA = localRunCalculation(companyId, { bomId, requireApproved: true });
assert(calcA.totalKgco2e > 0, "calc A total > 0");

const analytics = localGetBomAnalytics(companyId, bomId, calcA.id);
assert(analytics, "analytics available");
assert(analytics!.hotspots.length >= 2, "hotspots for both materials");
assert(
  analytics!.hotspots[0].directKgco2e >= analytics!.hotspots[1].directKgco2e,
  "hotspots sorted"
);
assert(analytics!.explorer.length === 1, "one explorer root");
assert(analytics!.explorer[0].children.length === 2, "root has 2 children");
assert(analytics!.lifecycle.some((b) => b.itemType === "material"), "lifecycle has material");

const shareSum = analytics!.hotspots.reduce((s, h) => s + h.shareOfTotal, 0);
assert(shareSum > 0.9 && shareSum <= 1.01, `hotspot shares ~1, got ${shareSum}`);

updateBomLocal(companyId, (s) => ({
  ...s,
  items: s.items.map((i) => (i.id === aluId ? { ...i, quantity: 1.5 } : i)),
}));
const calcB = localRunCalculation(companyId, { bomId, requireApproved: true });
assert(calcB.totalKgco2e > calcA.totalKgco2e, "higher alu qty increases total");

const cmp = localCompareCalculations(companyId, calcA.id, calcB.id);
assert(cmp.deltaTotalKgco2e > 0, "positive total delta");
const aluRow = cmp.rows.find((r) => r.partNumber === "ALU_PRIMARY");
assert(aluRow && aluRow.deltaKgco2e > 0, "alu delta positive");
assert(cmp.rows[0], "compare rows present");

const pure = buildBomAnalytics(calcA, [
  item({ id: rootId, partNumber: "PROD", parentItemId: null, itemType: "product", unit: "piece" }),
  item({ id: steelId, partNumber: "STEEL_CRUDE", parentItemId: rootId, quantity: 2 }),
  item({ id: aluId, partNumber: "ALU_PRIMARY", parentItemId: rootId, quantity: 0.5 }),
]);
assert(pure.calculationId === calcA.id, "pure analytics id");
const pureCmp = compareCalculations(calcA, calcB);
assert(pureCmp.leftCalculationId === calcA.id, "pure compare left");

clearBomLocal(companyId);
console.log("BOM Phase 1D analytics tests passed.");

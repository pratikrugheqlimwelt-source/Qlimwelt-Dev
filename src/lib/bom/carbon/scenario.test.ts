/**
 * BOM Phase 6 scenario / what-if tests — run: npm run test:bom:scenario
 */
import { clearBomLocal, newEntityId, updateBomLocal } from "@/lib/bom/local-store";
import type { BomItem } from "@/lib/bom/types";
import {
  applyScenarioOverrides,
  ensureCarbonLibrary,
  localApproveMapping,
  localCreateScenario,
  localRunCalculation,
  localRunScenario,
  localUpdateScenario,
  localUpsertMapping,
} from "./index";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const companyId = "co-phase6-scenario";
clearBomLocal(companyId);

const { factors } = ensureCarbonLibrary(companyId);
const steel = factors.find((f) => f.factorCode === "STEEL_CRUDE");
const alu = factors.find((f) => f.factorCode === "ALU_PRIMARY");
assert(steel && alu, "demo factors present");

const bomId = "bom-scenario-1";
const rootId = newEntityId("item");
const steelId = newEntityId("item");
const aluId = newEntityId("item");
const now = new Date().toISOString();

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

const baseline = localRunCalculation(companyId, { bomId, requireApproved: true });
assert(baseline.totalKgco2e > 0, "baseline total > 0");
assert(!baseline.scenarioId, "baseline is not a scenario calc");

const cloned = applyScenarioOverrides(
  [
    item({ id: aluId, partNumber: "ALU_PRIMARY", parentItemId: rootId, quantity: 0.5 }),
  ],
  [],
  [
    {
      id: "ov1",
      bomItemId: aluId,
      kind: "quantity",
      numericValue: 1.5,
    },
  ],
  companyId
);
assert(cloned.items[0].quantity === 1.5, "override clone qty");
assert(
  [
    item({ id: aluId, partNumber: "ALU_PRIMARY", parentItemId: rootId, quantity: 0.5 }),
  ][0].quantity === 0.5,
  "original input not mutated by applyScenarioOverrides"
);

const scenario = localCreateScenario(companyId, {
  bomId,
  name: "More aluminium",
  description: "Raise ALU qty without touching baseline BOM",
  baselineCalculationId: baseline.id,
  overrides: [
    {
      id: newEntityId("ov"),
      bomItemId: aluId,
      kind: "quantity",
      numericValue: 1.5,
    },
  ],
});
assert(scenario.baselineCalculationId === baseline.id, "baseline linked");

const run = localRunScenario(companyId, scenario.id, { requireApproved: true });
assert(run.result.scenarioId === scenario.id, "result tagged with scenarioId");
assert(run.result.totalKgco2e > baseline.totalKgco2e, "higher alu qty increases total");
assert(run.comparison && run.comparison.deltaTotalKgco2e > 0, "positive delta vs baseline");

const aluAfter = updateBomLocal(companyId, (s) => s).items.find((i) => i.id === aluId);
assert(aluAfter?.quantity === 0.5, "baseline BOM item qty unchanged after scenario");

const steelMap = updateBomLocal(companyId, (s) => s).carbonMappings.find(
  (m) => m.bomItemId === steelId
);
assert(steelMap?.emissionFactorId === steel!.id, "baseline mapping unchanged");

// Factor swap scenario
const swap = localCreateScenario(companyId, {
  bomId,
  name: "Swap steel factor",
  baselineCalculationId: baseline.id,
});
localUpdateScenario(companyId, swap.id, {
  overrides: [
    {
      id: newEntityId("ov"),
      bomItemId: steelId,
      kind: "emission_factor",
      emissionFactorId: alu!.id,
    },
  ],
});
const swapRun = localRunScenario(companyId, swap.id, { requireApproved: true });
assert(swapRun.result.totalKgco2e !== baseline.totalKgco2e, "factor swap changes total");
const steelMapStill = updateBomLocal(companyId, (s) => s).carbonMappings.find(
  (m) => m.bomItemId === steelId
);
assert(steelMapStill?.emissionFactorId === steel!.id, "baseline mapping still steel after factor-swap scenario");

clearBomLocal(companyId);
console.log("BOM Phase 6 scenario tests passed.");

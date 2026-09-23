/**
 * BOM Phase 1B carbon tests — run: npm run test:bom:carbon
 */
import { clearBomLocal, newEntityId, updateBomLocal } from "@/lib/bom/local-store";
import type { BomItem } from "@/lib/bom/types";
import { convertBomUnit } from "@/lib/bom/units";
import {
  calculateBomPcf,
  ensureCarbonLibrary,
  isMappingUsable,
  localApproveMapping,
  localRunCalculation,
  localUpsertMapping,
  scoreMappingConfidence,
  suggestMappings,
} from "./index";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const companyId = "co-1b-test";
clearBomLocal(companyId);

const { factors } = ensureCarbonLibrary(companyId);
assert(factors.length >= 5, "demo factors seeded");

const steel = factors.find((f) => f.factorCode === "STEEL_CRUDE");
const alu = factors.find((f) => f.factorCode === "ALU_PRIMARY");
assert(steel && alu, "steel and aluminium factors present");

const itemSteel: BomItem = {
  id: newEntityId("item"),
  companyId,
  bomId: "bom-1",
  parentItemId: null,
  partNumber: "STEEL_BRACKET",
  description: "Steel crude bracket",
  itemType: "material",
  quantity: 2,
  unit: "kg",
  scrapRate: 0.1,
  yieldRate: 1,
  sequenceNo: 0,
  createdAt: "",
  updatedAt: "",
};

const suggestions = suggestMappings(itemSteel, factors, 3);
assert(suggestions.length > 0, "suggestions returned");
assert(
  suggestions[0].confidence >= (suggestions[1]?.confidence ?? 0),
  "sorted by confidence"
);
const scored = scoreMappingConfidence(itemSteel, steel!);
assert(scored.confidence >= 0.5, `steel match confidence ${scored.confidence}`);

assert(isMappingUsable("suggested", true) === false, "suggested blocked when requireApproved");
assert(isMappingUsable("approved", true) === true, "approved allowed");
assert(isMappingUsable("suggested", false) === true, "suggested allowed when not required");

let threw = false;
try {
  convertBomUnit(1, "kg", "kwh");
} catch {
  threw = true;
}
assert(threw, "incompatible units must throw");

const rootId = newEntityId("item");
const childId = newEntityId("item");
const bomId = "bom-pcf-1";
const now = new Date().toISOString();
updateBomLocal(companyId, (s) => ({
  ...s,
  items: [
    {
      id: rootId,
      companyId,
      bomId,
      parentItemId: null,
      partNumber: "PROD-1",
      description: "Finished good",
      itemType: "product",
      quantity: 1,
      unit: "piece",
      scrapRate: 0,
      yieldRate: 1,
      sequenceNo: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: childId,
      companyId,
      bomId,
      parentItemId: rootId,
      partNumber: "STEEL_CRUDE",
      description: "Steel crude",
      itemType: "material",
      quantity: 1.5,
      unit: "kg",
      scrapRate: 0.05,
      yieldRate: 1,
      sequenceNo: 1,
      createdAt: now,
      updatedAt: now,
    },
  ],
}));

const mapping = localUpsertMapping(companyId, {
  bomItemId: childId,
  emissionFactorId: steel!.id,
  confidence: 0.9,
  matchReason: "test",
  status: "suggested",
});

const blocked = localRunCalculation(companyId, { bomId, requireApproved: true });
assert(blocked.totalKgco2e === 0, `unapproved should be 0, got ${blocked.totalKgco2e}`);
assert(
  blocked.warnings.some((w) => /approved mapping/i.test(w)),
  "warn missing approved mapping"
);

localApproveMapping(companyId, mapping.id);
const result = localRunCalculation(companyId, { bomId, requireApproved: true });
const expected = (1.5 / 0.95) * steel!.valueKgco2e;
assert(
  Math.abs(result.totalKgco2e - expected) < 1e-6,
  `expected ~${expected}, got ${result.totalKgco2e}`
);
assert((result.ledger?.length ?? 0) >= 2, "ledger has root + child");
assert(result.methodology === "bom_recursive_v1", "methodology stamped");

const direct = calculateBomPcf(
  { companyId, bomId, requireApproved: false },
  {
    items: [
      {
        id: rootId,
        companyId,
        bomId,
        parentItemId: null,
        partNumber: "PROD-1",
        description: "Finished good",
        itemType: "product",
        quantity: 1,
        unit: "piece",
        scrapRate: 0,
        yieldRate: 1,
        sequenceNo: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: childId,
        companyId,
        bomId,
        parentItemId: rootId,
        partNumber: "STEEL_CRUDE",
        description: "Steel crude",
        itemType: "material",
        quantity: 1500,
        unit: "g",
        scrapRate: 0,
        yieldRate: 1,
        sequenceNo: 1,
        createdAt: now,
        updatedAt: now,
      },
    ],
    mappings: [{ ...mapping, status: "approved" }],
    factors,
    declaredUnit: "piece",
  }
);
assert(
  Math.abs(direct.totalKgco2e - 1.5 * steel!.valueKgco2e) < 1e-6,
  `g→kg normalize failed: ${direct.totalKgco2e}`
);

clearBomLocal(companyId);
console.log("BOM Phase 1B carbon tests passed.");

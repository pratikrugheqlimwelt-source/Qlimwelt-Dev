import type { BomItem } from "@/lib/bom/types";
import type {
  BomScenario,
  CarbonMapping,
  EmissionFactor,
  PcfCalculation,
  ScenarioOverride,
} from "./types";
import { calculateBomPcf } from "./calculate";
import { compareCalculations, type VersionCompareResult } from "./analytics";

export type {
  BomScenario,
  ScenarioOverride,
  ScenarioOverrideKind,
} from "./types";

export type ScenarioRunResult = {
  scenario: BomScenario;
  baseline: PcfCalculation | null;
  result: PcfCalculation;
  comparison: VersionCompareResult | null;
  baselineItemSnapshot: Array<{
    id: string;
    quantity: number;
    scrapRate: number;
    yieldRate: number;
  }>;
};

export function applyScenarioOverrides(
  items: BomItem[],
  mappings: CarbonMapping[],
  overrides: ScenarioOverride[],
  companyId: string,
  now = new Date().toISOString()
): { items: BomItem[]; mappings: CarbonMapping[] } {
  const itemClones = items.map((i) => ({ ...i }));
  const byId = new Map(itemClones.map((i) => [i.id, i]));
  const mappingClones = mappings.map((m) => ({ ...m }));

  for (const o of overrides) {
    const item = byId.get(o.bomItemId);
    if (!item) continue;

    if (o.kind === "quantity" && o.numericValue != null && Number.isFinite(o.numericValue)) {
      item.quantity = o.numericValue;
    } else if (
      o.kind === "scrap_rate" &&
      o.numericValue != null &&
      Number.isFinite(o.numericValue)
    ) {
      item.scrapRate = Math.min(0.999, Math.max(0, o.numericValue));
    } else if (
      o.kind === "yield_rate" &&
      o.numericValue != null &&
      Number.isFinite(o.numericValue) &&
      o.numericValue > 0
    ) {
      item.yieldRate = o.numericValue;
    } else if (o.kind === "emission_factor" && o.emissionFactorId) {
      const idx = mappingClones.findIndex((m) => m.bomItemId === o.bomItemId);
      if (idx >= 0) {
        mappingClones[idx] = {
          ...mappingClones[idx],
          emissionFactorId: o.emissionFactorId,
          status: "approved",
          matchReason: "scenario_override",
          updatedAt: now,
        };
      } else {
        mappingClones.push({
          id: `scenario-map-${o.bomItemId}`,
          companyId,
          bomItemId: o.bomItemId,
          emissionFactorId: o.emissionFactorId,
          method: "qty_x_ef",
          confidence: 1,
          status: "approved",
          matchReason: "scenario_override",
          approvedBy: "scenario",
          approvedAt: now,
          notes: "Transient scenario mapping",
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  return { items: itemClones, mappings: mappingClones };
}

/** Pure scenario calculation against override clones (does not touch store). */
export function calculateScenarioPcf(input: {
  companyId: string;
  bomId: string;
  productId?: string | null;
  scenarioId: string;
  items: BomItem[];
  mappings: CarbonMapping[];
  factors: EmissionFactor[];
  overrides: ScenarioOverride[];
  requireApproved?: boolean;
  createdBy?: string | null;
}): PcfCalculation {
  const { items, mappings } = applyScenarioOverrides(
    input.items,
    input.mappings,
    input.overrides,
    input.companyId
  );
  const result = calculateBomPcf(
    {
      companyId: input.companyId,
      bomId: input.bomId,
      productId: input.productId,
      createdBy: input.createdBy,
      requireApproved: input.requireApproved,
    },
    {
      items,
      mappings,
      factors: input.factors,
      declaredUnit: "piece",
    }
  );
  return {
    ...result,
    scenarioId: input.scenarioId,
    methodology: "bom_recursive_v1_scenario",
  };
}

export function scenarioDeltaVsBaseline(
  baseline: PcfCalculation | null,
  scenarioResult: PcfCalculation
): VersionCompareResult | null {
  if (!baseline) return null;
  return compareCalculations(baseline, scenarioResult);
}

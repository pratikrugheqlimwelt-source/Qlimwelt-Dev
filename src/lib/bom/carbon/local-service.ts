import {
  clearBomLocal,
  loadBomLocal,
  newEntityId,
  updateBomLocal,
} from "@/lib/bom/local-store";
import type { BomItem } from "@/lib/bom/types";
import { appendAuditEvent, listAuditEvents } from "./audit";
import { calculateBomPcf } from "./calculate";
import { suggestMappings } from "./mapping";
import { seedDemoCarbonLibrary } from "./seed";
import {
  buildBomAnalytics,
  compareCalculations,
  type BomAnalytics,
  type VersionCompareResult,
} from "./analytics";
import { detectStaleCalculation } from "./stale";
import {
  calculateScenarioPcf,
  scenarioDeltaVsBaseline,
  type BomScenario,
  type ScenarioOverride,
  type ScenarioRunResult,
} from "./scenario";
import type {
  CarbonDataset,
  CarbonMapping,
  EmissionFactor,
  MappingSuggestion,
  BomAuditEvent,
  PcfCalculation,
} from "./types";

export function ensureCarbonLibrary(companyId: string): {
  datasets: CarbonDataset[];
  factors: EmissionFactor[];
} {
  const state = loadBomLocal(companyId);
  if (state.carbonDatasets.length > 0) {
    return { datasets: state.carbonDatasets, factors: state.emissionFactors };
  }
  const seeded = seedDemoCarbonLibrary(companyId);
  updateBomLocal(companyId, (s) => ({
    ...s,
    carbonDatasets: [...s.carbonDatasets, seeded.dataset],
    emissionFactors: [...s.emissionFactors, ...seeded.factors],
  }));
  return { datasets: [seeded.dataset], factors: seeded.factors };
}

export function localListDatasets(companyId: string): CarbonDataset[] {
  ensureCarbonLibrary(companyId);
  return loadBomLocal(companyId).carbonDatasets;
}

export function localListFactors(companyId: string): EmissionFactor[] {
  ensureCarbonLibrary(companyId);
  return loadBomLocal(companyId).emissionFactors;
}

export function localListMappings(companyId: string, bomId?: string): CarbonMapping[] {
  const state = loadBomLocal(companyId);
  const itemIds = bomId
    ? new Set(state.items.filter((i) => i.bomId === bomId).map((i) => i.id))
    : null;
  return state.carbonMappings.filter((m) => (itemIds ? itemIds.has(m.bomItemId) : true));
}

export function localSuggestForItem(
  companyId: string,
  item: BomItem,
  limit = 5
): MappingSuggestion[] {
  const { factors } = ensureCarbonLibrary(companyId);
  return suggestMappings(item, factors, limit);
}

export function localUpsertMapping(
  companyId: string,
  input: {
    id?: string;
    bomItemId: string;
    emissionFactorId: string;
    confidence?: number;
    matchReason?: string;
    status?: CarbonMapping["status"];
    method?: CarbonMapping["method"];
    notes?: string;
  }
): CarbonMapping {
  ensureCarbonLibrary(companyId);
  const now = new Date().toISOString();
  const existing = loadBomLocal(companyId).carbonMappings.find(
    (m) => m.id === input.id || m.bomItemId === input.bomItemId
  );
  const mapping: CarbonMapping = {
    id: existing?.id ?? input.id ?? newEntityId("map"),
    companyId,
    bomItemId: input.bomItemId,
    emissionFactorId: input.emissionFactorId,
    method: input.method ?? "qty_x_ef",
    confidence: input.confidence ?? existing?.confidence ?? 0.5,
    status: input.status ?? existing?.status ?? "suggested",
    matchReason: input.matchReason ?? existing?.matchReason ?? null,
    approvedBy: existing?.approvedBy ?? null,
    approvedAt: existing?.approvedAt ?? null,
    notes: input.notes ?? existing?.notes ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  updateBomLocal(companyId, (s) => ({
    ...s,
    carbonMappings: [
      ...s.carbonMappings.filter((m) => m.bomItemId !== mapping.bomItemId),
      mapping,
    ],
  }));
  return mapping;
}

export function localApproveMapping(
  companyId: string,
  mappingId: string,
  approvedBy?: string
): CarbonMapping {
  const now = new Date().toISOString();
  let updated: CarbonMapping | null = null;
  updateBomLocal(companyId, (s) => ({
    ...s,
    carbonMappings: s.carbonMappings.map((m) => {
      if (m.id !== mappingId) return m;
      updated = {
        ...m,
        status: "approved",
        approvedBy: approvedBy ?? "local-user",
        approvedAt: now,
        updatedAt: now,
      };
      return updated!;
    }),
  }));
  if (!updated) throw new Error("Mapping not found");
  appendAuditEvent({
    companyId,
    entityType: "mapping",
    entityId: mappingId,
    action: "mapping_approved",
    summary: `Approved mapping ${mappingId}`,
    actorId: approvedBy ?? null,
    afterState: { status: "approved" },
  });
  return updated;
}

export function localRejectMapping(companyId: string, mappingId: string): CarbonMapping {
  const now = new Date().toISOString();
  let updated: CarbonMapping | null = null;
  updateBomLocal(companyId, (s) => ({
    ...s,
    carbonMappings: s.carbonMappings.map((m) => {
      if (m.id !== mappingId) return m;
      updated = { ...m, status: "rejected", updatedAt: now };
      return updated!;
    }),
  }));
  if (!updated) throw new Error("Mapping not found");
  appendAuditEvent({
    companyId,
    entityType: "mapping",
    entityId: mappingId,
    action: "mapping_rejected",
    summary: `Rejected mapping ${mappingId}`,
    afterState: { status: "rejected" },
  });
  return updated;
}

export function localRunCalculation(
  companyId: string,
  input: {
    bomId: string;
    productId?: string | null;
    assessmentId?: string | null;
    requireApproved?: boolean;
    createdBy?: string | null;
  }
): PcfCalculation {
  ensureCarbonLibrary(companyId);
  const state = loadBomLocal(companyId);
  const items = state.items.filter((i) => i.bomId === input.bomId);
  const itemIds = new Set(items.map((i) => i.id));
  const mappings = state.carbonMappings.filter((m) => itemIds.has(m.bomItemId));
  const result = calculateBomPcf(
    {
      companyId,
      bomId: input.bomId,
      productId: input.productId,
      assessmentId: input.assessmentId,
      createdBy: input.createdBy,
      requireApproved: input.requireApproved,
    },
    {
      items,
      mappings,
      factors: state.emissionFactors,
      declaredUnit: "piece",
    }
  );

  updateBomLocal(companyId, (s) => ({
    ...s,
    pcfCalculations: [
      ...s.pcfCalculations.map((c) =>
        c.bomId === input.bomId && c.status === "completed" && !c.scenarioId
          ? { ...c, status: "superseded" as const, isStale: true, staleReason: "Superseded by newer calculation", staleAt: new Date().toISOString() }
          : c
      ),
      result,
    ],
  }));
  appendAuditEvent({
    companyId,
    entityType: "calculation",
    entityId: result.id,
    action: "calculated",
    summary: `Calculated PCF ${result.totalKgco2e.toFixed(4)} kgCO2e for BOM ${input.bomId}`,
    actorId: input.createdBy ?? null,
    afterState: {
      totalKgco2e: result.totalKgco2e,
      dqOverall: result.dq?.overall ?? null,
      approvalStatus: result.approvalStatus,
    },
  });
  return result;
}

export function localListCalculations(companyId: string, bomId?: string): PcfCalculation[] {
  return loadBomLocal(companyId)
    .pcfCalculations.filter((c) => (bomId ? c.bomId === bomId : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function localGetCalculation(
  companyId: string,
  calculationId: string
): PcfCalculation | null {
  return loadBomLocal(companyId).pcfCalculations.find((c) => c.id === calculationId) ?? null;
}

export function localApproveCalculation(
  companyId: string,
  calculationId: string,
  input?: { approvedBy?: string; notes?: string }
): PcfCalculation {
  const now = new Date().toISOString();
  let updated: PcfCalculation | null = null;
  updateBomLocal(companyId, (s) => ({
    ...s,
    pcfCalculations: s.pcfCalculations.map((c) => {
      if (c.id !== calculationId) return c;
      if (c.isStale) {
        throw new Error("Cannot approve a stale calculation — recalculate first");
      }
      updated = {
        ...c,
        approvalStatus: "approved",
        approvedBy: input?.approvedBy ?? "local-user",
        approvedAt: now,
        approvalNotes: input?.notes ?? null,
      };
      return updated!;
    }),
  }));
  if (!updated) throw new Error("Calculation not found");
  appendAuditEvent({
    companyId,
    entityType: "calculation",
    entityId: calculationId,
    action: "calc_approved",
    summary: `Approved calculation ${calculationId}`,
    actorId: input?.approvedBy ?? null,
    afterState: { approvalStatus: "approved" },
  });
  return updated;
}

export function localRejectCalculation(
  companyId: string,
  calculationId: string,
  input?: { notes?: string; actorId?: string }
): PcfCalculation {
  const now = new Date().toISOString();
  let updated: PcfCalculation | null = null;
  updateBomLocal(companyId, (s) => ({
    ...s,
    pcfCalculations: s.pcfCalculations.map((c) => {
      if (c.id !== calculationId) return c;
      updated = {
        ...c,
        approvalStatus: "rejected",
        approvedBy: null,
        approvedAt: null,
        approvalNotes: input?.notes ?? null,
      };
      return updated!;
    }),
  }));
  if (!updated) throw new Error("Calculation not found");
  appendAuditEvent({
    companyId,
    entityType: "calculation",
    entityId: calculationId,
    action: "calc_rejected",
    summary: `Rejected calculation ${calculationId}`,
    actorId: input?.actorId ?? null,
    afterState: { approvalStatus: "rejected", notes: input?.notes ?? null },
  });
  return updated;
}

/** Re-evaluate stale flags for a BOM's calculations against current items/mappings. */
export function localRefreshStaleFlags(companyId: string, bomId: string): PcfCalculation[] {
  const state = loadBomLocal(companyId);
  const items = state.items.filter((i) => i.bomId === bomId);
  const itemIds = new Set(items.map((i) => i.id));
  const mappings = state.carbonMappings.filter((m) => itemIds.has(m.bomItemId));
  const now = new Date().toISOString();
  const touched: PcfCalculation[] = [];

  updateBomLocal(companyId, (s) => ({
    ...s,
    pcfCalculations: s.pcfCalculations.map((c) => {
      if (c.bomId !== bomId) return c;
      const { isStale, reason } = detectStaleCalculation(c, items, mappings);
      if (isStale === c.isStale && (reason ?? null) === (c.staleReason ?? null)) return c;
      const next = {
        ...c,
        isStale,
        staleReason: reason,
        staleAt: isStale ? c.staleAt ?? now : null,
      };
      touched.push(next);
      if (isStale && !c.isStale) {
        appendAuditEvent({
          companyId,
          entityType: "calculation",
          entityId: c.id,
          action: "marked_stale",
          summary: reason ?? "Calculation marked stale",
          afterState: { isStale: true, reason },
        });
      }
      return next;
    }),
  }));
  return touched;
}

export function localListAuditEvents(
  companyId: string,
  filter?: { entityType?: string; entityId?: string; limit?: number }
): BomAuditEvent[] {
  return listAuditEvents(companyId, filter);
}

export function localGetBomAnalytics(
  companyId: string,
  bomId: string,
  calculationId?: string
): BomAnalytics | null {
  const calcs = localListCalculations(companyId, bomId).filter(
    (c) => c.status === "completed" || c.status === "superseded"
  );
  const calc = calculationId
    ? calcs.find((c) => c.id === calculationId) ?? null
    : calcs.find((c) => !c.isStale) ?? calcs[0] ?? null;
  if (!calc) return null;
  const items = loadBomLocal(companyId).items.filter((i) => i.bomId === bomId);
  // ensure ledger present
  const full = localGetCalculation(companyId, calc.id) ?? calc;
  return buildBomAnalytics(full, items);
}

export function localCompareCalculations(
  companyId: string,
  leftId: string,
  rightId: string
): VersionCompareResult {
  const left = localGetCalculation(companyId, leftId);
  const right = localGetCalculation(companyId, rightId);
  if (!left || !right) throw new Error("Both calculations are required for comparison");
  return compareCalculations(left, right);
}


export function localListScenarios(companyId: string, bomId?: string): BomScenario[] {
  return loadBomLocal(companyId)
    .scenarios.filter((s) => (bomId ? s.bomId === bomId : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function localGetScenario(companyId: string, scenarioId: string): BomScenario | null {
  return loadBomLocal(companyId).scenarios.find((s) => s.id === scenarioId) ?? null;
}

export function localCreateScenario(
  companyId: string,
  input: {
    bomId: string;
    name: string;
    description?: string | null;
    baselineCalculationId?: string | null;
    overrides?: ScenarioOverride[];
  }
): BomScenario {
  const now = new Date().toISOString();
  const baselineId =
    input.baselineCalculationId ??
    localListCalculations(companyId, input.bomId).find((c) => !c.scenarioId && c.status === "completed")?.id ??
    null;
  const scenario: BomScenario = {
    id: newEntityId("scn"),
    companyId,
    bomId: input.bomId,
    name: input.name.trim() || "What-if scenario",
    description: input.description ?? null,
    baselineCalculationId: baselineId,
    overrides: input.overrides ?? [],
    lastResultCalculationId: null,
    createdAt: now,
    updatedAt: now,
  };
  updateBomLocal(companyId, (s) => ({
    ...s,
    scenarios: [...s.scenarios, scenario],
  }));
  appendAuditEvent({
    companyId,
    entityType: "scenario",
    entityId: scenario.id,
    action: "scenario_created",
    summary: `Created scenario "${scenario.name}" for BOM ${input.bomId}`,
    afterState: { name: scenario.name, overrideCount: scenario.overrides.length },
  });
  return scenario;
}

export function localUpdateScenario(
  companyId: string,
  scenarioId: string,
  patch: {
    name?: string;
    description?: string | null;
    baselineCalculationId?: string | null;
    overrides?: ScenarioOverride[];
  }
): BomScenario {
  const now = new Date().toISOString();
  let updated: BomScenario | null = null;
  updateBomLocal(companyId, (s) => ({
    ...s,
    scenarios: s.scenarios.map((sc) => {
      if (sc.id !== scenarioId) return sc;
      updated = {
        ...sc,
        name: patch.name?.trim() || sc.name,
        description: patch.description !== undefined ? patch.description : sc.description,
        baselineCalculationId:
          patch.baselineCalculationId !== undefined
            ? patch.baselineCalculationId
            : sc.baselineCalculationId,
        overrides: patch.overrides ?? sc.overrides,
        updatedAt: now,
      };
      return updated!;
    }),
  }));
  if (!updated) throw new Error("Scenario not found");
  appendAuditEvent({
    companyId,
    entityType: "scenario",
    entityId: scenarioId,
    action: "scenario_updated",
    summary: `Updated scenario ${scenarioId}`,
    afterState: {
      name: updated.name,
      overrideCount: updated.overrides.length,
    },
  });
  return updated;
}

export function localDeleteScenario(companyId: string, scenarioId: string): void {
  updateBomLocal(companyId, (s) => ({
    ...s,
    scenarios: s.scenarios.filter((sc) => sc.id !== scenarioId),
    // keep historical scenario calculations for audit, but they remain tagged
  }));
  appendAuditEvent({
    companyId,
    entityType: "scenario",
    entityId: scenarioId,
    action: "scenario_deleted",
    summary: `Deleted scenario ${scenarioId}`,
  });
}

/** Run what-if calculation without mutating baseline BOM items or mappings. */
export function localRunScenario(
  companyId: string,
  scenarioId: string,
  input?: { productId?: string | null; requireApproved?: boolean; createdBy?: string | null }
): ScenarioRunResult {
  ensureCarbonLibrary(companyId);
  const state = loadBomLocal(companyId);
  const scenario = state.scenarios.find((s) => s.id === scenarioId);
  if (!scenario) throw new Error("Scenario not found");

  const items = state.items.filter((i) => i.bomId === scenario.bomId);
  const itemIds = new Set(items.map((i) => i.id));
  const mappings = state.carbonMappings.filter((m) => itemIds.has(m.bomItemId));

  const baselineItemSnapshot = items.map((i) => ({
    id: i.id,
    quantity: i.quantity,
    scrapRate: i.scrapRate,
    yieldRate: i.yieldRate,
  }));

  const baseline =
    (scenario.baselineCalculationId
      ? state.pcfCalculations.find((c) => c.id === scenario.baselineCalculationId)
      : null) ??
    state.pcfCalculations.find(
      (c) => c.bomId === scenario.bomId && !c.scenarioId && c.status === "completed"
    ) ??
    null;

  const result = calculateScenarioPcf({
    companyId,
    bomId: scenario.bomId,
    productId: input?.productId,
    scenarioId: scenario.id,
    items,
    mappings,
    factors: state.emissionFactors,
    overrides: scenario.overrides,
    requireApproved: input?.requireApproved,
    createdBy: input?.createdBy,
  });

  // Verify isolation: store items unchanged
  const afterItems = loadBomLocal(companyId).items.filter((i) => i.bomId === scenario.bomId);
  for (const snap of baselineItemSnapshot) {
    const cur = afterItems.find((i) => i.id === snap.id);
    if (!cur) continue;
    if (
      cur.quantity !== snap.quantity ||
      cur.scrapRate !== snap.scrapRate ||
      cur.yieldRate !== snap.yieldRate
    ) {
      throw new Error("Scenario run mutated baseline BOM items — aborting");
    }
  }

  const now = new Date().toISOString();
  let savedScenario: BomScenario = scenario;
  updateBomLocal(companyId, (s) => {
    savedScenario = {
      ...scenario,
      lastResultCalculationId: result.id,
      baselineCalculationId: scenario.baselineCalculationId ?? baseline?.id ?? null,
      updatedAt: now,
    };
    return {
      ...s,
      // Do NOT supersede baseline calculations when running scenarios
      pcfCalculations: [...s.pcfCalculations, result],
      scenarios: s.scenarios.map((sc) => (sc.id === scenarioId ? savedScenario : sc)),
    };
  });

  appendAuditEvent({
    companyId,
    entityType: "scenario",
    entityId: scenarioId,
    action: "scenario_calculated",
    summary: `Scenario "${savedScenario.name}" → ${result.totalKgco2e.toFixed(4)} kgCO2e`,
    actorId: input?.createdBy ?? null,
    afterState: {
      totalKgco2e: result.totalKgco2e,
      baselineTotalKgco2e: baseline?.totalKgco2e ?? null,
      overrideCount: savedScenario.overrides.length,
    },
  });

  // Re-load items to confirm still unchanged after persist
  const finalItems = loadBomLocal(companyId).items.filter((i) => i.bomId === scenario.bomId);
  for (const snap of baselineItemSnapshot) {
    const cur = finalItems.find((i) => i.id === snap.id);
    if (
      cur &&
      (cur.quantity !== snap.quantity ||
        cur.scrapRate !== snap.scrapRate ||
        cur.yieldRate !== snap.yieldRate)
    ) {
      throw new Error("Baseline BOM isolation failed after scenario persist");
    }
  }

  return {
    scenario: savedScenario,
    baseline,
    result,
    comparison: scenarioDeltaVsBaseline(baseline, result),
    baselineItemSnapshot,
  };
}

export function resetCarbonLocal(companyId: string) {

  clearBomLocal(companyId);
}


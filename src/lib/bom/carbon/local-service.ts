import {
  clearBomLocal,
  findSupplierPcfRequestByToken,
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
import {
  assertValidSupplierDeclaration,
  canTransitionSupplierPcf,
  newSupplierAccessToken,
  toSupplierPcfPortalView,
  type SupplierPcfPortalView,
  type SupplierPcfRequest,
} from "./supplier-pcf";
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
  const existing = localGetScenario(companyId, scenarioId);
  if (!existing) throw new Error("Scenario not found");
  const updated: BomScenario = {
    ...existing,
    name: patch.name?.trim() || existing.name,
    description: patch.description !== undefined ? patch.description : existing.description,
    baselineCalculationId:
      patch.baselineCalculationId !== undefined
        ? patch.baselineCalculationId
        : existing.baselineCalculationId,
    overrides: patch.overrides ?? existing.overrides,
    updatedAt: now,
  };
  updateBomLocal(companyId, (s) => ({
    ...s,
    scenarios: s.scenarios.map((sc) => (sc.id === scenarioId ? updated : sc)),
  }));
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

// ─── Phase 7 — Supplier PCF requests ───────────────────────────────────────

export function localListSupplierPcfRequests(
  companyId: string,
  bomId?: string
): SupplierPcfRequest[] {
  return loadBomLocal(companyId)
    .supplierPcfRequests.filter((r) => (bomId ? r.bomId === bomId : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function localGetSupplierPcfRequest(
  companyId: string,
  requestId: string
): SupplierPcfRequest | null {
  return loadBomLocal(companyId).supplierPcfRequests.find((r) => r.id === requestId) ?? null;
}

export function localCreateSupplierPcfRequest(
  companyId: string,
  input: {
    bomId: string;
    bomItemId: string;
    supplierName: string;
    supplierEmail?: string | null;
    message?: string | null;
  }
): SupplierPcfRequest {
  const state = loadBomLocal(companyId);
  const item = state.items.find((i) => i.id === input.bomItemId && i.bomId === input.bomId);
  if (!item) throw new Error("BOM item not found for supplier PCF request");
  const name = input.supplierName.trim();
  if (!name) throw new Error("supplierName is required");

  const now = new Date().toISOString();
  const request: SupplierPcfRequest = {
    id: newEntityId("spc"),
    companyId,
    bomId: input.bomId,
    bomItemId: input.bomItemId,
    partNumber: item.partNumber,
    supplierName: name,
    supplierEmail: input.supplierEmail?.trim() || null,
    status: "draft",
    accessToken: newSupplierAccessToken(),
    message: input.message?.trim() || null,
    declaredKgco2ePerUnit: null,
    declaredUnit: item.unit || "kg",
    methodology: null,
    evidenceNotes: null,
    submittedAt: null,
    reviewedAt: null,
    reviewedBy: null,
    reviewNotes: null,
    resultingMappingId: null,
    resultingFactorId: null,
    createdAt: now,
    updatedAt: now,
  };

  updateBomLocal(companyId, (s) => ({
    ...s,
    supplierPcfRequests: [...s.supplierPcfRequests, request],
  }));
  appendAuditEvent({
    companyId,
    entityType: "supplier_pcf_request",
    entityId: request.id,
    action: "supplier_pcf_request_created",
    summary: `Created supplier PCF request for ${request.partNumber} → ${request.supplierName}`,
    afterState: { status: request.status, bomItemId: request.bomItemId },
  });
  return request;
}

export function localSendSupplierPcfRequest(
  companyId: string,
  requestId: string
): SupplierPcfRequest {
  const existing = localGetSupplierPcfRequest(companyId, requestId);
  if (!existing) throw new Error("Supplier PCF request not found");
  if (!canTransitionSupplierPcf(existing.status, "sent")) {
    throw new Error(`Cannot send request in status ${existing.status}`);
  }
  const now = new Date().toISOString();
  const updated: SupplierPcfRequest = { ...existing, status: "sent", updatedAt: now };
  updateBomLocal(companyId, (s) => ({
    ...s,
    supplierPcfRequests: s.supplierPcfRequests.map((r) => (r.id === requestId ? updated : r)),
  }));
  appendAuditEvent({
    companyId,
    entityType: "supplier_pcf_request",
    entityId: requestId,
    action: "supplier_pcf_request_sent",
    summary: `Sent supplier PCF request ${requestId} (token portal)`,
    afterState: { status: "sent", accessToken: updated.accessToken },
  });
  return updated;
}

export function localCancelSupplierPcfRequest(
  companyId: string,
  requestId: string
): SupplierPcfRequest {
  const existing = localGetSupplierPcfRequest(companyId, requestId);
  if (!existing) throw new Error("Supplier PCF request not found");
  if (!canTransitionSupplierPcf(existing.status, "cancelled")) {
    throw new Error(`Cannot cancel request in status ${existing.status}`);
  }
  const now = new Date().toISOString();
  const updated: SupplierPcfRequest = { ...existing, status: "cancelled", updatedAt: now };
  updateBomLocal(companyId, (s) => ({
    ...s,
    supplierPcfRequests: s.supplierPcfRequests.map((r) => (r.id === requestId ? updated : r)),
  }));
  appendAuditEvent({
    companyId,
    entityType: "supplier_pcf_request",
    entityId: requestId,
    action: "supplier_pcf_request_cancelled",
    summary: `Cancelled supplier PCF request ${requestId}`,
    afterState: { status: "cancelled" },
  });
  return updated;
}

export function localGetSupplierPcfByToken(token: string): {
  companyId: string;
  request: SupplierPcfRequest;
  portal: SupplierPcfPortalView;
} | null {
  const found = findSupplierPcfRequestByToken(token);
  if (!found) return null;
  return {
    companyId: found.companyId,
    request: found.request,
    portal: toSupplierPcfPortalView(found.request),
  };
}

export function localSubmitSupplierPcfByToken(
  token: string,
  input: {
    declaredKgco2ePerUnit: number;
    declaredUnit?: string | null;
    methodology?: string | null;
    evidenceNotes?: string | null;
  }
): SupplierPcfPortalView {
  const found = findSupplierPcfRequestByToken(token);
  if (!found) throw new Error("Invalid or expired supplier portal token");
  const { companyId, request } = found;
  if (!canTransitionSupplierPcf(request.status, "submitted") && request.status !== "submitted") {
    throw new Error(`Cannot submit while request is ${request.status}`);
  }
  if (request.status !== "sent" && request.status !== "submitted") {
    throw new Error(`Cannot submit while request is ${request.status}`);
  }

  const declared = assertValidSupplierDeclaration(input);
  const now = new Date().toISOString();
  const updated: SupplierPcfRequest = {
    ...request,
    status: "submitted",
    declaredKgco2ePerUnit: declared.declaredKgco2ePerUnit,
    declaredUnit: declared.declaredUnit,
    methodology: input.methodology?.trim() || null,
    evidenceNotes: input.evidenceNotes?.trim() || null,
    submittedAt: now,
    updatedAt: now,
  };

  updateBomLocal(companyId, (s) => ({
    ...s,
    supplierPcfRequests: s.supplierPcfRequests.map((r) => (r.id === request.id ? updated : r)),
  }));
  appendAuditEvent({
    companyId,
    entityType: "supplier_pcf_request",
    entityId: request.id,
    action: "supplier_pcf_request_submitted",
    summary: `Supplier submitted PCF for ${updated.partNumber}: ${declared.declaredKgco2ePerUnit} kgCO2e/${declared.declaredUnit}`,
    afterState: {
      declaredKgco2ePerUnit: declared.declaredKgco2ePerUnit,
      declaredUnit: declared.declaredUnit,
    },
  });
  return toSupplierPcfPortalView(updated);
}

function ensureSupplierPcfDataset(companyId: string): CarbonDataset {
  const state = loadBomLocal(companyId);
  const existing = state.carbonDatasets.find((d) => d.code === "SUPPLIER_PCF");
  if (existing) return existing;
  const now = new Date().toISOString();
  const dataset: CarbonDataset = {
    id: newEntityId("cds"),
    companyId,
    code: "SUPPLIER_PCF",
    name: "Supplier primary PCF factors",
    source: "supplier_portal",
    geography: "GLO",
    methodology: "supplier_declared",
    versionLabel: "1",
    status: "active",
    notes: "Synthetic factors created from approved supplier PCF submissions",
    createdAt: now,
    updatedAt: now,
  };
  updateBomLocal(companyId, (s) => ({
    ...s,
    carbonDatasets: [...s.carbonDatasets, dataset],
  }));
  return dataset;
}

/** Approve submitted primary data → synthetic EF + approved supplier_pcf mapping. */
export function localApproveSupplierPcfRequest(
  companyId: string,
  requestId: string,
  input?: { reviewedBy?: string | null; reviewNotes?: string | null }
): SupplierPcfRequest {
  ensureCarbonLibrary(companyId);
  const existing = localGetSupplierPcfRequest(companyId, requestId);
  if (!existing) throw new Error("Supplier PCF request not found");
  if (!canTransitionSupplierPcf(existing.status, "approved")) {
    throw new Error(`Cannot approve request in status ${existing.status}`);
  }
  if (existing.declaredKgco2ePerUnit == null || !Number.isFinite(existing.declaredKgco2ePerUnit)) {
    throw new Error("Submitted declaration is missing declaredKgco2ePerUnit");
  }

  const dataset = ensureSupplierPcfDataset(companyId);
  const now = new Date().toISOString();
  const unit = existing.declaredUnit || "kg";
  const factor: EmissionFactor = {
    id: newEntityId("ef"),
    companyId,
    datasetId: dataset.id,
    factorCode: `SPC_${existing.partNumber}_${requestId.slice(-6)}`.toUpperCase().replace(/\s+/g, "_"),
    name: `Supplier PCF · ${existing.supplierName} · ${existing.partNumber}`,
    category: "supplier_pcf",
    activityUnit: unit,
    valueKgco2e: existing.declaredKgco2ePerUnit,
    uncertainty: null,
    geography: "GLO",
    validFrom: now.slice(0, 10),
    validTo: null,
    metadata: {
      source: "supplier_pcf",
      requestId: existing.id,
      supplierName: existing.supplierName,
      methodology: existing.methodology,
      evidenceNotes: existing.evidenceNotes,
    },
    createdAt: now,
    updatedAt: now,
  };

  // Upsert mapping with method supplier_pcf (approved) — calc still uses qty × EF
  const prior = loadBomLocal(companyId).carbonMappings.find((m) => m.bomItemId === existing.bomItemId);
  const mapping: CarbonMapping = {
    id: prior?.id ?? newEntityId("map"),
    companyId,
    bomItemId: existing.bomItemId,
    emissionFactorId: factor.id,
    method: "supplier_pcf",
    confidence: 0.95,
    status: "approved",
    matchReason: "supplier_primary_pcf",
    approvedBy: input?.reviewedBy ?? "local-user",
    approvedAt: now,
    notes: `Approved supplier PCF from ${existing.supplierName}`,
    createdAt: prior?.createdAt ?? now,
    updatedAt: now,
  };

  const updated: SupplierPcfRequest = {
    ...existing,
    status: "approved",
    reviewedAt: now,
    reviewedBy: input?.reviewedBy ?? "local-user",
    reviewNotes: input?.reviewNotes ?? null,
    resultingFactorId: factor.id,
    resultingMappingId: mapping.id,
    updatedAt: now,
  };

  updateBomLocal(companyId, (s) => ({
    ...s,
    emissionFactors: [...s.emissionFactors, factor],
    carbonMappings: [
      ...s.carbonMappings.filter((m) => m.bomItemId !== mapping.bomItemId),
      mapping,
    ],
    supplierPcfRequests: s.supplierPcfRequests.map((r) => (r.id === requestId ? updated : r)),
  }));

  appendAuditEvent({
    companyId,
    entityType: "supplier_pcf_request",
    entityId: requestId,
    action: "supplier_pcf_request_approved",
    summary: `Approved supplier PCF for ${existing.partNumber} → factor ${factor.factorCode}`,
    actorId: input?.reviewedBy ?? null,
    afterState: {
      resultingFactorId: factor.id,
      resultingMappingId: mapping.id,
      valueKgco2e: factor.valueKgco2e,
    },
  });
  return updated;
}

export function localRejectSupplierPcfRequest(
  companyId: string,
  requestId: string,
  input?: { reviewedBy?: string | null; reviewNotes?: string | null }
): SupplierPcfRequest {
  const existing = localGetSupplierPcfRequest(companyId, requestId);
  if (!existing) throw new Error("Supplier PCF request not found");
  if (!canTransitionSupplierPcf(existing.status, "rejected")) {
    throw new Error(`Cannot reject request in status ${existing.status}`);
  }
  const now = new Date().toISOString();
  const updated: SupplierPcfRequest = {
    ...existing,
    status: "rejected",
    reviewedAt: now,
    reviewedBy: input?.reviewedBy ?? "local-user",
    reviewNotes: input?.reviewNotes ?? null,
    updatedAt: now,
  };
  updateBomLocal(companyId, (s) => ({
    ...s,
    supplierPcfRequests: s.supplierPcfRequests.map((r) => (r.id === requestId ? updated : r)),
  }));
  appendAuditEvent({
    companyId,
    entityType: "supplier_pcf_request",
    entityId: requestId,
    action: "supplier_pcf_request_rejected",
    summary: `Rejected supplier PCF request ${requestId}`,
    actorId: input?.reviewedBy ?? null,
    afterState: { status: "rejected", reviewNotes: updated.reviewNotes },
  });
  return updated;
}

export function resetCarbonLocal(companyId: string) {
  clearBomLocal(companyId);
}


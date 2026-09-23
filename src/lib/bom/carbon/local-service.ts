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
import { detectStaleCalculation } from "./stale";
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
        c.bomId === input.bomId && c.status === "completed"
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

export function resetCarbonLocal(companyId: string) {
  clearBomLocal(companyId);
}


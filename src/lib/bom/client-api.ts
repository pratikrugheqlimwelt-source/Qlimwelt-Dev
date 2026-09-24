import type {
  Bom,
  BomImportColumnMapping,
  BomImportJob,
  BomItem,
  Product,
  ProductBundle,
} from "./types";
import {
  localCommitImport,
  localCreateProduct,
  localDeleteBomItem,
  localGetBom,
  localGetImportJob,
  localGetProductBundle,
  localListBomItems,
  localListProducts,
  localPreviewImport,
  localPreviewConnectorImport,
  localUpsertBomItem,
} from "./local-service";
import {
  BOM_CONNECTOR_PROFILES,
  type BomConnectorKind,
  type ConnectorNormalizeResult,
} from "./connectors";
import {
  ensureCarbonLibrary,
  localApproveMapping,
  localCompareCalculations,
  localGetBomAnalytics,
  localListCalculations,
  localListFactors,
  localListMappings,
  localRejectMapping,
  localApproveCalculation,
  localListAuditEvents,
  localRefreshStaleFlags,
  localRejectCalculation,
  localRunCalculation,
  localSuggestForItem,
  localUpsertMapping,
  localCreateScenario,
  localDeleteScenario,
  localListScenarios,
  localRunScenario,
  localUpdateScenario,
  localApproveSupplierPcfRequest,
  localCancelSupplierPcfRequest,
  localCreateSupplierPcfRequest,
  localListSupplierPcfRequests,
  localRejectSupplierPcfRequest,
  localSendSupplierPcfRequest,
  localAssessExchangeReadiness,
  localExportReadiness,
} from "./carbon/local-service";
import { localExportPactV3 } from "./carbon/pact/export";
import type { PactProductFootprintV3 } from "./carbon/pact/wire-types";
import type {
  BomAnalytics,
  VersionCompareResult,
} from "./carbon/analytics";
import type { BomScenario, ScenarioOverride, ScenarioRunResult } from "./carbon/scenario";
import type { SupplierPcfRequest } from "./carbon/supplier-pcf";
import type {
  ExchangeReadinessReport,
  ReadinessExportBundle,
  ReadinessFormat,
} from "./carbon/readiness";
import type { BomAuditEvent, CarbonMapping, EmissionFactor, MappingSuggestion, PcfCalculation } from "./carbon/types";
async function tryJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchProducts(companyId: string): Promise<Product[]> {
  try {
    const res = await fetch("/api/bom/products");
    if (res.ok) {
      const data = await tryJson<{ products: Product[] }>(res);
      if (data?.products) return data.products;
    }
  } catch {
    /* local */
  }
  return localListProducts(companyId);
}

export async function fetchProductBundle(
  companyId: string,
  productId: string
): Promise<ProductBundle | null> {
  try {
    const res = await fetch(`/api/bom/products/${productId}`);
    if (res.ok) {
      const data = await tryJson<ProductBundle>(res);
      if (data?.product) return data;
    }
  } catch {
    /* local */
  }
  return localGetProductBundle(companyId, productId);
}

export async function createProduct(
  companyId: string,
  input: {
    productNumber: string;
    name: string;
    category?: string;
    declaredUnit?: string;
    description?: string;
  }
): Promise<ProductBundle> {
  try {
    const res = await fetch("/api/bom/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const data = await tryJson<ProductBundle>(res);
      if (data?.product) return data;
    }
  } catch {
    /* local */
  }
  return localCreateProduct(companyId, input);
}

export async function fetchBomItems(companyId: string, bomId: string): Promise<BomItem[]> {
  try {
    const res = await fetch(`/api/bom/boms/${bomId}/items`);
    if (res.ok) {
      const data = await tryJson<{ items: BomItem[] }>(res);
      if (data?.items) return data.items;
    }
  } catch {
    /* local */
  }
  return localListBomItems(companyId, bomId);
}

export async function fetchBom(companyId: string, bomId: string): Promise<Bom | null> {
  try {
    const res = await fetch(`/api/bom/boms/${bomId}`);
    if (res.ok) {
      const data = await tryJson<{ bom: Bom }>(res);
      if (data?.bom) return data.bom;
    }
  } catch {
    /* local */
  }
  return localGetBom(companyId, bomId) ?? null;
}

export async function saveBomItem(
  companyId: string,
  bomId: string,
  item: Partial<BomItem> & { partNumber: string; quantity: number; unit: string }
): Promise<BomItem> {
  try {
    const res = await fetch(`/api/bom/boms/${bomId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (res.ok) {
      const data = await tryJson<{ item: BomItem }>(res);
      if (data?.item) return data.item;
    }
    // 401/403/5xx → fall through to local store (seed / offline)
  } catch {
    /* local */
  }
  return localUpsertBomItem(companyId, {
    id: item.id,
    bomId,
    parentItemId: item.parentItemId ?? null,
    partNumber: item.partNumber,
    description: item.description ?? item.partNumber,
    itemType: item.itemType ?? "component",
    quantity: item.quantity,
    unit: item.unit,
    scrapRate: item.scrapRate ?? 0,
    yieldRate: item.yieldRate ?? 1,
    sequenceNo: item.sequenceNo ?? 0,
    supplierId: item.supplierId ?? null,
    materialId: item.materialId ?? null,
  });
}

export async function removeBomItem(companyId: string, bomId: string, itemId: string) {
  try {
    const res = await fetch(`/api/bom/boms/${bomId}/items?itemId=${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    });
    if (res.ok) return;
  } catch {
    /* local */
  }
  localDeleteBomItem(companyId, itemId);
}

export async function previewBomImport(
  companyId: string,
  bomId: string,
  fileName: string,
  csvText: string,
  mapping?: Partial<BomImportColumnMapping>
): Promise<BomImportJob> {
  try {
    const res = await fetch("/api/bom/imports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bomId, fileName, csvText, mapping }),
    });
    if (res.ok) {
      const data = await tryJson<{ job: BomImportJob }>(res);
      if (data?.job) return data.job;
    }
  } catch {
    /* local */
  }
  return localPreviewImport(companyId, bomId, fileName, csvText, mapping);
}

export async function commitBomImport(
  companyId: string,
  jobId: string
): Promise<{ job: BomImportJob; items: BomItem[] }> {
  try {
    const res = await fetch(`/api/bom/imports/${jobId}/commit`, { method: "POST" });
    if (res.ok) {
      const data = await tryJson<{ job: BomImportJob; items: BomItem[] }>(res);
      if (data?.job) return data;
    }
    // Auth / backend unavailable → local commit
  } catch {
    /* local */
  }
  return localCommitImport(companyId, jobId);
}

export async function fetchImportJob(
  companyId: string,
  jobId: string
): Promise<BomImportJob | null> {
  try {
    const res = await fetch(`/api/bom/imports/${jobId}`);
    if (res.ok) {
      const data = await tryJson<{ job: BomImportJob }>(res);
      if (data?.job) return data.job;
    }
  } catch {
    /* local */
  }
  return localGetImportJob(companyId, jobId) ?? null;
}


/* ---- Phase 1B carbon ---- */

export async function fetchEmissionFactors(companyId: string): Promise<EmissionFactor[]> {
  try {
    const res = await fetch("/api/bom/carbon/factors");
    if (res.ok) {
      const data = await tryJson<{ factors: EmissionFactor[] }>(res);
      if (data?.factors) return data.factors;
    }
  } catch {
    /* local */
  }
  return localListFactors(companyId);
}

export async function fetchCarbonMappings(
  companyId: string,
  bomId: string
): Promise<CarbonMapping[]> {
  try {
    const res = await fetch(`/api/bom/carbon/mappings?bomId=${encodeURIComponent(bomId)}`);
    if (res.ok) {
      const data = await tryJson<{ mappings: CarbonMapping[] }>(res);
      if (data?.mappings) return data.mappings;
    }
  } catch {
    /* local */
  }
  return localListMappings(companyId, bomId);
}

export async function suggestItemMappings(
  companyId: string,
  item: BomItem
): Promise<MappingSuggestion[]> {
  try {
    const res = await fetch("/api/bom/carbon/mappings/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item }),
    });
    if (res.ok) {
      const data = await tryJson<{ suggestions: MappingSuggestion[] }>(res);
      if (data?.suggestions) return data.suggestions;
    }
  } catch {
    /* local */
  }
  ensureCarbonLibrary(companyId);
  return localSuggestForItem(companyId, item);
}

export async function upsertCarbonMapping(
  companyId: string,
  input: {
    bomItemId: string;
    emissionFactorId: string;
    confidence?: number;
    matchReason?: string;
    status?: CarbonMapping["status"];
  }
): Promise<CarbonMapping> {
  try {
    const res = await fetch("/api/bom/carbon/mappings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const data = await tryJson<{ mapping: CarbonMapping }>(res);
      if (data?.mapping) return data.mapping;
    }
  } catch {
    /* local */
  }
  return localUpsertMapping(companyId, input);
}

export async function approveCarbonMapping(
  companyId: string,
  mappingId: string
): Promise<CarbonMapping> {
  try {
    const res = await fetch(`/api/bom/carbon/mappings/${mappingId}/approve`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await tryJson<{ mapping: CarbonMapping }>(res);
      if (data?.mapping) return data.mapping;
    }
  } catch {
    /* local */
  }
  return localApproveMapping(companyId, mappingId);
}

export async function rejectCarbonMapping(
  companyId: string,
  mappingId: string
): Promise<CarbonMapping> {
  try {
    const res = await fetch(`/api/bom/carbon/mappings/${mappingId}/reject`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await tryJson<{ mapping: CarbonMapping }>(res);
      if (data?.mapping) return data.mapping;
    }
  } catch {
    /* local */
  }
  return localRejectMapping(companyId, mappingId);
}

export async function runBomCalculation(
  companyId: string,
  input: {
    bomId: string;
    productId?: string | null;
    assessmentId?: string | null;
    requireApproved?: boolean;
  }
): Promise<PcfCalculation> {
  try {
    const res = await fetch(`/api/bom/boms/${input.bomId}/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const data = await tryJson<{ calculation: PcfCalculation }>(res);
      if (data?.calculation) return data.calculation;
    }
  } catch {
    /* local */
  }
  return localRunCalculation(companyId, input);
}

export async function fetchBomCalculations(
  companyId: string,
  bomId: string
): Promise<PcfCalculation[]> {
  try {
    const res = await fetch(`/api/bom/boms/${bomId}/calculations`);
    if (res.ok) {
      const data = await tryJson<{ calculations: PcfCalculation[] }>(res);
      if (data?.calculations) return data.calculations;
    }
  } catch {
    /* local */
  }
  return localListCalculations(companyId, bomId);
}


export async function approveBomCalculation(
  companyId: string,
  calculationId: string,
  input?: { notes?: string }
): Promise<PcfCalculation> {
  try {
    const res = await fetch(`/api/bom/calculations/${calculationId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input ?? {}),
    });
    if (res.ok) {
      const data = await tryJson<{ calculation: PcfCalculation }>(res);
      if (data?.calculation) return data.calculation;
    }
  } catch {
    /* local */
  }
  return localApproveCalculation(companyId, calculationId, {
    approvedBy: "local-user",
    notes: input?.notes,
  });
}

export async function rejectBomCalculation(
  companyId: string,
  calculationId: string,
  input?: { notes?: string }
): Promise<PcfCalculation> {
  try {
    const res = await fetch(`/api/bom/calculations/${calculationId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input ?? {}),
    });
    if (res.ok) {
      const data = await tryJson<{ calculation: PcfCalculation }>(res);
      if (data?.calculation) return data.calculation;
    }
  } catch {
    /* local */
  }
  return localRejectCalculation(companyId, calculationId, input);
}

export async function refreshBomStaleFlags(
  companyId: string,
  bomId: string
): Promise<PcfCalculation[]> {
  try {
    const res = await fetch(`/api/bom/boms/${bomId}/stale/refresh`, { method: "POST" });
    if (res.ok) {
      const data = await tryJson<{ calculations: PcfCalculation[] }>(res);
      if (data?.calculations) return data.calculations;
    }
  } catch {
    /* local */
  }
  return localRefreshStaleFlags(companyId, bomId);
}

export async function fetchBomAuditEvents(
  companyId: string,
  filter?: { entityType?: string; entityId?: string; limit?: number }
): Promise<BomAuditEvent[]> {
  try {
    const params = new URLSearchParams();
    if (filter?.entityType) params.set("entityType", filter.entityType);
    if (filter?.entityId) params.set("entityId", filter.entityId);
    if (filter?.limit) params.set("limit", String(filter.limit));
    const res = await fetch(`/api/bom/audit?${params.toString()}`);
    if (res.ok) {
      const data = await tryJson<{ events: BomAuditEvent[] }>(res);
      if (data?.events) return data.events;
    }
  } catch {
    /* local */
  }
  return localListAuditEvents(companyId, filter);
}

export async function fetchBomAnalytics(
  companyId: string,
  bomId: string,
  calculationId?: string
): Promise<BomAnalytics | null> {
  try {
    const params = new URLSearchParams();
    if (calculationId) params.set("calculationId", calculationId);
    const qs = params.toString();
    const res = await fetch(
      `/api/bom/boms/${bomId}/analytics${qs ? `?${qs}` : ""}`
    );
    if (res.ok) {
      const data = await tryJson<{ analytics: BomAnalytics }>(res);
      if (data?.analytics) return data.analytics;
    }
  } catch {
    /* local */
  }
  return localGetBomAnalytics(companyId, bomId, calculationId);
}

export async function compareBomCalculations(
  companyId: string,
  leftId: string,
  rightId: string
): Promise<VersionCompareResult> {
  try {
    const params = new URLSearchParams({ left: leftId, right: rightId });
    const res = await fetch(`/api/bom/calculations/compare?${params.toString()}`);
    if (res.ok) {
      const data = await tryJson<{ comparison: VersionCompareResult }>(res);
      if (data?.comparison) return data.comparison;
    }
  } catch {
    /* local */
  }
  return localCompareCalculations(companyId, leftId, rightId);
}


export async function fetchBomScenarios(
  companyId: string,
  bomId: string
): Promise<BomScenario[]> {
  try {
    const res = await fetch(`/api/bom/boms/${bomId}/scenarios`);
    if (res.ok) {
      const data = await tryJson<{ scenarios: BomScenario[] }>(res);
      if (data?.scenarios) return data.scenarios;
    }
  } catch {
    /* local */
  }
  return localListScenarios(companyId, bomId);
}

export async function createBomScenario(
  companyId: string,
  input: {
    bomId: string;
    name: string;
    description?: string | null;
    baselineCalculationId?: string | null;
    overrides?: ScenarioOverride[];
  }
): Promise<BomScenario> {
  try {
    const res = await fetch(`/api/bom/boms/${input.bomId}/scenarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const data = await tryJson<{ scenario: BomScenario }>(res);
      if (data?.scenario) return data.scenario;
    }
  } catch {
    /* local */
  }
  return localCreateScenario(companyId, input);
}

export async function updateBomScenario(
  companyId: string,
  scenarioId: string,
  patch: {
    name?: string;
    description?: string | null;
    baselineCalculationId?: string | null;
    overrides?: ScenarioOverride[];
  }
): Promise<BomScenario> {
  try {
    const res = await fetch(`/api/bom/scenarios/${scenarioId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await tryJson<{ scenario: BomScenario }>(res);
      if (data?.scenario) return data.scenario;
    }
  } catch {
    /* local */
  }
  return localUpdateScenario(companyId, scenarioId, patch);
}

export async function deleteBomScenario(
  companyId: string,
  scenarioId: string
): Promise<void> {
  try {
    const res = await fetch(`/api/bom/scenarios/${scenarioId}`, { method: "DELETE" });
    if (res.ok) return;
  } catch {
    /* local */
  }
  localDeleteScenario(companyId, scenarioId);
}

export async function runBomScenario(
  companyId: string,
  scenarioId: string,
  input?: { productId?: string | null; requireApproved?: boolean }
): Promise<ScenarioRunResult> {
  try {
    const res = await fetch(`/api/bom/scenarios/${scenarioId}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input ?? {}),
    });
    if (res.ok) {
      const data = await tryJson<ScenarioRunResult>(res);
      if (data?.result) return data;
    }
  } catch {
    /* local */
  }
  return localRunScenario(companyId, scenarioId, input);
}

export async function fetchSupplierPcfRequests(
  companyId: string,
  bomId: string
): Promise<SupplierPcfRequest[]> {
  try {
    const res = await fetch(`/api/bom/boms/${bomId}/supplier-pcf-requests`);
    if (res.ok) {
      const data = await tryJson<{ requests: SupplierPcfRequest[] }>(res);
      if (data?.requests) return data.requests;
    }
  } catch {
    /* local */
  }
  return localListSupplierPcfRequests(companyId, bomId);
}

export async function createSupplierPcfRequest(
  companyId: string,
  input: {
    bomId: string;
    bomItemId: string;
    supplierName: string;
    supplierEmail?: string | null;
    message?: string | null;
    send?: boolean;
  }
): Promise<SupplierPcfRequest> {
  try {
    const res = await fetch(`/api/bom/boms/${input.bomId}/supplier-pcf-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const data = await tryJson<{ request: SupplierPcfRequest }>(res);
      if (data?.request) return data.request;
    }
  } catch {
    /* local */
  }
  let created = localCreateSupplierPcfRequest(companyId, input);
  if (input.send) {
    created = localSendSupplierPcfRequest(companyId, created.id);
  }
  return created;
}

async function patchSupplierPcfRequest(
  companyId: string,
  requestId: string,
  action: "send" | "cancel" | "approve" | "reject",
  reviewNotes?: string | null
): Promise<SupplierPcfRequest> {
  try {
    const res = await fetch(`/api/bom/supplier-pcf-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewNotes }),
    });
    if (res.ok) {
      const data = await tryJson<{ request: SupplierPcfRequest }>(res);
      if (data?.request) return data.request;
    }
  } catch {
    /* local */
  }
  if (action === "send") return localSendSupplierPcfRequest(companyId, requestId);
  if (action === "cancel") return localCancelSupplierPcfRequest(companyId, requestId);
  if (action === "approve") {
    return localApproveSupplierPcfRequest(companyId, requestId, { reviewNotes });
  }
  return localRejectSupplierPcfRequest(companyId, requestId, { reviewNotes });
}

export function sendSupplierPcfRequest(companyId: string, requestId: string) {
  return patchSupplierPcfRequest(companyId, requestId, "send");
}

export function cancelSupplierPcfRequest(companyId: string, requestId: string) {
  return patchSupplierPcfRequest(companyId, requestId, "cancel");
}

export function approveSupplierPcfRequest(
  companyId: string,
  requestId: string,
  reviewNotes?: string | null
) {
  return patchSupplierPcfRequest(companyId, requestId, "approve", reviewNotes);
}

export function rejectSupplierPcfRequest(
  companyId: string,
  requestId: string,
  reviewNotes?: string | null
) {
  return patchSupplierPcfRequest(companyId, requestId, "reject", reviewNotes);
}

export function listBomConnectorProfiles() {
  return BOM_CONNECTOR_PROFILES;
}

export async function previewBomConnectorImport(
  companyId: string,
  bomId: string,
  kind: BomConnectorKind,
  payload: string,
  fileName?: string
): Promise<{ job: BomImportJob; normalized: ConnectorNormalizeResult }> {
  try {
    const res = await fetch(`/api/bom/boms/${bomId}/connectors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, payload, fileName }),
    });
    if (res.ok) {
      const data = await tryJson<{
        job: BomImportJob;
        normalized: ConnectorNormalizeResult;
      }>(res);
      if (data?.job && data.normalized) return data;
    }
  } catch {
    /* local */
  }
  return localPreviewConnectorImport(companyId, bomId, kind, payload, fileName);
}

export async function fetchExchangeReadiness(
  companyId: string,
  calculationId: string
): Promise<ExchangeReadinessReport> {
  try {
    const res = await fetch(`/api/bom/calculations/${calculationId}/readiness`);
    if (res.ok) {
      const data = await tryJson<{ readiness: ExchangeReadinessReport }>(res);
      if (data?.readiness) return data.readiness;
    }
  } catch {
    /* local */
  }
  return localAssessExchangeReadiness(companyId, calculationId);
}

export async function exportReadinessPayload(
  companyId: string,
  calculationId: string,
  format: ReadinessFormat
): Promise<ReadinessExportBundle> {
  try {
    const res = await fetch(
      `/api/bom/calculations/${calculationId}/readiness?format=${encodeURIComponent(format)}`
    );
    if (res.ok) {
      const data = await tryJson<ReadinessExportBundle>(res);
      if (data?.payload && data.readiness) return data;
    }
  } catch {
    /* local */
  }
  return localExportReadiness(companyId, calculationId, format);
}

export async function exportPactV3Footprint(
  companyId: string,
  calculationId: string,
  options?: { companyName?: string | null }
): Promise<{
  footprint: PactProductFootprintV3;
  exchangeId: string;
  schemaOk: boolean;
  semanticsOk: boolean;
}> {
  try {
    const res = await fetch("/api/bom/pact/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calculationId,
        companyName: options?.companyName ?? undefined,
      }),
    });
    if (res.ok) {
      const data = await tryJson<{
        footprint: PactProductFootprintV3;
        exchangeId: string;
        schemaOk: boolean;
        semanticsOk: boolean;
      }>(res);
      if (data?.footprint) return data;
    } else {
      const err = await tryJson<{ error?: string; issues?: unknown }>(res);
      if (err?.error) {
        throw new Error(err.error);
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message !== "Failed to fetch") {
      // Prefer surfacing validation errors from API when present;
      // fall through to local for network/auth gaps.
      if (!/fetch|network|supabase/i.test(e.message)) throw e;
    }
  }
  const bundle = localExportPactV3(companyId, calculationId, {
    companyName: options?.companyName ?? null,
  });
  return {
    footprint: bundle.footprint,
    exchangeId: bundle.exchangeId,
    schemaOk: bundle.schema.ok,
    semanticsOk: bundle.semantics.ok,
  };
}

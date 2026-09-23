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
  localUpsertBomItem,
} from "./local-service";
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
} from "./carbon/local-service";
import type {
  BomAnalytics,
  VersionCompareResult,
} from "./carbon/analytics";
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

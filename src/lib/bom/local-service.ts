import type {
  Bom,
  BomImportColumnMapping,
  BomImportJob,
  BomItem,
  Product,
  ProductBundle,
  ProductVersion,
} from "./types";
import { previewRowsToBomItems } from "./import/commit";
import { previewFromCsvText } from "./import/parse";
import {
  normalizeConnectorPayload,
  type BomConnectorKind,
  type ConnectorNormalizeResult,
} from "./connectors";
import { loadBomLocal, newEntityId, updateBomLocal, type BomLocalState } from "./local-store";
import { hasBlockingErrors, validateBomStructure } from "./validate";

function nowIso() {
  return new Date().toISOString();
}

export function localListProducts(companyId: string): Product[] {
  return loadBomLocal(companyId).products.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function localGetProductBundle(companyId: string, productId: string): ProductBundle | null {
  const state = loadBomLocal(companyId);
  const product = state.products.find((p) => p.id === productId);
  if (!product) return null;
  const versions = state.versions.filter((v) => v.productId === productId);
  const versionIds = new Set(versions.map((v) => v.id));
  const boms = state.boms.filter((b) => versionIds.has(b.productVersionId));
  return { product, versions, boms };
}

export function localCreateProduct(
  companyId: string,
  input: {
    productNumber: string;
    name: string;
    category?: string;
    declaredUnit?: string;
    description?: string;
  }
): ProductBundle {
  const ts = nowIso();
  const product: Product = {
    id: newEntityId("prod"),
    companyId,
    productNumber: input.productNumber.trim(),
    name: input.name.trim(),
    description: input.description ?? null,
    category: input.category ?? "general",
    declaredUnit: input.declaredUnit ?? "piece",
    status: "draft",
    createdAt: ts,
    updatedAt: ts,
  };
  const version: ProductVersion = {
    id: newEntityId("pver"),
    companyId,
    productId: product.id,
    versionLabel: "1.0",
    status: "draft",
    effectiveFrom: null,
    effectiveTo: null,
    notes: null,
    createdAt: ts,
    updatedAt: ts,
  };
  const bom: Bom = {
    id: newEntityId("bom"),
    companyId,
    productVersionId: version.id,
    bomType: "engineering",
    versionLabel: "1",
    status: "draft",
    effectiveFrom: null,
    effectiveTo: null,
    notes: null,
    createdAt: ts,
    updatedAt: ts,
  };
  updateBomLocal(companyId, (s) => ({
    ...s,
    products: [...s.products, product],
    versions: [...s.versions, version],
    boms: [...s.boms, bom],
  }));
  return { product, versions: [version], boms: [bom] };
}

export function localListBomItems(companyId: string, bomId: string): BomItem[] {
  return loadBomLocal(companyId)
    .items.filter((i) => i.bomId === bomId)
    .sort((a, b) => a.sequenceNo - b.sequenceNo || a.partNumber.localeCompare(b.partNumber));
}

export function localGetBom(companyId: string, bomId: string): Bom | undefined {
  return loadBomLocal(companyId).boms.find((b) => b.id === bomId);
}

export function localUpsertBomItem(
  companyId: string,
  item: {
    id?: string;
    bomId: string;
    parentItemId?: string | null;
    partNumber: string;
    description?: string;
    itemType?: BomItem["itemType"];
    quantity: number;
    unit: string;
    scrapRate?: number;
    yieldRate?: number;
    sequenceNo?: number;
    supplierId?: string | null;
    materialId?: string | null;
  }
): BomItem {
  const ts = nowIso();
  const id = item.id || newEntityId("bitem");
  const previous = loadBomLocal(companyId).items.find((i) => i.id === id);
  const saved: BomItem = {
    id,
    companyId,
    bomId: item.bomId,
    parentItemId: item.parentItemId ?? null,
    partNumber: item.partNumber.trim(),
    description: (item.description ?? item.partNumber).trim(),
    itemType: item.itemType ?? "component",
    quantity: item.quantity,
    unit: item.unit,
    scrapRate: item.scrapRate ?? 0,
    yieldRate: item.yieldRate ?? 1,
    sequenceNo: item.sequenceNo ?? 0,
    supplierId: item.supplierId ?? null,
    materialId: item.materialId ?? null,
    createdAt: previous?.createdAt ?? ts,
    updatedAt: ts,
  };

  updateBomLocal(companyId, (s) => {
    const exists = s.items.some((i) => i.id === id);
    return {
      ...s,
      items: exists ? s.items.map((i) => (i.id === id ? saved : i)) : [...s.items, saved],
    };
  });

  const all = localListBomItems(companyId, saved.bomId);
  const issues = validateBomStructure(all);
  if (hasBlockingErrors(issues.filter((i) => i.code === "CIRCULAR_BOM"))) {
    updateBomLocal(companyId, (s) => ({
      ...s,
      items: previous
        ? s.items.map((i) => (i.id === id ? previous : i))
        : s.items.filter((i) => i.id !== id),
    }));
    throw new Error(issues.find((i) => i.code === "CIRCULAR_BOM")?.message ?? "Circular BOM");
  }
  return saved;
}

export function localDeleteBomItem(companyId: string, itemId: string) {
  updateBomLocal(companyId, (s) => {
    const toRemove = new Set<string>([itemId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const i of s.items) {
        if (i.parentItemId && toRemove.has(i.parentItemId) && !toRemove.has(i.id)) {
          toRemove.add(i.id);
          changed = true;
        }
      }
    }
    return { ...s, items: s.items.filter((i) => !toRemove.has(i.id)) };
  });
}

export function localPreviewImport(
  companyId: string,
  bomId: string,
  fileName: string,
  csvText: string,
  mapping?: Partial<BomImportColumnMapping>
): BomImportJob {
  const preview = previewFromCsvText(csvText, mapping);
  const ts = nowIso();
  const job: BomImportJob = {
    id: newEntityId("bimp"),
    companyId,
    bomId,
    fileName,
    status: "preview",
    rowCount: preview.rows.length,
    validCount: preview.validCount,
    warningCount: preview.warningCount,
    errorCount: preview.errorCount,
    columnMapping: {
      partNumber: mapping?.partNumber || preview.detectedColumns[0] || "part_number",
      ...mapping,
    },
    preview,
    errorMessage: null,
    createdAt: ts,
    committedAt: null,
  };
  updateBomLocal(companyId, (s) => ({ ...s, importJobs: [...s.importJobs, job] }));
  return job;
}

export function localCommitImport(
  companyId: string,
  jobId: string
): { job: BomImportJob; items: BomItem[] } {
  const state = loadBomLocal(companyId);
  const job = state.importJobs.find((j) => j.id === jobId);
  if (!job) throw new Error("Import job not found");
  if (!job.bomId) throw new Error("Import job has no BOM");
  if (job.errorCount > 0 || hasBlockingErrors(job.preview.issues)) {
    throw new Error("Cannot commit import with blocking errors");
  }

  const items = previewRowsToBomItems(companyId, job.bomId, job.preview);
  const structureIssues = validateBomStructure(items);
  if (hasBlockingErrors(structureIssues)) {
    throw new Error(structureIssues[0]?.message ?? "BOM structure invalid");
  }

  const ts = nowIso();
  const committed: BomImportJob = { ...job, status: "committed", committedAt: ts };
  updateBomLocal(companyId, (s) => ({
    ...s,
    items: [...s.items.filter((i) => i.bomId !== job.bomId), ...items],
    importJobs: s.importJobs.map((j) => (j.id === jobId ? committed : j)),
  }));
  return { job: committed, items };
}

export function localGetImportJob(companyId: string, jobId: string): BomImportJob | undefined {
  return loadBomLocal(companyId).importJobs.find((j) => j.id === jobId);
}

/** Phase 8 — normalize ERP/PLM/PDM payload → canonical CSV → same import job path. */
export function localPreviewConnectorImport(
  companyId: string,
  bomId: string,
  kind: BomConnectorKind,
  payload: string,
  fileName?: string
): { job: BomImportJob; normalized: ConnectorNormalizeResult } {
  const normalized = normalizeConnectorPayload(kind, payload);
  const job = localPreviewImport(
    companyId,
    bomId,
    fileName?.trim() || `${kind}-import.json`,
    normalized.csvText
  );
  const stamped: BomImportJob = {
    ...job,
    connectorKind: kind,
    sourceSystem: normalized.sourceSystem,
    connectorWarnings: normalized.warnings,
    warningCount: job.warningCount + normalized.warnings.length,
  };
  updateBomLocal(companyId, (s) => ({
    ...s,
    importJobs: s.importJobs.map((j) => (j.id === stamped.id ? stamped : j)),
  }));
  return { job: stamped, normalized };
}

export function localSnapshot(companyId: string): BomLocalState {
  return loadBomLocal(companyId);
}

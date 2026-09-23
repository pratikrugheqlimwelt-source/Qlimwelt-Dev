/** Browser local store for BOM Phase 1A when Supabase tables are unavailable */

import type {
  Bom,
  BomImportJob,
  BomItem,
  Material,
  Product,
  ProductVersion,
} from "./types";

const PREFIX = "qlimwelt-bom-v1:";

export type BomLocalState = {
  products: Product[];
  versions: ProductVersion[];
  boms: Bom[];
  items: BomItem[];
  materials: Material[];
  importJobs: BomImportJob[];
};

function key(companyId: string) {
  return `${PREFIX}${companyId}`;
}

function empty(): BomLocalState {
  return {
    products: [],
    versions: [],
    boms: [],
    items: [],
    materials: [],
    importJobs: [],
  };
}

export function loadBomLocal(companyId: string): BomLocalState {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(key(companyId));
    if (!raw) return empty();
    return { ...empty(), ...(JSON.parse(raw) as BomLocalState) };
  } catch {
    return empty();
  }
}

export function saveBomLocal(companyId: string, state: BomLocalState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(companyId), JSON.stringify(state));
}

export function updateBomLocal(
  companyId: string,
  updater: (state: BomLocalState) => BomLocalState
): BomLocalState {
  const next = updater(loadBomLocal(companyId));
  saveBomLocal(companyId, next);
  return next;
}

export function newEntityId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

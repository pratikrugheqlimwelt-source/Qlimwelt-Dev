/** Browser local store for BOM Phase 1A when Supabase tables are unavailable */

import type {
  Bom,
  BomImportJob,
  BomItem,
  Material,
  Product,
  ProductVersion,
} from "./types";
import type {
  CarbonDataset,
  CarbonMapping,
  EmissionFactor,
  PcfCalculation,
} from "./carbon/types";

const PREFIX = "qlimwelt-bom-v1:";

/** In-memory fallback for Node/tests (no window.localStorage). */
const memoryStore = new Map<string, BomLocalState>();

export type BomLocalState = {
  products: Product[];
  versions: ProductVersion[];
  boms: Bom[];
  items: BomItem[];
  materials: Material[];
  importJobs: BomImportJob[];
  carbonDatasets: CarbonDataset[];
  emissionFactors: EmissionFactor[];
  carbonMappings: CarbonMapping[];
  pcfCalculations: PcfCalculation[];
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
    carbonDatasets: [],
    emissionFactors: [],
    carbonMappings: [],
    pcfCalculations: [],
  };
}

export function loadBomLocal(companyId: string): BomLocalState {
  const k = key(companyId);
  if (typeof window === "undefined") {
    return memoryStore.get(k) ?? empty();
  }
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return empty();
    return { ...empty(), ...(JSON.parse(raw) as BomLocalState) };
  } catch {
    return empty();
  }
}

export function saveBomLocal(companyId: string, state: BomLocalState) {
  const k = key(companyId);
  if (typeof window === "undefined") {
    memoryStore.set(k, state);
    return;
  }
  localStorage.setItem(k, JSON.stringify(state));
}

/** Test helper: clear in-memory store for a company (or all). */
export function clearBomLocal(companyId?: string) {
  if (companyId) memoryStore.delete(key(companyId));
  else memoryStore.clear();
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

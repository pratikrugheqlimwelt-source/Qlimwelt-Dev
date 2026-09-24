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
  BomAuditEvent,
  BomScenario,
  SupplierPcfRequest,
  CarbonDataset,
  CarbonMapping,
  EmissionFactor,
  PcfCalculation,
} from "./carbon/types";
import type {
  PactEndpoint,
  PactExchange,
  ProductIdentityMapping,
  SupplierPcfRecord,
} from "./carbon/pact/types";

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
  auditEvents: BomAuditEvent[];
  scenarios: BomScenario[];
  supplierPcfRequests: SupplierPcfRequest[];
  /** PACT V3 Phase 3a */
  pactEndpoints: PactEndpoint[];
  productIdentityMappings: ProductIdentityMapping[];
  supplierPcfRecords: SupplierPcfRecord[];
  pactExchanges: PactExchange[];
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
    auditEvents: [],
    scenarios: [],
    supplierPcfRequests: [],
    pactEndpoints: [],
    productIdentityMappings: [],
    supplierPcfRecords: [],
    pactExchanges: [],
  };
}

export function loadBomLocal(companyId: string): BomLocalState {
  const k = key(companyId);
  if (typeof window === "undefined") {
    const mem = memoryStore.get(k);
    return mem ? { ...empty(), ...mem } : empty();
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

/** Scan in-memory company stores for a supplier portal token (tests / Node). */
export function findSupplierPcfRequestByToken(
  token: string
): { companyId: string; request: SupplierPcfRequest } | null {
  for (const [k, state] of memoryStore.entries()) {
    const request = (state.supplierPcfRequests ?? []).find((r) => r.accessToken === token);
    if (request) {
      const companyId = k.slice(PREFIX.length);
      return { companyId, request };
    }
  }
  if (typeof window !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const keyName = localStorage.key(i);
      if (!keyName || !keyName.startsWith(PREFIX)) continue;
      try {
        const state = JSON.parse(localStorage.getItem(keyName) || "{}") as BomLocalState;
        const request = (state.supplierPcfRequests ?? []).find((r) => r.accessToken === token);
        if (request) {
          return { companyId: keyName.slice(PREFIX.length), request };
        }
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}

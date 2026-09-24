/**
 * PACT V3 Phase 6 — hosted ProductFootprint catalog (local-store backed).
 */

import { localListPactExchanges } from "../store";
import type { PactProductFootprintV3 } from "../wire-types";

function isFootprint(value: unknown): value is PactProductFootprintV3 {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.specVersion === "string" &&
    typeof o.pcf === "object" &&
    o.pcf !== null &&
    Array.isArray(o.productIds) &&
    Array.isArray(o.companyIds)
  );
}

export function listHostedProductFootprints(
  companyId: string,
  filter?: {
    productId?: string[];
    companyIdFilter?: string[];
    status?: string;
    limit?: number;
  }
): PactProductFootprintV3[] {
  const exports = localListPactExchanges(companyId, {
    direction: "outbound",
    kind: "export",
  }).filter((e) => e.status === "completed" && e.responsePayload);

  const byId = new Map<string, PactProductFootprintV3>();
  for (const exchange of exports) {
    const payload = exchange.responsePayload;
    const candidate =
      payload && isFootprint(payload)
        ? payload
        : payload && isFootprint((payload as { footprint?: unknown }).footprint)
          ? ((payload as { footprint: PactProductFootprintV3 }).footprint)
          : null;
    if (!candidate) continue;
    if (!byId.has(candidate.id)) byId.set(candidate.id, candidate);
  }

  let list = [...byId.values()];
  if (filter?.status) {
    const wanted = filter.status.toLowerCase();
    list = list.filter((f) => String(f.status).toLowerCase() === wanted);
  }
  if (filter?.productId?.length) {
    const wanted = new Set(filter.productId.map((v) => v.toLowerCase()));
    list = list.filter((f) =>
      f.productIds.some((id) => wanted.has(String(id).toLowerCase()))
    );
  }
  if (filter?.companyIdFilter?.length) {
    const wanted = new Set(filter.companyIdFilter.map((v) => v.toLowerCase()));
    list = list.filter((f) =>
      f.companyIds.some((id) => wanted.has(String(id).toLowerCase()))
    );
  }
  list.sort((a, b) => String(b.created).localeCompare(String(a.created)));
  if (typeof filter?.limit === "number" && filter.limit >= 0) {
    list = list.slice(0, filter.limit);
  }
  return list;
}

export function getHostedProductFootprint(
  companyId: string,
  footprintId: string
): PactProductFootprintV3 | null {
  return (
    listHostedProductFootprints(companyId).find((f) => f.id === footprintId) ?? null
  );
}

import type { BomItem } from "@/lib/bom/types";
import type { CarbonLedgerEntry, PcfCalculation } from "./types";

export type CarbonHotspot = {
  bomItemId: string | null;
  partNumber: string;
  directKgco2e: number;
  rolledKgco2e: number;
  shareOfTotal: number;
  method: string | null;
  confidence: number | null;
};

export type CarbonExplorerNode = {
  bomItemId: string | null;
  partNumber: string;
  itemType?: string;
  quantity?: number;
  unit?: string;
  directKgco2e: number;
  rolledKgco2e: number;
  shareOfTotal: number;
  children: CarbonExplorerNode[];
};

export type LifecycleBucket = {
  itemType: string;
  kgco2e: number;
  shareOfTotal: number;
  itemCount: number;
};

export type VersionCompareRow = {
  partNumber: string;
  leftKgco2e: number;
  rightKgco2e: number;
  deltaKgco2e: number;
  deltaPct: number | null;
};

export type VersionCompareResult = {
  leftCalculationId: string;
  rightCalculationId: string;
  leftTotalKgco2e: number;
  rightTotalKgco2e: number;
  deltaTotalKgco2e: number;
  deltaPct: number | null;
  rows: VersionCompareRow[];
};

export type BomAnalytics = {
  calculationId: string;
  totalKgco2e: number;
  declaredUnit: string;
  hotspots: CarbonHotspot[];
  explorer: CarbonExplorerNode[];
  lifecycle: LifecycleBucket[];
};

function pct(part: number, total: number): number {
  if (!total) return 0;
  return Number((part / total).toFixed(6));
}

function deltaPct(left: number, right: number): number | null {
  if (left === 0) return right === 0 ? 0 : null;
  return Number((((right - left) / Math.abs(left)) * 100).toFixed(3));
}

/** Direct (own) kg = rolled − sum(children rolled). */
export function directContributionMap(
  ledger: CarbonLedgerEntry[]
): Map<string, { entry: CarbonLedgerEntry; direct: number; rolled: number }> {
  const childrenOf = new Map<string, CarbonLedgerEntry[]>();
  for (const e of ledger) {
    if (!e.parentEntryId) continue;
    const list = childrenOf.get(e.parentEntryId) ?? [];
    list.push(e);
    childrenOf.set(e.parentEntryId, list);
  }
  const out = new Map<string, { entry: CarbonLedgerEntry; direct: number; rolled: number }>();
  for (const e of ledger) {
    const childSum = (childrenOf.get(e.id) ?? []).reduce((s, c) => s + c.contributionKgco2e, 0);
    const direct = Number(Math.max(0, e.contributionKgco2e - childSum).toFixed(9));
    out.set(e.id, { entry: e, direct, rolled: e.contributionKgco2e });
  }
  return out;
}

export function buildHotspots(
  calc: PcfCalculation,
  limit = 10
): CarbonHotspot[] {
  const ledger = calc.ledger ?? [];
  const total = calc.totalKgco2e || 0;
  const directMap = directContributionMap(ledger);
  const rows: CarbonHotspot[] = [];
  // Only own (direct) emissions — parents that only roll up children are excluded
  // so hotspot shares sum ≈ 1 without double-counting rolled totals.
  for (const { entry, direct, rolled } of directMap.values()) {
    if (direct <= 0) continue;
    rows.push({
      bomItemId: entry.bomItemId,
      partNumber: entry.partNumber,
      directKgco2e: direct,
      rolledKgco2e: rolled,
      shareOfTotal: pct(direct, total),
      method: entry.method ?? null,
      confidence: entry.confidence,
    });
  }
  return rows
    .sort((a, b) => b.directKgco2e - a.directKgco2e || b.rolledKgco2e - a.rolledKgco2e)
    .slice(0, limit);
}

export function buildCarbonExplorer(
  calc: PcfCalculation,
  items: BomItem[] = []
): CarbonExplorerNode[] {
  const ledger = calc.ledger ?? [];
  const total = calc.totalKgco2e || 0;
  const itemById = new Map(items.map((i) => [i.id, i]));
  const directMap = directContributionMap(ledger);
  const nodeByEntryId = new Map<string, CarbonExplorerNode>();

  for (const e of ledger) {
    const d = directMap.get(e.id)!;
    const item = e.bomItemId ? itemById.get(e.bomItemId) : undefined;
    nodeByEntryId.set(e.id, {
      bomItemId: e.bomItemId,
      partNumber: e.partNumber,
      itemType: item?.itemType,
      quantity: item?.quantity,
      unit: item?.unit,
      directKgco2e: d.direct,
      rolledKgco2e: d.rolled,
      shareOfTotal: pct(d.rolled, total),
      children: [],
    });
  }

  const roots: CarbonExplorerNode[] = [];
  for (const e of ledger) {
    const node = nodeByEntryId.get(e.id)!;
    if (e.parentEntryId && nodeByEntryId.has(e.parentEntryId)) {
      nodeByEntryId.get(e.parentEntryId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  function sortTree(nodes: CarbonExplorerNode[]) {
    nodes.sort((a, b) => b.rolledKgco2e - a.rolledKgco2e);
    for (const n of nodes) sortTree(n.children);
  }
  sortTree(roots);
  return roots;
}

export function buildLifecycleBreakdown(
  calc: PcfCalculation,
  items: BomItem[]
): LifecycleBucket[] {
  const ledger = calc.ledger ?? [];
  const total = calc.totalKgco2e || 0;
  const itemById = new Map(items.map((i) => [i.id, i]));
  const directMap = directContributionMap(ledger);
  const buckets = new Map<string, { kg: number; count: number }>();

  for (const { entry, direct } of directMap.values()) {
    if (direct <= 0) continue;
    const item = entry.bomItemId ? itemById.get(entry.bomItemId) : undefined;
    const key = item?.itemType ?? "unknown";
    const cur = buckets.get(key) ?? { kg: 0, count: 0 };
    cur.kg += direct;
    cur.count += 1;
    buckets.set(key, cur);
  }

  return [...buckets.entries()]
    .map(([itemType, v]) => ({
      itemType,
      kgco2e: Number(v.kg.toFixed(9)),
      shareOfTotal: pct(v.kg, total),
      itemCount: v.count,
    }))
    .sort((a, b) => b.kgco2e - a.kgco2e);
}

export function buildBomAnalytics(
  calc: PcfCalculation,
  items: BomItem[] = [],
  hotspotLimit = 10
): BomAnalytics {
  return {
    calculationId: calc.id,
    totalKgco2e: calc.totalKgco2e,
    declaredUnit: calc.declaredUnit,
    hotspots: buildHotspots(calc, hotspotLimit),
    explorer: buildCarbonExplorer(calc, items),
    lifecycle: buildLifecycleBreakdown(calc, items),
  };
}

/** Compare two calculations by part number (direct contribution). */
export function compareCalculations(
  left: PcfCalculation,
  right: PcfCalculation
): VersionCompareResult {
  const leftDirect = directContributionMap(left.ledger ?? []);
  const rightDirect = directContributionMap(right.ledger ?? []);
  const leftDirectByPart = new Map<string, number>();
  const rightDirectByPart = new Map<string, number>();
  for (const { entry, direct } of leftDirect.values()) {
    if (direct <= 0) continue;
    leftDirectByPart.set(entry.partNumber, (leftDirectByPart.get(entry.partNumber) ?? 0) + direct);
  }
  for (const { entry, direct } of rightDirect.values()) {
    if (direct <= 0) continue;
    rightDirectByPart.set(entry.partNumber, (rightDirectByPart.get(entry.partNumber) ?? 0) + direct);
  }

  const parts = new Set([...leftDirectByPart.keys(), ...rightDirectByPart.keys()]);
  const rows: VersionCompareRow[] = [...parts].map((partNumber) => {
    const l = leftDirectByPart.get(partNumber) ?? 0;
    const r = rightDirectByPart.get(partNumber) ?? 0;
    return {
      partNumber,
      leftKgco2e: Number(l.toFixed(9)),
      rightKgco2e: Number(r.toFixed(9)),
      deltaKgco2e: Number((r - l).toFixed(9)),
      deltaPct: deltaPct(l, r),
    };
  });
  rows.sort((a, b) => Math.abs(b.deltaKgco2e) - Math.abs(a.deltaKgco2e));

  return {
    leftCalculationId: left.id,
    rightCalculationId: right.id,
    leftTotalKgco2e: left.totalKgco2e,
    rightTotalKgco2e: right.totalKgco2e,
    deltaTotalKgco2e: Number((right.totalKgco2e - left.totalKgco2e).toFixed(9)),
    deltaPct: deltaPct(left.totalKgco2e, right.totalKgco2e),
    rows,
  };
}

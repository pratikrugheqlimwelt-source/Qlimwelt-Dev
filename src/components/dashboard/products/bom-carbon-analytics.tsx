"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  compareBomCalculations,
  fetchBomAnalytics,
  fetchBomCalculations,
} from "@/lib/bom/client-api";
import type {
  BomAnalytics,
  CarbonExplorerNode,
  VersionCompareResult,
} from "@/lib/bom/carbon/analytics";
import type { PcfCalculation } from "@/lib/bom/carbon/types";

type Props = {
  companyId: string;
  bomId: string;
  /** Bump to reload after a new PCF run */
  refreshKey?: number | string;
};

function fmtKg(n: number): string {
  return n.toFixed(4);
}

function fmtPct(share: number): string {
  return `${(share * 100).toFixed(1)}%`;
}

function ExplorerBranch({ node, depth = 0 }: { node: CarbonExplorerNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasKids = node.children.length > 0;
  return (
    <div className="text-xs">
      <button
        type="button"
        className="flex w-full items-start gap-2 rounded px-1 py-1 text-left hover:bg-muted/40"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={() => hasKids && setOpen((v) => !v)}
      >
        <span className="w-3 shrink-0 tabular-nums text-muted-foreground">
          {hasKids ? (open ? "▾" : "▸") : "·"}
        </span>
        <span className="min-w-0 flex-1 font-mono">{node.partNumber}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {fmtKg(node.directKgco2e)} direct
        </span>
        <span className="w-20 shrink-0 text-right tabular-nums">
          {fmtKg(node.rolledKgco2e)}
        </span>
        <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">
          {fmtPct(node.shareOfTotal)}
        </span>
      </button>
      {open &&
        node.children.map((c, i) => (
          <ExplorerBranch key={`${c.partNumber}-${i}`} node={c} depth={depth + 1} />
        ))}
    </div>
  );
}

export function BomCarbonAnalytics({ companyId, bomId, refreshKey }: Props) {
  const [calcs, setCalcs] = useState<PcfCalculation[]>([]);
  const [calcId, setCalcId] = useState<string>("");
  const [analytics, setAnalytics] = useState<BomAnalytics | null>(null);
  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");
  const [comparison, setComparison] = useState<VersionCompareResult | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setWorking(true);
    setError(null);
    try {
      const list = await fetchBomCalculations(companyId, bomId);
      setCalcs(list);
      setCalcId((prev) => {
        const preferred =
          (prev && list.find((c) => c.id === prev)?.id) ||
          list.find((c) => c.status === "completed" && !c.isStale)?.id ||
          list[0]?.id ||
          "";
        return preferred;
      });
      if (list.length >= 2) {
        setLeftId((prev) => prev || list[1].id);
        setRightId((prev) => prev || list[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setWorking(false);
    }
  }, [companyId, bomId]);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  useEffect(() => {
    if (!calcId) {
      setAnalytics(null);
      return;
    }
    let cancelled = false;
    void fetchBomAnalytics(companyId, bomId, calcId).then((a) => {
      if (!cancelled) setAnalytics(a);
    });
    return () => {
      cancelled = true;
    };
  }, [companyId, bomId, calcId]);

  return (
    <div className="dash-card space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Carbon analytics</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Hotspots, BOM carbon explorer, lifecycle mix, and version compare (Phase 1D).
          </p>
        </div>
        <Button size="sm" variant="outline" disabled={working} onClick={() => void reload()}>
          Refresh
        </Button>
      </div>

      {calcs.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Run a PCF calculation first to unlock analytics.
        </p>
      ) : (
        <>
          <label className="block text-xs">
            <span className="text-muted-foreground">Calculation</span>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
              value={calcId}
              onChange={(e) => setCalcId(e.target.value)}
            >
              {calcs.map((c) => (
                <option key={c.id} value={c.id}>
                  {new Date(c.createdAt).toLocaleString()} · {c.totalKgco2e.toFixed(4)} kg ·{" "}
                  {c.approvalStatus}
                  {c.isStale ? " · stale" : ""}
                </option>
              ))}
            </select>
          </label>

          {analytics && (
            <>
              <div>
                <p className="mb-2 text-xs font-semibold">
                  Hotspots · total {fmtKg(analytics.totalKgco2e)} kgCO₂e / {analytics.declaredUnit}
                </p>
                <div className="space-y-1">
                  {analytics.hotspots.slice(0, 8).map((h) => (
                    <div
                      key={`${h.bomItemId}-${h.partNumber}`}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div className="h-1.5 min-w-[40px] flex-1 overflow-hidden rounded bg-muted">
                        <div
                          className="h-full rounded bg-foreground/70"
                          style={{ width: `${Math.min(100, h.shareOfTotal * 100)}%` }}
                        />
                      </div>
                      <span className="w-28 truncate font-mono">{h.partNumber}</span>
                      <span className="w-16 text-right tabular-nums">{fmtKg(h.directKgco2e)}</span>
                      <span className="w-12 text-right tabular-nums text-muted-foreground">
                        {fmtPct(h.shareOfTotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold">Lifecycle breakdown</p>
                <div className="flex flex-wrap gap-2">
                  {analytics.lifecycle.map((b) => (
                    <div
                      key={b.itemType}
                      className="rounded-md border border-border px-2 py-1 text-[11px]"
                    >
                      <span className="font-medium">{b.itemType}</span>
                      <span className="ml-2 tabular-nums text-muted-foreground">
                        {fmtKg(b.kgco2e)} · {fmtPct(b.shareOfTotal)} · {b.itemCount} items
                      </span>
                    </div>
                  ))}
                  {analytics.lifecycle.length === 0 && (
                    <p className="text-xs text-muted-foreground">No direct contributions.</p>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <p className="font-semibold">BOM carbon explorer</p>
                  <p className="text-muted-foreground">rolled kgCO₂e</p>
                </div>
                <div className="max-h-56 overflow-auto rounded-md border border-border/80 bg-muted/10 py-1">
                  {analytics.explorer.map((n, i) => (
                    <ExplorerBranch key={`${n.partNumber}-${i}`} node={n} />
                  ))}
                </div>
              </div>
            </>
          )}

          {calcs.length >= 2 && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-semibold">Version comparison</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block text-xs">
                  <span className="text-muted-foreground">Left (baseline)</span>
                  <select
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                    value={leftId}
                    onChange={(e) => setLeftId(e.target.value)}
                  >
                    {calcs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {new Date(c.createdAt).toLocaleString()} · {c.totalKgco2e.toFixed(4)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs">
                  <span className="text-muted-foreground">Right (compare)</span>
                  <select
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                    value={rightId}
                    onChange={(e) => setRightId(e.target.value)}
                  >
                    {calcs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {new Date(c.createdAt).toLocaleString()} · {c.totalKgco2e.toFixed(4)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Button
                size="sm"
                disabled={working || !leftId || !rightId || leftId === rightId}
                onClick={async () => {
                  setWorking(true);
                  setError(null);
                  try {
                    const cmp = await compareBomCalculations(companyId, leftId, rightId);
                    setComparison(cmp);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Compare failed");
                  } finally {
                    setWorking(false);
                  }
                }}
              >
                Compare
              </Button>
              {comparison && (
                <div className="space-y-2 text-xs">
                  <p>
                    Δ total{" "}
                    <strong className="tabular-nums">
                      {comparison.deltaTotalKgco2e >= 0 ? "+" : ""}
                      {fmtKg(comparison.deltaTotalKgco2e)}
                    </strong>{" "}
                    kgCO₂e
                    {comparison.deltaPct != null
                      ? ` (${comparison.deltaPct >= 0 ? "+" : ""}${comparison.deltaPct.toFixed(1)}%)`
                      : ""}
                  </p>
                  <div className="max-h-40 overflow-auto rounded-md border border-border">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-muted/80 text-[10px] uppercase text-muted-foreground">
                        <tr>
                          <th className="px-2 py-1 font-medium">Part</th>
                          <th className="px-2 py-1 text-right font-medium">Left</th>
                          <th className="px-2 py-1 text-right font-medium">Right</th>
                          <th className="px-2 py-1 text-right font-medium">Δ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparison.rows.slice(0, 20).map((r) => (
                          <tr key={r.partNumber} className="border-t border-border/60">
                            <td className="px-2 py-1 font-mono">{r.partNumber}</td>
                            <td className="px-2 py-1 text-right tabular-nums">
                              {fmtKg(r.leftKgco2e)}
                            </td>
                            <td className="px-2 py-1 text-right tabular-nums">
                              {fmtKg(r.rightKgco2e)}
                            </td>
                            <td className="px-2 py-1 text-right tabular-nums">
                              {r.deltaKgco2e >= 0 ? "+" : ""}
                              {fmtKg(r.deltaKgco2e)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

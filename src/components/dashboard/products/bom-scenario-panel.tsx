"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createBomScenario,
  deleteBomScenario,
  fetchBomScenarios,
  fetchEmissionFactors,
  runBomScenario,
  updateBomScenario,
} from "@/lib/bom/client-api";
import type { BomItem } from "@/lib/bom/types";
import type {
  BomScenario,
  ScenarioOverride,
  ScenarioOverrideKind,
  ScenarioRunResult,
} from "@/lib/bom/carbon/scenario";
import type { EmissionFactor } from "@/lib/bom/carbon/types";

type Props = {
  companyId: string;
  bomId: string;
  items: BomItem[];
  refreshKey?: number | string;
};

function fmtKg(n: number): string {
  return n.toFixed(4);
}

function newOverrideId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `ov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function BomScenarioPanel({ companyId, bomId, items, refreshKey }: Props) {
  const [scenarios, setScenarios] = useState<BomScenario[]>([]);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("What-if");
  const [itemId, setItemId] = useState("");
  const [kind, setKind] = useState<ScenarioOverrideKind>("quantity");
  const [value, setValue] = useState("1");
  const [factorId, setFactorId] = useState("");
  const [lastRun, setLastRun] = useState<ScenarioRunResult | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editableItems = useMemo(
    () => items.filter((i) => i.parentItemId != null || i.itemType !== "product"),
    [items]
  );

  const selected = scenarios.find((s) => s.id === selectedId) ?? null;

  const reload = useCallback(async () => {
    setWorking(true);
    setError(null);
    try {
      const [list, nextFactors] = await Promise.all([
        fetchBomScenarios(companyId, bomId),
        fetchEmissionFactors(companyId),
      ]);
      setScenarios(list);
      setFactors(nextFactors);
      setSelectedId((prev) => (prev && list.some((s) => s.id === prev) ? prev : list[0]?.id || ""));
      setItemId((prev) => prev || editableItems[0]?.id || "");
      setFactorId((prev) => prev || nextFactors[0]?.id || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load scenarios");
    } finally {
      setWorking(false);
    }
  }, [companyId, bomId, editableItems]);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  async function onCreate() {
    setWorking(true);
    setError(null);
    try {
      const scenario = await createBomScenario(companyId, {
        bomId,
        name: name.trim() || "What-if",
        overrides: [],
      });
      setScenarios((prev) => [scenario, ...prev]);
      setSelectedId(scenario.id);
      setLastRun(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setWorking(false);
    }
  }

  async function onAddOverride() {
    if (!selected || !itemId) return;
    setWorking(true);
    setError(null);
    try {
      const next: ScenarioOverride = {
        id: newOverrideId(),
        bomItemId: itemId,
        kind,
        numericValue: kind === "emission_factor" ? null : Number(value) || 0,
        emissionFactorId: kind === "emission_factor" ? factorId : null,
      };
      const updated = await updateBomScenario(companyId, selected.id, {
        overrides: [...selected.overrides, next],
      });
      setScenarios((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setLastRun(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Override failed");
    } finally {
      setWorking(false);
    }
  }

  async function onRemoveOverride(overrideId: string) {
    if (!selected) return;
    setWorking(true);
    try {
      const updated = await updateBomScenario(companyId, selected.id, {
        overrides: selected.overrides.filter((o) => o.id !== overrideId),
      });
      setScenarios((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setLastRun(null);
    } finally {
      setWorking(false);
    }
  }

  async function onRun() {
    if (!selected) return;
    setWorking(true);
    setError(null);
    try {
      const result = await runBomScenario(companyId, selected.id, { requireApproved: true });
      setLastRun(result);
      setScenarios((prev) =>
        prev.map((s) => (s.id === result.scenario.id ? result.scenario : s))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setWorking(false);
    }
  }

  async function onDelete() {
    if (!selected) return;
    setWorking(true);
    try {
      await deleteBomScenario(companyId, selected.id);
      setScenarios((prev) => prev.filter((s) => s.id !== selected.id));
      setSelectedId("");
      setLastRun(null);
    } finally {
      setWorking(false);
    }
  }

  const partLabel = (id: string) =>
    items.find((i) => i.id === id)?.partNumber ?? id.slice(0, 8);

  return (
    <div className="dash-card space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold">What-if scenarios</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Override quantity, scrap, yield, or emission factor on calculation clones — the
          baseline BOM is never mutated (Phase 6).
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Scenario name</p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-40"
            placeholder="What-if"
          />
        </div>
        <Button size="sm" disabled={working} onClick={() => void onCreate()}>
          New scenario
        </Button>
        <Button size="sm" variant="outline" disabled={working} onClick={() => void reload()}>
          Refresh
        </Button>
      </div>

      {scenarios.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Create a scenario after a baseline PCF exists, then add overrides and run.
        </p>
      ) : (
        <>
          <label className="block text-xs">
            <span className="text-muted-foreground">Active scenario</span>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setLastRun(null);
              }}
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.overrides.length} overrides
                </option>
              ))}
            </select>
          </label>

          {selected && (
            <>
              <div className="space-y-2 rounded-md border border-border/80 bg-muted/10 p-3">
                <p className="text-xs font-semibold">Overrides</p>
                {selected.overrides.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">No overrides yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {selected.overrides.map((o) => (
                      <li
                        key={o.id}
                        className="flex items-center justify-between gap-2 text-[11px]"
                      >
                        <span className="font-mono">
                          {partLabel(o.bomItemId)} · {o.kind}
                          {o.kind === "emission_factor"
                            ? ` → ${
                                factors.find((f) => f.id === o.emissionFactorId)?.factorCode ??
                                o.emissionFactorId?.slice(0, 12)
                              }`
                            : ` = ${o.numericValue}`}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[11px]"
                          disabled={working}
                          onClick={() => void onRemoveOverride(o.id)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block text-[11px]">
                    <span className="text-muted-foreground">BOM item</span>
                    <select
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                      value={itemId}
                      onChange={(e) => setItemId(e.target.value)}
                    >
                      {editableItems.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.partNumber} · {i.quantity} {i.unit}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-[11px]">
                    <span className="text-muted-foreground">Override</span>
                    <select
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                      value={kind}
                      onChange={(e) => setKind(e.target.value as ScenarioOverrideKind)}
                    >
                      <option value="quantity">Quantity</option>
                      <option value="scrap_rate">Scrap rate</option>
                      <option value="yield_rate">Yield rate</option>
                      <option value="emission_factor">Emission factor</option>
                    </select>
                  </label>
                  {kind === "emission_factor" ? (
                    <label className="block text-[11px] sm:col-span-2">
                      <span className="text-muted-foreground">Factor</span>
                      <select
                        className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                        value={factorId}
                        onChange={(e) => setFactorId(e.target.value)}
                      >
                        {factors.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.factorCode} · {f.valueKgco2e} kgCO₂e/{f.activityUnit}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label className="block text-[11px]">
                      <span className="text-muted-foreground">Value</span>
                      <Input
                        className="mt-1 h-8 text-xs"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        type="number"
                      />
                    </label>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={working || !itemId}
                    onClick={() => void onAddOverride()}
                  >
                    Add override
                  </Button>
                  <Button
                    size="sm"
                    disabled={working || selected.overrides.length === 0}
                    onClick={() => void onRun()}
                  >
                    {working ? "Running…" : "Run scenario"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={working}
                    onClick={() => void onDelete()}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {lastRun && (
                <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3 text-xs">
                  <p>
                    Scenario total{" "}
                    <strong className="tabular-nums">
                      {fmtKg(lastRun.result.totalKgco2e)}
                    </strong>{" "}
                    kgCO₂e
                    {lastRun.baseline && (
                      <>
                        {" "}
                        · baseline {fmtKg(lastRun.baseline.totalKgco2e)} · Δ{" "}
                        <strong className="tabular-nums">
                          {(lastRun.comparison?.deltaTotalKgco2e ?? 0) >= 0 ? "+" : ""}
                          {fmtKg(lastRun.comparison?.deltaTotalKgco2e ?? 0)}
                        </strong>
                        {lastRun.comparison?.deltaPct != null
                          ? ` (${lastRun.comparison.deltaPct >= 0 ? "+" : ""}${lastRun.comparison.deltaPct.toFixed(1)}%)`
                          : ""}
                      </>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Baseline BOM quantities verified unchanged after run (
                    {lastRun.baselineItemSnapshot.length} items checked).
                  </p>
                  {lastRun.comparison && lastRun.comparison.rows.length > 0 && (
                    <div className="max-h-36 overflow-auto rounded border border-border/70">
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-muted/80 text-[10px] uppercase text-muted-foreground">
                          <tr>
                            <th className="px-2 py-1 font-medium">Part</th>
                            <th className="px-2 py-1 text-right font-medium">Base</th>
                            <th className="px-2 py-1 text-right font-medium">Scenario</th>
                            <th className="px-2 py-1 text-right font-medium">Δ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lastRun.comparison.rows.slice(0, 12).map((r) => (
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
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

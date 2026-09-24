"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  exportPactV3Footprint,
  exportReadinessPayload,
  fetchBomCalculations,
  fetchExchangeReadiness,
} from "@/lib/bom/client-api";
import type {
  ExchangeReadinessReport,
  ReadinessFormat,
} from "@/lib/bom/carbon/readiness";
import type { PcfCalculation } from "@/lib/bom/carbon/types";

type Props = {
  companyId: string;
  bomId: string;
  refreshKey?: number | string;
};

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function BomReadinessPanel({ companyId, bomId, refreshKey }: Props) {
  const [calcs, setCalcs] = useState<PcfCalculation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [report, setReport] = useState<ExchangeReadinessReport | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setWorking(true);
    setError(null);
    try {
      const list = await fetchBomCalculations(companyId, bomId);
      const baseline = list.filter((c) => !c.scenarioId);
      setCalcs(baseline);
      setSelectedId((prev) =>
        prev && baseline.some((c) => c.id === prev) ? prev : baseline[0]?.id || ""
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load calculations");
    } finally {
      setWorking(false);
    }
  }, [companyId, bomId]);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  useEffect(() => {
    if (!selectedId) {
      setReport(null);
      return;
    }
    void (async () => {
      setWorking(true);
      setError(null);
      try {
        setReport(await fetchExchangeReadiness(companyId, selectedId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Readiness check failed");
        setReport(null);
      } finally {
        setWorking(false);
      }
    })();
  }, [companyId, selectedId]);

  async function onExport(format: ReadinessFormat) {
    if (!selectedId) return;
    setWorking(true);
    setError(null);
    try {
      const bundle = await exportReadinessPayload(companyId, selectedId, format);
      setReport(bundle.readiness);
      downloadJson(`${format}-readiness-${selectedId.slice(0, 8)}.json`, bundle.payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setWorking(false);
    }
  }

  async function onExportPactV3() {
    if (!selectedId) return;
    setWorking(true);
    setError(null);
    try {
      const bundle = await exportPactV3Footprint(companyId, selectedId);
      downloadJson(
        `pact-v3-${selectedId.slice(0, 8)}.json`,
        bundle.footprint
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "PACT V3 export failed");
    } finally {
      setWorking(false);
    }
  }

  const selected = calcs.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="dash-card space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold">PACT / Catena-X / DPP readiness</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Phase 9 readiness stubs plus real PACT V3 ProductFootprint export (schema-validated).
          Does not mutate the calculation engine.
        </p>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Calculation</label>
        <select
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {calcs.length === 0 ? <option value="">No calculations yet</option> : null}
          {calcs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.totalKgco2e.toFixed(4)} kgCO₂e · {c.approvalStatus}
              {c.isStale ? " · stale" : ""} · {c.createdAt.slice(0, 10)}
            </option>
          ))}
        </select>
        {selected ? (
          <p className="text-[11px] text-muted-foreground">
            {selected.methodology} · {selected.declaredUnit} · id {selected.id.slice(0, 8)}
          </p>
        ) : null}
      </div>

      {report ? (
        <div className="space-y-2 rounded-md border border-border bg-muted/20 px-3 py-2">
          <p className="text-xs font-medium">
            Overall: <span className="uppercase">{report.overall}</span>
          </p>
          <ul className="space-y-1">
            {report.checks.map((check) => (
              <li key={check.id} className="text-[11px]">
                <span
                  className={
                    check.status === "pass"
                      ? "text-emerald-700"
                      : check.status === "warn"
                        ? "text-amber-700"
                        : "text-destructive"
                  }
                >
                  [{check.status}]
                </span>{" "}
                <span className="font-medium">{check.label}</span> — {check.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={working || !selectedId}
          onClick={() => void onExportPactV3()}
        >
          Export PACT V3 JSON
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={working || !selectedId}
          onClick={() => void onExport("pact")}
        >
          Export PACT readiness
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={working || !selectedId}
          onClick={() => void onExport("catena_x")}
        >
          Export Catena-X JSON
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={working || !selectedId}
          onClick={() => void onExport("dpp")}
        >
          Export DPP readiness
        </Button>
      </div>
    </div>
  );
}

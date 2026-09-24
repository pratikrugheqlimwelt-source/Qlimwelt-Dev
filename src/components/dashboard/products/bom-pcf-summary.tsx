"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  exportPactV3Footprint,
  fetchBomCalculations,
  fetchCarbonMappings,
  fetchPactExchanges,
  fetchProductIdentityMappings,
  fetchSupplierPcfRecords,
} from "@/lib/bom/client-api";
import type { BomItem } from "@/lib/bom/types";
import {
  buildProductPcfSummary,
  type ProductPcfSummary,
} from "@/lib/bom/carbon/pact/summary";

type Props = {
  companyId: string;
  productId: string;
  bomId: string;
  items: BomItem[];
  refreshKey?: number | string;
  onJumpToPact?: () => void;
  onJumpToReadiness?: () => void;
};

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtKg(n: number | null): string {
  if (n == null) return "—";
  return `${n.toFixed(4)} kgCO₂e`;
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-border/70 bg-background px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium tabular-nums">{value}</p>
      {hint ? (
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function BomPcfSummary({
  companyId,
  productId,
  bomId,
  items,
  refreshKey,
  onJumpToPact,
  onJumpToReadiness,
}: Props) {
  const [summary, setSummary] = useState<ProductPcfSummary | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setWorking(true);
    setError(null);
    try {
      const [calcs, mappings, records, identities, exchanges] = await Promise.all([
        fetchBomCalculations(companyId, bomId),
        fetchCarbonMappings(companyId, bomId),
        fetchSupplierPcfRecords(companyId),
        fetchProductIdentityMappings(companyId, { productId }),
        fetchPactExchanges(companyId),
      ]);
      setSummary(
        buildProductPcfSummary({
          items,
          mappings,
          calculations: calcs,
          supplierRecords: records,
          identityMappings: identities,
          exchanges,
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load PCF summary");
      setSummary(null);
    } finally {
      setWorking(false);
    }
  }, [companyId, productId, bomId, items]);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  async function onExport() {
    if (!summary?.calculationId) {
      setError("Approve a baseline calculation before exporting PACT V3");
      onJumpToReadiness?.();
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const bundle = await exportPactV3Footprint(companyId, summary.calculationId);
      downloadJson(
        `pact-v3-${summary.calculationId.slice(0, 8)}.json`,
        bundle.footprint
      );
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "PACT V3 export failed");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="dash-card space-y-3 p-4" data-testid="bom-pcf-summary">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Product PCF summary</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Totals, BOM coverage, supplier PCFs, and PACT exchange posture for this BOM.
          </p>
        </div>
        {working ? (
          <span className="text-[11px] text-muted-foreground">Refreshing…</span>
        ) : null}
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {summary ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Total PCF"
              value={fmtKg(summary.totalKgco2e)}
              hint={
                summary.declaredUnit
                  ? `per ${summary.declaredUnit}${
                      summary.calculationStale ? " · stale" : ""
                    }${
                      summary.calculationApproval
                        ? ` · ${summary.calculationApproval}`
                        : ""
                    }`
                  : "No completed baseline yet"
              }
            />
            <Stat
              label="BOM coverage"
              value={`${summary.coveragePercent}%`}
              hint={`${summary.approvedMappingCount}/${summary.mappableItemCount} items mapped`}
            />
            <Stat
              label="Supplier PCFs"
              value={`${summary.supplierRecordsAccepted} accepted`}
              hint={
                summary.supplierRecordsPending > 0
                  ? `${summary.supplierRecordsPending} pending review · ${summary.supplierRecordsTotal} total`
                  : `${summary.supplierRecordsTotal} total`
              }
            />
            <Stat
              label="PACT status"
              value={summary.pactConnectionLabel}
              hint={
                summary.exchangeCount > 0
                  ? `${summary.exchangeCount} exchanges${
                      summary.lastExportAt
                        ? ` · last export ${summary.lastExportAt.slice(0, 10)}`
                        : ""
                    }`
                  : `${summary.identityMappingsConfirmed} confirmed identities`
              }
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={working || !summary.calculationId}
              onClick={() => void onExport()}
            >
              Export PACT V3
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={working}
              onClick={() => onJumpToPact?.()}
            >
              Import / history
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={working}
              onClick={() => onJumpToReadiness?.()}
            >
              Readiness
            </Button>
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Loading summary…</p>
      )}
    </div>
  );
}

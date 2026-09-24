"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  approveBomCalculation,
  approveCarbonMapping,
  fetchBomAuditEvents,
  fetchCarbonMappings,
  fetchEmissionFactors,
  refreshBomStaleFlags,
  rejectBomCalculation,
  rejectCarbonMapping,
  runBomCalculation,
  suggestItemMappings,
  upsertCarbonMapping,
} from "@/lib/bom/client-api";
import type { BomAuditEvent, CarbonMapping, EmissionFactor, MappingSuggestion, PcfCalculation } from "@/lib/bom/carbon/types";
import type { BomItem } from "@/lib/bom/types";

type Props = {
  companyId: string;
  productId?: string;
  bomId: string;
  item: BomItem | null;
  busy?: boolean;
  onCalculated?: () => void;
};

export function BomCarbonPanel({ companyId, productId, bomId, item, busy, onCalculated }: Props) {
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [mappings, setMappings] = useState<CarbonMapping[]>([]);
  const [suggestions, setSuggestions] = useState<MappingSuggestion[]>([]);
  const [calc, setCalc] = useState<PcfCalculation | null>(null);
  const [auditEvents, setAuditEvents] = useState<BomAuditEvent[]>([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemMapping = useMemo(
    () => (item ? mappings.find((m) => m.bomItemId === item.id) ?? null : null),
    [item, mappings]
  );

  async function reload() {
    const [f, m, events] = await Promise.all([
      fetchEmissionFactors(companyId),
      fetchCarbonMappings(companyId, bomId),
      fetchBomAuditEvents(companyId, { limit: 8 }),
    ]);
    setFactors(f);
    setMappings(m);
    setAuditEvents(events);
    await refreshBomStaleFlags(companyId, bomId);
  }

  useEffect(() => {
    void reload();
  }, [companyId, bomId]);

  useEffect(() => {
    if (!item) {
      setSuggestions([]);
      return;
    }
    void suggestItemMappings(companyId, item).then(setSuggestions);
  }, [companyId, item?.id]);

  const factorName = (id: string | null | undefined) =>
    factors.find((f) => f.id === id)?.name ?? id ?? "—";

  return (
    <div className="dash-card space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold">Carbon mapping & PCF</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Map factors, run PCF, review DQ scores, approve calculations, and inspect the audit trail.
        </p>
      </div>

      {item ? (
        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-medium">
            Selected: <span className="font-mono">{item.partNumber}</span>
          </p>
          {itemMapping ? (
            <p className="text-xs text-muted-foreground">
              Mapping: {factorName(itemMapping.emissionFactorId)} · {itemMapping.status} ·{" "}
              {(itemMapping.confidence * 100).toFixed(0)}% confidence
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">No mapping yet — pick a suggestion below.</p>
          )}

          <div className="space-y-2">
            {suggestions.slice(0, 4).map((s) => (
              <div
                key={s.emissionFactorId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 bg-background px-2 py-1.5 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.factor.name}</p>
                  <p className="text-muted-foreground">
                    {(s.confidence * 100).toFixed(0)}% · {s.matchReason}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={working || busy}
                  onClick={async () => {
                    setWorking(true);
                    setError(null);
                    try {
                      await upsertCarbonMapping(companyId, {
                        bomItemId: item.id,
                        emissionFactorId: s.emissionFactorId,
                        confidence: s.confidence,
                        matchReason: s.matchReason,
                        status: "suggested",
                      });
                      await reload();
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Mapping failed");
                    } finally {
                      setWorking(false);
                    }
                  }}
                >
                  Use
                </Button>
              </div>
            ))}
          </div>

          {itemMapping && itemMapping.status !== "approved" && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={working || busy}
                onClick={async () => {
                  setWorking(true);
                  setError(null);
                  try {
                    await approveCarbonMapping(companyId, itemMapping.id);
                    await reload();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Approve failed");
                  } finally {
                    setWorking(false);
                  }
                }}
              >
                Approve mapping
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={working || busy}
                onClick={async () => {
                  setWorking(true);
                  try {
                    await rejectCarbonMapping(companyId, itemMapping.id);
                    await reload();
                  } finally {
                    setWorking(false);
                  }
                }}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Select a BOM line to map carbon factors.</p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button
          disabled={working || busy}
          onClick={async () => {
            setWorking(true);
            setError(null);
            try {
              const result = await runBomCalculation(companyId, {
                bomId,
                productId,
                requireApproved: true,
              });
              setCalc(result);
              onCalculated?.();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Calculation failed");
            } finally {
              setWorking(false);
            }
          }}
        >
          {working ? "Calculating…" : "Run PCF calculation"}
        </Button>
        <span className="text-[11px] text-muted-foreground">
          Uses approved mappings only · scrap/yield applied · ledger written
        </span>
      </div>

      {calc && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <p>
            Total:{" "}
            <strong className="tabular-nums">{calc.totalKgco2e.toFixed(4)}</strong> kgCO₂e /{" "}
            {calc.declaredUnit}
          </p>
          <p className="text-xs text-muted-foreground">
            {calc.methodology} · {calc.ledger?.length ?? 0} ledger rows · {calc.status} · approval{" "}
            {calc.approvalStatus}
            {calc.isStale ? " · STALE" : ""}
          </p>
          {calc.dq && (
            <div className="grid grid-cols-2 gap-1 text-xs sm:grid-cols-4">
              <span>DQ overall {(calc.dq.overall * 100).toFixed(0)}%</span>
              <span>Temporal {(calc.dq.temporal * 100).toFixed(0)}%</span>
              <span>Geo {(calc.dq.geo * 100).toFixed(0)}%</span>
              <span>Tech {(calc.dq.tech * 100).toFixed(0)}%</span>
            </div>
          )}
          {calc.isStale && calc.staleReason && (
            <p className="text-xs text-amber-800">Stale: {calc.staleReason}</p>
          )}
          {calc.warnings.slice(0, 5).map((w) => (
            <p key={w} className="text-xs text-amber-800">
              {w}
            </p>
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              disabled={working || busy || calc.isStale || calc.approvalStatus === "approved"}
              onClick={async () => {
                setWorking(true);
                setError(null);
                try {
                  const next = await approveBomCalculation(companyId, calc.id);
                  setCalc(next);
                  await reload();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Approve calc failed");
                } finally {
                  setWorking(false);
                }
              }}
            >
              Approve calculation
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={working || busy || calc.approvalStatus === "rejected"}
              onClick={async () => {
                setWorking(true);
                try {
                  const next = await rejectBomCalculation(companyId, calc.id, {
                    notes: "Rejected from BOM panel",
                  });
                  setCalc(next);
                  await reload();
                } finally {
                  setWorking(false);
                }
              }}
            >
              Reject calculation
            </Button>
          </div>
        </div>
      )}

      {auditEvents.length > 0 && (
        <div className="space-y-1 border-t border-border pt-3">
          <p className="text-xs font-semibold">Audit trail</p>
          {auditEvents.slice(0, 6).map((e) => (
            <p key={e.id} className="text-[11px] text-muted-foreground">
              {new Date(e.createdAt).toLocaleString()} · {e.action} · {e.summary}
            </p>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

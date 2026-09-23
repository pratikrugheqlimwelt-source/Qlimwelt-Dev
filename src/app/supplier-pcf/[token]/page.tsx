"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SupplierPcfPortalView } from "@/lib/bom/carbon/supplier-pcf";

export default function SupplierPcfPortalPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [portal, setPortal] = useState<SupplierPcfPortalView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("kg");
  const [methodology, setMethodology] = useState("");
  const [evidence, setEvidence] = useState("");
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch(`/api/supplier-pcf/${encodeURIComponent(token)}`);
      const data = (await res.json()) as { portal?: SupplierPcfPortalView; error?: string };
      if (!res.ok || !data.portal) {
        setError(data.error || "Link is invalid or expired");
        setPortal(null);
        return;
      }
      setPortal(data.portal);
      setUnit(data.portal.declaredUnit || "kg");
      if (data.portal.declaredKgco2ePerUnit != null) {
        setValue(String(data.portal.declaredKgco2ePerUnit));
      }
      setMethodology(data.portal.methodology || "");
      setEvidence(data.portal.evidenceNotes || "");
      setDone(data.portal.status === "submitted" || data.portal.status === "approved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load request");
    } finally {
      setWorking(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!portal?.canSubmit) return;
    setWorking(true);
    setError(null);
    try {
      const res = await fetch(`/api/supplier-pcf/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          declaredKgco2ePerUnit: Number(value),
          declaredUnit: unit.trim() || "kg",
          methodology: methodology.trim() || null,
          evidenceNotes: evidence.trim() || null,
        }),
      });
      const data = (await res.json()) as { portal?: SupplierPcfPortalView; error?: string };
      if (!res.ok || !data.portal) {
        setError(data.error || "Submit failed");
        return;
      }
      setPortal(data.portal);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 px-4 py-12">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800/70">
            Qlimwelt
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Supplier PCF response
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Submit primary product carbon footprint data for the requested part.
          </p>
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {!portal && !error ? (
          <p className="text-sm text-slate-500">{working ? "Loading…" : "—"}</p>
        ) : null}

        {portal ? (
          <div className="space-y-4 rounded-xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div className="grid gap-1 text-sm">
              <p>
                <span className="text-slate-500">Part</span>{" "}
                <span className="font-mono font-medium">{portal.partNumber}</span>
              </p>
              <p>
                <span className="text-slate-500">Supplier</span>{" "}
                <span className="font-medium">{portal.supplierName}</span>
              </p>
              <p>
                <span className="text-slate-500">Status</span>{" "}
                <span className="font-medium capitalize">{portal.status}</span>
              </p>
              {portal.message ? (
                <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  {portal.message}
                </p>
              ) : null}
            </div>

            {done && !portal.canSubmit ? (
              <p className="text-sm text-emerald-800">
                Thank you — your declaration has been recorded
                {portal.declaredKgco2ePerUnit != null
                  ? ` (${portal.declaredKgco2ePerUnit} kgCO₂e / ${portal.declaredUnit})`
                  : ""}
                .
              </p>
            ) : null}

            {portal.canSubmit ? (
              <form className="space-y-3" onSubmit={onSubmit}>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">
                    Declared kgCO₂e per unit
                  </label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. 1.85"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Unit</label>
                  <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Methodology (optional)</label>
                  <Input
                    value={methodology}
                    onChange={(e) => setMethodology(e.target.value)}
                    placeholder="ISO 14067 / GHG Protocol Product"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Evidence notes (optional)</label>
                  <Input
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    placeholder="Report ID, LCA boundary, year"
                  />
                </div>
                <Button type="submit" disabled={working || !value.trim()} className="w-full">
                  {working ? "Submitting…" : "Submit primary PCF"}
                </Button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

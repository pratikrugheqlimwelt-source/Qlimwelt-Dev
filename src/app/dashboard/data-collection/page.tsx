"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { calculateEmissionsTCO2e } from "@/lib/calculations/engine";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import type { CalculationMethod, EmissionActivity, Scope } from "@/types/carbon";
import { HelpCorner } from "@/components/ui/tooltip";
import { formatCO2 } from "@/lib/utils";
import { MetricFigure } from "@/components/ui/metric-figure";
import { PageHeader } from "@/components/dashboard/shared/page-header";

const PRESETS = [
  {
    id: "mobile",
    label: "Mobile combustion (fuel)",
    scope: "scope1" as Scope,
    category: "Mobile combustion",
    factor: 2.68,
    unit: "litre",
    method: "fuel_based" as CalculationMethod,
  },
  {
    id: "electricity",
    label: "Purchased electricity",
    scope: "scope2" as Scope,
    category: "Purchased electricity",
    factor: 0.000385,
    unit: "kWh",
    method: "location_based" as CalculationMethod,
  },
  {
    id: "travel",
    label: "Business travel",
    scope: "scope3" as Scope,
    category: "Category 6",
    factor: 0.000156,
    unit: "passenger-km",
    method: "distance_based" as CalculationMethod,
  },
  {
    id: "goods",
    label: "Purchased goods (spend)",
    scope: "scope3" as Scope,
    category: "Category 1",
    factor: 0.004,
    unit: "EUR",
    method: "spend_based" as CalculationMethod,
  },
  {
    id: "waste",
    label: "Waste",
    scope: "scope3" as Scope,
    category: "Category 5",
    factor: 0.52,
    unit: "tonne",
    method: "average_data" as CalculationMethod,
  },
  {
    id: "custom",
    label: "Custom input (pick factor or enter manually)",
    scope: "scope1" as Scope,
    category: "Custom",
    factor: 0,
    unit: "unit",
    method: "activity_specific" as CalculationMethod,
  },
];

export default function DataCollectionPage() {
  const {
    facilities,
    vehicles,
    suppliers,
    company,
    emissionFactors,
    addActivity,
    saving,
  } = useDashboard();

  const [presetId, setPresetId] = useState("electricity");
  const [factorId, setFactorId] = useState<string>("");
  const [scope, setScope] = useState<Scope>("scope2");
  const [category, setCategory] = useState("Purchased electricity");
  const [activityUnit, setActivityUnit] = useState("kWh");
  const [factorValue, setFactorValue] = useState("0.000385");
  const [activityValue, setActivityValue] = useState("");
  const [source, setSource] = useState("");
  const [period, setPeriod] = useState("2024-12");
  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? "");
  const [resourceId, setResourceId] = useState<string>("none");
  const [preview, setPreview] = useState<number | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const preset = PRESETS.find((c) => c.id === presetId) ?? PRESETS[1];
  const selectedFactor = emissionFactors.find((f) => f.id === factorId);

  useEffect(() => {
    if (!facilityId && facilities[0]) setFacilityId(facilities[0].id);
  }, [facilities, facilityId]);

  useEffect(() => {
    if (presetId === "custom") return;
    setScope(preset.scope);
    setCategory(preset.category);
    setActivityUnit(preset.unit);
    setFactorValue(String(preset.factor));
    setFactorId("");
  }, [presetId, preset]);

  useEffect(() => {
    if (!selectedFactor) return;
    setFactorValue(String(selectedFactor.value));
    setActivityUnit(selectedFactor.denominatorUnit);
    setCategory(selectedFactor.category || category);
  }, [selectedFactor]); // eslint-disable-line react-hooks/exhaustive-deps

  const facility = facilities.find((f) => f.id === facilityId) ?? facilities[0];
  const factorNum = Number(factorValue) || 0;
  const valueNum = Number(activityValue) || 0;

  const livePreview = useMemo(
    () => (valueNum > 0 && factorNum > 0 ? calculateEmissionsTCO2e(valueNum, factorNum) : null),
    [valueNum, factorNum]
  );

  const handlePreview = () => setPreview(livePreview);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valueNum || !source.trim() || !factorNum) return;

    const method: CalculationMethod =
      selectedFactor?.method ?? preset.method;

    const activity: EmissionActivity = {
      id: `a-user-${Date.now()}`,
      period,
      facilityId: facility?.id ?? "fac-mun",
      country: facility?.country ?? "Germany",
      businessUnitId: facility?.businessUnitId ?? "bu-ops",
      scope,
      category: category.trim() || "Custom",
      subcategory: selectedFactor?.name ?? preset.label,
      source: source.trim(),
      activityValue: valueNum,
      activityUnit: activityUnit.trim() || "unit",
      emissionFactorId: selectedFactor?.id ?? `ef-${preset.id}`,
      emissionFactorValue: factorNum,
      emissionFactorUnit: `kgCO2e/${activityUnit.trim() || "unit"}`,
      emissionFactorSource: selectedFactor?.source ?? "User entry",
      emissionFactorYear: selectedFactor?.year ?? company.reportingYear,
      conversionFactor: 1,
      ghg: "CO2",
      gwp: 1,
      method,
      dataQualityScore: selectedFactor ? Math.max(50, 100 - selectedFactor.uncertaintyPct) : 70,
      uncertaintyPct: selectedFactor?.uncertaintyPct ?? 15,
      evidenceStatus: evidenceFile ? "uploaded" : "pending",
      resourceId: resourceId !== "none" ? resourceId : undefined,
      isEstimated: false,
    };

    await addActivity(activity);

    if (evidenceFile) {
      setEvidenceError(null);
      const formData = new FormData();
      formData.append("file", evidenceFile);
      formData.append("activityId", activity.id);
      formData.append("notes", `Evidence for ${activity.source}`);
      try {
        const res = await fetch("/api/evidence", { method: "POST", body: formData });
        const data = (await res.json()) as { error?: string; hint?: string };
        if (!res.ok) {
          setEvidenceError(data.hint || data.error || "Evidence upload failed");
        }
      } catch {
        setEvidenceError("Evidence upload failed — check storage / migration 005.");
      }
    }

    setActivityValue("");
    setSource("");
    setPreview(null);
    setResourceId("none");
    setEvidenceFile(null);
  };

  return (
    <div className="relative space-y-4">
      <PageHeader
        title="Data collection"
        description="Enter activity data — the inputs carbon calculations run on. Choose a preset, library factor, or enter your own factor."
        tip="tCO₂e = activity value × emission factor ÷ 1000. Facilities, vehicles, and suppliers you add under Resources appear here as allocation / linked inputs."
      />

      <HelpCorner content="Create a new emission activity. Preview calculates tCO₂e from activity value × factor. Save adds it to your inventory and Emissions page." />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">New activity input</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Calculation template</Label>
              <Select value={presetId} onValueChange={setPresetId}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRESETS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Emission factor library</Label>
              <Select
                value={factorId || "none"}
                onValueChange={(v) => {
                  setFactorId(v === "none" ? "" : v);
                  if (v !== "none") setPresetId("custom");
                }}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Use template factor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Use template / manual factor</SelectItem>
                  {emissionFactors.slice(0, 40).map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} · {f.value} kgCO₂e/{f.denominatorUnit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Add custom factors in Settings — they appear in this list.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Scope</Label>
                <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scope1">Scope 1</SelectItem>
                    <SelectItem value="scope2">Scope 2</SelectItem>
                    <SelectItem value="scope3">Scope 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Input className="mt-1" value={category} onChange={(e) => setCategory(e.target.value)} required />
              </div>
              <div>
                <Label>Activity unit</Label>
                <Input className="mt-1" value={activityUnit} onChange={(e) => setActivityUnit(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Activity value ({activityUnit})</Label>
                <Input
                  className="mt-1"
                  type="number"
                  step="any"
                  value={activityValue}
                  onChange={(e) => setActivityValue(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Emission factor (kgCO₂e / {activityUnit})</Label>
                <Input
                  className="mt-1"
                  type="number"
                  step="any"
                  value={factorValue}
                  onChange={(e) => {
                    setFactorValue(e.target.value);
                    setFactorId("");
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Source / description</Label>
              <Input
                className="mt-1"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Munich plant electricity — Dec invoice"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Period (YYYY-MM)</Label>
                <Input className="mt-1" value={period} onChange={(e) => setPeriod(e.target.value)} required />
              </div>
              <div>
                <Label>Facility</Label>
                <Select value={facilityId || facilities[0]?.id} onValueChange={setFacilityId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select facility" /></SelectTrigger>
                  <SelectContent>
                    {facilities.length === 0 ? (
                      <SelectItem value="none" disabled>Add a facility under Resources first</SelectItem>
                    ) : (
                      facilities.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Link resource (optional)</Label>
              <Select value={resourceId} onValueChange={setResourceId}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked resource</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      Vehicle · {v.manufacturer} {v.model} ({v.registration})
                    </SelectItem>
                  ))}
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      Supplier · {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Evidence file (optional)</Label>
              <Input
                className="mt-1"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls"
                onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Uploads to Supabase Storage after the activity is saved (migration 005).
              </p>
              {evidenceError && <p className="mt-1 text-xs text-destructive">{evidenceError}</p>}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={handlePreview}>
                Preview calculation
              </Button>
              <Button type="submit" disabled={saving || !valueNum || !factorNum || !source.trim()}>
                {saving ? "Saving…" : "Save to inventory"}
              </Button>
            </div>

            {(preview !== null || livePreview !== null) && (
              <div className="rounded border bg-brand/5 p-4 text-sm">
                <p className="font-mono text-xs uppercase text-muted-foreground">Calculation preview</p>
                <MetricFigure size="md" className="mt-1">
                  {formatCO2(preview ?? livePreview ?? 0)}
                </MetricFigure>
                <p className="text-xs text-muted-foreground">
                  {activityValue || "0"} {activityUnit} × {factorValue || "0"} ÷ 1000
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

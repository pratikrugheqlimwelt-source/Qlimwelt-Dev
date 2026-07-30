"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { getModule } from "@/lib/assessment/modules";
import { FUEL_UNIT_MAP } from "@/lib/assessment/engine";
import type { ModuleId } from "@/types/assessment";
import type { EmissionActivity, Facility } from "@/types/carbon";
import { calculateEmissionsTCO2e } from "@/lib/calculations/engine";
import { formatCO2 } from "@/lib/utils";
import { MetricFigure } from "@/components/ui/metric-figure";

type ModuleCollectFormProps = {
  assessmentId: string;
  moduleId: ModuleId;
  periodDefault: string;
  locked?: boolean;
  onSaved: () => void;
};

export function ModuleCollectForm({
  assessmentId,
  moduleId,
  periodDefault,
  locked,
  onSaved,
}: ModuleCollectFormProps) {
  const { facilities, company, addActivity, saving } = useDashboard();
  const mod = getModule(moduleId);

  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState(mod?.defaultUnit ?? "unit");
  const [factor, setFactor] = useState(String(mod?.defaultFactor ?? 0));
  const [source, setSource] = useState("");
  const [period, setPeriod] = useState(periodDefault);
  const [isEstimated, setIsEstimated] = useState(false);
  const [fuelType, setFuelType] = useState("natural_gas");
  const [dataMethod, setDataMethod] = useState("invoice");
  const [renewablePct, setRenewablePct] = useState("0");
  const [marketFactor, setMarketFactor] = useState("0");

  const facility: Facility | undefined =
    facilities.find((f) => f.id === facilityId) ?? facilities[0];

  const valueNum = Number(quantity) || 0;
  const factorNum = Number(factor) || 0;
  const preview =
    valueNum > 0 && factorNum > 0 ? calculateEmissionsTCO2e(valueNum, factorNum) : null;

  const unitChoices = useMemo(() => {
    if (moduleId === "scope1_stationary") return FUEL_UNIT_MAP[fuelType] ?? [unit];
    return [mod?.defaultUnit ?? unit, "kWh", "MWh", "litre", "kg", "tonne", "EUR", "passenger-km", "tonne-km"].filter(
      (u, i, arr) => arr.indexOf(u) === i
    );
  }, [moduleId, fuelType, mod, unit]);

  if (!mod) return <p className="text-sm text-muted-foreground">Unknown module.</p>;

  const handleSave = async () => {
    if (!valueNum || !source.trim() || !factorNum || locked) return;

    let dq = isEstimated ? 55 : 80;
    if (dataMethod === "invoice" || dataMethod === "meter") dq = Math.min(95, dq + 10);

    const metadata: Record<string, unknown> = {
      moduleId,
      dataMethod,
      fuelType: moduleId === "scope1_stationary" ? fuelType : undefined,
      renewablePercentage:
        moduleId === "scope2_electricity" ? Number(renewablePct) || 0 : undefined,
    };

    const base: EmissionActivity = {
      id: `a-assess-${Date.now()}`,
      period,
      facilityId: facility?.id ?? "fac-default",
      country: facility?.country ?? "Germany",
      businessUnitId: facility?.businessUnitId ?? "bu-ops",
      scope: mod.scope,
      category: mod.category,
      subcategory: mod.label,
      source: source.trim(),
      activityValue: valueNum,
      activityUnit: unit,
      emissionFactorId: `ef-${moduleId}`,
      emissionFactorValue: factorNum,
      emissionFactorUnit: `kgCO2e/${unit}`,
      emissionFactorSource: "Assessment module default",
      emissionFactorYear: company.reportingYear,
      conversionFactor: 1,
      ghg: "CO2",
      gwp: 1,
      method: mod.method,
      dataQualityScore: dq,
      uncertaintyPct: isEstimated ? 25 : 12,
      evidenceStatus: "pending",
      isEstimated,
      assessmentId,
      metadata,
    };

    await addActivity(base);

    // Dual Scope 2: market-based sibling when renewable / contractual factor provided
    if (moduleId === "scope2_electricity" && Number(marketFactor) > 0) {
      await addActivity({
        ...base,
        id: `a-assess-mb-${Date.now()}`,
        method: "market_based",
        emissionFactorValue: Number(marketFactor),
        emissionFactorId: `ef-${moduleId}-mb`,
        emissionFactorSource: "Market-based / contractual",
        subcategory: `${mod.label} (market-based)`,
        metadata: { ...metadata, calculationMethod: "market_based" },
      });
    }

    setQuantity("");
    setSource("");
    onSaved();
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{mod.hint}</p>

      {moduleId === "scope1_stationary" && (
        <div>
          <Label>Fuel type</Label>
          <Select
            value={fuelType}
            onValueChange={(v) => {
              setFuelType(v);
              setUnit(FUEL_UNIT_MAP[v]?.[0] ?? unit);
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(FUEL_UNIT_MAP).map((f) => (
                <SelectItem key={f} value={f}>
                  {f.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {moduleId === "scope1_mobile" && (
        <div>
          <Label>How can you provide vehicle data?</Label>
          <Select value={dataMethod} onValueChange={setDataMethod}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fuel">Fuel consumption</SelectItem>
              <SelectItem value="distance">Distance travelled</SelectItem>
              <SelectItem value="invoice">Fleet invoice</SelectItem>
              <SelectItem value="estimate">Estimated fleet data</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {(moduleId === "scope2_electricity" || moduleId.startsWith("scope3")) && (
        <div>
          <Label>Data availability</Label>
          <Select value={dataMethod} onValueChange={setDataMethod}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice">Invoice / bill</SelectItem>
              <SelectItem value="meter">Meter reading</SelectItem>
              <SelectItem value="spend">Spend / procurement</SelectItem>
              <SelectItem value="estimate">Estimate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Quantity ({unit})</Label>
          <Input
            className="mt-1"
            type="number"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={locked}
          />
        </div>
        <div>
          <Label>Unit</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitChoices.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Emission factor (kgCO₂e / {unit})</Label>
          <Input
            className="mt-1"
            type="number"
            step="any"
            value={factor}
            onChange={(e) => setFactor(e.target.value)}
            disabled={locked}
          />
        </div>
        <div>
          <Label>Period (YYYY-MM)</Label>
          <Input
            className="mt-1"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            disabled={locked}
          />
        </div>
      </div>

      {moduleId === "scope2_electricity" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Renewable share (%)</Label>
            <Input
              className="mt-1"
              type="number"
              value={renewablePct}
              onChange={(e) => setRenewablePct(e.target.value)}
              disabled={locked}
            />
          </div>
          <div>
            <Label>Market-based factor (optional)</Label>
            <Input
              className="mt-1"
              type="number"
              step="any"
              value={marketFactor}
              onChange={(e) => setMarketFactor(e.target.value)}
              placeholder="kgCO₂e/kWh"
              disabled={locked}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Location-based is always stored. Market-based is added separately when set.
            </p>
          </div>
        </div>
      )}

      <div>
        <Label>Facility</Label>
        <Select value={facilityId || facilities[0]?.id} onValueChange={setFacilityId}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select facility" />
          </SelectTrigger>
          <SelectContent>
            {facilities.length === 0 ? (
              <SelectItem value="none" disabled>
                Add a facility under Resources first
              </SelectItem>
            ) : (
              facilities.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Source / description</Label>
        <Input
          className="mt-1"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Invoice ref, meter ID, or description"
          disabled={locked}
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
        <span className="text-sm">{isEstimated ? "Estimated" : "Measured"}</span>
        <Switch checked={isEstimated} onCheckedChange={setIsEstimated} disabled={locked} />
      </div>

      {preview !== null && (
        <div className="rounded-xl bg-muted/30 p-3">
          <p className="text-[10px] font-mono uppercase text-muted-foreground">Preview</p>
          <MetricFigure size="sm">{formatCO2(preview)}</MetricFigure>
        </div>
      )}

      <Button
        type="button"
        onClick={handleSave}
        disabled={locked || saving || !valueNum || !factorNum || !source.trim()}
      >
        {saving ? "Saving…" : "Save activity to inventory"}
      </Button>
    </div>
  );
}

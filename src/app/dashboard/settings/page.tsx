"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { useT } from "@/components/i18n/locale-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { EmissionFactor } from "@/types/carbon";
import { HelpCorner } from "@/components/ui/tooltip";

const DEFAULT_GWP: Record<string, number> = {
  CO2: 1, CH4: 27.9, N2O: 273, HFCs: 1430, PFCs: 6630, SF6: 25200, NF3: 17400,
};

export default function SettingsPage() {
  const { company, emissionFactors, saveSettings, addFactor, saving, gwpValues } = useDashboard();
  const t = useT();
  const [gwp, setGwp] = useState(gwpValues ?? DEFAULT_GWP);
  const [name, setName] = useState(company.name);
  const [industry, setIndustry] = useState(company.industry);
  const [carbonPrice, setCarbonPrice] = useState(company.carbonPricePerTonne);
  const [baselineYear, setBaselineYear] = useState(company.baselineYear);
  const [reportingYear, setReportingYear] = useState(company.reportingYear);
  const [unitsProduced, setUnitsProduced] = useState(company.unitsProduced);
  const [employeeCount, setEmployeeCount] = useState(company.employeeCount);
  const [revenueEUR, setRevenueEUR] = useState(company.revenueEUR);
  const [showFactorForm, setShowFactorForm] = useState(false);
  const [factorName, setFactorName] = useState("");
  const [factorValue, setFactorValue] = useState("");

  useEffect(() => {
    setName(company.name);
    setIndustry(company.industry);
    setCarbonPrice(company.carbonPricePerTonne);
    setBaselineYear(company.baselineYear);
    setReportingYear(company.reportingYear);
    setUnitsProduced(company.unitsProduced);
    setEmployeeCount(company.employeeCount);
    setRevenueEUR(company.revenueEUR);
  }, [company]);

  useEffect(() => {
    if (gwpValues) setGwp(gwpValues);
  }, [gwpValues]);

  const handleSave = async () => {
    await saveSettings({
      companyName: name,
      industry,
      carbonPricePerTonne: carbonPrice,
      baselineYear,
      reportingYear,
      unitsProduced,
      employeeCount,
      revenueEUR,
      discountRate: company.discountRate,
    });
  };

  const handleAddFactor = async () => {
    if (!factorName.trim() || !factorValue) return;
    const factor: EmissionFactor = {
      id: `ef-custom-${Date.now()}`,
      name: factorName.trim(),
      category: "Custom",
      subcategory: "User",
      country: "EU",
      region: "EU",
      year: reportingYear,
      value: Number(factorValue),
      numeratorUnit: "kgCO2e",
      denominatorUnit: "unit",
      ghgCoverage: ["CO2"],
      source: "Custom",
      validFrom: `${reportingYear}-01-01`,
      validUntil: `${reportingYear}-12-31`,
      method: "activity_specific",
      uncertaintyPct: 20,
      isDemo: false,
    };
    await addFactor(factor);
    setFactorName("");
    setFactorValue("");
    setShowFactorForm(false);
  };

  return (
    <div className="relative max-w-2xl space-y-4">
      <PageHeader
        title={t("pages.settings.title")}
        description={t("pages.settings.description")}
      />
      <HelpCorner content="Update company profile, carbon price, and emission factors. Saves persist to Supabase when available, otherwise localStorage for this workspace." />
      <Card>
        <CardHeader><CardTitle className="text-sm">Company settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Company name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
          <div><Label>Industry</Label><Input value={industry} onChange={(e) => setIndustry(e.target.value)} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Carbon price (€/tCO₂e)</Label><Input type="number" value={carbonPrice} onChange={(e) => setCarbonPrice(Number(e.target.value))} className="mt-1" /></div>
            <div><Label>Employees</Label><Input type="number" value={employeeCount} onChange={(e) => setEmployeeCount(Number(e.target.value))} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Baseline year</Label><Input type="number" value={baselineYear} onChange={(e) => setBaselineYear(Number(e.target.value))} className="mt-1" /></div>
            <div><Label>Reporting year</Label><Input type="number" value={reportingYear} onChange={(e) => setReportingYear(Number(e.target.value))} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Units produced</Label><Input type="number" value={unitsProduced} onChange={(e) => setUnitsProduced(Number(e.target.value))} className="mt-1" /></div>
            <div><Label>Revenue (EUR)</Label><Input type="number" value={revenueEUR} onChange={(e) => setRevenueEUR(Number(e.target.value))} className="mt-1" /></div>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save company settings"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Global Warming Potential values</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Configurable GWP values (AR6). Used when converting non-CO₂ gases.</p>
          {Object.entries(gwp).map(([gas, val]) => (
            <div key={gas} className="flex items-center gap-4">
              <Label className="w-16">{gas}</Label>
              <Input type="number" value={val} onChange={(e) => setGwp({ ...gwp, [gas]: Number(e.target.value) })} className="max-w-[140px]" />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => void saveSettings({ gwpValues: gwp })}
          >
            {saving ? "Saving…" : "Save GWP values"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Emission factor library ({emissionFactors.length} factors)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-2">Name</th><th className="p-2">Value</th><th className="p-2">Unit</th><th className="p-2">Source</th><th className="p-2">Year</th>
              </tr>
            </thead>
            <tbody>
              {emissionFactors.map((f) => (
                <tr key={f.id} className="border-b">
                  <td className="p-2">{f.name}</td>
                  <td className="p-2">{f.value}</td>
                  <td className="p-2">{f.numeratorUnit}/{f.denominatorUnit}</td>
                  <td className="p-2">{f.source}</td>
                  <td className="p-2">{f.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!showFactorForm ? (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowFactorForm(true)}>
              Add custom factor
            </Button>
          ) : (
            <div className="mt-4 space-y-3 rounded-lg border p-4">
              <div><Label>Factor name</Label><Input className="mt-1" value={factorName} onChange={(e) => setFactorName(e.target.value)} /></div>
              <div><Label>Value (kgCO₂e / unit)</Label><Input className="mt-1" type="number" step="any" value={factorValue} onChange={(e) => setFactorValue(e.target.value)} /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddFactor} disabled={saving}>Save factor</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowFactorForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

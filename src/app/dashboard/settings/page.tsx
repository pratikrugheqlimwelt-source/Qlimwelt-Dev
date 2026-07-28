"use client";

import { useState } from "react";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const DEFAULT_GWP: Record<string, number> = {
  CO2: 1, CH4: 27.9, N2O: 273, HFCs: 1430, PFCs: 6630, SF6: 25200, NF3: 17400,
};

export default function SettingsPage() {
  const { company, emissionFactors } = useDashboard();
  const [gwp, setGwp] = useState(DEFAULT_GWP);
  const [carbonPrice, setCarbonPrice] = useState(company.carbonPricePerTonne);
  const [currency, setCurrency] = useState(company.currency);

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader><CardTitle className="text-sm">Company settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Company name</Label><Input defaultValue={company.name} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Currency</Label><Input value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1" /></div>
            <div><Label>Carbon price (€/tCO₂e)</Label><Input type="number" value={carbonPrice} onChange={(e) => setCarbonPrice(Number(e.target.value))} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Baseline year</Label><Input type="number" defaultValue={company.baselineYear} className="mt-1" /></div>
            <div><Label>Reporting year</Label><Input type="number" defaultValue={company.reportingYear} className="mt-1" /></div>
          </div>
          <Button onClick={() => toast({ title: "Settings saved", description: "Demonstration settings updated locally." })}>Save company settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Global Warming Potential values</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Configurable GWP values (AR6 demonstration). gasCO₂e = gasMass × GWP</p>
          {Object.entries(gwp).map(([gas, val]) => (
            <div key={gas} className="flex items-center gap-4">
              <Label className="w-16">{gas}</Label>
              <Input type="number" value={val} onChange={(e) => setGwp({ ...gwp, [gas]: Number(e.target.value) })} className="max-w-[140px]" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Emission factor library ({emissionFactors.length} demo factors)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b text-left text-muted-foreground"><th className="p-2">Name</th><th className="p-2">Value</th><th className="p-2">Unit</th><th className="p-2">Source</th><th className="p-2">Year</th></tr></thead>
            <tbody>{emissionFactors.map((f) => (
              <tr key={f.id} className="border-b"><td className="p-2">{f.name}</td><td className="p-2">{f.value}</td><td className="p-2">{f.numeratorUnit}/{f.denominatorUnit}</td><td className="p-2">{f.source}</td><td className="p-2">{f.year}</td></tr>
            ))}</tbody>
          </table>
          <Button variant="outline" size="sm" className="mt-4">Add custom factor</Button>
        </CardContent>
      </Card>
    </div>
  );
}

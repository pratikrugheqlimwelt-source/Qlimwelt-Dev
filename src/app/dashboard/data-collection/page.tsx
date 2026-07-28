"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { calculateEmissionsTCO2e } from "@/lib/calculations/engine";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = [
  { id: "mobile", label: "Mobile combustion", fields: ["vehicle", "fuelLitres", "distanceKm", "period"] },
  { id: "electricity", label: "Purchased electricity", fields: ["facility", "kwh", "supplier", "renewablePct", "period"] },
  { id: "travel", label: "Business travel", fields: ["mode", "origin", "destination", "distanceKm", "passengers", "period"] },
  { id: "goods", label: "Purchased goods", fields: ["supplier", "product", "quantity", "unit", "valueEUR", "method"] },
  { id: "waste", label: "Waste", fields: ["wasteType", "massTonnes", "treatment", "facility", "period"] },
];

export default function DataCollectionPage() {
  const [category, setCategory] = useState("electricity");
  const [preview, setPreview] = useState<number | null>(null);
  const cat = CATEGORIES.find((c) => c.id === category)!;

  const handlePreview = () => {
    const val = category === "electricity" ? 420000 : category === "mobile" ? 4200 : 1000;
    const factor = category === "electricity" ? 0.000385 : 0.00268;
    setPreview(calculateEmissionsTCO2e(val, factor));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Record saved", description: "Demonstration activity record added to inventory.", variant: "success" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">New activity record</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Emission category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {cat.fields.map((f) => (
              <div key={f}><Label className="capitalize">{f.replace(/([A-Z])/g, " $1")}</Label><Input className="mt-1" placeholder={`Enter ${f}`} required /></div>
            ))}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={handlePreview}>Preview calculation</Button>
              <Button type="submit">Save record</Button>
            </div>
            {preview !== null && (
              <div className="rounded border bg-brand/5 p-4 text-sm">
                <p className="font-mono text-xs uppercase text-muted-foreground">Calculation preview</p>
                <p className="mt-1 font-bold">{preview.toFixed(4)} tCO₂e</p>
                <p className="text-xs text-muted-foreground">activityValue × emissionFactor × conversionFactor ÷ 1000</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

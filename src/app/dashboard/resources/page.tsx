"use client";

import { useState } from "react";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/dashboard/shared/data-table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCO2 } from "@/lib/utils";
import { simplePaybackPeriod, netAnnualSaving } from "@/lib/calculations/engine";
import { Building2, Truck, Users, Plus, Upload, LayoutGrid, List } from "lucide-react";

export default function ResourcesPage() {
  const { facilities, vehicles, suppliers } = useDashboard();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "table">("table");

  const filteredVehicles = vehicles.filter((v) =>
    `${v.manufacturer} ${v.model} ${v.registration}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Resources"
        description="Manage facilities, fleet vehicles, and supplier relationships across your value chain."
      />

      <Tabs defaultValue="vehicles" className="space-y-4">
        <TabsList className="dash-tab-list h-auto w-full justify-start sm:w-auto">
          <TabsTrigger value="facilities" className="dash-tab-trigger gap-1.5"><Building2 className="h-3.5 w-3.5" />Facilities ({facilities.length})</TabsTrigger>
          <TabsTrigger value="vehicles" className="dash-tab-trigger gap-1.5"><Truck className="h-3.5 w-3.5" />Vehicles ({vehicles.length})</TabsTrigger>
          <TabsTrigger value="suppliers" className="dash-tab-trigger gap-1.5"><Users className="h-3.5 w-3.5" />Suppliers ({suppliers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="facilities">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((f) => (
              <div key={f.id} className="dash-card p-5 transition-all hover:shadow-[0_8px_30px_rgba(15,23,42,0.07)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand-dark">
                  <Building2 className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="mt-3 text-[10px]">{f.type}</Badge>
                <p className="mt-2 font-semibold">{f.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{f.country} · {f.floorAreaM2.toLocaleString()} m²</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input placeholder="Search manufacturer, model, registration…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm border-border/60 shadow-none" />
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setView(view === "table" ? "grid" : "table")}>
              {view === "table" ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
              {view === "table" ? "Grid" : "Table"}
            </Button>
            <Button size="sm" className="h-9 gap-1.5"><Plus className="h-3.5 w-3.5" />Add vehicle</Button>
            <Button variant="outline" size="sm" className="h-9 gap-1.5"><Upload className="h-3.5 w-3.5" />Bulk upload</Button>
          </div>

          {view === "table" ? (
            <DataTable>
              <table className="w-full">
                <DataTableHeader>
                  <DataTableHead>Vehicle</DataTableHead>
                  <DataTableHead>Category</DataTableHead>
                  <DataTableHead>Fuel</DataTableHead>
                  <DataTableHead>Distance</DataTableHead>
                  <DataTableHead>Fuel/Elec</DataTableHead>
                  <DataTableHead>Est. emissions</DataTableHead>
                  <DataTableHead>Intensity/km</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {filteredVehicles.map((v) => {
                    const emissions = v.fuelLitres * v.emissionFactor / 1000 + v.electricityKwh * 0.000385;
                    return (
                      <DataTableRow key={v.id}>
                        <DataTableCell>
                          <p className="font-medium">{v.manufacturer} {v.model}</p>
                          <p className="text-xs text-muted-foreground">{v.registration}</p>
                        </DataTableCell>
                        <DataTableCell>{v.category}</DataTableCell>
                        <DataTableCell><Badge variant={v.fuelType.includes("electric") ? "success" : "secondary"} className="text-[10px]">{v.fuelType}</Badge></DataTableCell>
                        <DataTableCell>{v.distanceKm.toLocaleString()} km</DataTableCell>
                        <DataTableCell>{v.fuelLitres ? `${v.fuelLitres}L` : `${v.electricityKwh} kWh`}</DataTableCell>
                        <DataTableCell className="font-semibold tabular-nums">{formatCO2(emissions)}</DataTableCell>
                        <DataTableCell className="tabular-nums">{(emissions / v.distanceKm * 1000).toFixed(3)} kg/km</DataTableCell>
                      </DataTableRow>
                    );
                  })}
                </DataTableBody>
              </table>
            </DataTable>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVehicles.map((v) => (
                <div key={v.id} className="dash-card p-4">
                  <p className="font-semibold">{v.manufacturer} {v.model}</p>
                  <p className="text-xs text-muted-foreground">{v.registration}</p>
                  <Badge className="mt-2" variant={v.fuelType.includes("electric") ? "success" : "secondary"}>{v.fuelType}</Badge>
                </div>
              ))}
            </div>
          )}

          <div className="dash-card border-brand/20 bg-brand/5 p-5">
            <p className="font-semibold">EV replacement opportunity</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Diesel van → Battery electric: est. 4.2 tCO₂e/yr reduction, payback {simplePaybackPeriod(42000, netAnnualSaving(8900, 1200)).toFixed(1)} years
            </p>
          </div>
        </TabsContent>

        <TabsContent value="suppliers">
          <DataTable>
            <table className="w-full">
              <DataTableHeader>
                <DataTableHead>Supplier</DataTableHead>
                <DataTableHead>Country</DataTableHead>
                <DataTableHead>Category</DataTableHead>
                <DataTableHead>Scope 3 tCO₂e</DataTableHead>
                <DataTableHead>Data quality</DataTableHead>
                <DataTableHead>Influence</DataTableHead>
              </DataTableHeader>
              <DataTableBody>
                {suppliers.map((s) => (
                  <DataTableRow key={s.id}>
                    <DataTableCell className="font-medium">{s.name}</DataTableCell>
                    <DataTableCell>{s.country}</DataTableCell>
                    <DataTableCell>{s.category}</DataTableCell>
                    <DataTableCell className="tabular-nums font-semibold">{s.scope3TCO2e.toLocaleString()}</DataTableCell>
                    <DataTableCell><Badge variant="secondary">{s.dataQualityScore}%</Badge></DataTableCell>
                    <DataTableCell>{s.influenceScore}/100</DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </table>
          </DataTable>
        </TabsContent>
      </Tabs>
    </div>
  );
}

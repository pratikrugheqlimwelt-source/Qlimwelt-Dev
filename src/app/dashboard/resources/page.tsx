"use client";

import { useRef, useState } from "react";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/dashboard/shared/data-table";
import { useT } from "@/components/i18n/locale-provider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpCorner } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCO2 } from "@/lib/utils";
import { simplePaybackPeriod, netAnnualSaving } from "@/lib/calculations/engine";
import { Building2, Truck, Users, Plus, Upload, LayoutGrid, List } from "lucide-react";
import type { Facility, Supplier, Vehicle } from "@/types/carbon";
import { Label } from "@/components/ui/label";

export default function ResourcesPage() {
  const {
    facilities,
    vehicles,
    suppliers,
    addVehicle,
    addVehiclesBulk,
    addFacility,
    addSupplier,
    logVehicleEmissions,
    logSupplierEmissions,
    saving,
  } = useDashboard();
  const t = useT();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "table">("table");
  const [showAdd, setShowAdd] = useState(false);
  const [showFacility, setShowFacility] = useState(false);
  const [showSupplier, setShowSupplier] = useState(false);
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [registration, setRegistration] = useState("");
  const [fuelType, setFuelType] = useState("Diesel");
  const [facName, setFacName] = useState("");
  const [facCountry, setFacCountry] = useState("Germany");
  const [facType, setFacType] = useState("Plant");
  const [facArea, setFacArea] = useState("1000");
  const [supName, setSupName] = useState("");
  const [supCountry, setSupCountry] = useState("Germany");
  const [supCategory, setSupCategory] = useState("Raw materials");
  const [supTco2e, setSupTco2e] = useState("");
  const bulkRef = useRef<HTMLInputElement>(null);

  const filteredVehicles = vehicles.filter((v) =>
    `${v.manufacturer} ${v.model} ${v.registration}`.toLowerCase().includes(search.toLowerCase())
  );

  const buildVehicle = (
    mfr: string,
    mdl: string,
    reg: string,
    fuel: string,
    year: number,
    distanceKm: number
  ): Vehicle => {
    const isEv = fuel.toLowerCase().includes("electric");
    const facility = facilities[0];
    return {
      id: `veh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: `${mfr} ${mdl}`,
      manufacturer: mfr,
      model: mdl,
      category: "Light commercial",
      fuelType: fuel,
      registration: reg,
      ownership: "owned",
      facilityId: facility?.id ?? "fac-mun",
      country: facility?.country ?? "Germany",
      year,
      distanceKm,
      fuelLitres: isEv ? 0 : Math.round(distanceKm * 0.08),
      electricityKwh: isEv ? Math.round(distanceKm * 0.2) : 0,
      emissionFactor: isEv ? 0.385 : 2.68,
      status: "active",
    };
  };

  const handleAddVehicle = async () => {
    if (!manufacturer.trim() || !model.trim()) return;
    await addVehicle(
      buildVehicle(
        manufacturer.trim(),
        model.trim(),
        registration.trim() || `REG-${Date.now()}`,
        fuelType,
        new Date().getFullYear(),
        15000
      )
    );
    setManufacturer("");
    setModel("");
    setRegistration("");
    setShowAdd(false);
  };

  const handleAddFacility = async () => {
    if (!facName.trim()) return;
    const facility: Facility = {
      id: `fac-${Date.now()}`,
      name: facName.trim(),
      country: facCountry.trim() || "Germany",
      businessUnitId: "bu-ops",
      type: facType.trim() || "Facility",
      floorAreaM2: Number(facArea) || 0,
    };
    await addFacility(facility);
    setFacName("");
    setFacArea("1000");
    setShowFacility(false);
  };

  const handleAddSupplier = async () => {
    if (!supName.trim()) return;
    const supplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: supName.trim(),
      country: supCountry.trim() || "Germany",
      category: supCategory.trim() || "Other",
      scope3TCO2e: Number(supTco2e) || 0,
      dataQualityScore: 65,
      influenceScore: 50,
      reductionOpportunity: 50,
    };
    await addSupplier(supplier);
    setSupName("");
    setSupTco2e("");
    setShowSupplier(false);
  };

  const handleBulkFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    const rows = lines.slice(1);
    const parsed: Vehicle[] = [];
    for (const row of rows) {
      const cols = row.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      parsed.push(
        buildVehicle(
          cols[0] || "Unknown",
          cols[1] || "Unknown",
          cols[2] || `BULK-${parsed.length}`,
          cols[3] || "Diesel",
          Number(cols[4]) || new Date().getFullYear(),
          Number(cols[5]) || 10000
        )
      );
    }
    if (parsed.length) await addVehiclesBulk(parsed);
  };

  const paybackYears = simplePaybackPeriod(42000, netAnnualSaving(8900, 1200)).toFixed(1);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.resources.title")}
        description={t("pages.resources.description")}
        tip={t("resourcesPage.tip")}
      />

      <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        {t("resourcesPage.infoBannerBefore")}{" "}
        <span className="font-medium">{t("resourcesPage.infoBannerAction")}</span>{" "}
        {t("resourcesPage.infoBannerAfter")}
      </div>
      <Tabs defaultValue="facilities" className="space-y-4">
        <TabsList className="dash-tab-list h-auto w-full justify-start sm:w-auto">
          <TabsTrigger value="facilities" className="dash-tab-trigger gap-1.5">
            <Building2 className="h-3.5 w-3.5" />{t("resourcesPage.facilities")} ({facilities.length})
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="dash-tab-trigger gap-1.5">
            <Truck className="h-3.5 w-3.5" />{t("resourcesPage.vehicles")} ({vehicles.length})
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="dash-tab-trigger gap-1.5">
            <Users className="h-3.5 w-3.5" />{t("resourcesPage.suppliers")} ({suppliers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facilities" className="space-y-4">
          <Button size="sm" className="h-9 gap-1.5" onClick={() => setShowFacility((v) => !v)}>
            <Plus className="h-3.5 w-3.5" />{t("resourcesPage.addFacility")}
          </Button>
          {showFacility && (
            <div className="dash-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1.5">
                <Label>{t("resourcesPage.name")}</Label>
                <Input value={facName} onChange={(e) => setFacName(e.target.value)} placeholder={t("resourcesPage.placeholderMunichHq")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("resourcesPage.country")}</Label>
                <Input value={facCountry} onChange={(e) => setFacCountry(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("resourcesPage.type")}</Label>
                <Input value={facType} onChange={(e) => setFacType(e.target.value)} placeholder={t("resourcesPage.placeholderPlantOffice")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("resourcesPage.floorArea")}</Label>
                <Input type="number" value={facArea} onChange={(e) => setFacArea(e.target.value)} />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={() => void handleAddFacility()} disabled={saving || !facName.trim()}>
                  {saving ? t("common.saving") : t("common.save")}
                </Button>
                <Button variant="ghost" onClick={() => setShowFacility(false)}>{t("common.cancel")}</Button>
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((f) => (
              <div key={f.id} className="dash-card relative p-5 pr-11 transition-all hover:shadow-[0_8px_30px_rgba(15,23,42,0.07)]">
                <HelpCorner content={t("resourcesPage.facilityHelp", { name: f.name, type: f.type, country: f.country, area: f.floorAreaM2.toLocaleString() })} />
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
            <Input placeholder={t("resourcesPage.searchVehicles")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm border-border/60 shadow-none" />
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setView(view === "table" ? "grid" : "table")}>
              {view === "table" ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
              {view === "table" ? t("resourcesPage.grid") : t("resourcesPage.table")}
            </Button>
            <Button size="sm" className="h-9 gap-1.5" onClick={() => setShowAdd((v) => !v)}>
              <Plus className="h-3.5 w-3.5" />{t("resourcesPage.addVehicle")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => bulkRef.current?.click()}
              disabled={saving}
            >
              <Upload className="h-3.5 w-3.5" />{t("resourcesPage.bulkUpload")}
            </Button>
            <input
              ref={bulkRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleBulkFile(f);
                e.target.value = "";
              }}
            />
          </div>

          {showAdd && (
            <div className="dash-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1.5">
                <Label>{t("resourcesPage.manufacturer")}</Label>
                <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder={t("resourcesPage.placeholderVolvo")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("resourcesPage.model")}</Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder={t("resourcesPage.placeholderModel")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("resourcesPage.registration")}</Label>
                <Input value={registration} onChange={(e) => setRegistration(e.target.value)} placeholder={t("resourcesPage.placeholderReg")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("resourcesPage.fuelType")}</Label>
                <Input value={fuelType} onChange={(e) => setFuelType(e.target.value)} placeholder={t("resourcesPage.placeholderDiesel")} />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={() => void handleAddVehicle()} disabled={saving || !manufacturer || !model}>
                  {saving ? t("common.saving") : t("common.save")}
                </Button>
                <Button variant="ghost" onClick={() => setShowAdd(false)}>{t("common.cancel")}</Button>
              </div>
              <p className="sm:col-span-2 lg:col-span-5 text-xs text-muted-foreground">
                {t("resourcesPage.csvFormat")}
              </p>
            </div>
          )}

          {view === "table" ? (
            <DataTable tip={t("resourcesPage.vehiclesTableTip")}>
              <table className="w-full">
                <DataTableHeader>
                  <DataTableHead>{t("resourcesPage.vehicle")}</DataTableHead>
                  <DataTableHead>{t("resourcesPage.category")}</DataTableHead>
                  <DataTableHead>{t("resourcesPage.fuel")}</DataTableHead>
                  <DataTableHead>{t("resourcesPage.distance")}</DataTableHead>
                  <DataTableHead>{t("resourcesPage.fuelElec")}</DataTableHead>
                  <DataTableHead>{t("resourcesPage.estEmissions")}</DataTableHead>
                  <DataTableHead>{t("resourcesPage.action")}</DataTableHead>
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
                        <DataTableCell className="dash-num">{formatCO2(emissions)}</DataTableCell>
                        <DataTableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px]"
                            disabled={saving}
                            onClick={() => void logVehicleEmissions(v)}
                          >
                            {t("resourcesPage.addToInventory")}
                          </Button>
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })}
                </DataTableBody>
              </table>
            </DataTable>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVehicles.map((v) => (
                <div key={v.id} className="dash-card relative space-y-3 p-4 pr-11">
                  <HelpCorner content={t("resourcesPage.vehicleHelp", { vehicle: `${v.manufacturer} ${v.model}`, registration: v.registration, fuel: v.fuelType })} />
                  <p className="font-semibold">{v.manufacturer} {v.model}</p>
                  <p className="text-xs text-muted-foreground">{v.registration}</p>
                  <Badge className="mt-2" variant={v.fuelType.includes("electric") ? "success" : "secondary"}>{v.fuelType}</Badge>
                  <Button size="sm" variant="outline" className="w-full" disabled={saving} onClick={() => void logVehicleEmissions(v)}>
                    {t("resourcesPage.addToInventory")}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="dash-card relative border-brand/20 bg-brand/5 p-5 pr-12">
            <HelpCorner content={t("resourcesPage.evOpportunityDesc", { years: paybackYears })} />
            <p className="font-semibold">{t("resourcesPage.evOpportunity")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("resourcesPage.evOpportunityDesc", { years: paybackYears })}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Button size="sm" className="h-9 gap-1.5" onClick={() => setShowSupplier((v) => !v)}>
            <Plus className="h-3.5 w-3.5" />{t("resourcesPage.addSupplier")}
          </Button>
          {showSupplier && (
            <div className="dash-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1.5">
                <Label>{t("resourcesPage.name")}</Label>
                <Input value={supName} onChange={(e) => setSupName(e.target.value)} placeholder={t("resourcesPage.placeholderSteelCo")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("resourcesPage.country")}</Label>
                <Input value={supCountry} onChange={(e) => setSupCountry(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("resourcesPage.category")}</Label>
                <Input value={supCategory} onChange={(e) => setSupCategory(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("resourcesPage.scope3Tco2e")}</Label>
                <Input type="number" step="any" value={supTco2e} onChange={(e) => setSupTco2e(e.target.value)} placeholder="120" />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={() => void handleAddSupplier()} disabled={saving || !supName.trim()}>
                  {saving ? t("common.saving") : t("common.save")}
                </Button>
                <Button variant="ghost" onClick={() => setShowSupplier(false)}>{t("common.cancel")}</Button>
              </div>
            </div>
          )}
          <DataTable tip={t("resourcesPage.suppliersTableTip")}>
            <table className="w-full">
              <DataTableHeader>
                <DataTableHead>{t("resourcesPage.supplier")}</DataTableHead>
                <DataTableHead>{t("resourcesPage.country")}</DataTableHead>
                <DataTableHead>{t("resourcesPage.category")}</DataTableHead>
                <DataTableHead>{t("resourcesPage.scope3Tco2e")}</DataTableHead>
                <DataTableHead>{t("resourcesPage.dataQuality")}</DataTableHead>
                <DataTableHead>{t("resourcesPage.action")}</DataTableHead>
              </DataTableHeader>
              <DataTableBody>
                {suppliers.map((s) => (
                  <DataTableRow key={s.id}>
                    <DataTableCell className="font-medium">{s.name}</DataTableCell>
                    <DataTableCell>{s.country}</DataTableCell>
                    <DataTableCell>{s.category}</DataTableCell>
                    <DataTableCell className="dash-num">{s.scope3TCO2e.toLocaleString()}</DataTableCell>
                    <DataTableCell><Badge variant="secondary">{s.dataQualityScore}%</Badge></DataTableCell>
                    <DataTableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        disabled={saving || s.scope3TCO2e <= 0}
                        title={s.scope3TCO2e <= 0 ? t("resourcesPage.setScope3First") : t("resourcesPage.postToInventory")}
                        onClick={() => void logSupplierEmissions(s)}
                      >
                        {t("resourcesPage.addToInventory")}
                      </Button>
                    </DataTableCell>
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

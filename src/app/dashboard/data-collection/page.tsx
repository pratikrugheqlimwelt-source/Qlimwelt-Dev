"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { calculateEmissionsTCO2e } from "@/lib/calculations/engine";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import type { CalculationMethod, EmissionActivity, Scope } from "@/types/carbon";
import { cn, formatCO2 } from "@/lib/utils";
import { MetricFigure } from "@/components/ui/metric-figure";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { ACTIVITY_PRESETS } from "@/lib/carbon/activity-presets";
import { resolveActivityIcon } from "@/lib/carbon/activity-icons";
import { ActivityTypeCards } from "@/components/dashboard/data-collection/activity-type-cards";
import { FactorPicker } from "@/components/dashboard/data-collection/factor-picker";
import { useT } from "@/components/i18n/locale-provider";
import { useDomainT } from "@/lib/i18n/use-domain-t";

function lastMonthPeriod(ref = new Date()): string {
  const d = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fyPeriod(reportingYear: number): string {
  return `${reportingYear}-12`;
}

function currentMonthPeriod(ref = new Date()): string {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
}

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
  const t = useT();
  const d = useDomainT();

  const [presetId, setPresetId] = useState("electricity");
  const [factorId, setFactorId] = useState<string>("");
  const [scope, setScope] = useState<Scope>("scope2");
  const [category, setCategory] = useState("Purchased electricity");
  const [activityUnit, setActivityUnit] = useState("kWh");
  const [factorValue, setFactorValue] = useState("0.000385");
  const [activityValue, setActivityValue] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [isEstimated, setIsEstimated] = useState(false);
  const [period, setPeriod] = useState(() => lastMonthPeriod());
  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? "");
  const [resourceId, setResourceId] = useState<string>("none");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const preset = ACTIVITY_PRESETS.find((c) => c.id === presetId) ?? ACTIVITY_PRESETS[3];
  const presetLocalized = d.preset(preset.id);
  const selectedFactor = emissionFactors.find((f) => f.id === factorId);
  const PresetIcon = resolveActivityIcon(`${preset.id} ${preset.label} ${preset.category}`);

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

  const periodChips = useMemo(
    () => [
      { id: "last", label: t("pages.dataCollection.lastMonth"), value: lastMonthPeriod() },
      { id: "current", label: t("pages.dataCollection.thisMonth"), value: currentMonthPeriod() },
      {
        id: "fy",
        label: t("pages.dataCollection.fyYear", { year: company.reportingYear }),
        value: fyPeriod(company.reportingYear),
      },
    ],
    [company.reportingYear, t]
  );

  const handlePresetChange = (id: string) => {
    setPresetId(id);
  };

  const handleFactorChange = (id: string) => {
    setFactorId(id);
    if (id) setPresetId("custom");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valueNum || !source.trim() || !factorNum) return;

    const method: CalculationMethod = selectedFactor?.method ?? preset.method;

    let dq = selectedFactor ? Math.max(50, 100 - selectedFactor.uncertaintyPct) : 70;
    if (isEstimated) dq = Math.max(35, dq - 15);
    else if (evidenceFile) dq = Math.min(100, dq + 5);

    const evidenceNotes = notes.trim();
    const sourceWithNotes = evidenceNotes
      ? `${source.trim()} — ${evidenceNotes}`
      : source.trim();

    const activity: EmissionActivity = {
      id: `a-user-${Date.now()}`,
      period,
      facilityId: facility?.id ?? "fac-mun",
      country: facility?.country ?? "Germany",
      businessUnitId: facility?.businessUnitId ?? "bu-ops",
      scope,
      category: category.trim() || "Custom",
      subcategory: selectedFactor?.name ?? preset.label,
      source: sourceWithNotes,
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
      dataQualityScore: dq,
      uncertaintyPct: selectedFactor?.uncertaintyPct ?? (isEstimated ? 25 : 15),
      evidenceStatus: evidenceFile ? "uploaded" : "pending",
      resourceId: resourceId !== "none" ? resourceId : undefined,
      isEstimated,
    };

    await addActivity(activity);

    if (evidenceFile) {
      setEvidenceError(null);
      const formData = new FormData();
      formData.append("file", evidenceFile);
      formData.append("activityId", activity.id);
      formData.append(
        "notes",
        evidenceNotes
          ? `Evidence for ${source.trim()}. ${evidenceNotes}`
          : `Evidence for ${source.trim()}`
      );
      try {
        const res = await fetch("/api/evidence", { method: "POST", body: formData });
        const data = (await res.json()) as { error?: string; hint?: string };
        if (!res.ok) {
          setEvidenceError(data.hint || data.error || t("pages.dataCollection.evidenceUploadFailed"));
        }
      } catch {
        setEvidenceError(t("pages.dataCollection.evidenceUploadFailedHint"));
      }
    }

    setActivityValue("");
    setSource("");
    setNotes("");
    setIsEstimated(false);
    setResourceId("none");
    setEvidenceFile(null);
  };

  return (
    <div className="relative space-y-4">
      <PageHeader
        title={t("pages.dataCollection.title")}
        description={t("pages.dataCollection.description")}
        tip={t("pages.dataCollection.tip")}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Activity type cards */}
        <section className="dash-card space-y-3 p-4 sm:p-5">
          <div>
            <p className="dash-label">{t("pages.dataCollection.activityType")}</p>
            <h3 className="mt-0.5 text-sm font-semibold tracking-tight">{t("pages.dataCollection.whatRecording")}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("pages.dataCollection.chooseTemplate")}
            </p>
          </div>
          <ActivityTypeCards
            presets={ACTIVITY_PRESETS}
            value={presetId}
            onChange={handlePresetChange}
          />
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] lg:items-start">
          {/* Main form */}
          <div className="space-y-4">
            <section className="dash-card space-y-4 p-4 sm:p-5">
              <div>
                <p className="dash-label">{t("pages.dataCollection.emissionFactor")}</p>
                <h3 className="mt-0.5 text-sm font-semibold tracking-tight">{t("pages.dataCollection.libraryOrManual")}</h3>
              </div>
              <FactorPicker
                factors={emissionFactors}
                value={factorId}
                onChange={handleFactorChange}
              />
            </section>

            <section className="dash-card space-y-4 p-4 sm:p-5">
              <div>
                <p className="dash-label">{t("pages.dataCollection.activityDetails")}</p>
                <h3 className="mt-0.5 text-sm font-semibold tracking-tight">{t("pages.dataCollection.valuesAllocation")}</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>{t("pages.dataCollection.scope")}</Label>
                  <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scope1">{d.scope("scope1")}</SelectItem>
                      <SelectItem value="scope2">{d.scope("scope2")}</SelectItem>
                      <SelectItem value="scope3">{d.scope("scope3")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("pages.dataCollection.category")}</Label>
                  <Input
                    className="mt-1"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>{t("pages.dataCollection.activityUnit")}</Label>
                  <Input
                    className="mt-1"
                    value={activityUnit}
                    onChange={(e) => setActivityUnit(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>
                    {t("pages.dataCollection.activityValue")} ({d.unit(activityUnit)})
                  </Label>
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
                  <Label>{t("moduleForm.factor", { unit: d.unit(activityUnit) })}</Label>
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

              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {isEstimated ? t("pages.dataCollection.estimatedValue") : t("pages.dataCollection.measuredValue")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isEstimated ? t("pages.dataCollection.estimatedHint") : t("pages.dataCollection.measuredHint")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground">{t("common.measured")}</span>
                  <Switch
                    checked={isEstimated}
                    onCheckedChange={setIsEstimated}
                    aria-label={t("pages.dataCollection.estimatedValue")}
                  />
                  <span className="text-[11px] font-medium text-muted-foreground">{t("common.estimated")}</span>
                </div>
              </div>

              <div>
                <Label>{t("pages.dataCollection.sourceDesc")}</Label>
                <Input
                  className="mt-1"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder={t("pages.dataCollection.sourcePlaceholder")}
                  required
                />
              </div>

              <div>
                <Label>{t("pages.dataCollection.notesOptional")}</Label>
                <textarea
                  className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("pages.dataCollection.notesPlaceholder")}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{t("pages.dataCollection.periodYyyyMm")}</Label>
                  <Input
                    className="mt-1"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    required
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {periodChips.map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setPeriod(chip.value)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors",
                          period === chip.value
                            ? "border-brand/40 bg-brand-light text-brand-dark"
                            : "border-border bg-background text-muted-foreground hover:border-brand/25 hover:text-foreground"
                        )}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>{t("pages.dataCollection.facility")}</Label>
                  <Select value={facilityId || facilities[0]?.id} onValueChange={setFacilityId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t("pages.dataCollection.selectFacility")} />
                    </SelectTrigger>
                    <SelectContent>
                      {facilities.length === 0 ? (
                        <SelectItem value="none" disabled>
                          {t("pages.dataCollection.addFacilityFirst")}
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
              </div>

              <div>
                <Label>{t("pages.dataCollection.linkResource")}</Label>
                <Select value={resourceId} onValueChange={setResourceId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("pages.dataCollection.noLinkedResource")}</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {t("pages.dataCollection.vehiclePrefix")} {v.manufacturer} {v.model} ({v.registration})
                      </SelectItem>
                    ))}
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {t("pages.dataCollection.supplierPrefix")} {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t("pages.dataCollection.evidenceFile")}</Label>
                <Input
                  className="mt-1"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("pages.dataCollection.evidenceUploadHint")}
                </p>
                {evidenceError && <p className="mt-1 text-xs text-destructive">{evidenceError}</p>}
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <Button type="submit" disabled={saving || !valueNum || !factorNum || !source.trim()}>
                  {saving ? t("common.saving") : t("pages.dataCollection.saveInventory")}
                </Button>
              </div>
            </section>
          </div>

          {/* Live preview panel */}
          <aside className="lg:sticky lg:top-20">
            <div className="dash-card space-y-3 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand-dark ring-1 ring-brand/20">
                  <PresetIcon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="dash-label">{t("pages.dataCollection.livePreview")}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold tracking-tight">{presetLocalized.label}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("pages.dataCollection.calculatedEmissions")}
                </p>
                {livePreview !== null ? (
                  <MetricFigure size="md" className="mt-1">
                    {formatCO2(livePreview)}
                  </MetricFigure>
                ) : (
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-muted-foreground/50">—</p>
                )}
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {activityValue || "0"} {d.unit(activityUnit)} × {factorValue || "0"} ÷ 1000
                </p>
              </div>

              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t("pages.dataCollection.scope")}</dt>
                  <dd className="font-medium">{d.scope(scope)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t("pages.dataCollection.period")}</dt>
                  <dd className="font-medium tabular-nums">{period}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t("pages.dataCollection.quality")}</dt>
                  <dd className="font-medium">{d.quality(isEstimated ? "Estimated" : "Measured")}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t("pages.dataCollection.factorSource")}</dt>
                  <dd className="max-w-[55%] truncate text-right font-medium">
                    {selectedFactor
                      ? d.factorName(selectedFactor.name)
                      : t("pages.dataCollection.templateManual")}
                  </dd>
                </div>
              </dl>

              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {t("pages.dataCollection.previewHint")}
              </p>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}

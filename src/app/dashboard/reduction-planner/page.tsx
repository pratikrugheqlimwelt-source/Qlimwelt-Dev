"use client";

import { useState } from "react";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { ChartCard } from "@/components/dashboard/shared/chart-card";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { useT } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { HelpCorner } from "@/components/ui/tooltip";
import { costPerTonneReduced, netAnnualSaving, simplePaybackPeriod, lifetimeEmissionReduction } from "@/lib/calculations/engine";
import { CHART, CHART_GRID } from "@/lib/chart-theme";
import { formatCurrency } from "@/lib/utils";
import { MetricFigure } from "@/components/ui/metric-figure";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip } from "recharts";
import { Target, TrendingDown, Play, CheckCircle2, Plus } from "lucide-react";
import type { ReductionInitiative } from "@/types/carbon";

export default function ReductionPlannerPage() {
  const { reductionInitiatives, setInitiativeStatus, saveInitiative, saving } = useDashboard();
  const t = useT();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [reduction, setReduction] = useState("");
  const [cost, setCost] = useState("");

  const statusLabel = (status: ReductionInitiative["status"]) => {
    const map: Record<ReductionInitiative["status"], string> = {
      planned: t("reductionPage.planned"),
      in_progress: t("reductionPage.inProgress"),
      completed: t("reductionPage.completed"),
    };
    return map[status];
  };

  const difficultyLabel = (level: ReductionInitiative["difficulty"]) => {
    const map: Record<ReductionInitiative["difficulty"], string> = {
      low: t("reductionPage.low"),
      medium: t("reductionPage.med"),
      high: t("reductionPage.high"),
    };
    return map[level];
  };

  const enriched = reductionInitiatives.map((i) => ({
    ...i,
    netSaving: netAnnualSaving(i.annualFinancialSaving, i.annualOperatingCost),
    costPerTonne: costPerTonneReduced(i.implementationCost, lifetimeEmissionReduction(i.annualEmissionReductionTCO2e, i.expectedLifetimeYears)),
    payback: simplePaybackPeriod(i.implementationCost, netAnnualSaving(i.annualFinancialSaving, i.annualOperatingCost)),
    lifetimeReduction: lifetimeEmissionReduction(i.annualEmissionReductionTCO2e, i.expectedLifetimeYears),
  }));

  const matrix = enriched.map((i) => ({
    name: i.name.slice(0, 20),
    potential: i.annualEmissionReductionTCO2e,
    difficulty: i.difficulty === "low" ? 1 : i.difficulty === "medium" ? 2 : 3,
    size: i.annualEmissionReductionTCO2e,
  }));

  const nextStatus = (status: ReductionInitiative["status"]): ReductionInitiative["status"] | null => {
    if (status === "planned") return "in_progress";
    if (status === "in_progress") return "completed";
    return null;
  };

  const handleAdd = async () => {
    const trimmed = name.trim();
    const reductionVal = Number(reduction);
    const costVal = Number(cost);
    if (!trimmed || !Number.isFinite(reductionVal) || reductionVal <= 0) return;
    const initiative: ReductionInitiative = {
      id: `init-${Date.now()}`,
      name: trimmed,
      category: "Custom",
      source: "User",
      implementationCost: Number.isFinite(costVal) ? costVal : 0,
      annualOperatingCost: 0,
      annualFinancialSaving: 0,
      annualEmissionReductionTCO2e: reductionVal,
      implementationDate: new Date().toISOString().slice(0, 10),
      confidence: 70,
      status: "planned",
      expectedLifetimeYears: 10,
      difficulty: "medium",
    };
    await saveInitiative(initiative);
    setName("");
    setReduction("");
    setCost("");
    setShowForm(false);
  };

  const difficultyTicks = ["", t("reductionPage.low"), t("reductionPage.med"), t("reductionPage.high")];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.reduction.title")}
        description={t("pages.reduction.description")}
        tip={t("reductionPage.tip")}
      />

      <div className="dash-card p-4">
        {!showForm ? (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />{t("reductionPage.addInitiative")}
          </Button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="init-name">{t("reductionPage.name")}</Label>
              <Input id="init-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("reductionPage.namePlaceholder")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="init-reduction">{t("reductionPage.reductionPerYear")}</Label>
              <Input id="init-reduction" type="number" min={0} step="any" value={reduction} onChange={(e) => setReduction(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="init-cost">{t("reductionPage.costEuro")}</Label>
              <Input id="init-cost" type="number" min={0} step="any" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button size="sm" disabled={saving || !name.trim() || !reduction} onClick={() => void handleAdd()}>
                {saving ? t("common.saving") : t("common.save")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
            </div>
          </div>
        )}
      </div>

      <ChartCard title={t("reductionPage.prioritisationMatrix")} tip={t("reductionPage.matrixTip")} icon={Target}>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart>
            <CartesianGrid {...CHART_GRID} />
            <XAxis dataKey="difficulty" name={t("reductionPage.difficulty")} domain={[0, 4]} tickFormatter={(v) => difficultyTicks[v] ?? ""} tick={{ fontSize: 11, fill: CHART.tick }} />
            <YAxis dataKey="potential" name="tCO₂e/yr" tick={{ fontSize: 11, fill: CHART.tick }} />
            <ZAxis dataKey="size" range={[100, 600]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={matrix} fill={CHART.scope2} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="space-y-4">
        {enriched.map((i) => {
          const progressPct = i.status === "completed" ? 100 : i.status === "in_progress" ? 55 : 10;
          const advance = nextStatus(i.status);
          return (
            <div key={i.id} className="dash-card relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(15,23,42,0.07)]">
              <HelpCorner content={t("reductionPage.helpTemplate", {
                name: i.name,
                reduction: i.annualEmissionReductionTCO2e.toLocaleString(),
                saving: formatCurrency(i.netSaving),
                difficulty: difficultyLabel(i.difficulty),
                payback: i.payback.toFixed(1),
              })} />
              <div className="p-5 pr-12">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-dark">
                      <TrendingDown className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{i.name}</p>
                        <Badge variant={i.status === "completed" ? "success" : i.status === "in_progress" ? "warning" : "secondary"} className="text-[10px]">
                          {statusLabel(i.status)}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {t("reductionPage.difficultyLabel", { level: difficultyLabel(i.difficulty) })}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{i.category} · {i.source}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-brand-dark">
                        <MetricFigure size="lg" className="text-brand-dark">
                          {`${i.annualEmissionReductionTCO2e.toLocaleString()} tCO₂e/yr`}
                        </MetricFigure>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("reductionPage.netSavingPerYear", { amount: formatCurrency(i.netSaving) })}
                      </p>
                    </div>
                    {advance && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        disabled={saving}
                        onClick={() => void setInitiativeStatus(i.id, advance)}
                      >
                        {advance === "in_progress" ? (
                          <><Play className="mr-1.5 h-3.5 w-3.5" />{t("reductionPage.startInitiative")}</>
                        ) : (
                          <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />{t("reductionPage.markCompleted")}</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground">{t("reductionPage.implementationProgress")}</span>
                    <span className="font-medium">{progressPct}%</span>
                  </div>
                  <Progress value={progressPct} className="h-1.5" />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <Stat label={t("reductionPage.implementation")} value={formatCurrency(i.implementationCost)} />
                  <Stat label={t("reductionPage.costPerTonne")} value={formatCurrency(i.costPerTonne)} />
                  <Stat label={t("reductionPage.payback")} value={i.payback === Infinity ? "—" : `${i.payback.toFixed(1)} ${t("reductionPage.yrs")}`} />
                  <Stat label={t("reductionPage.lifetimeReduction")} value={`${i.lifetimeReduction.toLocaleString()} t`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <MetricFigure size="sm" className="mt-0.5">
        {value}
      </MetricFigure>
    </div>
  );
}

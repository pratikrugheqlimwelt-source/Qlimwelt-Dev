"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { absoluteTargetEmissions, targetProgressPct, annualLinearReduction } from "@/lib/calculations/engine";
import { ChartCard } from "@/components/dashboard/shared/chart-card";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { MetricCard } from "@/components/dashboard/shared/metric-card";
import { useT } from "@/components/i18n/locale-provider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpCorner } from "@/components/ui/tooltip";
import { CHART, CHART_AXIS, CHART_GRID } from "@/lib/chart-theme";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { Flag, Target, TrendingDown, Calendar } from "lucide-react";
import type { ClimateTarget } from "@/types/carbon";

type TargetStatus = "ahead" | "on_track" | "at_risk" | "off_track";

export default function TargetsPage() {
  const { climateTarget, metrics, saveClimateTarget, saving } = useDashboard();
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ClimateTarget>(climateTarget);

  useEffect(() => {
    setDraft(climateTarget);
  }, [climateTarget]);

  const targetEmissions = absoluteTargetEmissions(climateTarget.baselineEmissionsTCO2e, climateTarget.targetReductionPct);
  const progress = targetProgressPct(climateTarget.baselineEmissionsTCO2e, metrics.totalTCO2e * 12, targetEmissions);
  const annualReduction = annualLinearReduction(climateTarget.baselineEmissionsTCO2e, targetEmissions, climateTarget.targetYear - climateTarget.baselineYear);
  const status: TargetStatus = progress >= 80 ? "ahead" : progress >= 50 ? "on_track" : progress >= 25 ? "at_risk" : "off_track";

  const statusLabel = (s: TargetStatus) => {
    const map: Record<TargetStatus, string> = {
      ahead: t("targetsPage.ahead"),
      on_track: t("targetsPage.onTrack"),
      at_risk: t("targetsPage.atRisk"),
      off_track: t("targetsPage.offTrack"),
    };
    return map[s];
  };

  const pathway = Array.from({ length: Math.max(1, climateTarget.targetYear - climateTarget.baselineYear + 1) }, (_, i) => {
    const year = climateTarget.baselineYear + i;
    return { year, required: climateTarget.baselineEmissionsTCO2e - annualReduction * i, actual: year <= 2024 ? climateTarget.baselineEmissionsTCO2e * (1 - i * 0.04) : null };
  });

  const handleSave = async () => {
    const next: ClimateTarget = {
      ...draft,
      id: draft.id || climateTarget.id || `tgt-${Date.now()}`,
      baselineYear: Number(draft.baselineYear),
      targetYear: Number(draft.targetYear),
      baselineEmissionsTCO2e: Number(draft.baselineEmissionsTCO2e),
      targetReductionPct: Number(draft.targetReductionPct),
      type: draft.type === "intensity" ? "intensity" : "absolute",
    };
    if (!next.name.trim() || next.targetYear <= next.baselineYear) return;
    await saveClimateTarget(next);
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.targets.title")}
        description={t("pages.targets.description")}
        tip={t("targetsPage.tip")}
      />

      <div className="dash-card relative overflow-hidden">
        <HelpCorner content={t("targetsPage.summaryHelp")} />
        <div className="border-b border-border/40 bg-gradient-to-r from-brand/5 to-transparent p-6 pr-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand-dark">
                <Flag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("targetsPage.sbtLabel")}</p>
                <h2 className="text-xl font-semibold tracking-tight">{climateTarget.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("targetsPage.reductionBy", {
                    pct: climateTarget.targetReductionPct,
                    targetYear: climateTarget.targetYear,
                    baselineYear: climateTarget.baselineYear,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status === "ahead" || status === "on_track" ? "success" : "warning"} className="text-sm">
                {statusLabel(status)}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
                {editing ? t("targetsPage.close") : t("targetsPage.editTarget")}
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium">{t("targetsPage.progressToTarget")}</span>
              <span className="dash-num">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(100, progress)} className="h-2.5" />
          </div>
        </div>

        {editing && (
          <div className="grid gap-4 border-b border-border/40 bg-muted/20 p-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label>{t("targetsPage.targetName")}</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("targetsPage.baselineYear")}</Label>
              <Input
                type="number"
                value={draft.baselineYear}
                onChange={(e) => setDraft({ ...draft, baselineYear: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("targetsPage.targetYear")}</Label>
              <Input
                type="number"
                value={draft.targetYear}
                onChange={(e) => setDraft({ ...draft, targetYear: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("targetsPage.type")}</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as ClimateTarget["type"] })}
              >
                <option value="absolute">{t("targetsPage.absolute")}</option>
                <option value="intensity">{t("targetsPage.intensity")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("targetsPage.baselineEmissions")}</Label>
              <Input
                type="number"
                step="any"
                value={draft.baselineEmissionsTCO2e}
                onChange={(e) => setDraft({ ...draft, baselineEmissionsTCO2e: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("targetsPage.reductionPct")}</Label>
              <Input
                type="number"
                step="any"
                value={draft.targetReductionPct}
                onChange={(e) => setDraft({ ...draft, targetReductionPct: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving ? t("common.saving") : t("targetsPage.saveTarget")}
              </Button>
              <Button variant="ghost" onClick={() => { setDraft(climateTarget); setEditing(false); }}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard accent="neutral" icon={Calendar} label={t("targetsPage.baseline")} value={`${climateTarget.baselineEmissionsTCO2e.toLocaleString()} t`} sub={`${climateTarget.baselineYear}`} tooltip={t("targetsPage.baselineTooltip")} />
          <MetricCard accent="success" icon={Target} label={t("targetsPage.targetYearLabel", { year: climateTarget.targetYear })} value={`${targetEmissions.toLocaleString()} t`} sub={`${climateTarget.targetReductionPct}% reduction`} tooltip={t("targetsPage.targetTooltip")} />
          <MetricCard accent="brand" icon={TrendingDown} label={t("targetsPage.annualReductionReq")} value={`${annualReduction.toFixed(0)} t/yr`} tooltip={t("targetsPage.annualReductionTooltip")} />
          <MetricCard accent="neutral" label={t("targetsPage.currentFiltered")} value={`${(metrics.totalTCO2e * 12).toFixed(0)} t/yr`} sub={t("targetsPage.estimatedAnnual")} tooltip={t("targetsPage.currentTooltip")} />
        </div>
      </div>

      <ChartCard title={t("targetsPage.reductionPathway")} tip={t("targetsPage.pathwayTip")} icon={Target}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={pathway}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis dataKey="year" {...CHART_AXIS} />
            <YAxis {...CHART_AXIS} />
            <Tooltip formatter={(v: number) => [`${v?.toFixed(0) ?? "—"} tCO₂e`, ""]} />
            <ReferenceLine y={targetEmissions} stroke={CHART.target} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="required" stroke={CHART.baseline} strokeDasharray="4 4" dot={false} name={t("targetsPage.requiredPathway")} />
            <Line type="monotone" dataKey="actual" stroke={CHART.actual} strokeWidth={2} name={t("targetsPage.actual")} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

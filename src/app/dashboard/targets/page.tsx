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
  const status = progress >= 80 ? "ahead" : progress >= 50 ? "on_track" : progress >= 25 ? "at_risk" : "off_track";

  const pathway = Array.from({ length: Math.max(1, climateTarget.targetYear - climateTarget.baselineYear + 1) }, (_, i) => {
    const year = climateTarget.baselineYear + i;
    const required = climateTarget.baselineEmissionsTCO2e - annualReduction * i;
    return { year, required, actual: year <= 2024 ? climateTarget.baselineEmissionsTCO2e * (1 - i * 0.04) : null };
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
        tip="Set baseline year, absolute emissions, reduction %, and target year. Progress uses your live filtered inventory."
      />

      <div className="dash-card relative overflow-hidden">
        <HelpCorner content="Your science-based target summary: baseline year, absolute target, status versus the linear pathway, and key reduction metrics." />
        <div className="border-b border-border/40 bg-gradient-to-r from-brand/5 to-transparent p-6 pr-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand-dark">
                <Flag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Science-based target</p>
                <h2 className="text-xl font-semibold tracking-tight">{climateTarget.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {climateTarget.targetReductionPct}% reduction by {climateTarget.targetYear} from {climateTarget.baselineYear} baseline
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status === "ahead" || status === "on_track" ? "success" : "warning"} className="text-sm capitalize">
                {status.replace(/_/g, " ")}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
                {editing ? "Close" : "Edit target"}
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium">Progress to target</span>
              <span className="dash-num">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(100, progress)} className="h-2.5" />
          </div>
        </div>

        {editing && (
          <div className="grid gap-4 border-b border-border/40 bg-muted/20 p-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label>Target name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Baseline year</Label>
              <Input
                type="number"
                value={draft.baselineYear}
                onChange={(e) => setDraft({ ...draft, baselineYear: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Target year</Label>
              <Input
                type="number"
                value={draft.targetYear}
                onChange={(e) => setDraft({ ...draft, targetYear: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as ClimateTarget["type"] })}
              >
                <option value="absolute">Absolute</option>
                <option value="intensity">Intensity</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Baseline emissions (tCO₂e)</Label>
              <Input
                type="number"
                step="any"
                value={draft.baselineEmissionsTCO2e}
                onChange={(e) => setDraft({ ...draft, baselineEmissionsTCO2e: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reduction %</Label>
              <Input
                type="number"
                step="any"
                value={draft.targetReductionPct}
                onChange={(e) => setDraft({ ...draft, targetReductionPct: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving ? "Saving…" : "Save target"}
              </Button>
              <Button variant="ghost" onClick={() => { setDraft(climateTarget); setEditing(false); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard accent="neutral" icon={Calendar} label="Baseline" value={`${climateTarget.baselineEmissionsTCO2e.toLocaleString()} t`} sub={`${climateTarget.baselineYear}`} tooltip="Absolute emissions in the baseline year used for your science-based target." />
          <MetricCard accent="success" icon={Target} label={`${climateTarget.targetYear} target`} value={`${targetEmissions.toLocaleString()} t`} sub={`${climateTarget.targetReductionPct}% reduction`} tooltip="Absolute emissions level required by the target year after applying the reduction percentage." />
          <MetricCard accent="brand" icon={TrendingDown} label="Annual reduction req." value={`${annualReduction.toFixed(0)} t/yr`} tooltip="Average annual reduction needed on a linear pathway from baseline to target." />
          <MetricCard accent="neutral" label="Current (filtered)" value={`${(metrics.totalTCO2e * 12).toFixed(0)} t/yr`} sub="Estimated annual" tooltip="Current filtered emissions annualised (×12) for comparison against the pathway." />
        </div>
      </div>

      <ChartCard title="Reduction pathway" tip="Required linear pathway vs actual emissions trajectory" icon={Target}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={pathway}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis dataKey="year" {...CHART_AXIS} />
            <YAxis {...CHART_AXIS} />
            <Tooltip formatter={(v: number) => [`${v?.toFixed(0) ?? "—"} tCO₂e`, ""]} />
            <ReferenceLine y={targetEmissions} stroke={CHART.target} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="required" stroke={CHART.baseline} strokeDasharray="4 4" dot={false} name="Required pathway" />
            <Line type="monotone" dataKey="actual" stroke={CHART.actual} strokeWidth={2} name="Actual" connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

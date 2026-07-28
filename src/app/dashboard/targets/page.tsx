"use client";

import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { absoluteTargetEmissions, targetProgressPct, annualLinearReduction } from "@/lib/calculations/engine";
import { ChartCard } from "@/components/dashboard/shared/chart-card";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { MetricCard } from "@/components/dashboard/shared/metric-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CHART, CHART_AXIS, CHART_GRID } from "@/lib/chart-theme";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { Flag, Target, TrendingDown, Calendar } from "lucide-react";

export default function TargetsPage() {
  const { climateTarget, metrics } = useDashboard();
  const targetEmissions = absoluteTargetEmissions(climateTarget.baselineEmissionsTCO2e, climateTarget.targetReductionPct);
  const progress = targetProgressPct(climateTarget.baselineEmissionsTCO2e, metrics.totalTCO2e * 12, targetEmissions);
  const annualReduction = annualLinearReduction(climateTarget.baselineEmissionsTCO2e, targetEmissions, climateTarget.targetYear - climateTarget.baselineYear);
  const status = progress >= 80 ? "ahead" : progress >= 50 ? "on_track" : progress >= 25 ? "at_risk" : "off_track";

  const pathway = Array.from({ length: climateTarget.targetYear - climateTarget.baselineYear + 1 }, (_, i) => {
    const year = climateTarget.baselineYear + i;
    const required = climateTarget.baselineEmissionsTCO2e - annualReduction * i;
    return { year, required, actual: year <= 2024 ? climateTarget.baselineEmissionsTCO2e * (1 - i * 0.04) : null };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Science-based targets"
        description="Track progress toward your SBTi-aligned reduction pathway."
      />

      <div className="dash-card overflow-hidden">
        <div className="border-b border-border/40 bg-gradient-to-r from-brand/5 to-transparent p-6">
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
            <Badge variant={status === "ahead" || status === "on_track" ? "success" : "warning"} className="text-sm capitalize">
              {status.replace(/_/g, " ")}
            </Badge>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium">Progress to target</span>
              <span className="font-semibold tabular-nums">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(100, progress)} className="h-2.5" />
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard accent="neutral" icon={Calendar} label="Baseline" value={`${climateTarget.baselineEmissionsTCO2e.toLocaleString()} t`} sub={`${climateTarget.baselineYear}`} />
          <MetricCard accent="success" icon={Target} label="2030 target" value={`${targetEmissions.toLocaleString()} t`} sub={`${climateTarget.targetReductionPct}% reduction`} />
          <MetricCard accent="brand" icon={TrendingDown} label="Annual reduction req." value={`${annualReduction.toFixed(0)} t/yr`} />
          <MetricCard accent="neutral" label="Current (filtered)" value={`${(metrics.totalTCO2e * 12).toFixed(0)} t/yr`} sub="Estimated annual" />
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

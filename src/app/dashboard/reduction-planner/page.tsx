"use client";

import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { ChartCard } from "@/components/dashboard/shared/chart-card";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { costPerTonneReduced, netAnnualSaving, simplePaybackPeriod, lifetimeEmissionReduction } from "@/lib/calculations/engine";
import { CHART, CHART_GRID } from "@/lib/chart-theme";
import { formatCurrency } from "@/lib/utils";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip } from "recharts";
import { Target, TrendingDown } from "lucide-react";

export default function ReductionPlannerPage() {
  const { reductionInitiatives } = useDashboard();

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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reduction planner"
        description="Prioritize decarbonization initiatives by emission impact, cost, and implementation difficulty."
      />

      <ChartCard title="Prioritisation matrix" tip="Bubble size = annual reduction potential. X-axis = implementation difficulty." icon={Target}>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart>
            <CartesianGrid {...CHART_GRID} />
            <XAxis dataKey="difficulty" name="Difficulty" domain={[0, 4]} tickFormatter={(v) => ["", "Low", "Med", "High"][v] ?? ""} tick={{ fontSize: 11, fill: CHART.tick }} />
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
          return (
            <div key={i.id} className="dash-card overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(15,23,42,0.07)]">
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-dark">
                      <TrendingDown className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{i.name}</p>
                        <Badge variant={i.status === "completed" ? "success" : i.status === "in_progress" ? "warning" : "secondary"} className="text-[10px] capitalize">
                          {i.status.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">{i.difficulty} difficulty</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{i.category} · {i.source}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold tabular-nums text-brand-dark">{i.annualEmissionReductionTCO2e.toLocaleString()} tCO₂e/yr</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(i.netSaving)} net saving/yr</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground">Implementation progress</span>
                    <span className="font-medium">{progressPct}%</span>
                  </div>
                  <Progress value={progressPct} className="h-1.5" />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <Stat label="Implementation" value={formatCurrency(i.implementationCost)} />
                  <Stat label="Cost/t reduced" value={formatCurrency(i.costPerTonne)} />
                  <Stat label="Payback" value={i.payback === Infinity ? "—" : `${i.payback.toFixed(1)} yrs`} />
                  <Stat label="Lifetime reduction" value={`${i.lifetimeReduction.toLocaleString()} t`} />
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
      <p className="mt-0.5 font-semibold tabular-nums">{value}</p>
    </div>
  );
}

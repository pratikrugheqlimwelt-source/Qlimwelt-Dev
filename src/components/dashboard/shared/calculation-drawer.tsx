"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { Badge } from "@/components/ui/badge";
import { ScopeBadge } from "@/components/dashboard/shared/scope-badge";
import { Calculator, FileCheck2 } from "lucide-react";
import { MetricFigure } from "@/components/ui/metric-figure";

export function CalculationDrawer() {
  const { calculationDetail, closeCalculation } = useDashboard();
  if (!calculationDetail) return null;
  const { activity, formula, resultTCO2e } = calculationDetail;

  return (
    <Sheet open={!!calculationDetail} onOpenChange={(o) => !o && closeCalculation()}>
      <SheetContent className="w-full overflow-y-auto border-l border-border/60 bg-white sm:max-w-lg">
        <SheetHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand-dark">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-left">Calculation breakdown</SheetTitle>
              <p className="text-xs text-muted-foreground">{activity.source}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-5 text-sm">
          <div className="flex flex-wrap gap-2">
            <ScopeBadge scope={activity.scope} />
            <Badge variant="secondary">{activity.category}</Badge>
            <Badge variant="outline">{activity.period}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Method" value={activity.method.replace(/_/g, " ")} />
            <Field label="GHG" value={activity.ghg} />
            <Field label="Activity" value={`${activity.activityValue} ${activity.activityUnit}`} />
            <Field label="GWP" value={String(activity.gwp)} />
          </div>

          <div className="rounded-xl border border-border/60 bg-slate-50 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <FileCheck2 className="h-3.5 w-3.5" />
              Formula
            </p>
            <p className="font-mono text-xs text-muted-foreground">emissions = activity × factor × conversion</p>
            <p className="mt-2 font-mono text-xs leading-relaxed">{formula}</p>
            <div className="mt-4 border-t border-border/40 pt-4">
              <MetricFigure size="lg" value={resultTCO2e.toFixed(4)} unit="tCO₂e" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Emission factor" value={`${activity.emissionFactorValue}`} sub={activity.emissionFactorSource} />
            <Field label="Uncertainty" value={`±${activity.uncertaintyPct}%`} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={activity.isEstimated ? "warning" : "success"}>{activity.isEstimated ? "Estimated" : "Calculated"}</Badge>
            <Badge variant="secondary">DQ: {activity.dataQualityScore}%</Badge>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium capitalize">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

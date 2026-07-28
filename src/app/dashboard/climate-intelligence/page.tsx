"use client";

import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Brain, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES = {
  high: "dash-insight-card-high",
  medium: "dash-insight-card-medium",
  low: "dash-insight-card-low",
} as const;

export default function ClimateIntelligencePage() {
  const { climateInsights } = useDashboard();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Climate Intelligence"
        description="AI-powered insights from your emissions data — prioritized by impact and confidence."
      />

      <div className="dash-card flex items-start gap-4 border-brand/20 bg-gradient-to-r from-brand/5 to-transparent p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand-dark">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">Qlimwelt AI Carbon Analyst</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Rule-based insights generated from your demonstration dataset. In production, these would be powered by autonomous AI agents monitoring your data 24/7.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {climateInsights.map((ins) => (
          <div
            key={ins.id}
            className={cn("dash-insight-card p-5", PRIORITY_STYLES[ins.priority as keyof typeof PRIORITY_STYLES] ?? PRIORITY_STYLES.medium)}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight">{ins.title}</h3>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <Badge variant={ins.priority === "high" ? "destructive" : "warning"} className="text-[10px] uppercase">
                      {ins.priority} priority
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">{ins.confidence}% confidence</Badge>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-8 shrink-0 text-xs">
                Act on this <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <InsightBlock label="What happened" content={ins.what} />
              <InsightBlock label="Why it matters" content={ins.why} />
              <InsightBlock label="Recommended action" content={ins.action} highlight />
            </div>

            <div className="mt-4 flex flex-wrap gap-6 border-t border-border/40 pt-4 text-xs">
              <div>
                <span className="text-muted-foreground">Emission impact </span>
                <span className="font-semibold tabular-nums">{ins.emissionImpactTCO2e > 0 ? `${ins.emissionImpactTCO2e} tCO₂e` : "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Financial impact </span>
                <span className="font-semibold tabular-nums">{ins.financialImpactEUR > 0 ? formatCurrency(ins.financialImpactEUR) : "—"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightBlock({ label, content, highlight }: { label: string; content: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1.5 text-sm leading-relaxed", highlight && "font-medium text-brand-dark")}>{content}</p>
    </div>
  );
}

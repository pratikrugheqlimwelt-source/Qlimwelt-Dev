"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { useT } from "@/components/i18n/locale-provider";
import { QlimAiChat } from "@/components/qlim-ai/qlim-ai-chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { MetricFigure } from "@/components/ui/metric-figure";
import { ArrowRight, Leaf, Zap, Factory, TrendingDown } from "lucide-react";
import type { ClimateInsight } from "@/types/carbon";

const WELCOME = {
  role: "assistant" as const,
  content: `★ Brief take
Hi — I'm Qlim AI, your carbon consultant on Qlimwelt. Ask me anything about your footprint, scopes, hotspots, or CSRD next steps.

★ What this means for you
I'll use your live inventory when you're signed in, and rate priorities with ★★★★★ → ★☆☆☆☆ so you can see what matters most.

★ Consultant recommendation
Start with a simple question like "What's our biggest scope?" or "Where should we cut first?"

★ Next step in Qlimwelt
Type below — I'll answer in plain language and point you to the right page.`,
};

export default function ClimateIntelligencePage() {
  const { climateInsights, actOnInsight, saving, activities, metrics } = useDashboard();
  const router = useRouter();
  const t = useT();
  const hasInventory = activities.length > 0;
  const isEmptyInsight = climateInsights.length === 1 && climateInsights[0]?.id === "ins-empty";

  const scopeShare = useMemo(() => {
    const total = metrics.totalTCO2e || 0;
    const pct = (v: number) => (total > 0 ? (v / total) * 100 : 0);
    return {
      s1: pct(metrics.scope1),
      s2: pct(metrics.scope2),
      s3: pct(metrics.scope3),
    };
  }, [metrics]);

  const handleAct = async (ins: ClimateInsight) => {
    const href = await actOnInsight(ins);
    router.push(href);
  };

  const recommendations =
    !hasInventory || isEmptyInsight ? [] : climateInsights.slice(0, 4);

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-8.75rem)] lg:min-h-[560px]">
      <PageHeader
        title={t("pages.climate.title")}
        description={t("pages.climate.description")}
        tip="Chat uses your inventory. Analysis and recommendations update from the same activity data."
        className="shrink-0"
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.85fr)]">
        {/* Chat */}
        <QlimAiChat
          messages={[WELCOME]}
          animateLast={false}
          interactive
          fill
          className="h-[min(70vh,560px)] w-full min-w-0 lg:h-full"
        />

        {/* Analysis + recommendations */}
        <aside className="flex min-h-0 min-w-0 flex-col gap-4 lg:h-full lg:overflow-hidden">
          <section className="shrink-0 rounded-2xl border border-border bg-background p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-tight">AI analysis</h2>
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {hasInventory ? `${activities.length} activities` : "No inventory"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <StatTile
                icon={Leaf}
                label="Total"
                value={`${formatNumber(metrics.totalTCO2e, 1)}`}
                unit="tCO₂e"
                accent
              />
              <StatTile
                icon={TrendingDown}
                label="Reduction opp."
                value={`${formatNumber(metrics.reductionOpportunity, 1)}`}
                unit="tCO₂e"
              />
              <StatTile
                icon={Factory}
                label="Scope 1"
                value={`${formatNumber(metrics.scope1, 1)}`}
                unit="tCO₂e"
                hint={`${scopeShare.s1.toFixed(0)}%`}
              />
              <StatTile
                icon={Zap}
                label="Scope 2"
                value={`${formatNumber(metrics.scope2, 1)}`}
                unit="tCO₂e"
                hint={`${scopeShare.s2.toFixed(0)}%`}
              />
            </div>

            <div className="mt-3 rounded-xl border border-border bg-muted/30 px-3.5 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs text-muted-foreground">Scope 3</p>
                <p className="dash-num text-sm">
                  <MetricFigure size="sm" className="!inline-flex">
                    {`${formatNumber(metrics.scope3, 1)} tCO₂e`}
                  </MetricFigure>
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}· {scopeShare.s3.toFixed(0)}%
                  </span>
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="flex h-full w-full min-w-0">
                  <div
                    className="min-w-0 bg-brand-dark/80"
                    style={{ width: `${scopeShare.s1}%` }}
                    title="Scope 1"
                  />
                  <div
                    className="min-w-0 bg-brand"
                    style={{ width: `${scopeShare.s2}%` }}
                    title="Scope 2"
                  />
                  <div
                    className="min-w-0 bg-brand/40"
                    style={{ width: `${scopeShare.s3}%` }}
                    title="Scope 3"
                  />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-dark/80" /> S1
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" /> S2
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand/40" /> S3
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-border px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground">Carbon cost</p>
                <p className="dash-num mt-0.5 truncate text-sm">
                  {formatCurrency(metrics.carbonCostExposure)}
                </p>
              </div>
              <div className="rounded-lg border border-border px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground">Verified</p>
                <p className="dash-num mt-0.5 text-sm">
                  {metrics.verifiedPct.toFixed(0)}%
                </p>
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-background p-4 sm:p-5">
            <h2 className="mb-3 shrink-0 text-base font-semibold tracking-tight">Recommendations</h2>
            {recommendations.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Add activities in Data Collection to generate recommendations.
              </p>
            ) : (
              <ul className="min-h-0 space-y-2.5 overflow-y-auto">
                {recommendations.map((ins) => (
                  <li
                    key={ins.id}
                    className="rounded-xl border border-border/80 bg-muted/20 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">{ins.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {ins.action}
                        </p>
                      </div>
                      <Badge
                        variant={ins.priority === "high" ? "destructive" : "warning"}
                        className="shrink-0 text-[9px] uppercase"
                      >
                        {ins.priority}
                      </Badge>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/50 pt-2">
                      <span className="dash-num truncate text-[10px] text-muted-foreground">
                        {ins.emissionImpactTCO2e > 0
                          ? `${ins.emissionImpactTCO2e} tCO₂e`
                          : "—"}
                        {ins.financialImpactEUR > 0
                          ? ` · ${formatCurrency(ins.financialImpactEUR)}`
                          : ""}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 shrink-0 px-2 text-xs"
                        disabled={saving}
                        onClick={() => void handleAct(ins)}
                      >
                        Act <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  unit,
  hint,
  accent,
}: {
  icon: typeof Leaf;
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-border px-3 py-2.5",
        accent && "border-brand/25 bg-brand-light/50"
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        <p className="truncate text-[10px] font-medium uppercase tracking-wider">{label}</p>
      </div>
      <MetricFigure size="sm" className="mt-1.5 truncate">
        {unit ? `${value} ${unit}` : value}
      </MetricFigure>
      {hint && <p className="mt-0.5 text-[10px] text-muted-foreground">{hint} of total</p>}
    </div>
  );
}

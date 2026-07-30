"use client";

import Link from "next/link";
import { FilterBar } from "@/components/dashboard/shared/filter-bar";
import { MetricCard } from "@/components/dashboard/shared/metric-card";
import { OverviewCharts } from "@/components/dashboard/overview/overview-charts";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { ScopeDonut, ScopeLegend } from "@/components/dashboard/charts/scope-donut";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { useT } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { HelpCorner } from "@/components/ui/tooltip";
import { formatCO2, formatCurrency } from "@/lib/utils";
import { MetricFigure } from "@/components/ui/metric-figure";
import {
  Activity, Cloud, Target, TrendingUp, ShieldCheck, Zap, DollarSign, BarChart3, Users, Factory,
  Leaf, CheckCircle2, AlertCircle, Database,
} from "lucide-react";

function KpiSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <SectionHeader title={title} description={description} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}

export function OverviewPage() {
  const {
    metrics,
    company,
    monthlyTrend,
    facilities,
    filters,
    climateInsights,
    isEmpty,
    reductionInitiatives,
  } = useDashboard();
  const t = useT();

  const totalSpark = monthlyTrend.map((m) => m.total);
  const s1Spark = monthlyTrend.map((m) => m.scope1);
  const s2Spark = monthlyTrend.map((m) => m.scope2);
  const s3Spark = monthlyTrend.map((m) => m.scope3);
  const total = metrics.scope1 + metrics.scope2 + metrics.scope3;
  const highRisks = climateInsights.filter((i) => i.priority === "high").length;
  const periodLabel =
    filters.period === "all"
      ? `FY ${company.reportingYear}`
      : filters.period;

  const pct = (n: number) => (total ? ((n / total) * 100).toFixed(0) : "0");

  return (
    <div className="space-y-4">
      <WelcomeCard />

      {isEmpty && (
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-brand/40 bg-brand/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand-dark">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("overview.emptyTitle")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("overview.emptyBody")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link href="/dashboard/data-collection">{t("overview.goDataCollection")}</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="dash-hero-banner relative p-5 lg:p-6">
        <HelpCorner
          content={t("pages.overview.description")}
          className="right-3 top-3 [&_button]:border-white/20 [&_button]:bg-white/10 [&_button]:text-white/80 [&_button:hover]:bg-white/20 [&_button:hover]:text-white"
        />
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA0KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#82D153]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-teal-500/15 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="dash-pill-green"><Leaf className="h-3 w-3" />{t("overview.carbonIntelligence")}</span>
              <span className="dash-pill bg-white/10 text-white/80 ring-white/20"><CheckCircle2 className="h-3 w-3" />{t("overview.csrdReady")}</span>
              {highRisks > 0 && (
                <span className="dash-pill bg-amber-500/20 text-amber-200 ring-amber-400/30">
                  <AlertCircle className="h-3 w-3" />
                  {highRisks === 1
                    ? t("overview.riskFlagged", { count: highRisks })
                    : t("overview.risksFlagged", { count: highRisks })}
                </span>
              )}
            </div>
            <MetricFigure size="xl" className="mt-4 text-white" unitClassName="opacity-60">
              {formatCO2(metrics.totalTCO2e)}
            </MetricFigure>
            <p className="mt-1 text-base text-white/60">
              {t("overview.totalEmissionsLine", { period: periodLabel })}
            </p>
            <p className="mt-3 text-sm text-white/50">
              {company.name} ·{" "}
              {t("overview.companyMeta", {
                employees: company.employeeCount.toLocaleString(),
                revenue: (company.revenueEUR / 1_000_000).toFixed(0),
                facilities: facilities.length,
              })}
            </p>
          </div>

          <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
            <ScopeDonut
              scope1={metrics.scope1}
              scope2={metrics.scope2}
              scope3={metrics.scope3}
              className="h-24 w-24 sm:h-[7.25rem] sm:w-[7.25rem] lg:h-[8.125rem] lg:w-[8.125rem]"
            />
            <div className="w-full min-w-[180px] text-white">
              <ScopeLegend scope1={metrics.scope1} scope2={metrics.scope2} scope3={metrics.scope3} total={total} />
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t("overview.targetProgress"), value: `${metrics.targetProgress.toFixed(0)}%`, sub: t("overview.sbt2030") },
            { label: t("overview.verifiedData"), value: `${metrics.verifiedPct.toFixed(0)}%`, sub: t("overview.auditReady") },
            { label: t("overview.carbonExposure"), value: formatCurrency(metrics.carbonCostExposure), sub: `@€${company.carbonPricePerTonne}/t` },
            { label: t("overview.periodChange"), value: `${metrics.changePct >= 0 ? "+" : ""}${metrics.changePct.toFixed(1)}%`, sub: t("overview.vsPriorPeriod") },
          ].map((stat) => (
            <div key={stat.label} className="dash-hero-stat">
              <MetricFigure size="md" className="text-white" unitClassName="opacity-55">
                {stat.value}
              </MetricFigure>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">{stat.label}</p>
              <p className="text-[10px] text-white/35">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard size="hero" accent="brand" icon={Activity} label={t("overview.totalEmissions")} value={formatCO2(metrics.totalTCO2e)} tooltip={t("overview.tipTotal")} trend={metrics.changePct} sparkline={totalSpark} />
        <MetricCard size="hero" accent="scope1" icon={Factory} label={t("overview.scope1")} value={formatCO2(metrics.scope1)} tooltip={t("overview.tipScope1")} sub={t("overview.ofTotal", { pct: pct(metrics.scope1) })} sparkline={s1Spark} />
        <MetricCard size="hero" accent="scope2" icon={Zap} label={t("overview.scope2")} value={formatCO2(metrics.scope2)} tooltip={t("overview.tipScope2")} sub={t("overview.ofTotal", { pct: pct(metrics.scope2) })} sparkline={s2Spark} />
        <MetricCard size="hero" accent="scope3" icon={Cloud} label={t("overview.scope3")} value={formatCO2(metrics.scope3)} tooltip={t("overview.tipScope3")} sub={t("overview.ofTotal", { pct: pct(metrics.scope3) })} sparkline={s3Spark} />
      </div>

      <FilterBar />

      <KpiSection title={t("overview.intensityTitle")} description={t("overview.intensityDesc")}>
        <MetricCard accent="indigo" icon={TrendingUp} label={t("overview.periodChange")} value={`${metrics.changePct >= 0 ? "+" : ""}${metrics.changePct.toFixed(1)}%`} tooltip={t("overview.vsPriorPeriod")} trend={metrics.changePct} sparkline={totalSpark} />
        <MetricCard accent="teal" icon={Users} label={t("overview.perEmployee")} value={`${metrics.perEmployee.toFixed(2)} t`} tooltip={t("overview.perEmployee")} sub={t("overview.employeesCount", { count: company.employeeCount })} />
        <MetricCard accent="indigo" icon={BarChart3} label={t("overview.perRevenue")} value={`${metrics.perRevenue.toFixed(3)} t/€M`} tooltip={t("overview.perRevenue")} />
        <MetricCard accent="success" icon={Target} label={t("overview.targetProgress")} value={`${metrics.targetProgress.toFixed(0)}%`} tooltip={t("overview.sbt2030")} progress={metrics.targetProgress} />
      </KpiSection>

      <KpiSection title={t("overview.qualityTitle")} description={t("overview.qualityDesc")}>
        <MetricCard accent="success" icon={ShieldCheck} label={t("overview.verifiedData")} value={`${metrics.verifiedPct.toFixed(0)}%`} tooltip={t("overview.auditReady")} progress={metrics.verifiedPct} />
        <MetricCard accent="warning" label={t("overview.estimatedData")} value={`${metrics.estimatedPct.toFixed(0)}%`} tooltip={t("overview.estimatedData")} progress={metrics.estimatedPct} />
        <MetricCard accent="brand" label={t("overview.reductionOpp")} value={formatCO2(metrics.reductionOpportunity)} tooltip={t("overview.reductionOpp")} sub={t("overview.fromInitiatives", { count: reductionInitiatives.length })} />
        <MetricCard accent="indigo" icon={DollarSign} label={t("overview.carbonCost")} value={formatCurrency(metrics.carbonCostExposure)} tooltip={`€${company.carbonPricePerTonne}/t`} sub={t("overview.savings", { amount: formatCurrency(metrics.financialSavings) })} />
      </KpiSection>

      <OverviewCharts />
    </div>
  );
}

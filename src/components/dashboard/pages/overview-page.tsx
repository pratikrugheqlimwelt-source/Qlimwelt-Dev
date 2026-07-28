"use client";

import { FilterBar } from "@/components/dashboard/shared/filter-bar";
import { MetricCard } from "@/components/dashboard/shared/metric-card";
import { OverviewCharts } from "@/components/dashboard/overview/overview-charts";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { ScopeDonut, ScopeLegend } from "@/components/dashboard/charts/scope-donut";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { formatCO2, formatCurrency } from "@/lib/utils";
import {
  Activity, Cloud, Target, TrendingUp, ShieldCheck, Zap, DollarSign, BarChart3, Users, Factory,
  Leaf, CheckCircle2, AlertCircle,
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
  const { metrics, company, monthlyTrend, facilities } = useDashboard();

  const totalSpark = monthlyTrend.map((m) => m.total);
  const s1Spark = monthlyTrend.map((m) => m.scope1);
  const s2Spark = monthlyTrend.map((m) => m.scope2);
  const s3Spark = monthlyTrend.map((m) => m.scope3);
  const total = metrics.scope1 + metrics.scope2 + metrics.scope3;

  return (
    <div className="space-y-4">
      <WelcomeCard />
      {/* Executive hero banner */}
      <div className="dash-hero-banner p-5 lg:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA0KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#82D153]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-teal-500/15 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="dash-pill-green"><Leaf className="h-3 w-3" />Carbon Intelligence</span>
              <span className="dash-pill bg-white/10 text-white/80 ring-white/20"><CheckCircle2 className="h-3 w-3" />CSRD-ready</span>
              <span className="dash-pill bg-amber-500/20 text-amber-200 ring-amber-400/30"><AlertCircle className="h-3 w-3" />2 risks flagged</span>
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white lg:text-4xl">
              {formatCO2(metrics.totalTCO2e)}
            </h2>
            <p className="mt-1 text-base text-white/60">Total emissions · FY 2024 · All scopes</p>
            <p className="mt-3 text-sm text-white/50">
              {company.name} · {company.employeeCount.toLocaleString()} employees · €{(company.revenueEUR / 1_000_000).toFixed(0)}M revenue · {facilities.length} facilities
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
            { label: "Target progress", value: `${metrics.targetProgress.toFixed(0)}%`, sub: "2030 SBT" },
            { label: "Verified data", value: `${metrics.verifiedPct.toFixed(0)}%`, sub: "Audit ready" },
            { label: "Carbon exposure", value: formatCurrency(metrics.carbonCostExposure), sub: `@€${company.carbonPricePerTonne}/t` },
            { label: "Period change", value: `${metrics.changePct >= 0 ? "+" : ""}${metrics.changePct.toFixed(1)}%`, sub: "vs prior period" },
          ].map((stat) => (
            <div key={stat.label} className="dash-hero-stat">
              <p className="text-xl font-bold tabular-nums text-white">{stat.value}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">{stat.label}</p>
              <p className="text-[10px] text-white/35">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hero KPIs with sparklines */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard size="hero" accent="brand" icon={Activity} label="Total emissions" value={formatCO2(metrics.totalTCO2e)} tooltip="Sum of Scope 1, 2, and 3." trend={metrics.changePct} sparkline={totalSpark} />
        <MetricCard size="hero" accent="scope1" icon={Factory} label="Scope 1" value={formatCO2(metrics.scope1)} tooltip="Direct emissions." sub={`${total ? ((metrics.scope1 / total) * 100).toFixed(0) : 0}% of total`} sparkline={s1Spark} />
        <MetricCard size="hero" accent="scope2" icon={Zap} label="Scope 2" value={formatCO2(metrics.scope2)} tooltip="Purchased energy." sub={`${total ? ((metrics.scope2 / total) * 100).toFixed(0) : 0}% of total`} sparkline={s2Spark} />
        <MetricCard size="hero" accent="scope3" icon={Cloud} label="Scope 3" value={formatCO2(metrics.scope3)} tooltip="Value chain emissions." sub={`${total ? ((metrics.scope3 / total) * 100).toFixed(0) : 0}% of total`} sparkline={s3Spark} />
      </div>

      <FilterBar />

      <KpiSection title="Intensity & performance" description="Normalized metrics for benchmarking and disclosure">
        <MetricCard accent="indigo" icon={TrendingUp} label="Period change" value={`${metrics.changePct >= 0 ? "+" : ""}${metrics.changePct.toFixed(1)}%`} tooltip="Percentage change vs previous period." trend={metrics.changePct} sparkline={totalSpark} />
        <MetricCard accent="teal" icon={Users} label="Per employee" value={`${metrics.perEmployee.toFixed(2)} t`} tooltip="Emissions per employee." sub={`${company.employeeCount} employees`} />
        <MetricCard accent="indigo" icon={BarChart3} label="Per revenue" value={`${metrics.perRevenue.toFixed(3)} t/€M`} tooltip="Emissions intensity per €M revenue." />
        <MetricCard accent="success" icon={Target} label="Target progress" value={`${metrics.targetProgress.toFixed(0)}%`} tooltip="Progress toward 2030 SBT." progress={metrics.targetProgress} />
      </KpiSection>

      <KpiSection title="Data quality & financial" description="Audit readiness and carbon cost exposure">
        <MetricCard accent="success" icon={ShieldCheck} label="Verified data" value={`${metrics.verifiedPct.toFixed(0)}%`} tooltip="Records with verified evidence." progress={metrics.verifiedPct} />
        <MetricCard accent="warning" label="Estimated data" value={`${metrics.estimatedPct.toFixed(0)}%`} tooltip="Records using estimates." progress={metrics.estimatedPct} />
        <MetricCard accent="brand" label="Reduction opportunity" value={formatCO2(metrics.reductionOpportunity)} tooltip="Planned initiative reductions." sub="From 5 active initiatives" />
        <MetricCard accent="indigo" icon={DollarSign} label="Carbon cost exposure" value={formatCurrency(metrics.carbonCostExposure)} tooltip={`At €${company.carbonPricePerTonne}/t carbon price.`} sub={`Savings: ${formatCurrency(metrics.financialSavings)}`} />
      </KpiSection>

      <OverviewCharts />
    </div>
  );
}

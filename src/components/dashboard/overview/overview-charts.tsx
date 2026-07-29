"use client";

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  Treemap, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Scatter, ScatterChart, ZAxis, ReferenceLine,
} from "recharts";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { activityToCalculation } from "@/lib/calculations/engine";
import { ChartCard } from "@/components/dashboard/shared/chart-card";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/dashboard/shared/data-table";
import { CHART, CHART_AXIS, CHART_GRID, GRADIENT_IDS, qualityColor, BAR_PALETTE } from "@/lib/chart-theme";
import { ChartGradients } from "@/components/dashboard/charts/chart-gradients";
import { ChartTooltip, ChartLegendInline } from "@/components/dashboard/charts/chart-tooltip";
import { TrendTooltip } from "@/components/dashboard/charts/trend-tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fragment, useMemo, useState } from "react";
import { TrendingUp, PieChart as PieIcon, Brain, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { MetricFigure } from "@/components/ui/metric-figure";

export function OverviewCharts() {
  const { filteredActivities, monthlyTrend, metrics, facilities, openCalculation, company } = useDashboard();
  const [trendMode, setTrendMode] = useState<"current" | "previous" | "baseline" | "target">("current");

  const treemapData = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of filteredActivities) {
      const key = `${a.scope} / ${a.category}`;
      map.set(key, (map.get(key) ?? 0) + activityToCalculation(a).emissionsTCO2e);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, size: value }));
  }, [filteredActivities]);

  const byFacility = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of filteredActivities) {
      const fac = facilities.find((f) => f.id === a.facilityId)?.name ?? a.facilityId;
      map.set(fac, (map.get(fac) ?? 0) + activityToCalculation(a).emissionsTCO2e);
    }
    return Array.from(map.entries()).map(([name, emissions]) => ({ name, emissions }));
  }, [filteredActivities, facilities]);

  const byCountry = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of filteredActivities) {
      map.set(a.country, (map.get(a.country) ?? 0) + activityToCalculation(a).emissionsTCO2e);
    }
    return Array.from(map.entries()).map(([name, emissions]) => ({ name, emissions }));
  }, [filteredActivities]);

  const waterfall = useMemo(() => [
    { name: "Prior period", value: metrics.totalTCO2e * 1.08, fill: "#94a3b8" },
    { name: "Scope 1 Δ", value: metrics.scope1 * 0.05, fill: "#1e293b" },
    { name: "Scope 2 Δ", value: -metrics.scope2 * 0.12, fill: "#82D153" },
    { name: "Scope 3 Δ", value: metrics.scope3 * 0.03, fill: "#5cb832" },
    { name: "Current", value: metrics.totalTCO2e, fill: "#2563eb" },
  ], [metrics]);

  const macCurve = useMemo(() => [
    { name: "LED retrofit", reduction: 85, cost: -22000, size: 85 },
    { name: "Renewable PPA", reduction: 2964, cost: 45000, size: 2964 },
    { name: "Fleet EV", reduction: 420, cost: 62000, size: 420 },
    { name: "Solar install", reduction: 520, cost: 78000, size: 520 },
    { name: "Supplier prog.", reduction: 890, cost: 95000, size: 890 },
  ], []);

  const qualityHeatmap = useMemo(() => {
    const cats = [...new Set(filteredActivities.map((a) => a.category))].slice(0, 6);
    const months = ["01","02","03","04","05","06","07","08","09","10","11","12"];
    return cats.flatMap((cat) =>
      months.map((m) => {
        const acts = filteredActivities.filter((a) => a.category === cat && a.period.endsWith(m));
        const avg = acts.length ? acts.reduce((s, a) => s + a.dataQualityScore, 0) / acts.length : 0;
        return { category: cat.slice(0, 12), month: m, score: Math.round(avg) };
      })
    );
  }, [filteredActivities]);

  const factorCoverage = useMemo(() => {
    const methods = ["supplier_specific", "activity_specific", "location_based", "spend_based", "estimated"] as const;
    return methods.map((m) => ({
      method: m.replace(/_/g, " "),
      count: filteredActivities.filter((a) => a.method === m || (m === "estimated" && a.isEstimated)).length,
    }));
  }, [filteredActivities]);

  const scope3Matrix = useMemo(() => [
    { category: "Cat.1 Goods", volume: 8500, quality: 52, influence: 88, opportunity: 72 },
    { category: "Cat.4 Transport", volume: 2100, quality: 68, influence: 70, opportunity: 74 },
    { category: "Cat.6 Travel", volume: 890, quality: 65, influence: 45, opportunity: 55 },
    { category: "Cat.7 Commute", volume: 620, quality: 58, influence: 40, opportunity: 60 },
  ], []);

  const intensityDomain = useMemo(() => {
    const values = monthlyTrend.map((m) => m.intensity).filter((v) => Number.isFinite(v) && v > 0);
    if (!values.length) return [0, 1] as [number, number];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max((max - min) * 0.2, max * 0.08, 0.05);
    return [Math.max(0, min - pad), max + pad] as [number, number];
  }, [monthlyTrend]);

  const scenarios = [
    { name: "BAU", y2024: metrics.totalTCO2e * 12, y2027: metrics.totalTCO2e * 12 * 1.08, y2030: metrics.totalTCO2e * 12 * 1.15 },
    { name: "Moderate", y2024: metrics.totalTCO2e * 12, y2027: metrics.totalTCO2e * 12 * 0.92, y2030: metrics.totalTCO2e * 12 * 0.78 },
    { name: "Ambitious", y2024: metrics.totalTCO2e * 12, y2027: metrics.totalTCO2e * 12 * 0.85, y2030: metrics.totalTCO2e * 12 * 0.58 },
  ];

  const trendStats = useMemo(() => {
    const totals = monthlyTrend.map((m) => m.total);
    const avg = totals.reduce((s, v) => s + v, 0) / (totals.length || 1);
    const peak = monthlyTrend.reduce((best, m) => (m.total > best.total ? m : best), monthlyTrend[0]);
    const low = monthlyTrend.reduce((best, m) => (m.total < best.total ? m : best), monthlyTrend[0]);
    const ytdTotal = totals.reduce((s, v) => s + v, 0);
    const ytdPrev = monthlyTrend.reduce((s, m) => s + m.previousYear, 0);
    const ytdYoy = ytdPrev > 0 ? ((ytdTotal - ytdPrev) / ytdPrev) * 100 : 0;
    const variance = Math.max(...totals) - Math.min(...totals);
    return { avg, peak, low, ytdTotal, ytdYoy, variance };
  }, [monthlyTrend]);

  const trendOverlays = useMemo(() => {
    if (trendMode === "current") {
      return [
        { label: "Prior year", color: CHART.baseline, key: "previousYear" as const, dashed: true },
        { label: "3-mo rolling avg", color: CHART.actual, key: "rollingAvg" as const, dashed: false },
      ];
    }
    if (trendMode === "previous") return [{ label: "Prior year", color: CHART.baseline, key: "previousYear" as const, dashed: true }];
    if (trendMode === "baseline") return [{ label: "Baseline", color: "#94a3b8", key: "baseline" as const, dashed: true }];
    return [{ label: "Target pathway", color: CHART.target, key: "target" as const, dashed: true }];
  }, [trendMode]);

  return (
    <div className="space-y-4">
      <SectionHeader title="Analytics" description="Interactive charts — click activity rows to inspect calculations" />
      <Tabs defaultValue="trends" className="space-y-4">
      <TabsList className="dash-tab-list h-auto w-full justify-start">
        <TabsTrigger value="trends" className="dash-tab-trigger">Trends</TabsTrigger>
        <TabsTrigger value="breakdown" className="dash-tab-trigger">Breakdown</TabsTrigger>
        <TabsTrigger value="analysis" className="dash-tab-trigger">Analysis</TabsTrigger>
        <TabsTrigger value="data" className="dash-tab-trigger">Data quality</TabsTrigger>
      </TabsList>

      <TabsContent value="trends" className="mt-0 space-y-4">
        <ChartCard title="Emission trend" tip="Monthly emissions with seasonal variation, MoM/YoY context, and comparison overlays." icon={TrendingUp} accent="brand">
          {/* Summary stats */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {[
              { label: "YTD total", value: `${trendStats.ytdTotal.toFixed(0)} t`, sub: "All scopes" },
              { label: "Monthly avg", value: `${trendStats.avg.toFixed(1)} t`, sub: "12-mo mean" },
              { label: "Peak month", value: trendStats.peak?.monthLabel ?? "—", sub: `${trendStats.peak?.total.toFixed(1)} t` },
              { label: "Low month", value: trendStats.low?.monthLabel ?? "—", sub: `${trendStats.low?.total.toFixed(1)} t` },
              { label: "Seasonal range", value: `±${(trendStats.variance / 2).toFixed(1)} t`, sub: "Peak vs trough" },
              {
                label: "YTD vs prior yr",
                value: `${trendStats.ytdYoy >= 0 ? "+" : ""}${trendStats.ytdYoy.toFixed(1)}%`,
                sub: trendStats.ytdYoy <= 0 ? "On track" : "Above baseline",
                positive: trendStats.ytdYoy <= 0,
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-white px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className={cn(
                  "mt-0.5",
                  "positive" in stat ? (stat.positive ? "text-green-600" : "text-red-600") : "text-foreground"
                )}>
                  <MetricFigure size="md" className={cn("positive" in stat ? (stat.positive ? "text-green-600" : "text-red-600") : "text-foreground")}>
                    {String(stat.value)}
                  </MetricFigure>
                </p>
                <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </div>

          <ChartLegendInline className="mb-3" items={[
            { label: "Scope 1", color: CHART.scope1 },
            { label: "Scope 2", color: CHART.scope2 },
            { label: "Scope 3", color: CHART.scope3 },
            ...trendOverlays.map((o) => ({ label: o.label, color: o.color, dashed: o.dashed })),
          ]} />
          <div className="mb-4 flex flex-wrap gap-2">
            {(["current", "previous", "baseline", "target"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setTrendMode(m)} className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all",
                trendMode === m
                  ? "bg-gradient-to-r from-[#82D153] to-emerald-500 text-white shadow-md shadow-green-500/25"
                  : "border border-border/60 bg-white text-muted-foreground hover:bg-muted/50"
              )}>
                {m === "current" ? "Current year" : m === "previous" ? "Previous year" : m === "baseline" ? "Baseline" : "Target pathway"}
              </button>
            ))}
          </div>
          <div className="min-h-[320px] w-full">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={monthlyTrend} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
              <ChartGradients />
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="monthLabel" {...CHART_AXIS} />
              <YAxis {...CHART_AXIS} width={36} tickFormatter={(v) => v.toFixed(0)} />
              <Tooltip
                cursor={{ stroke: CHART.grid, strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = monthlyTrend.find((m) => m.monthLabel === label);
                  return (
                    <TrendTooltip
                      active={active}
                      payload={payload.filter((p) => !["previousYear", "baseline", "target", "rollingAvg", "total"].includes(String(p.dataKey))).map((p) => ({
                        name: String(p.name ?? p.dataKey),
                        value: p.value as number,
                        color: p.color,
                        dataKey: String(p.dataKey),
                      }))}
                      label={label}
                      row={row}
                    />
                  );
                }}
              />
              <Area type="monotone" dataKey="scope1" stackId="1" fill={`url(#${GRADIENT_IDS.scope1})`} stroke={CHART.scope1} strokeWidth={1.5} name="Scope 1" animationDuration={800} />
              <Area type="monotone" dataKey="scope2" stackId="1" fill={`url(#${GRADIENT_IDS.scope2})`} stroke={CHART.scope2} strokeWidth={1.5} name="Scope 2" animationDuration={900} />
              <Area type="monotone" dataKey="scope3" stackId="1" fill={`url(#${GRADIENT_IDS.scope3})`} stroke={CHART.scope3} strokeWidth={1.5} name="Scope 3" animationDuration={1000} />
              <Line
                type="monotone"
                dataKey="total"
                stroke={CHART.scope1}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART.scope1, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: CHART.brand, stroke: "#fff", strokeWidth: 2 }}
                name="Total"
              />
              {(trendMode === "current" || trendMode === "previous") && (
                <Line type="monotone" dataKey="previousYear" stroke={CHART.baseline} strokeWidth={2} strokeDasharray="6 4" dot={false} name="Prior year" />
              )}
              {trendMode === "baseline" && (
                <Line type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Baseline" />
              )}
              {trendMode === "target" && (
                <Line type="monotone" dataKey="target" stroke={CHART.target} strokeWidth={2} strokeDasharray="6 4" dot={false} name="Target pathway" />
              )}
              {trendMode === "current" && (
                <Line type="monotone" dataKey="rollingAvg" stroke={CHART.actual} strokeWidth={1.5} strokeDasharray="2 3" dot={false} name="3-mo avg" />
              )}
              <ReferenceLine y={trendStats.avg} stroke={CHART.brand} strokeDasharray="3 6" strokeOpacity={0.4} label={{ value: "Avg", position: "insideTopRight", fontSize: 10, fill: CHART.tick }} />
            </ComposedChart>
          </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Target pathway" tip="Baseline, actual, projected, and required reduction pathway to 2030 SBT." accent="blue">
          <ChartLegendInline className="mb-4" items={[
            { label: "Baseline", color: CHART.baseline },
            { label: "Actual", color: CHART.actual },
            { label: "Target", color: CHART.target },
            { label: "Projected", color: CHART.projected },
          ]} />
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyTrend.map((m, i) => ({ month: m.month, actual: m.total * 12, baseline: m.baseline * 12, target: m.target * 12, projected: m.total * 12 * (1 + i * 0.005) }))}>
              <ChartGradients />
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="month" {...CHART_AXIS} />
              <YAxis {...CHART_AXIS} />
              <Tooltip content={<ChartTooltip unit="tCO₂e/yr" />} />
              <Line dataKey="baseline" stroke={CHART.baseline} strokeDasharray="4 4" strokeWidth={2} dot={false} name="Baseline" />
              <Line dataKey="actual" stroke={CHART.actual} strokeWidth={2.5} dot={false} name="Actual" />
              <Line dataKey="target" stroke={CHART.target} strokeDasharray="4 4" strokeWidth={2} dot={false} name="Target" />
              <Line dataKey="projected" stroke={CHART.projected} strokeDasharray="2 2" strokeWidth={2} dot={false} name="Projected" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Intensity trend" tip="tCO₂e per €1M revenue over the reporting year." accent="teal">
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={monthlyTrend}>
                <ChartGradients />
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="monthLabel" {...CHART_AXIS} />
                <YAxis {...CHART_AXIS} domain={intensityDomain} tickFormatter={(v) => v.toFixed(2)} width={48} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    const row = monthlyTrend.find((m) => m.monthLabel === label);
                    return (
                      <TrendTooltip
                        active={active}
                        payload={payload?.map((p) => ({ name: "Intensity", value: p.value as number, color: CHART.teal }))}
                        label={label}
                        unit="t/€M"
                        row={row ? { monthLabel: row.monthLabel, momChange: row.momChange } : undefined}
                      />
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="intensity"
                  fill={`url(#${GRADIENT_IDS.teal})`}
                  stroke={CHART.teal}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: CHART.teal, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: CHART.teal, stroke: "#fff", strokeWidth: 2 }}
                  name="Intensity"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Waterfall — period change" tip="How activities increased or decreased emissions vs prior period." accent="purple">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={waterfall}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: CHART.tick }} />
                <YAxis {...CHART_AXIS} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {waterfall.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </TabsContent>

      <TabsContent value="breakdown" className="mt-0 space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Scope comparison" tip="Scope 1 = direct; Scope 2 = purchased energy; Scope 3 = value chain." icon={PieIcon} accent="brand">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={[{ name: "Scope 1", value: metrics.scope1 }, { name: "Scope 2", value: metrics.scope2 }, { name: "Scope 3", value: metrics.scope3 }]} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  <Cell fill={CHART.scope1} /><Cell fill={CHART.scope2} /><Cell fill={CHART.scope3} />
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Emission source breakdown" tip="Hierarchical view by scope and category." accent="teal">
            <ResponsiveContainer width="100%" height={260}>
              <Treemap data={treemapData} dataKey="size" nameKey="name" stroke="#fff" fill={CHART.scope2} />
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="By facility" tip="Emissions allocated to each facility." accent="blue">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byFacility} layout="vertical">
                <CartesianGrid {...CHART_GRID} />
                <XAxis type="number" {...CHART_AXIS} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: CHART.tick }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="emissions" fill={CHART.actual} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="By country" tip="Geographic allocation of emissions." accent="brand">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byCountry}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="name" {...CHART_AXIS} />
                <YAxis {...CHART_AXIS} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="emissions" radius={[6, 6, 0, 0]}>
                  {byCountry.map((_, i) => <Cell key={i} fill={BAR_PALETTE[i % BAR_PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </TabsContent>

      <TabsContent value="analysis" className="mt-0 space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Marginal abatement cost curve" tip="Reduction potential vs implementation cost per initiative.">
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart><CartesianGrid /><XAxis dataKey="reduction" name="tCO₂e/yr" tick={{ fontSize: 10 }} /><YAxis dataKey="cost" name="Cost €" tick={{ fontSize: 10 }} /><ZAxis dataKey="size" range={[40, 400]} /><Tooltip cursor={{ strokeDasharray: "3 3" }} /><Scatter data={macCurve} fill="#82D153" /></ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Scope 3 hotspot matrix" tip="Categories by volume, data quality, influence, and reduction opportunity.">
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart><CartesianGrid /><XAxis dataKey="quality" name="Quality" domain={[0, 100]} /><YAxis dataKey="volume" name="Volume tCO₂e" /><ZAxis dataKey="opportunity" range={[50, 400]} /><Tooltip /><Scatter data={scope3Matrix} fill="#2563eb" /></ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <ChartCard title="Scenario comparison" tip="Business as usual vs moderate and ambitious reduction scenarios." accent="purple">
          <ChartLegendInline className="mb-4" items={[
            { label: "2027 projection", color: CHART.baseline },
            { label: "2030 projection", color: CHART.scope2 },
          ]} />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={scenarios}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="name" {...CHART_AXIS} />
              <YAxis {...CHART_AXIS} />
              <Tooltip content={<ChartTooltip unit="tCO₂e/yr" />} />
              <Bar dataKey="y2027" fill={CHART.baseline} name="2027" radius={[6, 6, 0, 0]} />
              <Bar dataKey="y2030" fill={CHART.scope2} name="2030" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Climate risk panel" tip="Transition, energy, carbon price, supplier, and operational risk indicators." icon={Brain} accent="amber">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { risk: "Transition risk", level: "Medium" as const, detail: "CSRD and EU ETS expansion", color: "from-amber-50 to-orange-50 border-amber-200/60" },
              { risk: "Energy price exposure", level: "High" as const, detail: "€890k annual energy spend", color: "from-red-50 to-rose-50 border-red-200/60" },
              { risk: "Carbon price exposure", level: "Medium" as const, detail: `€${metrics.carbonCostExposure.toFixed(0)} at €${company.carbonPricePerTonne}/t`, color: "from-amber-50 to-yellow-50 border-amber-200/60" },
              { risk: "Supplier risk", level: "High" as const, detail: "2 high-risk suppliers flagged", color: "from-red-50 to-orange-50 border-red-200/60" },
              { risk: "Operational risk", level: "Low" as const, detail: "Refrigerant leakage monitored", color: "from-green-50 to-emerald-50 border-green-200/60" },
            ].map((r) => (
              <div key={r.risk} className={cn("rounded-xl border bg-gradient-to-br p-4", r.color)}>
                <p className="text-sm font-semibold">{r.risk}</p>
                <p className={cn("mt-1 text-xs font-bold uppercase tracking-wide", r.level === "High" ? "text-red-600" : r.level === "Medium" ? "text-amber-600" : "text-green-700")}>{r.level}</p>
                <p className="mt-2 text-xs text-muted-foreground">{r.detail}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </TabsContent>

      <TabsContent value="data" className="mt-0 space-y-4">
        <ChartCard title="Data quality heatmap" tip="Completeness and reliability score by category and month (0–100).">
          <div className="overflow-x-auto">
            <div className="inline-grid gap-1" style={{ gridTemplateColumns: "repeat(13, minmax(36px, 1fr))" }}>
              <div className="text-[10px] font-mono">Cat / Mo</div>
              {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m) => <div key={m} className="text-center text-[10px]">{m}</div>)}
              {[...new Set(qualityHeatmap.map((h) => h.category))].map((cat) => (
                <Fragment key={cat}>
                  <div className="truncate text-[10px]">{cat}</div>
                  {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m) => {
                    const cell = qualityHeatmap.find((h) => h.category === cat && h.month === m);
                    const s = cell?.score ?? 0;
                    return <div key={`${cat}-${m}`} className="flex h-9 items-center justify-center rounded-md text-[10px] font-semibold text-white shadow-sm" style={{ backgroundColor: qualityColor(s), opacity: s ? 1 : 0.15 }}>{s || "—"}</div>;
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </ChartCard>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Emission factor coverage" tip="Which calculation methods are used across filtered records.">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={factorCoverage}><XAxis dataKey="method" tick={{ fontSize: 9 }} /><YAxis /><Tooltip /><Bar dataKey="count" fill="#5cb832" /></BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Activity records" tip="Click any row to open the calculation breakdown drawer." icon={Database} noPadding>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-xs">
                <DataTableHeader>
                  <DataTableHead>Period</DataTableHead>
                  <DataTableHead>Source</DataTableHead>
                  <DataTableHead>Scope</DataTableHead>
                  <DataTableHead>tCO₂e</DataTableHead>
                  <DataTableHead>Method</DataTableHead>
                  <DataTableHead>DQ</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {filteredActivities.slice(0, 50).map((a) => (
                    <DataTableRow key={a.id} onClick={() => openCalculation(a)}>
                      <DataTableCell>{a.period}</DataTableCell>
                      <DataTableCell>{a.source}</DataTableCell>
                      <DataTableCell className="capitalize">{a.scope}</DataTableCell>
                      <DataTableCell className="dash-num">{activityToCalculation(a).emissionsTCO2e.toFixed(3)}</DataTableCell>
                      <DataTableCell className="capitalize">{a.method.replace(/_/g, " ")}</DataTableCell>
                      <DataTableCell>{a.dataQualityScore}%</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </table>
            </div>
          </ChartCard>
        </div>
      </TabsContent>
    </Tabs>
    </div>
  );
}

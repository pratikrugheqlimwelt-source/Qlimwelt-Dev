"use client";

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  Treemap, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Scatter, ScatterChart, ZAxis, ReferenceLine,
} from "recharts";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { useT } from "@/components/i18n/locale-provider";
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
  const t = useT();
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
    { name: t("overview.charts.priorPeriod"), value: metrics.totalTCO2e * 1.08, fill: "#94a3b8" },
    { name: t("overview.charts.scope1Delta"), value: metrics.scope1 * 0.05, fill: "#1e293b" },
    { name: t("overview.charts.scope2Delta"), value: -metrics.scope2 * 0.12, fill: "#82D153" },
    { name: t("overview.charts.scope3Delta"), value: metrics.scope3 * 0.03, fill: "#5cb832" },
    { name: t("overview.charts.current"), value: metrics.totalTCO2e, fill: "#2563eb" },
  ], [metrics, t]);

  const macCurve = useMemo(() => [
    { name: t("overview.charts.ledRetrofit"), reduction: 85, cost: -22000, size: 85 },
    { name: t("overview.charts.renewablePpa"), reduction: 2964, cost: 45000, size: 2964 },
    { name: t("overview.charts.fleetEv"), reduction: 420, cost: 62000, size: 420 },
    { name: t("overview.charts.solarInstall"), reduction: 520, cost: 78000, size: 520 },
    { name: t("overview.charts.supplierProg"), reduction: 890, cost: 95000, size: 890 },
  ], [t]);

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
    { category: t("overview.charts.cat1Goods"), volume: 8500, quality: 52, influence: 88, opportunity: 72 },
    { category: t("overview.charts.cat4Transport"), volume: 2100, quality: 68, influence: 70, opportunity: 74 },
    { category: t("overview.charts.cat6Travel"), volume: 890, quality: 65, influence: 45, opportunity: 55 },
    { category: t("overview.charts.cat7Commute"), volume: 620, quality: 58, influence: 40, opportunity: 60 },
  ], [t]);

  const intensityDomain = useMemo(() => {
    const values = monthlyTrend.map((m) => m.intensity).filter((v) => Number.isFinite(v) && v > 0);
    if (!values.length) return [0, 1] as [number, number];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max((max - min) * 0.2, max * 0.08, 0.05);
    return [Math.max(0, min - pad), max + pad] as [number, number];
  }, [monthlyTrend]);

  const scenarios = useMemo(() => [
    { name: t("overview.charts.scenarioBau"), y2024: metrics.totalTCO2e * 12, y2027: metrics.totalTCO2e * 12 * 1.08, y2030: metrics.totalTCO2e * 12 * 1.15 },
    { name: t("overview.charts.scenarioModerate"), y2024: metrics.totalTCO2e * 12, y2027: metrics.totalTCO2e * 12 * 0.92, y2030: metrics.totalTCO2e * 12 * 0.78 },
    { name: t("overview.charts.scenarioAmbitious"), y2024: metrics.totalTCO2e * 12, y2027: metrics.totalTCO2e * 12 * 0.85, y2030: metrics.totalTCO2e * 12 * 0.58 },
  ], [metrics, t]);

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
        { label: t("overview.charts.priorYear"), color: CHART.baseline, key: "previousYear" as const, dashed: true },
        { label: t("overview.charts.rollingAvg"), color: CHART.actual, key: "rollingAvg" as const, dashed: false },
      ];
    }
    if (trendMode === "previous") return [{ label: t("overview.charts.priorYear"), color: CHART.baseline, key: "previousYear" as const, dashed: true }];
    if (trendMode === "baseline") return [{ label: t("overview.charts.baseline"), color: "#94a3b8", key: "baseline" as const, dashed: true }];
    return [{ label: t("overview.charts.targetPathway"), color: CHART.target, key: "target" as const, dashed: true }];
  }, [trendMode, t]);

  return (
    <div className="space-y-4">
      <SectionHeader title={t("overview.charts.sectionTitle")} description={t("overview.charts.sectionDescription")} />
      <Tabs defaultValue="trends" className="space-y-4">
      <TabsList className="dash-tab-list h-auto w-full justify-start">
        <TabsTrigger value="trends" className="dash-tab-trigger">{t("overview.charts.tabTrends")}</TabsTrigger>
        <TabsTrigger value="breakdown" className="dash-tab-trigger">{t("overview.charts.tabBreakdown")}</TabsTrigger>
        <TabsTrigger value="analysis" className="dash-tab-trigger">{t("overview.charts.tabAnalysis")}</TabsTrigger>
        <TabsTrigger value="data" className="dash-tab-trigger">{t("overview.charts.tabDataQuality")}</TabsTrigger>
      </TabsList>

      <TabsContent value="trends" className="mt-0 space-y-4">
        <ChartCard title={t("overview.charts.emissionTrendTitle")} tip={t("overview.charts.emissionTrendTip")} icon={TrendingUp} accent="brand">
          {/* Summary stats */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {[
              { label: t("overview.charts.ytdTotal"), value: `${trendStats.ytdTotal.toFixed(0)} t`, sub: t("overview.charts.allScopes") },
              { label: t("overview.charts.monthlyAvg"), value: `${trendStats.avg.toFixed(1)} t`, sub: t("overview.charts.twelveMoMean") },
              { label: t("overview.charts.peakMonth"), value: trendStats.peak?.monthLabel ?? "—", sub: `${trendStats.peak?.total.toFixed(1)} t` },
              { label: t("overview.charts.lowMonth"), value: trendStats.low?.monthLabel ?? "—", sub: `${trendStats.low?.total.toFixed(1)} t` },
              { label: t("overview.charts.seasonalRange"), value: `±${(trendStats.variance / 2).toFixed(1)} t`, sub: t("overview.charts.peakVsTrough") },
              {
                label: t("overview.charts.ytdVsPriorYr"),
                value: `${trendStats.ytdYoy >= 0 ? "+" : ""}${trendStats.ytdYoy.toFixed(1)}%`,
                sub: trendStats.ytdYoy <= 0 ? t("overview.charts.onTrack") : t("overview.charts.aboveBaseline"),
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
            { label: t("overview.scope1"), color: CHART.scope1 },
            { label: t("overview.scope2"), color: CHART.scope2 },
            { label: t("overview.scope3"), color: CHART.scope3 },
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
                {m === "current" ? t("overview.charts.currentYear") : m === "previous" ? t("overview.charts.previousYear") : m === "baseline" ? t("overview.charts.baseline") : t("overview.charts.targetPathway")}
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
              <Area type="monotone" dataKey="scope1" stackId="1" fill={`url(#${GRADIENT_IDS.scope1})`} stroke={CHART.scope1} strokeWidth={1.5} name={t("overview.scope1")} animationDuration={800} />
              <Area type="monotone" dataKey="scope2" stackId="1" fill={`url(#${GRADIENT_IDS.scope2})`} stroke={CHART.scope2} strokeWidth={1.5} name={t("overview.scope2")} animationDuration={900} />
              <Area type="monotone" dataKey="scope3" stackId="1" fill={`url(#${GRADIENT_IDS.scope3})`} stroke={CHART.scope3} strokeWidth={1.5} name={t("overview.scope3")} animationDuration={1000} />
              <Line
                type="monotone"
                dataKey="total"
                stroke={CHART.scope1}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART.scope1, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: CHART.brand, stroke: "#fff", strokeWidth: 2 }}
                name={t("overview.charts.total")}
              />
              {(trendMode === "current" || trendMode === "previous") && (
                <Line type="monotone" dataKey="previousYear" stroke={CHART.baseline} strokeWidth={2} strokeDasharray="6 4" dot={false} name={t("overview.charts.priorYear")} />
              )}
              {trendMode === "baseline" && (
                <Line type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} name={t("overview.charts.baseline")} />
              )}
              {trendMode === "target" && (
                <Line type="monotone" dataKey="target" stroke={CHART.target} strokeWidth={2} strokeDasharray="6 4" dot={false} name={t("overview.charts.targetPathway")} />
              )}
              {trendMode === "current" && (
                <Line type="monotone" dataKey="rollingAvg" stroke={CHART.actual} strokeWidth={1.5} strokeDasharray="2 3" dot={false} name={t("overview.charts.threeMoAvg")} />
              )}
              <ReferenceLine y={trendStats.avg} stroke={CHART.brand} strokeDasharray="3 6" strokeOpacity={0.4} label={{ value: t("overview.charts.avg"), position: "insideTopRight", fontSize: 10, fill: CHART.tick }} />
            </ComposedChart>
          </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t("overview.charts.targetPathwayTitle")} tip={t("overview.charts.targetPathwayTip")} accent="blue">
          <ChartLegendInline className="mb-4" items={[
            { label: t("overview.charts.baseline"), color: CHART.baseline },
            { label: t("overview.charts.actual"), color: CHART.actual },
            { label: t("overview.charts.target"), color: CHART.target },
            { label: t("overview.charts.projected"), color: CHART.projected },
          ]} />
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyTrend.map((m, i) => ({ month: m.month, actual: m.total * 12, baseline: m.baseline * 12, target: m.target * 12, projected: m.total * 12 * (1 + i * 0.005) }))}>
              <ChartGradients />
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="month" {...CHART_AXIS} />
              <YAxis {...CHART_AXIS} />
              <Tooltip content={<ChartTooltip unit="tCO₂e/yr" />} />
              <Line dataKey="baseline" stroke={CHART.baseline} strokeDasharray="4 4" strokeWidth={2} dot={false} name={t("overview.charts.baseline")} />
              <Line dataKey="actual" stroke={CHART.actual} strokeWidth={2.5} dot={false} name={t("overview.charts.actual")} />
              <Line dataKey="target" stroke={CHART.target} strokeDasharray="4 4" strokeWidth={2} dot={false} name={t("overview.charts.target")} />
              <Line dataKey="projected" stroke={CHART.projected} strokeDasharray="2 2" strokeWidth={2} dot={false} name={t("overview.charts.projected")} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title={t("overview.charts.intensityTrendTitle")} tip={t("overview.charts.intensityTrendTip")} accent="teal">
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
                        payload={payload?.map((p) => ({ name: t("overview.charts.intensity"), value: p.value as number, color: CHART.teal }))}
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
                  name={t("overview.charts.intensity")}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={t("overview.charts.waterfallTitle")} tip={t("overview.charts.waterfallTip")} accent="purple">
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
          <ChartCard title={t("overview.charts.scopeComparisonTitle")} tip={t("overview.charts.scopeComparisonTip")} icon={PieIcon} accent="brand">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={[{ name: t("overview.scope1"), value: metrics.scope1 }, { name: t("overview.scope2"), value: metrics.scope2 }, { name: t("overview.scope3"), value: metrics.scope3 }]} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  <Cell fill={CHART.scope1} /><Cell fill={CHART.scope2} /><Cell fill={CHART.scope3} />
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={t("overview.charts.sourceBreakdownTitle")} tip={t("overview.charts.sourceBreakdownTip")} accent="teal">
            <ResponsiveContainer width="100%" height={260}>
              <Treemap data={treemapData} dataKey="size" nameKey="name" stroke="#fff" fill={CHART.scope2} />
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title={t("overview.charts.byFacilityTitle")} tip={t("overview.charts.byFacilityTip")} accent="blue">
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
          <ChartCard title={t("overview.charts.byCountryTitle")} tip={t("overview.charts.byCountryTip")} accent="brand">
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
          <ChartCard title={t("overview.charts.macTitle")} tip={t("overview.charts.macTip")}>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart><CartesianGrid /><XAxis dataKey="reduction" name="tCO₂e/yr" tick={{ fontSize: 10 }} /><YAxis dataKey="cost" name={t("overview.charts.costEuro")} tick={{ fontSize: 10 }} /><ZAxis dataKey="size" range={[40, 400]} /><Tooltip cursor={{ strokeDasharray: "3 3" }} /><Scatter data={macCurve} fill="#82D153" /></ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={t("overview.charts.scope3MatrixTitle")} tip={t("overview.charts.scope3MatrixTip")}>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart><CartesianGrid /><XAxis dataKey="quality" name={t("overview.charts.quality")} domain={[0, 100]} /><YAxis dataKey="volume" name={t("overview.charts.volumeTco2e")} /><ZAxis dataKey="opportunity" range={[50, 400]} /><Tooltip /><Scatter data={scope3Matrix} fill="#2563eb" /></ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <ChartCard title={t("overview.charts.scenarioTitle")} tip={t("overview.charts.scenarioTip")} accent="purple">
          <ChartLegendInline className="mb-4" items={[
            { label: t("overview.charts.projection2027"), color: CHART.baseline },
            { label: t("overview.charts.projection2030"), color: CHART.scope2 },
          ]} />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={scenarios}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="name" {...CHART_AXIS} />
              <YAxis {...CHART_AXIS} />
              <Tooltip content={<ChartTooltip unit="tCO₂e/yr" />} />
              <Bar dataKey="y2027" fill={CHART.baseline} name={t("overview.charts.year2027")} radius={[6, 6, 0, 0]} />
              <Bar dataKey="y2030" fill={CHART.scope2} name={t("overview.charts.year2030")} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title={t("overview.charts.climateRiskTitle")} tip={t("overview.charts.climateRiskTip")} icon={Brain} accent="amber">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { risk: t("overview.charts.transitionRisk"), level: t("overview.charts.riskMedium"), levelKey: "medium" as const, detail: t("overview.charts.transitionDetail"), color: "from-amber-50 to-orange-50 border-amber-200/60" },
              { risk: t("overview.charts.energyPriceExposure"), level: t("overview.charts.riskHigh"), levelKey: "high" as const, detail: t("overview.charts.energyDetail"), color: "from-red-50 to-rose-50 border-red-200/60" },
              { risk: t("overview.charts.carbonPriceExposure"), level: t("overview.charts.riskMedium"), levelKey: "medium" as const, detail: t("overview.charts.carbonDetail", { amount: metrics.carbonCostExposure.toFixed(0), price: company.carbonPricePerTonne }), color: "from-amber-50 to-yellow-50 border-amber-200/60" },
              { risk: t("overview.charts.supplierRisk"), level: t("overview.charts.riskHigh"), levelKey: "high" as const, detail: t("overview.charts.supplierDetail"), color: "from-red-50 to-orange-50 border-red-200/60" },
              { risk: t("overview.charts.operationalRisk"), level: t("overview.charts.riskLow"), levelKey: "low" as const, detail: t("overview.charts.operationalDetail"), color: "from-green-50 to-emerald-50 border-green-200/60" },
            ].map((r) => (
              <div key={r.risk} className={cn("rounded-xl border bg-gradient-to-br p-4", r.color)}>
                <p className="text-sm font-semibold">{r.risk}</p>
                <p className={cn("mt-1 text-xs font-bold uppercase tracking-wide", r.levelKey === "high" ? "text-red-600" : r.levelKey === "medium" ? "text-amber-600" : "text-green-700")}>{r.level}</p>
                <p className="mt-2 text-xs text-muted-foreground">{r.detail}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </TabsContent>

      <TabsContent value="data" className="mt-0 space-y-4">
        <ChartCard title={t("overview.charts.qualityHeatmapTitle")} tip={t("overview.charts.qualityHeatmapTip")}>
          <div className="overflow-x-auto">
            <div className="inline-grid gap-1" style={{ gridTemplateColumns: "repeat(13, minmax(36px, 1fr))" }}>
              <div className="text-[10px] font-mono">{t("overview.charts.catMo")}</div>
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
          <ChartCard title={t("overview.charts.factorCoverageTitle")} tip={t("overview.charts.factorCoverageTip")}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={factorCoverage}><XAxis dataKey="method" tick={{ fontSize: 9 }} /><YAxis /><Tooltip /><Bar dataKey="count" fill="#5cb832" /></BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={t("overview.charts.activityRecordsTitle")} tip={t("overview.charts.activityRecordsTip")} icon={Database} noPadding>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-xs">
                <DataTableHeader>
                  <DataTableHead>{t("overview.charts.period")}</DataTableHead>
                  <DataTableHead>{t("overview.charts.source")}</DataTableHead>
                  <DataTableHead>{t("overview.charts.scope")}</DataTableHead>
                  <DataTableHead>{t("overview.charts.tco2e")}</DataTableHead>
                  <DataTableHead>{t("overview.charts.method")}</DataTableHead>
                  <DataTableHead>{t("overview.charts.dq")}</DataTableHead>
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

"use client";

import {
  Area, BarChart, Bar, Line, Cell,
  Treemap, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Scatter, ScatterChart, ZAxis, ReferenceLine, LabelList,
} from "recharts";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { useT } from "@/components/i18n/locale-provider";
import { activityToCalculation } from "@/lib/calculations/engine";
import { ChartCard } from "@/components/dashboard/shared/chart-card";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/dashboard/shared/data-table";
import { CHART, CHART_AXIS, CHART_GRID, qualityColor, BAR_PALETTE, formatChartValue } from "@/lib/chart-theme";
import { useChartGradients } from "@/components/dashboard/charts/chart-gradients";
import { ChartTooltip, ChartLegendInline } from "@/components/dashboard/charts/chart-tooltip";
import { TrendTooltip } from "@/components/dashboard/charts/trend-tooltip";
import { AdvancedScopeDonut } from "@/components/dashboard/charts/advanced-scope-donut";
import { TreemapTile } from "@/components/dashboard/charts/treemap-tile";
import { WaterfallChart } from "@/components/dashboard/charts/waterfall-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fragment, useMemo, useState } from "react";
import { TrendingUp, PieChart as PieIcon, Brain, Database } from "lucide-react";
import { cn, formatCO2 } from "@/lib/utils";
import { MetricFigure } from "@/components/ui/metric-figure";

function opportunityColor(score: number): string {
  if (score >= 70) return CHART.brand;
  if (score >= 55) return CHART.actual;
  return CHART.projected;
}

function riskLevelPct(levelKey: "high" | "medium" | "low"): number {
  if (levelKey === "high") return 88;
  if (levelKey === "medium") return 55;
  return 28;
}

export function OverviewCharts() {
  const { filteredActivities, monthlyTrend, metrics, facilities, openCalculation, company } = useDashboard();
  const t = useT();
  const [trendMode, setTrendMode] = useState<"current" | "previous" | "baseline" | "target">("current");
  const trendG = useChartGradients("trend");
  const pathG = useChartGradients("path");
  const intensityG = useChartGradients("intensity");
  const facilityG = useChartGradients("facility");
  const scenarioG = useChartGradients("scenario");
  const factorG = useChartGradients("factor");

  const treemapData = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of filteredActivities) {
      const key = `${a.scope} / ${a.category}`;
      map.set(key, (map.get(key) ?? 0) + activityToCalculation(a).emissionsTCO2e);
    }
    const rows = Array.from(map.entries())
      .map(([name, value]) => ({ name, size: value }))
      .sort((a, b) => b.size - a.size);
    const total = rows.reduce((s, r) => s + r.size, 0) || 1;
    const significant = rows.filter((r) => r.size / total >= 0.04);
    const tiny = rows.filter((r) => r.size / total < 0.04);
    if (tiny.length > 1) {
      const otherSize = tiny.reduce((s, r) => s + r.size, 0);
      significant.push({ name: t("overview.charts.otherSources"), size: otherSize });
    } else if (tiny.length === 1) {
      significant.push(tiny[0]);
    }
    return significant.map((r) => ({ ...r, pct: (r.size / total) * 100 }));
  }, [filteredActivities, t]);

  const byFacility = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of filteredActivities) {
      const fac = facilities.find((f) => f.id === a.facilityId)?.name ?? a.facilityId;
      map.set(fac, (map.get(fac) ?? 0) + activityToCalculation(a).emissionsTCO2e);
    }
    return Array.from(map.entries())
      .map(([name, emissions]) => ({ name, emissions }))
      .sort((a, b) => b.emissions - a.emissions);
  }, [filteredActivities, facilities]);

  const byCountry = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of filteredActivities) {
      map.set(a.country, (map.get(a.country) ?? 0) + activityToCalculation(a).emissionsTCO2e);
    }
    return Array.from(map.entries())
      .map(([name, emissions]) => ({ name, emissions }))
      .sort((a, b) => b.emissions - a.emissions);
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
        return { category: cat, month: m, score: Math.round(avg) };
      })
    );
  }, [filteredActivities]);

  const factorCoverage = useMemo(() => {
    const methods = ["supplier_specific", "activity_specific", "location_based", "spend_based", "estimated"] as const;
    return methods.map((m) => ({
      method: m.replace(/_/g, " "),
      count: filteredActivities.filter((a) => a.method === m || (m === "estimated" && a.isEstimated)).length,
    })).filter((m) => m.count > 0 || filteredActivities.length === 0);
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

  const scenarios = useMemo(() => {
    const y2024 = metrics.totalTCO2e * 12;
    return [
      {
        name: t("overview.charts.scenarioBau"),
        y2024,
        y2027: y2024 * 1.08,
        y2030: y2024 * 1.15,
        delta2030: ((y2024 * 1.15 - y2024) / y2024) * 100,
      },
      {
        name: t("overview.charts.scenarioModerate"),
        y2024,
        y2027: y2024 * 0.92,
        y2030: y2024 * 0.78,
        delta2030: ((y2024 * 0.78 - y2024) / y2024) * 100,
      },
      {
        name: t("overview.charts.scenarioAmbitious"),
        y2024,
        y2027: y2024 * 0.85,
        y2030: y2024 * 0.58,
        delta2030: ((y2024 * 0.58 - y2024) / y2024) * 100,
      },
    ];
  }, [metrics, t]);

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

  const pathwayData = useMemo(
    () =>
      monthlyTrend.map((m, i) => {
        const actual = m.total * 12;
        const baseline = m.baseline * 12;
        const target = m.target * 12;
        const projected = m.total * 12 * (1 + i * 0.005);
        return {
          month: m.month,
          actual,
          baseline,
          target,
          projected,
          bandLow: Math.min(baseline, target),
          bandSpan: Math.abs(baseline - target),
          gap: actual - target,
        };
      }),
    [monthlyTrend]
  );

  const latestGap = pathwayData[pathwayData.length - 1]?.gap ?? 0;

  const intensityWithMarker = useMemo(
    () =>
      monthlyTrend.map((m, i) => ({
        ...m,
        lastIntensity: i === monthlyTrend.length - 1 ? m.intensity : null,
      })),
    [monthlyTrend]
  );

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
                <p className="mt-0.5">
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
              <trendG.Defs />
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="monthLabel" {...CHART_AXIS} />
              <YAxis
                {...CHART_AXIS}
                width={42}
                tickFormatter={(v) => formatChartValue(v, 0)}
                label={{ value: "tCO₂e", angle: -90, position: "insideLeft", offset: 8, style: { fontSize: 10, fill: CHART.tick } }}
              />
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
              <Area type="monotone" dataKey="scope1" stackId="1" fill={`url(#${trendG.ids.scope1})`} stroke={CHART.scope1} strokeWidth={1.5} name={t("overview.scope1")} animationDuration={800} />
              <Area type="monotone" dataKey="scope2" stackId="1" fill={`url(#${trendG.ids.scope2})`} stroke={CHART.scope2} strokeWidth={1.5} name={t("overview.scope2")} animationDuration={900} />
              <Area type="monotone" dataKey="scope3" stackId="1" fill={`url(#${trendG.ids.scope3})`} stroke={CHART.scope3} strokeWidth={1.5} name={t("overview.scope3")} animationDuration={1000} />
              <Line
                type="monotone"
                dataKey="total"
                stroke={CHART.scope1}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: CHART.scope1, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7, fill: CHART.brand, stroke: "#fff", strokeWidth: 2 }}
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
              <ReferenceLine y={trendStats.avg} stroke={CHART.brand} strokeDasharray="3 6" strokeOpacity={0.45} label={{ value: t("overview.charts.avg"), position: "insideTopRight", fontSize: 10, fill: CHART.tick }} />
            </ComposedChart>
          </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title={t("overview.charts.targetPathwayTitle")}
          tip={t("overview.charts.targetPathwayTip")}
          accent="blue"
          action={
            <div className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold",
              latestGap <= 0 ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"
            )}>
              {t("overview.charts.gapToTarget")}: {latestGap >= 0 ? "+" : ""}{formatChartValue(latestGap, 0)} t
            </div>
          }
        >
          <ChartLegendInline className="mb-4" items={[
            { label: t("overview.charts.baseline"), color: CHART.baseline, dashed: true },
            { label: t("overview.charts.actual"), color: CHART.actual },
            { label: t("overview.charts.target"), color: CHART.target, dashed: true },
            { label: t("overview.charts.projected"), color: CHART.projected },
          ]} />
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={pathwayData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <pathG.Defs />
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="month" {...CHART_AXIS} />
              <YAxis {...CHART_AXIS} tickFormatter={(v) => formatChartValue(v, 0)} width={44} />
              <Tooltip content={<ChartTooltip unit="tCO₂e/yr" />} />
              <Area type="monotone" dataKey="bandLow" stackId="band" stroke="none" fill="transparent" legendType="none" />
              <Area type="monotone" dataKey="bandSpan" stackId="band" stroke="none" fill={`url(#${pathG.ids.targetBand})`} name={t("overview.charts.targetPathway")} />
              <Area type="monotone" dataKey="projected" fill={`url(#${pathG.ids.projected})`} stroke={CHART.projected} strokeWidth={1.5} strokeDasharray="4 3" name={t("overview.charts.projected")} />
              <Line dataKey="baseline" stroke={CHART.baseline} strokeDasharray="5 4" strokeWidth={2} dot={false} name={t("overview.charts.baseline")} />
              <Line
                dataKey="actual"
                stroke={CHART.actual}
                strokeWidth={2.75}
                dot={{ r: 3, fill: CHART.actual, stroke: "#fff", strokeWidth: 1.5 }}
                activeDot={{ r: 6 }}
                name={t("overview.charts.actual")}
              />
              <Line dataKey="target" stroke={CHART.target} strokeDasharray="5 4" strokeWidth={2} dot={false} name={t("overview.charts.target")} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title={t("overview.charts.intensityTrendTitle")} tip={t("overview.charts.intensityTrendTip")} accent="teal">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={intensityWithMarker} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                <intensityG.Defs />
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="monthLabel" {...CHART_AXIS} />
                <YAxis {...CHART_AXIS} domain={intensityDomain} tickFormatter={(v) => v.toFixed(2)} width={48} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    const row = monthlyTrend.find((m) => m.monthLabel === label);
                    return (
                      <TrendTooltip
                        active={active}
                        payload={payload?.filter((p) => p.dataKey === "intensity").map((p) => ({ name: t("overview.charts.intensity"), value: p.value as number, color: CHART.teal }))}
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
                  fill={`url(#${intensityG.ids.teal})`}
                  stroke={CHART.teal}
                  strokeWidth={2.25}
                  name={t("overview.charts.intensity")}
                />
                <Line
                  type="monotone"
                  dataKey="intensity"
                  stroke={CHART.teal}
                  strokeWidth={0}
                  dot={{ r: 2.5, fill: CHART.teal, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: CHART.teal, stroke: "#fff", strokeWidth: 2 }}
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="lastIntensity"
                  stroke="none"
                  dot={{ r: 6, fill: CHART.brandDark, stroke: "#fff", strokeWidth: 2 }}
                  activeDot={false}
                  legendType="none"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={t("overview.charts.waterfallTitle")} tip={t("overview.charts.waterfallTip")} accent="purple">
            <WaterfallChart data={waterfall} height={260} />
          </ChartCard>
        </div>
      </TabsContent>

      <TabsContent value="breakdown" className="mt-0 space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title={t("overview.charts.scopeComparisonTitle")}
            description={t("overview.charts.scopeComparisonTip")}
            tip={t("overview.charts.scopeComparisonTip")}
            icon={PieIcon}
            accent="brand"
          >
            <AdvancedScopeDonut scope1={metrics.scope1} scope2={metrics.scope2} scope3={metrics.scope3} height={260} />
          </ChartCard>
          <ChartCard
            title={t("overview.charts.sourceBreakdownTitle")}
            description={t("overview.charts.sourceBreakdownTip")}
            tip={t("overview.charts.hoverForDetails")}
            accent="teal"
          >
            <ChartLegendInline className="mb-3" items={[
              { label: t("overview.scope1"), color: CHART.scope1 },
              { label: t("overview.scope2"), color: CHART.scope2 },
              { label: t("overview.scope3"), color: CHART.scope3 },
            ]} />
            <ResponsiveContainer width="100%" height={280}>
              <Treemap
                data={treemapData}
                dataKey="size"
                nameKey="name"
                stroke="#fff"
                fill={CHART.scope2}
                content={<TreemapTile />}
                isAnimationActive
              >
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as (typeof treemapData)[0];
                    return (
                      <div className="min-w-[200px] rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur-sm">
                        <p className="text-sm font-bold text-slate-900">{d.name}</p>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between gap-6">
                            <span className="text-muted-foreground">{t("overview.charts.tco2e")}</span>
                            <span className="dash-num">{formatCO2(d.size)}</span>
                          </div>
                          <div className="flex justify-between gap-6">
                            <span className="text-muted-foreground">{t("overview.charts.shareOfTotal")}</span>
                            <span className="dash-num">{d.pct.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              </Treemap>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title={t("overview.charts.byFacilityTitle")}
            description={t("overview.charts.byFacilityTip")}
            tip={t("overview.charts.byFacilityTip")}
            accent="blue"
          >
            <ResponsiveContainer width="100%" height={Math.max(260, byFacility.length * 40)}>
              <BarChart data={byFacility} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 4 }}>
                <facilityG.Defs />
                <CartesianGrid {...CHART_GRID} horizontal={false} />
                <XAxis type="number" {...CHART_AXIS} tickFormatter={(v) => formatChartValue(v, 0)} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: CHART.tick, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
                <Bar dataKey="emissions" fill={`url(#${facilityG.ids.barActual})`} radius={[0, 6, 6, 0]} maxBarSize={22} name={t("overview.charts.tco2e")}>
                  <LabelList dataKey="emissions" position="right" formatter={(v: number) => formatChartValue(v, 1)} style={{ fontSize: 10, fill: CHART.tick, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard
            title={t("overview.charts.byCountryTitle")}
            description={t("overview.charts.byCountryTip")}
            tip={t("overview.charts.byCountryTip")}
            accent="brand"
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byCountry} margin={{ top: 20, right: 12, left: 8, bottom: 8 }}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: CHART.tick, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis {...CHART_AXIS} tickFormatter={(v) => formatChartValue(v, 0)} width={44} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
                <Bar dataKey="emissions" radius={[8, 8, 0, 0]} maxBarSize={52} name={t("overview.charts.tco2e")}>
                  {byCountry.map((_, i) => (
                    <Cell key={i} fill={BAR_PALETTE[i % BAR_PALETTE.length]} fillOpacity={0.92} />
                  ))}
                  <LabelList dataKey="emissions" position="top" formatter={(v: number) => formatChartValue(v, 0)} style={{ fontSize: 10, fill: CHART.tick, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </TabsContent>

      <TabsContent value="analysis" className="mt-0 space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title={t("overview.charts.macTitle")} description={t("overview.charts.macTip")} tip={t("overview.charts.macTip")} accent="brand">
            <ChartLegendInline className="mb-3" items={[
              { label: t("overview.charts.costSavingZone"), color: CHART.brand },
              { label: t("overview.charts.investmentZone"), color: CHART.actual },
            ]} />
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 36, right: 36, left: 16, bottom: 44 }}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis
                  type="number"
                  dataKey="reduction"
                  name={t("overview.charts.reductionPotential")}
                  tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatChartValue(v, 0)}
                  padding={{ left: 16, right: 16 }}
                  label={{ value: `${t("overview.charts.reductionPotential")} (tCO₂e/yr)`, position: "insideBottom", offset: -24, style: { fontSize: 12, fill: "#334155", fontWeight: 600, fontFamily: "var(--font-sans), system-ui, sans-serif" } }}
                />
                <YAxis
                  type="number"
                  dataKey="cost"
                  name={t("overview.charts.costEuro")}
                  tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatChartValue(v, 0)}
                  width={58}
                  label={{ value: t("overview.charts.costEuro"), angle: -90, position: "insideLeft", offset: 4, style: { fontSize: 12, fill: "#334155", fontWeight: 600, fontFamily: "var(--font-sans), system-ui, sans-serif" } }}
                />
                <ZAxis type="number" dataKey="size" range={[80, 260]} />
                <ReferenceLine y={0} stroke={CHART.brand} strokeDasharray="4 4" strokeOpacity={0.7} label={{ value: "€0", position: "insideTopRight", fontSize: 10, fill: CHART.tick }} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3", stroke: CHART.grid }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as (typeof macCurve)[0];
                    const costPerT = d.reduction ? d.cost / d.reduction : 0;
                    return (
                      <div className="min-w-[200px] rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur-sm">
                        <p className="font-sans text-sm font-bold text-slate-900">{d.name}</p>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">{t("overview.charts.reductionPotential")}</span>
                            <span className="dash-num">{d.reduction.toFixed(0)} t</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">{t("overview.charts.costEuro")}</span>
                            <span className="dash-num">€{formatChartValue(d.cost, 0)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">{t("overview.charts.costPerTonne")}</span>
                            <span className="dash-num">{costPerT.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter data={macCurve} name="MAC">
                  {macCurve.map((entry, i) => (
                    <Cell key={i} fill={entry.cost < 0 ? CHART.brand : CHART.actual} fillOpacity={0.92} stroke="#fff" strokeWidth={2.5} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="mt-3 flex flex-wrap gap-2">
              {macCurve.map((entry) => (
                <span
                  key={entry.name}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 font-sans text-xs font-semibold text-slate-700 shadow-sm"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.cost < 0 ? CHART.brand : CHART.actual }} />
                  {entry.name}
                </span>
              ))}
            </div>
          </ChartCard>
          <ChartCard title={t("overview.charts.scope3MatrixTitle")} description={t("overview.charts.scope3MatrixTip")} tip={t("overview.charts.hoverForDetails")} accent="blue">
            <ChartLegendInline className="mb-3" items={[
              { label: `${t("overview.charts.opportunity")} ≥70`, color: CHART.brand },
              { label: `${t("overview.charts.opportunity")} 55–69`, color: CHART.actual },
              { label: `${t("overview.charts.opportunity")} <55`, color: CHART.projected },
            ]} />
            <p className="mb-3 text-xs font-medium text-slate-600">{t("overview.charts.bubbleSizeHint")}</p>
            <div className="overflow-visible">
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 36, right: 36, left: 20, bottom: 48 }}>
                  <CartesianGrid {...CHART_GRID} />
                  <XAxis
                    type="number"
                    dataKey="quality"
                    name={t("overview.charts.quality")}
                    domain={[40, 85]}
                    tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    padding={{ left: 24, right: 24 }}
                    label={{ value: t("overview.charts.qualityScoreAxis"), position: "insideBottom", offset: -28, style: { fontSize: 12, fill: "#334155", fontWeight: 600, fontFamily: "var(--font-sans), system-ui, sans-serif" } }}
                  />
                  <YAxis
                    type="number"
                    dataKey="volume"
                    name={t("overview.charts.volumeTco2e")}
                    domain={[0, Math.ceil(Math.max(...scope3Matrix.map((d) => d.volume), 1) * 1.2)]}
                    tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatChartValue(v, 0)}
                    width={62}
                    label={{ value: t("overview.charts.volumeTco2e"), angle: -90, position: "insideLeft", offset: 8, style: { fontSize: 12, fill: "#334155", fontWeight: 600, fontFamily: "var(--font-sans), system-ui, sans-serif" } }}
                  />
                  <ZAxis type="number" dataKey="opportunity" range={[90, 280]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3", stroke: CHART.grid }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload as (typeof scope3Matrix)[0];
                      return (
                        <div className="min-w-[200px] rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur-sm">
                          <p className="font-sans text-sm font-bold text-slate-900">{d.category}</p>
                          <div className="mt-2 space-y-1 text-xs">
                            <div className="flex justify-between gap-4"><span className="text-muted-foreground">{t("overview.charts.volumeTco2e")}</span><span className="dash-num">{d.volume.toLocaleString()}</span></div>
                            <div className="flex justify-between gap-4"><span className="text-muted-foreground">{t("overview.charts.quality")}</span><span className="dash-num">{d.quality}</span></div>
                            <div className="flex justify-between gap-4"><span className="text-muted-foreground">{t("overview.charts.influence")}</span><span className="dash-num">{d.influence}</span></div>
                            <div className="flex justify-between gap-4"><span className="text-muted-foreground">{t("overview.charts.opportunity")}</span><span className="dash-num">{d.opportunity}</span></div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={scope3Matrix} name="S3">
                    {scope3Matrix.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={opportunityColor(entry.opportunity)}
                        fillOpacity={0.92}
                        stroke="#fff"
                        strokeWidth={2.5}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {scope3Matrix.map((entry) => (
                <span
                  key={entry.category}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 font-sans text-xs font-semibold text-slate-700 shadow-sm"
                >
                  <span className="h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: opportunityColor(entry.opportunity) }} />
                  {entry.category}
                  <span className="dash-num text-[11px] text-slate-500">{entry.volume.toLocaleString()} t</span>
                </span>
              ))}
            </div>
          </ChartCard>
        </div>
        <ChartCard title={t("overview.charts.scenarioTitle")} tip={t("overview.charts.scenarioTip")} accent="purple">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <ChartLegendInline items={[
              { label: t("overview.charts.projection2027"), color: CHART.baseline },
              { label: t("overview.charts.projection2030"), color: CHART.scope2 },
            ]} />
            <div className="ml-auto flex flex-wrap gap-2">
              {scenarios.map((s) => (
                <span
                  key={s.name}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                    s.delta2030 <= 0 ? "bg-green-100 text-green-700" : "bg-amber-50 text-amber-700"
                  )}
                >
                  {s.name} {t("overview.charts.vs2024")}: {s.delta2030 >= 0 ? "+" : ""}{s.delta2030.toFixed(0)}%
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={scenarios} barGap={6} margin={{ top: 16, right: 12, left: 8, bottom: 8 }}>
              <scenarioG.Defs />
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: CHART.tick, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis {...CHART_AXIS} tickFormatter={(v) => formatChartValue(v, 0)} width={48} />
              <Tooltip content={<ChartTooltip unit="tCO₂e/yr" />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
              <Bar dataKey="y2027" fill={CHART.baseline} name={t("overview.charts.year2027")} radius={[6, 6, 0, 0]} maxBarSize={44} />
              <Bar dataKey="y2030" fill={`url(#${scenarioG.ids.barScope3})`} name={t("overview.charts.year2030")} radius={[6, 6, 0, 0]} maxBarSize={44}>
                <LabelList dataKey="y2030" position="top" formatter={(v: number) => formatChartValue(v, 0)} style={{ fontSize: 10, fill: CHART.tick, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title={t("overview.charts.climateRiskTitle")} tip={t("overview.charts.climateRiskTip")} icon={Brain} accent="amber">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { risk: t("overview.charts.transitionRisk"), level: t("overview.charts.riskMedium"), levelKey: "medium" as const, detail: t("overview.charts.transitionDetail"), color: "from-amber-50 to-orange-50 border-amber-200/60", bar: "bg-amber-500" },
              { risk: t("overview.charts.energyPriceExposure"), level: t("overview.charts.riskHigh"), levelKey: "high" as const, detail: t("overview.charts.energyDetail"), color: "from-red-50 to-rose-50 border-red-200/60", bar: "bg-red-500" },
              { risk: t("overview.charts.carbonPriceExposure"), level: t("overview.charts.riskMedium"), levelKey: "medium" as const, detail: t("overview.charts.carbonDetail", { amount: metrics.carbonCostExposure.toFixed(0), price: company.carbonPricePerTonne }), color: "from-amber-50 to-yellow-50 border-amber-200/60", bar: "bg-amber-500" },
              { risk: t("overview.charts.supplierRisk"), level: t("overview.charts.riskHigh"), levelKey: "high" as const, detail: t("overview.charts.supplierDetail"), color: "from-red-50 to-orange-50 border-red-200/60", bar: "bg-red-500" },
              { risk: t("overview.charts.operationalRisk"), level: t("overview.charts.riskLow"), levelKey: "low" as const, detail: t("overview.charts.operationalDetail"), color: "from-green-50 to-emerald-50 border-green-200/60", bar: "bg-green-500" },
            ].map((r) => (
              <div key={r.risk} className={cn("rounded-xl border bg-gradient-to-br p-4", r.color)}>
                <p className="text-sm font-semibold">{r.risk}</p>
                <p className={cn("mt-1 text-xs font-bold uppercase tracking-wide", r.levelKey === "high" ? "text-red-600" : r.levelKey === "medium" ? "text-amber-600" : "text-green-700")}>{r.level}</p>
                <p className="mt-2 text-xs text-muted-foreground">{r.detail}</p>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[10px] font-medium text-muted-foreground">
                    <span>{t("overview.charts.riskSeverity")}</span>
                    <span>{riskLevelPct(r.levelKey)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
                    <div className={cn("h-full rounded-full transition-all duration-700", r.bar)} style={{ width: `${riskLevelPct(r.levelKey)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </TabsContent>

      <TabsContent value="data" className="mt-0 space-y-4">
        <ChartCard title={t("overview.charts.qualityHeatmapTitle")} description={t("overview.charts.qualityHeatmapTip")} tip={t("overview.charts.hoverForDetails")} accent="teal">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{t("overview.charts.quality")}</span>
            {[
              { label: t("overview.charts.qualityPoor"), color: "#ef4444" },
              { label: t("overview.charts.qualityFair"), color: "#f59e0b" },
              { label: t("overview.charts.qualityGood"), color: "#82D153" },
              { label: t("overview.charts.qualityExcellent"), color: "#16a34a" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-md" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <div className="inline-grid min-w-full gap-1.5" style={{ gridTemplateColumns: "minmax(150px, 1.4fr) repeat(12, minmax(44px, 1fr))" }}>
              <div className="flex items-end pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">{t("overview.charts.catMo")}</div>
              {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m) => (
                <div key={m} className="pb-1 text-center text-[11px] font-bold text-slate-600">{m}</div>
              ))}
              {[...new Set(qualityHeatmap.map((h) => h.category))].map((cat) => (
                <Fragment key={cat}>
                  <div className="flex items-center pr-3 text-xs font-semibold leading-snug text-slate-800" title={cat}>
                    <span className="line-clamp-2">{cat}</span>
                  </div>
                  {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m) => {
                    const cell = qualityHeatmap.find((h) => h.category === cat && h.month === m);
                    const s = cell?.score ?? 0;
                    return (
                      <div
                        key={`${cat}-${m}`}
                        className="flex h-11 cursor-default items-center justify-center rounded-lg text-[11px] font-bold text-white shadow-sm ring-1 ring-black/5 transition-transform hover:z-10 hover:scale-105 hover:ring-2 hover:ring-slate-400/40"
                        style={{ backgroundColor: qualityColor(s), opacity: s ? 1 : 0.18 }}
                        title={`${cat} · ${m}: ${s || "—"}`}
                      >
                        {s || "—"}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </ChartCard>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title={t("overview.charts.factorCoverageTitle")} description={t("overview.charts.factorCoverageTip")} tip={t("overview.charts.factorCoverageTip")} accent="brand">
            <ResponsiveContainer width="100%" height={Math.max(240, factorCoverage.length * 48)}>
              <BarChart data={factorCoverage} layout="vertical" margin={{ top: 8, right: 48, left: 8, bottom: 8 }}>
                <factorG.Defs />
                <CartesianGrid {...CHART_GRID} horizontal={false} />
                <XAxis type="number" {...CHART_AXIS} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="method"
                  width={128}
                  tick={{ fontSize: 11, fill: "#334155", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<ChartTooltip unit={t("overview.charts.records")} formatter={(v) => `${v}`} />}
                  cursor={{ fill: "rgba(15,23,42,0.04)" }}
                />
                <Bar dataKey="count" fill={`url(#${factorG.ids.barBrand})`} radius={[0, 8, 8, 0]} maxBarSize={26} name={t("overview.charts.records")}>
                  <LabelList dataKey="count" position="right" style={{ fontSize: 12, fill: "#0f172a", fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={t("overview.charts.activityRecordsTitle")} description={t("overview.charts.activityRecordsTip")} tip={t("overview.charts.activityRecordsTip")} icon={Database} noPadding accent="slate">
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
                      <DataTableCell>
                        <span
                          className="inline-flex min-w-[2.25rem] justify-center rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: qualityColor(a.dataQualityScore) }}
                        >
                          {a.dataQualityScore}%
                        </span>
                      </DataTableCell>
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

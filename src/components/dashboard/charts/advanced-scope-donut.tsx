"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CHART } from "@/lib/chart-theme";
import { formatCO2, cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";
import { MetricFigure } from "@/components/ui/metric-figure";

interface AdvancedScopeDonutProps {
  scope1: number;
  scope2: number;
  scope3: number;
  className?: string;
  height?: number;
}

export function AdvancedScopeDonut({
  scope1,
  scope2,
  scope3,
  className,
  height = 280,
}: AdvancedScopeDonutProps) {
  const t = useT();
  const total = scope1 + scope2 + scope3;
  const data = [
    { name: t("overview.scope1"), value: scope1, color: CHART.scope1, pct: total ? (scope1 / total) * 100 : 0 },
    { name: t("overview.scope2"), value: scope2, color: CHART.scope2, pct: total ? (scope2 / total) * 100 : 0 },
    { name: t("overview.scope3"), value: scope3, color: CHART.scope3, pct: total ? (scope3 / total) * 100 : 0 },
  ].filter((d) => d.value > 0 || total === 0);

  const chartData = data.length
    ? data.map((d) => ({ ...d, value: Math.max(d.value, total * 0.015 || 0.01) }))
    : [{ name: "—", value: 1, color: CHART.grid, pct: 0 }];

  return (
    <div className={cn("advanced-scope-donut grid items-center gap-4 sm:grid-cols-[1fr_minmax(140px,180px)]", className)}>
      <div className="relative mx-auto aspect-square w-full" style={{ maxWidth: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={3}
              stroke="#fff"
              strokeWidth={3}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} className="transition-opacity hover:opacity-85" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload as (typeof data)[0];
                return (
                  <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-xs shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur-sm">
                    <p className="font-semibold">{d.name}</p>
                    <p className="dash-num mt-0.5">{formatCO2(d.value)} · {d.pct.toFixed(1)}%</p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <MetricFigure size="lg" className="text-foreground">
            {formatCO2(total)}
          </MetricFigure>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("overview.charts.total")}
          </p>
        </div>
      </div>

      <div className="space-y-3 px-1">
        {data.map((item) => (
          <div key={item.name}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/5" style={{ backgroundColor: item.color }} />
                <span className="truncate font-medium text-foreground">{item.name}</span>
              </div>
              <span className="dash-num shrink-0 text-muted-foreground">{item.pct.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${item.pct}%`, backgroundColor: item.color }}
              />
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{formatCO2(item.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

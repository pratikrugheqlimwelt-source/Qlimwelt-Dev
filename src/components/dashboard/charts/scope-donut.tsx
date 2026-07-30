"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CHART } from "@/lib/chart-theme";
import { cn } from "@/lib/utils";
import { formatCO2 } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

interface ScopeDonutProps {
  scope1: number;
  scope2: number;
  scope3: number;
  size?: number;
  className?: string;
  dark?: boolean;
}

export function ScopeDonut({
  scope1,
  scope2,
  scope3,
  size = 130,
  className,
  dark = true,
}: ScopeDonutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState(size);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const width = element.getBoundingClientRect().width;
      if (width > 0) setChartSize(width);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const total = scope1 + scope2 + scope3;
  const t = useT();
  const data = [
    { name: t("overview.scope1"), value: Math.max(scope1, total * 0.02), raw: scope1, color: CHART.scope1, pct: total ? (scope1 / total) * 100 : 0 },
    { name: t("overview.scope2"), value: Math.max(scope2, total * 0.02), raw: scope2, color: CHART.scope2, pct: total ? (scope2 / total) * 100 : 0 },
    { name: t("overview.scope3"), value: Math.max(scope3, total * 0.02), raw: scope3, color: CHART.scope3, pct: total ? (scope3 / total) * 100 : 0 },
  ];

  const displayTotal =
    total >= 1000 ? `${(total / 1000).toFixed(1)}k` : Math.round(total).toLocaleString();
  const valueFontSize = Math.max(14, Math.min(chartSize * 0.19, 28));
  const labelFontSize = Math.max(8, Math.min(chartSize * 0.065, 11));
  const innerRadius = chartSize * 0.36;
  const outerRadius = chartSize * 0.46;

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-square shrink-0 w-[8.125rem]", className)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            strokeWidth={2}
            stroke={dark ? "rgba(255,255,255,0.15)" : "white"}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} className="transition-opacity hover:opacity-80" />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as (typeof data)[0];
              return (
                <div className="rounded-lg border bg-white px-3 py-2 text-xs shadow-lg">
                  <p className="font-semibold">{d.name}</p>
                  <p className="dash-num">{formatCO2(d.raw)} · {d.pct.toFixed(1)}%</p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        className="pointer-events-none absolute inset-0 grid place-items-center px-[22%] py-[24%]"
        aria-hidden="true"
      >
        <div className="flex min-w-0 max-w-full flex-col items-center justify-center gap-[0.15em] text-center">
          <span
            className={cn(
              "metric-figure max-w-full truncate leading-none",
              dark ? "text-white" : "text-foreground"
            )}
            style={{ fontSize: valueFontSize }}
          >
            {displayTotal}
          </span>
          <span
            className={cn(
              "whitespace-nowrap font-semibold uppercase leading-none tracking-wider",
              dark ? "text-white/50" : "text-muted-foreground"
            )}
            style={{ fontSize: labelFontSize }}
          >
            tCO₂e
          </span>
        </div>
      </div>
    </div>
  );
}

interface ScopeLegendProps {
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

export function ScopeLegend({ scope1, scope2, scope3, total }: ScopeLegendProps) {
  const t = useT();
  const items = [
    { label: t("overview.scope1"), value: scope1, color: CHART.scope1, pct: total ? (scope1 / total) * 100 : 0 },
    { label: t("overview.scope2"), value: scope2, color: CHART.scope2, pct: total ? (scope2 / total) * 100 : 0 },
    { label: t("overview.scope3"), value: scope3, color: CHART.scope3, pct: total ? (scope3 / total) * 100 : 0 },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full ring-1 ring-white/20" style={{ backgroundColor: item.color }} />
              <span className="font-medium text-white/90">{item.label}</span>
            </div>
            <span className="dash-num text-white/60">{formatCO2(item.value)} · {item.pct.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${item.pct}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

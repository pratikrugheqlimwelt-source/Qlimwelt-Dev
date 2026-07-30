"use client";

import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { CHART, CHART_AXIS, CHART_GRID, formatChartValue } from "@/lib/chart-theme";
import { useT } from "@/components/i18n/locale-provider";

export type WaterfallInput = {
  name: string;
  value: number;
  fill?: string;
};

type WaterfallRow = {
  name: string;
  base: number;
  delta: number;
  display: number;
  fill: string;
  isTotal: boolean;
};

function buildWaterfall(rows: WaterfallInput[]): WaterfallRow[] {
  if (!rows.length) return [];
  const out: WaterfallRow[] = [];
  let running = 0;

  rows.forEach((row, i) => {
    const isFirst = i === 0;
    const isLast = i === rows.length - 1;
    const isTotal = isFirst || isLast;

    if (isFirst) {
      out.push({
        name: row.name,
        base: 0,
        delta: Math.abs(row.value),
        display: row.value,
        fill: row.fill ?? CHART.baseline,
        isTotal: true,
      });
      running = row.value;
      return;
    }

    if (isLast) {
      out.push({
        name: row.name,
        base: 0,
        delta: Math.abs(row.value),
        display: row.value,
        fill: row.fill ?? CHART.actual,
        isTotal: true,
      });
      return;
    }

    const start = running;
    const end = running + row.value;
    const base = Math.min(start, end);
    const delta = Math.abs(row.value);
    out.push({
      name: row.name,
      base,
      delta,
      display: row.value,
      fill: row.fill ?? (row.value >= 0 ? CHART.scope1 : CHART.brand),
      isTotal: false,
    });
    running = end;
  });

  return out;
}

interface WaterfallChartProps {
  data: WaterfallInput[];
  height?: number;
}

export function WaterfallChart({ data, height = 240 }: WaterfallChartProps) {
  const t = useT();
  const rows = buildWaterfall(data);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 4 }} barCategoryGap="28%">
        <CartesianGrid {...CHART_GRID} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: CHART.tick, fontWeight: 500 }} axisLine={false} tickLine={false} interval={0} />
        <YAxis {...CHART_AXIS} tickFormatter={(v) => formatChartValue(v, 0)} width={40} />
        <ReferenceLine y={0} stroke={CHART.grid} />
        <Tooltip
          cursor={{ fill: "rgba(15,23,42,0.04)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0]?.payload as WaterfallRow;
            const isUp = row.display >= 0;
            return (
              <div className="rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{row.name}</p>
                <p className="mt-1 dash-num text-sm">
                  {row.isTotal ? "" : isUp ? "+" : ""}
                  {row.display.toFixed(1)} tCO₂e
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {row.isTotal
                    ? t("overview.charts.total")
                    : isUp
                      ? t("overview.charts.increase")
                      : t("overview.charts.decrease")}
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="delta" stackId="wf" radius={[5, 5, 0, 0]} maxBarSize={48}>
          {rows.map((entry, i) => (
            <Cell key={i} fill={entry.fill} fillOpacity={entry.isTotal ? 1 : 0.92} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

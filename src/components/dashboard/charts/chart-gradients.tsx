"use client";

import { GRADIENT_IDS, CHART, qualityColor } from "@/lib/chart-theme";
import { ChartTooltip } from "@/components/dashboard/charts/chart-tooltip";

/** SVG gradient defs — place inside any Recharts chart */
export function ChartGradients() {
  return (
    <defs>
      <linearGradient id={GRADIENT_IDS.scope1} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={CHART.scope1} stopOpacity={0.85} />
        <stop offset="100%" stopColor={CHART.scope1} stopOpacity={0.05} />
      </linearGradient>
      <linearGradient id={GRADIENT_IDS.scope2} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={CHART.scope2} stopOpacity={0.9} />
        <stop offset="100%" stopColor={CHART.scope2} stopOpacity={0.08} />
      </linearGradient>
      <linearGradient id={GRADIENT_IDS.scope3} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={CHART.scope3} stopOpacity={0.85} />
        <stop offset="100%" stopColor={CHART.scope3} stopOpacity={0.06} />
      </linearGradient>
      <linearGradient id={GRADIENT_IDS.total} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={CHART.brand} stopOpacity={0.55} />
        <stop offset="100%" stopColor={CHART.brand} stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id={GRADIENT_IDS.actual} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={CHART.actual} stopOpacity={0.8} />
        <stop offset="100%" stopColor={CHART.actual} stopOpacity={0.05} />
      </linearGradient>
      <linearGradient id={GRADIENT_IDS.teal} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={CHART.teal} stopOpacity={0.75} />
        <stop offset="100%" stopColor={CHART.teal} stopOpacity={0.06} />
      </linearGradient>
      <linearGradient id={GRADIENT_IDS.brand} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={CHART.scope2} />
        <stop offset="100%" stopColor={CHART.scope3} />
      </linearGradient>
    </defs>
  );
}

export { ChartTooltip, qualityColor };

"use client";

import { useId, type ReactElement } from "react";
import { GRADIENT_IDS, CHART, qualityColor } from "@/lib/chart-theme";
import { ChartTooltip } from "@/components/dashboard/charts/chart-tooltip";

export type ChartGradientIds = Record<keyof typeof GRADIENT_IDS, string>;

/** Unique gradient IDs per chart instance (avoids cross-SVG url(#id) collisions). */
export function useChartGradients(prefix = "cg"): { ids: ChartGradientIds; Defs: () => ReactElement } {
  const uid = useId().replace(/:/g, "");
  const p = `${prefix}${uid}`;
  const ids: ChartGradientIds = {
    scope1: `${p}-s1`,
    scope2: `${p}-s2`,
    scope3: `${p}-s3`,
    total: `${p}-tot`,
    brand: `${p}-br`,
    actual: `${p}-ac`,
    teal: `${p}-te`,
    barActual: `${p}-ba`,
    barBrand: `${p}-bb`,
    barTeal: `${p}-bt`,
    barAccent: `${p}-bac`,
    barScope3: `${p}-bs3`,
    projected: `${p}-pr`,
    targetBand: `${p}-tb`,
  };

  function Defs() {
    return (
      <defs>
        <linearGradient id={ids.scope1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART.scope1} stopOpacity={0.85} />
          <stop offset="100%" stopColor={CHART.scope1} stopOpacity={0.05} />
        </linearGradient>
        <linearGradient id={ids.scope2} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART.scope2} stopOpacity={0.9} />
          <stop offset="100%" stopColor={CHART.scope2} stopOpacity={0.08} />
        </linearGradient>
        <linearGradient id={ids.scope3} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART.scope3} stopOpacity={0.85} />
          <stop offset="100%" stopColor={CHART.scope3} stopOpacity={0.06} />
        </linearGradient>
        <linearGradient id={ids.total} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART.brand} stopOpacity={0.55} />
          <stop offset="100%" stopColor={CHART.brand} stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id={ids.actual} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART.actual} stopOpacity={0.8} />
          <stop offset="100%" stopColor={CHART.actual} stopOpacity={0.05} />
        </linearGradient>
        <linearGradient id={ids.teal} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART.teal} stopOpacity={0.75} />
          <stop offset="100%" stopColor={CHART.teal} stopOpacity={0.06} />
        </linearGradient>
        <linearGradient id={ids.brand} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={CHART.scope2} />
          <stop offset="100%" stopColor={CHART.scope3} />
        </linearGradient>
        <linearGradient id={ids.projected} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART.projected} stopOpacity={0.35} />
          <stop offset="100%" stopColor={CHART.projected} stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id={ids.targetBand} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART.target} stopOpacity={0.12} />
          <stop offset="100%" stopColor={CHART.baseline} stopOpacity={0.08} />
        </linearGradient>
        <linearGradient id={ids.barActual} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={CHART.actual} stopOpacity={0.85} />
          <stop offset="100%" stopColor={CHART.actualLight} stopOpacity={1} />
        </linearGradient>
        <linearGradient id={ids.barBrand} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={CHART.brandDark} stopOpacity={0.95} />
          <stop offset="100%" stopColor={CHART.brand} stopOpacity={1} />
        </linearGradient>
        <linearGradient id={ids.barTeal} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={CHART.teal} stopOpacity={0.9} />
          <stop offset="100%" stopColor="#5eead4" stopOpacity={1} />
        </linearGradient>
        <linearGradient id={ids.barAccent} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART.accent} stopOpacity={0.95} />
          <stop offset="100%" stopColor={CHART.accentLight} stopOpacity={0.85} />
        </linearGradient>
        <linearGradient id={ids.barScope3} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART.scope3} stopOpacity={0.95} />
          <stop offset="100%" stopColor={CHART.scope3Light} stopOpacity={0.7} />
        </linearGradient>
      </defs>
    );
  }

  return { ids, Defs };
}

/** @deprecated Prefer useChartGradients() for unique IDs. Kept for simple single-chart callers. */
export function ChartGradients() {
  const { Defs } = useChartGradients("legacy");
  return <Defs />;
}

export { ChartTooltip, qualityColor };

/** Industry-grade chart design tokens for carbon intelligence dashboards */

export const CHART = {
  scope1: "#334155",
  scope1Light: "#64748b",
  scope2: "#22c55e",
  scope2Light: "#86efac",
  scope3: "#059669",
  scope3Light: "#6ee7b7",
  brand: "#82D153",
  brandDark: "#5cb832",
  target: "#ef4444",
  targetLight: "#fca5a5",
  baseline: "#94a3b8",
  actual: "#3b82f6",
  actualLight: "#93c5fd",
  projected: "#f59e0b",
  accent: "#8b5cf6",
  accentLight: "#c4b5fd",
  indigo: "#6366f1",
  teal: "#14b8a6",
  grid: "#e2e8f0",
  tick: "#64748b",
  tooltipBg: "#ffffff",
} as const;

export const SCOPE_COLORS = [CHART.scope1, CHART.scope2, CHART.scope3] as const;

export const CHART_AXIS = {
  tick: { fontSize: 11, fill: CHART.tick, fontWeight: 500 },
  axisLine: false,
  tickLine: false,
};

export const CHART_GRID = {
  strokeDasharray: "3 3",
  stroke: CHART.grid,
  vertical: false,
};

export const GRADIENT_IDS = {
  scope1: "gradScope1",
  scope2: "gradScope2",
  scope3: "gradScope3",
  total: "gradTotal",
  brand: "gradBrand",
  actual: "gradActual",
  teal: "gradTeal",
} as const;

export function chartTooltipFormatter(value: number, unit = "tCO₂e") {
  return [`${value.toFixed(1)} ${unit}`, ""];
}

/** Quality score → heatmap color */
export function qualityColor(score: number): string {
  if (score >= 85) return "#16a34a";
  if (score >= 70) return "#82D153";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

/** Bar chart palette for categorical data */
export const BAR_PALETTE = [
  CHART.scope2,
  CHART.actual,
  CHART.accent,
  CHART.teal,
  CHART.scope3,
  CHART.indigo,
  CHART.projected,
  CHART.scope1Light,
];

/** Chart tokens — greens match logo #82D153 */

export const BRAND_GREEN = "#82D153";
export const BRAND_GREEN_DARK = "#5cb832";
export const BRAND_GREEN_LIGHT = "#b8e69a";

export const CHART = {
  scope1: "#334155",
  scope1Light: "#64748b",
  scope2: BRAND_GREEN,
  scope2Light: BRAND_GREEN_LIGHT,
  scope3: "#0f766e",
  scope3Light: "#5eead4",
  brand: BRAND_GREEN,
  brandDark: BRAND_GREEN_DARK,
  target: "#ef4444",
  targetLight: "#fca5a5",
  baseline: "#94a3b8",
  actual: "#334155",
  actualLight: "#94a3b8",
  projected: "#f59e0b",
  accent: BRAND_GREEN,
  accentLight: BRAND_GREEN_LIGHT,
  indigo: "#004d40",
  teal: "#008e7b",
  grid: "#e2e8f0",
  tick: "#64748b",
  tooltipBg: "#ffffff",
} as const;

export const SCOPE_COLORS = [CHART.scope1, CHART.scope2, CHART.scope3] as const;

export const CHART_AXIS = {
  tick: { fontSize: 11, fill: CHART.tick, fontWeight: 500 },
  axisLine: false as const,
  tickLine: false as const,
};

export const CHART_GRID = {
  strokeDasharray: "4 6",
  stroke: CHART.grid,
  vertical: false,
  strokeOpacity: 0.85,
};

export const GRADIENT_IDS = {
  scope1: "gradScope1",
  scope2: "gradScope2",
  scope3: "gradScope3",
  total: "gradTotal",
  brand: "gradBrand",
  actual: "gradActual",
  teal: "gradTeal",
  barActual: "gradBarActual",
  barBrand: "gradBarBrand",
  barTeal: "gradBarTeal",
  barAccent: "gradBarAccent",
  barScope3: "gradBarScope3",
  projected: "gradProjected",
  targetBand: "gradTargetBand",
} as const;

export function chartTooltipFormatter(value: number, unit = "tCO₂e") {
  return [`${value.toFixed(1)} ${unit}`, ""];
}

/** Compact KPI / axis / label formatter for chart chrome */
export function formatChartValue(value: number, digits = 1): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${(value / 1_000).toFixed(1)}k`;
  if (abs >= 1000) return `${(value / 1_000).toFixed(2)}k`;
  return value.toFixed(digits);
}

/** Quality score → heatmap color */
export function qualityColor(score: number): string {
  if (score >= 85) return BRAND_GREEN_DARK;
  if (score >= 70) return BRAND_GREEN;
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

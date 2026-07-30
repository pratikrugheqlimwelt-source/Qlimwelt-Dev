"use client";

import { CHART, formatChartValue } from "@/lib/chart-theme";

type TreemapNode = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  size?: number;
  value?: number;
  depth?: number;
  index?: number;
};

const SCOPE_FILL: Record<string, string> = {
  scope1: CHART.scope1,
  "scope 1": CHART.scope1,
  scope2: CHART.scope2,
  "scope 2": CHART.scope2,
  scope3: CHART.scope3,
  "scope 3": CHART.scope3,
};

export function colorForTreemapName(name: string, index = 0): string {
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(SCOPE_FILL)) {
    if (lower.startsWith(key) || lower.includes(`${key} /`) || lower.includes(`${key}/`)) {
      return color;
    }
  }
  const palette = [CHART.scope2, CHART.actual, CHART.accent, CHART.teal, CHART.scope3, CHART.indigo];
  return palette[index % palette.length];
}

function splitLabel(name: string): { scope: string; category: string } {
  const parts = name.split(/\s*\/\s*/);
  if (parts.length >= 2) {
    return { scope: parts[0].trim(), category: parts.slice(1).join(" / ").trim() };
  }
  return { scope: "", category: name };
}

/** Custom Recharts Treemap leaf — theme sans font via foreignObject for clear readable labels. */
export function TreemapTile(props: TreemapNode) {
  const { x = 0, y = 0, width = 0, height = 0, name = "", size, value, depth, index = 0 } = props;
  if (depth !== 1 || width < 2 || height < 2) return null;

  const fill = colorForTreemapName(name, index);
  const displayValue = size ?? value ?? 0;
  const pad = 8;
  const innerW = Math.max(0, width - pad * 2);
  const innerH = Math.max(0, height - pad * 2);
  const { scope, category } = splitLabel(name);

  const roomy = innerW >= 88 && innerH >= 64;
  const medium = innerW >= 72 && innerH >= 44;
  const compact = innerW >= 52 && innerH >= 32;
  const showLabel = roomy || medium || compact;

  return (
    <g style={{ cursor: "pointer" }}>
      <title>{`${name}: ${displayValue.toFixed(2)} tCO₂e`}</title>
      <rect
        x={x + 1.5}
        y={y + 1.5}
        width={Math.max(0, width - 3)}
        height={Math.max(0, height - 3)}
        rx={8}
        ry={8}
        fill={fill}
        fillOpacity={0.94}
        stroke="#fff"
        strokeWidth={2}
      />
      {showLabel && (
        <foreignObject x={x + pad} y={y + pad} width={innerW} height={innerH}>
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: roomy ? "flex-start" : "center",
              gap: roomy ? 4 : 2,
              overflow: "hidden",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              color: "#fff",
              lineHeight: 1.25,
              pointerEvents: "none",
            }}
          >
            {scope && (roomy || medium) && (
              <span
                style={{
                  fontSize: roomy ? 11 : 10,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  opacity: 0.8,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {scope}
              </span>
            )}
            <span
              style={{
                fontSize: roomy ? 14 : medium ? 13 : 12,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: roomy ? 2 : 1,
                WebkitBoxOrient: "vertical",
                wordBreak: "break-word",
              }}
            >
              {category || name}
            </span>
            {(roomy || medium) && (
              <span
                style={{
                  marginTop: roomy ? 2 : 0,
                  fontSize: roomy ? 15 : 13,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                  opacity: 0.95,
                  whiteSpace: "nowrap",
                }}
              >
                {formatChartValue(displayValue)} t
              </span>
            )}
            {compact && !medium && !roomy && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatChartValue(displayValue)}
              </span>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

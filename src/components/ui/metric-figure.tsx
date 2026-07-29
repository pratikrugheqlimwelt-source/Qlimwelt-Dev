import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type MetricFigureSize = "sm" | "md" | "lg" | "xl" | "hero";

const SIZE: Record<MetricFigureSize, string> = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl sm:text-4xl",
  hero: "text-4xl sm:text-5xl lg:text-6xl",
};

/** Split "106.8 tCO₂e" / "12.4k tCO₂e" / "74%" into value + unit for professional display. */
export function splitMetricLabel(text: string): { value: string; unit?: string } {
  const trimmed = text.trim();

  const pctTight = trimmed.match(/^([+\-−]?[\d.,]+)\s*%$/);
  if (pctTight) return { value: pctTight[1], unit: "%" };

  const match = trimmed.match(
    /^([+\-−]?[\d.,]+k?)\s+(tCO₂e(?:\/yr)?|t\/€M|t|%|pts?|yr|years?)$/i
  );
  if (match) return { value: match[1], unit: match[2] };

  const co2 = trimmed.match(/^(.+?)\s+(tCO₂e(?:\/yr)?)$/i);
  if (co2) return { value: co2[1], unit: co2[2] };

  const currency = trimmed.match(/^([€$£])([\d.,]+[kKmMbB]?)$/);
  if (currency) return { value: `${currency[1]}${currency[2]}` };

  const spaced = trimmed.match(/^(.+?)\s+([^\d\s][^\s]*)$/);
  if (spaced && /[a-zA-Z₂€$%]/.test(spaced[2])) {
    return { value: spaced[1], unit: spaced[2] };
  }

  return { value: trimmed };
}

type MetricFigureProps = {
  /** Full string e.g. "106.8 tCO₂e", or pass value+unit separately. */
  children?: string;
  value?: string | number;
  unit?: string;
  size?: MetricFigureSize;
  className?: string;
  valueClassName?: string;
  unitClassName?: string;
  style?: CSSProperties;
  as?: "span" | "p" | "div";
};

/**
 * Professional emission / KPI figure: clear Plus Jakarta digits + subdued unit.
 * Example: 106.8 tCO₂e
 */
export function MetricFigure({
  children,
  value,
  unit,
  size = "md",
  className,
  valueClassName,
  unitClassName,
  style,
  as: Tag = "span",
}: MetricFigureProps) {
  const raw =
    value !== undefined
      ? unit
        ? `${value} ${unit}`
        : String(value)
      : (children ?? "");
  const parts =
    unit !== undefined && value !== undefined
      ? { value: String(value), unit }
      : splitMetricLabel(raw);

  return (
    <Tag className={cn("metric-figure", SIZE[size], className)} style={style}>
      <span className={cn("metric-figure-value", valueClassName)}>{parts.value}</span>
      {parts.unit ? (
        <span className={cn("metric-figure-unit", unitClassName)}>{parts.unit}</span>
      ) : null}
    </Tag>
  );
}

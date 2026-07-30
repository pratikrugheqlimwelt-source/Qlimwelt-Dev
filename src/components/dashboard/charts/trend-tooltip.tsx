"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

interface TrendTooltipProps {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[];
  label?: string;
  unit?: string;
  /** Full row from monthlyTrend for rich context */
  row?: {
    monthLabel?: string;
    total?: number;
    momChange?: number;
    yoyChange?: number;
    rollingAvg?: number;
    previousYear?: number;
    target?: number;
    scope1?: number;
    scope2?: number;
    scope3?: number;
  };
}

export function TrendTooltip({ active, payload, label, unit = "tCO₂e", row }: TrendTooltipProps) {
  const t = useT();
  if (!active || !payload?.length) return null;

  const monthLabel = row?.monthLabel ?? label;

  return (
    <div className="min-w-[200px] rounded-xl border border-border/60 bg-white px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.15)]">
      <p className="mb-2 text-sm font-bold">{monthLabel} 2024</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color ?? "#82D153" }} />
            <span className="text-xs text-muted-foreground">{entry.name ?? entry.dataKey}</span>
          </div>
          <span className="dash-num text-xs">
            {(entry.value ?? 0).toFixed(2)} {unit}
          </span>
        </div>
      ))}
      {row && (
        <div className="mt-2 space-y-1 border-t border-border/40 pt-2 text-[11px]">
          {row.total !== undefined && (
            <div className="flex justify-between">
              <span className="font-medium text-foreground">{t("overview.charts.total")}</span>
              <span className="dash-num">{row.total.toFixed(2)} {unit}</span>
            </div>
          )}
          {row.momChange !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("overview.charts.momChange")}</span>
              <span className={cn("dash-num", row.momChange <= 0 ? "text-green-600" : "text-red-600")}>
                {row.momChange >= 0 ? "+" : ""}{row.momChange.toFixed(1)}%
              </span>
            </div>
          )}
          {row.yoyChange !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("overview.charts.vsPriorYear")}</span>
              <span className={cn("dash-num", row.yoyChange <= 0 ? "text-green-600" : "text-red-600")}>
                {row.yoyChange >= 0 ? "+" : ""}{row.yoyChange.toFixed(1)}%
              </span>
            </div>
          )}
          {row.rollingAvg !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("overview.charts.threeMoAvg")}</span>
              <span className="dash-num">{row.rollingAvg.toFixed(2)} {unit}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

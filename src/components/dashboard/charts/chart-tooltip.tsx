"use client";

import { cn } from "@/lib/utils";

interface ChartTooltipProps {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[];
  label?: string;
  unit?: string;
  formatter?: (value: number) => string;
}

export function ChartTooltip({ active, payload, label, unit = "tCO₂e", formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-white px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.12)]">
      {label && <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>}
      <div className="space-y-1.5">
        {payload.map((entry, i) => {
          const val = entry.value ?? 0;
          const display = formatter ? formatter(val) : `${val.toFixed(1)} ${unit}`;
          return (
            <div key={i} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color ?? "#82D153" }} />
                <span className="text-xs text-muted-foreground">{entry.name ?? entry.dataKey}</span>
              </div>
              <span className="text-xs font-semibold tabular-nums">{display}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ChartLegendProps {
  items: { label: string; color: string; dashed?: boolean }[];
  className?: string;
}

export function ChartLegendInline({ items, className }: ChartLegendProps) {
  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          {item.dashed ? (
            <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: item.color }} />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          )}
          <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

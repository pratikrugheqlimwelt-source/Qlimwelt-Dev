"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn, formatCO2, formatNumber, formatPercent } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number | string;
  unit?: string;
  change?: number;
  icon: LucideIcon;
  format?: "number" | "co2" | "score" | "text";
  className?: string;
  delay?: number;
}

export function KpiCard({
  title,
  value,
  unit,
  change,
  icon: Icon,
  format = "number",
  className,
  delay = 0,
}: KpiCardProps) {
  const formattedValue =
    format === "co2" && typeof value === "number"
      ? formatCO2(value)
      : format === "score" && typeof value === "number"
      ? `${value}/100`
      : format === "number" && typeof value === "number"
      ? formatNumber(value)
      : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("h-full", className)}
    >
      <div className="group relative flex h-full flex-col overflow-hidden border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <div className="relative flex flex-1 items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl font-bold tabular-nums tracking-tight">{formattedValue}</span>
              {unit && format !== "co2" && (
                <span className="text-sm text-muted-foreground">{unit}</span>
              )}
            </div>
            {change !== undefined && (
              <div
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  change <= 0 ? "bg-brand/10 text-brand-dark" : "bg-destructive/10 text-destructive"
                )}
              >
                {change <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                {formatPercent(change)} vs last year
              </div>
            )}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-brand/20 bg-brand/10">
            <Icon className="h-5 w-5 text-brand-dark" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

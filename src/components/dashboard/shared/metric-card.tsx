"use client";

import { InfoTip } from "@/components/ui/tooltip";
import { Sparkline } from "@/components/dashboard/charts/sparkline";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

type Accent = "brand" | "scope1" | "scope2" | "scope3" | "neutral" | "warning" | "success" | "indigo" | "teal";

const ACCENT_STYLES: Record<Accent, {
  bar: string;
  icon: string;
  glow: string;
  spark: string;
  bg: string;
}> = {
  brand: {
    bar: "bg-gradient-to-b from-[#82D153] to-[#5cb832]",
    icon: "bg-gradient-to-br from-[#82D153]/20 to-[#5cb832]/10 text-[#3d8b2e] ring-1 ring-[#82D153]/30",
    glow: "from-[#82D153]/15 to-transparent",
    spark: "#82D153",
    bg: "from-[#82D153]/[0.06] to-white",
  },
  scope1: {
    bar: "bg-gradient-to-b from-slate-700 to-slate-900",
    icon: "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 ring-1 ring-slate-300/50",
    glow: "from-slate-400/10 to-transparent",
    spark: "#334155",
    bg: "from-slate-50 to-white",
  },
  scope2: {
    bar: "bg-gradient-to-b from-[#86efac] to-[#22c55e]",
    icon: "bg-gradient-to-br from-green-50 to-emerald-100 text-green-700 ring-1 ring-green-200/60",
    glow: "from-green-400/12 to-transparent",
    spark: "#22c55e",
    bg: "from-green-50/80 to-white",
  },
  scope3: {
    bar: "bg-gradient-to-b from-emerald-400 to-emerald-700",
    icon: "bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-700 ring-1 ring-emerald-200/60",
    glow: "from-emerald-400/12 to-transparent",
    spark: "#059669",
    bg: "from-emerald-50/60 to-white",
  },
  neutral: {
    bar: "bg-gradient-to-b from-slate-300 to-slate-400",
    icon: "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600 ring-1 ring-slate-200",
    glow: "from-slate-200/20 to-transparent",
    spark: "#64748b",
    bg: "from-slate-50/50 to-white",
  },
  warning: {
    bar: "bg-gradient-to-b from-amber-400 to-orange-500",
    icon: "bg-gradient-to-br from-amber-50 to-orange-100 text-amber-700 ring-1 ring-amber-200/60",
    glow: "from-amber-400/12 to-transparent",
    spark: "#f59e0b",
    bg: "from-amber-50/60 to-white",
  },
  success: {
    bar: "bg-gradient-to-b from-[#82D153] to-[#3d8b2e]",
    icon: "bg-gradient-to-br from-green-50 to-[#82D153]/20 text-[#3d8b2e] ring-1 ring-[#82D153]/30",
    glow: "from-[#82D153]/12 to-transparent",
    spark: "#5cb832",
    bg: "from-green-50/60 to-white",
  },
  indigo: {
    bar: "bg-gradient-to-b from-indigo-400 to-indigo-600",
    icon: "bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-700 ring-1 ring-indigo-200/60",
    glow: "from-indigo-400/12 to-transparent",
    spark: "#6366f1",
    bg: "from-indigo-50/50 to-white",
  },
  teal: {
    bar: "bg-gradient-to-b from-teal-400 to-teal-600",
    icon: "bg-gradient-to-br from-teal-50 to-cyan-100 text-teal-700 ring-1 ring-teal-200/60",
    glow: "from-teal-400/12 to-transparent",
    spark: "#14b8a6",
    bg: "from-teal-50/50 to-white",
  },
};

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  tooltip?: string;
  trend?: number;
  icon?: LucideIcon;
  accent?: Accent;
  size?: "default" | "hero";
  sparkline?: number[];
  progress?: number;
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  label,
  value,
  sub,
  tooltip,
  trend,
  icon: Icon,
  accent = "neutral",
  size = "default",
  sparkline,
  progress,
  className,
  onClick,
}: MetricCardProps) {
  const Comp = onClick ? "button" : "div";
  const styles = ACCENT_STYLES[accent];

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "dash-metric-card group relative overflow-hidden text-left bg-gradient-to-br",
        styles.bg,
        size === "hero" && "dash-metric-card-hero",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className={cn("pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-80 blur-2xl", styles.glow)} />
      <div className={cn("absolute left-0 top-0 h-full w-1", styles.bar)} />

      <div className="relative pl-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              {tooltip && <InfoTip content={tooltip} />}
            </div>
            <p className={cn("mt-2 font-bold tabular-nums tracking-tight", size === "hero" ? "text-3xl" : "text-2xl")}>
              {value}
            </p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
            {trend !== undefined && (
              <div className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                trend <= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              )}>
                {trend <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                {Math.abs(trend).toFixed(1)}% vs prior
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110",
              styles.icon
            )}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>

        {progress !== undefined && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
              <div
                className={cn("h-full rounded-full transition-all duration-700", styles.bar)}
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>
        )}

        {sparkline && sparkline.length > 1 && (
          <div className="mt-3 -mb-1">
            <Sparkline data={sparkline} color={styles.spark} height={size === "hero" ? 56 : 44} />
          </div>
        )}
      </div>
    </Comp>
  );
}

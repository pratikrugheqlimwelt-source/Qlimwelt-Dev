"use client";

import { HelpCorner } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type AccentColor = "brand" | "blue" | "purple" | "teal" | "amber" | "slate";

const ICON_ACCENTS: Record<AccentColor, string> = {
  brand: "bg-gradient-to-br from-[#82D153]/25 to-[#5cb832]/10 text-[#3d8b2e] ring-[#82D153]/25",
  blue: "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 ring-blue-200/50",
  purple: "bg-gradient-to-br from-violet-50 to-purple-100 text-violet-700 ring-violet-200/50",
  teal: "bg-gradient-to-br from-teal-50 to-cyan-100 text-teal-700 ring-teal-200/50",
  amber: "bg-gradient-to-br from-amber-50 to-orange-100 text-amber-700 ring-amber-200/50",
  slate: "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 ring-slate-200/50",
};

const STRIPE_ACCENTS: Record<AccentColor, string> = {
  brand: "from-[#82D153] via-[#5cb832] to-emerald-600",
  blue: "from-blue-500 via-indigo-500 to-violet-500",
  purple: "from-violet-500 via-purple-500 to-fuchsia-500",
  teal: "from-teal-400 via-cyan-500 to-blue-500",
  amber: "from-amber-400 via-orange-500 to-red-400",
  slate: "from-slate-400 via-slate-500 to-slate-600",
};

interface ChartCardProps {
  title: string;
  /** Explains this chart/component on "?" hover (upper-right) */
  tip?: string;
  description?: string;
  icon?: LucideIcon;
  accent?: AccentColor;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function ChartCard({
  title,
  tip,
  description,
  icon: Icon,
  accent = "brand",
  action,
  children,
  className,
  noPadding,
}: ChartCardProps) {
  return (
    <div className={cn("dash-card relative overflow-hidden", className)}>
      <div className={cn("h-1 w-full bg-gradient-to-r", STRIPE_ACCENTS[accent])} />
      <div className="relative flex items-start justify-between gap-4 border-b border-border/30 bg-gradient-to-r from-muted/20 to-transparent px-5 py-4 pr-12">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 shadow-sm", ICON_ACCENTS[accent])}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action && <div className="mr-1 shrink-0">{action}</div>}
        {tip && <HelpCorner content={tip} className="right-3 top-3" />}
      </div>
      <div className={cn(noPadding ? "" : "p-5")}>{children}</div>
    </div>
  );
}

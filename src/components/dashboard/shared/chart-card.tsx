"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { InfoTip } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

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
  /** Extra detail shown in the expanded popup (falls back to tip) */
  details?: string;
  icon?: LucideIcon;
  accent?: AccentColor;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  /** Hide the expand (+) control when false */
  expandable?: boolean;
}

export function ChartCard({
  title,
  tip,
  description,
  details,
  icon: Icon,
  accent = "brand",
  action,
  children,
  className,
  noPadding,
  expandable = true,
}: ChartCardProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const infoText = details ?? tip ?? description;

  return (
    <>
      <div className={cn("dash-card relative overflow-hidden", className)}>
        <div className={cn("h-1 w-full bg-gradient-to-r", STRIPE_ACCENTS[accent])} />
        <div className="relative flex items-start justify-between gap-4 border-b border-border/30 bg-gradient-to-r from-muted/20 to-transparent px-5 py-4 pr-24">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 shadow-sm", ICON_ACCENTS[accent])}>
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
              {description && <p className="mt-1 text-sm leading-snug text-muted-foreground">{description}</p>}
            </div>
          </div>
          {action && <div className="mr-1 shrink-0">{action}</div>}
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
            {expandable && (
              <InfoTip content={t("common.expandChart")} side="left">
                <button
                  type="button"
                  aria-label={t("common.expandChart")}
                  onClick={() => setOpen(true)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:border-[#82D153]/50 hover:bg-[#82D153]/10 hover:text-[#3d8b2e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82D153]/40"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </InfoTip>
            )}
            {tip && <InfoTip content={tip} side="left" />}
          </div>
        </div>
        <div className={cn(noPadding ? "" : "p-5")}>
          {open ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center text-sm text-muted-foreground">
              {t("common.chartExpanded")}
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <div className={cn("h-1.5 w-full shrink-0 bg-gradient-to-r", STRIPE_ACCENTS[accent])} />
          <DialogHeader>
            <div className="flex items-start gap-3">
              {Icon && (
                <div className={cn("mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 shadow-sm", ICON_ACCENTS[accent])}>
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <DialogTitle>{title}</DialogTitle>
                {(description || tip) && (
                  <DialogDescription className="mt-1.5">
                    {description ?? tip}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          {infoText && (
            <div className="mx-6 mt-4 shrink-0 rounded-xl border border-slate-200/80 bg-slate-50/90 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                {t("common.chartDetails")}
              </p>
              <p className="mt-1.5 font-sans text-sm leading-relaxed text-slate-700">{infoText}</p>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
            <div className="chart-expand-view w-full">
              {open ? children : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

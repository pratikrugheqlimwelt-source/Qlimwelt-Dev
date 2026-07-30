"use client";

import { cn } from "@/lib/utils";
import { useDomainT } from "@/lib/i18n/use-domain-t";

type Scope = "scope1" | "scope2" | "scope3" | "1" | "2" | "3";

const STYLES: Record<string, string> = {
  scope1: "bg-slate-900/10 text-slate-800 border-slate-900/20",
  scope2: "bg-brand/15 text-brand-dark border-brand/25",
  scope3: "bg-emerald-700/10 text-emerald-800 border-emerald-700/20",
  "1": "bg-slate-900/10 text-slate-800 border-slate-900/20",
  "2": "bg-brand/15 text-brand-dark border-brand/25",
  "3": "bg-emerald-700/10 text-emerald-800 border-emerald-700/20",
};

export function ScopeBadge({ scope, className }: { scope: string; className?: string }) {
  const d = useDomainT();
  const key = scope.replace(/\s/g, "").toLowerCase();
  const label = d.scope(scope);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        STYLES[key] ?? STYLES.scope3,
        className
      )}
    >
      {label}
    </span>
  );
}

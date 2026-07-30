"use client";

import { cn } from "@/lib/utils";
import { resolveActivityIcon } from "@/lib/carbon/activity-icons";
import type { ActivityPreset } from "@/lib/carbon/activity-presets";
import { useDomainT } from "@/lib/i18n/use-domain-t";

type ActivityTypeCardsProps = {
  presets: ActivityPreset[];
  value: string;
  onChange: (id: string) => void;
};

export function ActivityTypeCards({ presets, value, onChange }: ActivityTypeCardsProps) {
  const d = useDomainT();

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {presets.map((preset) => {
        const Icon = resolveActivityIcon(`${preset.id} ${preset.label} ${preset.category}`);
        const selected = value === preset.id;
        const localized = d.preset(preset.id);
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
            className={cn(
              "group relative flex flex-col gap-3 rounded-2xl border p-4 text-left transition-all",
              selected
                ? "border-brand/40 bg-brand-light/70 shadow-sm ring-1 ring-brand/20"
                : "border-border bg-background hover:border-brand/25 hover:bg-muted/30"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl ring-1 transition-colors",
                  selected
                    ? "bg-brand/15 text-brand-dark ring-brand/25"
                    : "bg-muted/60 text-muted-foreground ring-border group-hover:bg-brand/10 group-hover:text-brand-dark"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  preset.scope === "scope1" && "bg-slate-100 text-slate-700",
                  preset.scope === "scope2" && "bg-emerald-50 text-emerald-700",
                  preset.scope === "scope3" && "bg-teal-50 text-teal-700"
                )}
              >
                {d.scope(preset.scope)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">{localized.label}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{localized.hint}</p>
            </div>
            {selected && (
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-brand" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}

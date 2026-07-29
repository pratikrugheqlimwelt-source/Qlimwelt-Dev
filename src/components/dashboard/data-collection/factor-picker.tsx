"use client";

import { useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { resolveActivityIcon } from "@/lib/carbon/activity-icons";
import type { EmissionFactor } from "@/types/carbon";

type FactorPickerProps = {
  factors: EmissionFactor[];
  value: string;
  onChange: (id: string) => void;
};

export function FactorPicker({ factors, value, onChange }: FactorPickerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = factors.slice(0, 80);
    if (!q) return list;
    return list.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.source.toLowerCase().includes(q) ||
        f.subcategory.toLowerCase().includes(q)
    );
  }, [factors, query]);

  const selected = factors.find((f) => f.id === value);

  return (
    <div className="space-y-3">
      {selected && (
        <div className="flex items-center gap-3 rounded-xl border border-brand/30 bg-brand-light/60 px-3 py-2.5">
          {(() => {
            const Icon = resolveActivityIcon(`${selected.category} ${selected.name}`);
            return (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand-dark ring-1 ring-brand/20">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
            );
          })()}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{selected.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {selected.value} kgCO₂e/{selected.denominatorUnit} · {selected.source}
            </p>
          </div>
          <button
            type="button"
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
            onClick={() => onChange("")}
          >
            Clear
          </button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search factors by name, category, source…"
          className="pl-9"
        />
      </div>

      <div className="max-h-56 overflow-y-auto rounded-2xl border border-border bg-background">
        <button
          type="button"
          onClick={() => onChange("")}
          className={cn(
            "flex w-full items-center gap-3 border-b border-border/60 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/40",
            !value && "bg-muted/30"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <SlidersFallback />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Template / manual factor</p>
            <p className="text-[11px] text-muted-foreground">Use the selected activity card defaults</p>
          </div>
          {!value && <Check className="h-4 w-4 shrink-0 text-brand-dark" />}
        </button>

        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">No factors match your search.</p>
        ) : (
          filtered.map((f) => {
            const Icon = resolveActivityIcon(`${f.category} ${f.name} ${f.subcategory}`);
            const active = value === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange(f.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-border/40 px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/40",
                  active && "bg-brand-light/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                    active
                      ? "bg-brand/15 text-brand-dark ring-brand/25"
                      : "bg-muted/70 text-muted-foreground ring-border"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {f.category} · {f.value} kgCO₂e/{f.denominatorUnit} · {f.source}
                  </p>
                </div>
                {active && <Check className="h-4 w-4 shrink-0 text-brand-dark" />}
              </button>
            );
          })
        )}
      </div>
      <p className="text-xs text-muted-foreground">Add custom factors in Settings — they appear here automatically.</p>
    </div>
  );
}

function SlidersFallback() {
  const Icon = resolveActivityIcon("custom");
  return <Icon className="h-4 w-4" strokeWidth={1.75} />;
}

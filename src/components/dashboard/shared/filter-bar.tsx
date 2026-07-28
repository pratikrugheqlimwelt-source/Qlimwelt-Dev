"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Filter, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_FILTERS } from "@/types/carbon";
import { PERIODS, COUNTRIES, SCOPES } from "@/data/carbon";
import { cn } from "@/lib/utils";

export function FilterBar() {
  const { filters, setFilters, facilities, businessUnits } = useDashboard();
  const [open, setOpen] = useState(false);

  const categories = [
    "all", "Stationary combustion", "Mobile combustion", "Purchased electricity",
    "Category 1", "Category 4", "Category 6", "Category 7",
  ];

  const activeCount = Object.entries(filters).filter(([k, v]) => k !== "period" && v !== "all").length;

  return (
    <div className="dash-card overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-border/40 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand-dark">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Data filters</p>
            <p className="text-xs text-muted-foreground">
              {filters.period === "all" ? "Full year 2024" : filters.period}
              {activeCount > 0 && ` · ${activeCount} active`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Badge variant="secondary" className="hidden font-mono text-[10px] sm:inline-flex">
              {activeCount} filtered
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="hidden h-8 text-xs sm:flex" onClick={() => setFilters(DEFAULT_FILTERS)}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
          <Button variant="outline" size="sm" className="h-8 lg:hidden" onClick={() => setOpen(!open)}>
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            {open ? "Hide" : "Show"}
            {open ? <ChevronUp className="ml-1 h-3.5 w-3.5" /> : <ChevronDown className="ml-1 h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <div className={cn("px-5 pb-5 pt-4", open ? "block" : "hidden lg:block")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect label="Period" value={filters.period} onChange={(v) => setFilters({ period: v })} options={PERIODS.map((p) => ({ value: p, label: p === "all" ? "Full year 2024" : p }))} />
          <FilterSelect label="Facility" value={filters.facilityId} onChange={(v) => setFilters({ facilityId: v })} options={[{ value: "all", label: "All facilities" }, ...facilities.map((f) => ({ value: f.id, label: f.name }))]} />
          <FilterSelect label="Country" value={filters.country} onChange={(v) => setFilters({ country: v })} options={COUNTRIES.map((c) => ({ value: c, label: c === "all" ? "All countries" : c }))} />
          <FilterSelect label="Business unit" value={filters.businessUnitId} onChange={(v) => setFilters({ businessUnitId: v })} options={[{ value: "all", label: "All units" }, ...businessUnits.map((b) => ({ value: b.id, label: b.name }))]} />
          <FilterSelect label="Scope" value={filters.scope} onChange={(v) => setFilters({ scope: v })} options={SCOPES.map((s) => ({ value: s, label: s === "all" ? "All scopes" : s.replace("scope", "Scope ") }))} />
          <FilterSelect label="Category" value={filters.category} onChange={(v) => setFilters({ category: v })} options={categories.map((c) => ({ value: c, label: c === "all" ? "All categories" : c }))} />
          <FilterSelect label="Data quality" value={filters.dataQuality} onChange={(v) => setFilters({ dataQuality: v })} options={[{ value: "all", label: "All quality" }, { value: "high", label: "High" }, { value: "good", label: "Good" }, { value: "moderate", label: "Moderate" }, { value: "low", label: "Low" }]} />
          <FilterSelect label="Method" value={filters.method} onChange={(v) => setFilters({ method: v })} options={[{ value: "all", label: "All methods" }, { value: "fuel_based", label: "Fuel based" }, { value: "location_based", label: "Location based" }, { value: "spend_based", label: "Spend based" }, { value: "distance_based", label: "Distance based" }]} />
        </div>
        <div className="mt-4 flex justify-end lg:hidden">
          <Button variant="outline" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Reset filters
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full border-border/60 bg-background text-xs shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Filter, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { useT } from "@/components/i18n/locale-provider";
import { useDomainT } from "@/lib/i18n/use-domain-t";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCorner } from "@/components/ui/tooltip";
import { DEFAULT_FILTERS } from "@/types/carbon";
import { PERIODS, COUNTRIES, SCOPES } from "@/data/carbon";
import { cn } from "@/lib/utils";

const CATEGORY_KEYS: Record<string, string> = {
  "Stationary combustion": "filters.categoryStationaryCombustion",
  "Mobile combustion": "filters.categoryMobileCombustion",
  "Purchased electricity": "filters.categoryPurchasedElectricity",
  "Category 1": "filters.category1",
  "Category 4": "filters.category4",
  "Category 6": "filters.category6",
  "Category 7": "filters.category7",
};

export function FilterBar() {
  const { filters, setFilters, facilities, businessUnits } = useDashboard();
  const [open, setOpen] = useState(false);
  const t = useT();
  const d = useDomainT();

  const categories = [
    "all", "Stationary combustion", "Mobile combustion", "Purchased electricity",
    "Category 1", "Category 4", "Category 6", "Category 7",
  ];

  const activeCount = Object.entries(filters).filter(([k, v]) => k !== "period" && v !== "all").length;

  const scopeLabel = (s: string) => {
    if (s === "all") return t("filters.allScopes");
    if (s === "scope1") return t("overview.scope1");
    if (s === "scope2") return t("overview.scope2");
    if (s === "scope3") return t("overview.scope3");
    return s;
  };

  const categoryLabel = (c: string) => {
    if (c === "all") return t("filters.allCategories");
    const key = CATEGORY_KEYS[c];
    return key ? t(key) : c;
  };

  return (
    <div className="dash-card relative overflow-hidden">
      <HelpCorner
        content={t("filters.helpTooltip")}
        className="right-3 top-3"
      />
      <div className="flex items-center justify-between gap-4 border-b border-border/40 px-5 py-3.5 pr-12">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand-dark">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{t("filters.title")}</p>
            <p className="text-xs text-muted-foreground">
              {filters.period === "all" ? t("filters.fullYear2024") : filters.period}
              {activeCount > 0 && ` · ${t("filters.activeCount", { count: activeCount })}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Badge variant="secondary" className="hidden font-mono text-[10px] sm:inline-flex">
              {t("filters.filteredBadge", { count: activeCount })}
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="hidden h-8 text-xs sm:flex" onClick={() => setFilters(DEFAULT_FILTERS)}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {t("filters.reset")}
          </Button>
          <Button variant="outline" size="sm" className="h-8 lg:hidden" onClick={() => setOpen(!open)}>
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            {open ? t("filters.hide") : t("filters.show")}
            {open ? <ChevronUp className="ml-1 h-3.5 w-3.5" /> : <ChevronDown className="ml-1 h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <div className={cn("px-5 pb-5 pt-4", open ? "block" : "hidden lg:block")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect label={t("filters.period")} value={filters.period} onChange={(v) => setFilters({ period: v })} options={PERIODS.map((p) => ({ value: p, label: p === "all" ? t("filters.fullYear2024") : p }))} />
          <FilterSelect label={t("filters.facility")} value={filters.facilityId} onChange={(v) => setFilters({ facilityId: v })} options={[{ value: "all", label: t("filters.allFacilities") }, ...facilities.map((f) => ({ value: f.id, label: d.source(f.name) }))]} />
          <FilterSelect label={t("filters.country")} value={filters.country} onChange={(v) => setFilters({ country: v })} options={COUNTRIES.map((c) => ({ value: c, label: c === "all" ? t("filters.allCountries") : c }))} />
          <FilterSelect label={t("filters.businessUnit")} value={filters.businessUnitId} onChange={(v) => setFilters({ businessUnitId: v })} options={[{ value: "all", label: t("filters.allUnits") }, ...businessUnits.map((b) => ({ value: b.id, label: d.source(b.name) }))]} />
          <FilterSelect label={t("filters.scope")} value={filters.scope} onChange={(v) => setFilters({ scope: v })} options={SCOPES.map((s) => ({ value: s, label: scopeLabel(s) }))} />
          <FilterSelect label={t("filters.category")} value={filters.category} onChange={(v) => setFilters({ category: v })} options={categories.map((c) => ({ value: c, label: categoryLabel(c) }))} />
          <FilterSelect label={t("filters.dataQuality")} value={filters.dataQuality} onChange={(v) => setFilters({ dataQuality: v })} options={[{ value: "all", label: t("filters.allQuality") }, { value: "high", label: t("filters.qualityHigh") }, { value: "good", label: t("filters.qualityGood") }, { value: "moderate", label: t("filters.qualityModerate") }, { value: "low", label: t("filters.qualityLow") }]} />
          <FilterSelect label={t("filters.method")} value={filters.method} onChange={(v) => setFilters({ method: v })} options={[{ value: "all", label: t("filters.allMethods") }, { value: "fuel_based", label: t("filters.methodFuelBased") }, { value: "location_based", label: t("filters.methodLocationBased") }, { value: "spend_based", label: t("filters.methodSpendBased") }, { value: "distance_based", label: t("filters.methodDistanceBased") }]} />
        </div>
        <div className="mt-4 flex justify-end lg:hidden">
          <Button variant="outline" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            {t("filters.resetFilters")}
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

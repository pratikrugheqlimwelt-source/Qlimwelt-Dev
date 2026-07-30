"use client";

import { useMemo } from "react";
import { FilterBar } from "@/components/dashboard/shared/filter-bar";
import { MetricCard } from "@/components/dashboard/shared/metric-card";
import { ChartCard } from "@/components/dashboard/shared/chart-card";
import { ScopeBadge } from "@/components/dashboard/shared/scope-badge";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/dashboard/shared/data-table";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { useT } from "@/components/i18n/locale-provider";
import { useDomainT } from "@/lib/i18n/use-domain-t";
import { activityToCalculation } from "@/lib/calculations/engine";
import { CHART, CHART_AXIS, CHART_GRID } from "@/lib/chart-theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { Factory, Zap, Cloud, BarChart3, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn, formatCO2 } from "@/lib/utils";

const SCOPE3_CAT_KEYS = [
  "Category 1", "Category 2", "Category 3", "Category 4", "Category 5",
  "Category 6", "Category 7", "Category 8", "Category 9", "Category 10",
  "Category 11", "Category 12", "Category 13", "Category 14", "Category 15",
] as const;

export default function EmissionsPage() {
  const { filteredActivities, metrics, openCalculation, deleteActivityRecord, saving, filters, setFilters } =
    useDashboard();
  const t = useT();
  const d = useDomainT();

  const handleDelete = async (id: string, source: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(t("emissions.deleteConfirm", { source: d.source(source) }))) return;
    await deleteActivityRecord(id);
  };

  const scope3Activities = useMemo(
    () => filteredActivities.filter((a) => a.scope === "scope3"),
    [filteredActivities]
  );

  const byCategory = SCOPE3_CAT_KEYS.map((cat) => {
    const rows = filteredActivities.filter((a) => a.category === cat);
    const emissions = rows.reduce((s, a) => s + activityToCalculation(a).emissionsTCO2e, 0);
    const spendBased = rows.filter((a) => a.method === "spend_based").length;
    const primary = rows.filter(
      (a) => a.method === "supplier_specific" || a.method === "activity_specific"
    ).length;
    return {
      categoryKey: cat,
      category: d.category(cat),
      emissions,
      records: rows.length,
      spendBased,
      primary,
      covered: emissions > 0,
    };
  });

  const activeCategories = byCategory.filter((c) => c.covered);
  const coveredCount = activeCategories.length;
  const total = metrics.totalTCO2e;
  const scope3Share = total > 0 ? Math.round((metrics.scope3 / total) * 100) : 0;
  const spendBasedShare =
    scope3Activities.length === 0
      ? 0
      : Math.round(
          (scope3Activities.filter((a) => a.method === "spend_based").length /
            scope3Activities.length) *
            100
        );
  const primaryShare =
    scope3Activities.length === 0
      ? 0
      : Math.round(
          (scope3Activities.filter(
            (a) => a.method === "supplier_specific" || a.method === "activity_specific"
          ).length /
            scope3Activities.length) *
            100
        );

  const pieData = [
    { name: t("overview.scope1"), value: metrics.scope1 },
    { name: t("overview.scope2"), value: metrics.scope2 },
    { name: t("overview.scope3"), value: metrics.scope3 },
  ];

  const focusScope3 = filters.scope === "scope3";

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.emissions.title")}
        description={t("pages.emissions.description")}
        tip={t("emissions.tip")}
        actions={
          <Button
            size="sm"
            variant={focusScope3 ? "default" : "outline"}
            onClick={() => setFilters({ scope: focusScope3 ? "all" : "scope3" })}
          >
            <Cloud className="mr-1.5 h-3.5 w-3.5" />
            {focusScope3 ? t("emissions.clearScope3Focus") : t("emissions.focusScope3")}
          </Button>
        }
      />

      <FilterBar />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          accent="scope1"
          icon={Factory}
          label={t("overview.scope1")}
          value={formatCO2(metrics.scope1)}
          tooltip={t("emissions.tipScope1")}
          sub={t("emissions.directEmissions")}
        />
        <MetricCard
          accent="scope2"
          icon={Zap}
          label={t("overview.scope2")}
          value={formatCO2(metrics.scope2)}
          tooltip={t("emissions.tipScope2")}
          sub={t("emissions.energyIndirect")}
        />
        <MetricCard
          accent="scope3"
          icon={Cloud}
          label={t("overview.scope3")}
          value={formatCO2(metrics.scope3)}
          tooltip={t("emissions.tipScope3")}
          sub={t("emissions.valueChain")}
        />
      </div>

      <section className="space-y-3">
        <SectionHeader
          title={t("emissions.scope3Management")}
          description={t("emissions.scope3ManagementDesc")}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            size="compact"
            accent="scope3"
            icon={Cloud}
            label={t("emissions.scope3Share")}
            value={`${scope3Share}%`}
            sub={t("emissions.ofTotalInventory")}
            progress={scope3Share}
            tooltip={t("emissions.scope3ShareTip")}
          />
          <MetricCard
            size="compact"
            accent={coveredCount >= 8 ? "success" : coveredCount >= 4 ? "warning" : "neutral"}
            icon={CheckCircle2}
            label={t("emissions.categoriesCovered")}
            value={`${coveredCount}/15`}
            sub={t("emissions.ghgProtocolCats")}
            progress={Math.round((coveredCount / 15) * 100)}
            tooltip={t("emissions.categoriesCoveredTip")}
          />
          <MetricCard
            size="compact"
            accent={spendBasedShare > 40 ? "warning" : "success"}
            icon={AlertTriangle}
            label={t("emissions.spendBasedShare")}
            value={`${spendBasedShare}%`}
            sub={t("emissions.ofScope3Records")}
            progress={spendBasedShare}
            tooltip={t("emissions.spendBasedShareTip")}
          />
          <MetricCard
            size="compact"
            accent={primaryShare >= 30 ? "success" : "teal"}
            icon={BarChart3}
            label={t("emissions.primaryDataShare")}
            value={`${primaryShare}%`}
            sub={t("emissions.supplierOrActivity")}
            progress={primaryShare}
            tooltip={t("emissions.primaryDataShareTip")}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("emissions.scope3Categories")} tip={t("emissions.scope3Tip")} icon={BarChart3}>
          {activeCategories.length === 0 ? (
            <div className="flex h-[280px] flex-col items-center justify-center gap-2 px-4 text-center">
              <Cloud className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">{t("emissions.scope3EmptyTitle")}</p>
              <p className="max-w-sm text-xs text-muted-foreground">{t("emissions.scope3EmptyBody")}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={activeCategories} layout="vertical">
                <CartesianGrid {...CHART_GRID} />
                <XAxis type="number" {...CHART_AXIS} />
                <YAxis dataKey="category" type="category" width={90} tick={{ fontSize: 10, fill: CHART.tick }} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(1)} tCO₂e`, ""]} />
                <Bar dataKey="emissions" fill={CHART.scope3} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title={t("emissions.scopeSplit")} tip={t("emissions.scopeSplitTip")} icon={Cloud}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                <Cell fill={CHART.scope1} />
                <Cell fill={CHART.scope2} />
                <Cell fill={CHART.scope3} />
              </Pie>
              <Tooltip formatter={(v: number) => `${v.toFixed(1)} tCO₂e`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard
        title={t("emissions.scope3Coverage")}
        tip={t("emissions.scope3CoverageTip")}
        description={t("emissions.scope3CoverageDesc", { covered: coveredCount })}
      >
        <div className="space-y-2">
          {byCategory.map((cat) => (
            <div
              key={cat.categoryKey}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border/40 px-3 py-2"
            >
              <div className="min-w-[140px] flex-1">
                <p className="text-sm font-medium">{cat.category}</p>
                <p className="text-[11px] text-muted-foreground">
                  {cat.records > 0
                    ? t("emissions.scope3CatMeta", {
                        records: cat.records,
                        spend: cat.spendBased,
                        primary: cat.primary,
                      })
                    : t("emissions.scope3CatEmpty")}
                </p>
              </div>
              <Badge variant={cat.covered ? "success" : "secondary"} className="text-[10px]">
                {cat.covered ? t("emissions.covered") : t("emissions.notCovered")}
              </Badge>
              <div className="w-full max-w-[160px]">
                <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>{formatCO2(cat.emissions)}</span>
                  <span className="dash-num">
                    {metrics.scope3 > 0 ? Math.round((cat.emissions / metrics.scope3) * 100) : 0}%
                  </span>
                </div>
                <Progress
                  value={metrics.scope3 > 0 ? (cat.emissions / metrics.scope3) * 100 : 0}
                  className="h-1.5"
                  indicatorClassName={cn(cat.covered ? "bg-emerald-600" : "bg-muted-foreground/30")}
                />
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard
        title={t("emissions.activityRecords")}
        tip={t("emissions.activityRecordsTip")}
        description={t("emissions.recordsMatching", { count: filteredActivities.length })}
      >
        <DataTable>
          <table className="w-full">
            <DataTableHeader>
              <DataTableHead>{t("emissions.colScope")}</DataTableHead>
              <DataTableHead>{t("emissions.colCategory")}</DataTableHead>
              <DataTableHead>{t("emissions.colSubcategory")}</DataTableHead>
              <DataTableHead>{t("emissions.colSource")}</DataTableHead>
              <DataTableHead>{t("emissions.colActivity")}</DataTableHead>
              <DataTableHead>tCO₂e</DataTableHead>
              <DataTableHead>{t("emissions.colMethod")}</DataTableHead>
              <DataTableHead className="w-[72px]">{t("emissions.colActions")}</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {filteredActivities.length === 0 ? (
                <DataTableRow>
                  <DataTableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    {t("emissions.recordsEmpty")}
                  </DataTableCell>
                </DataTableRow>
              ) : (
                filteredActivities.map((a) => (
                  <DataTableRow key={a.id} onClick={() => openCalculation(a)}>
                    <DataTableCell>
                      <ScopeBadge scope={a.scope} />
                    </DataTableCell>
                    <DataTableCell>{d.category(a.category)}</DataTableCell>
                    <DataTableCell className="text-muted-foreground">{d.subcategory(a.subcategory)}</DataTableCell>
                    <DataTableCell className="font-medium">{d.source(a.source)}</DataTableCell>
                    <DataTableCell>
                      {a.activityValue} {d.unit(a.activityUnit)}
                    </DataTableCell>
                    <DataTableCell className="dash-num">{activityToCalculation(a).emissionsTCO2e.toFixed(3)}</DataTableCell>
                    <DataTableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {d.method(a.method)}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                        disabled={saving}
                        onClick={(e) => void handleDelete(a.id, a.source, e)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        {t("emissions.delete")}
                      </Button>
                    </DataTableCell>
                  </DataTableRow>
                ))
              )}
            </DataTableBody>
          </table>
        </DataTable>
      </ChartCard>
    </div>
  );
}

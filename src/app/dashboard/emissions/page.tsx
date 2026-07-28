"use client";

import { FilterBar } from "@/components/dashboard/shared/filter-bar";
import { MetricCard } from "@/components/dashboard/shared/metric-card";
import { ChartCard } from "@/components/dashboard/shared/chart-card";
import { ScopeBadge } from "@/components/dashboard/shared/scope-badge";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/dashboard/shared/data-table";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { activityToCalculation } from "@/lib/calculations/engine";
import { CHART, CHART_AXIS, CHART_GRID } from "@/lib/chart-theme";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { Factory, Zap, Cloud, BarChart3 } from "lucide-react";
import { formatCO2 } from "@/lib/utils";

const SCOPE3_CATS = [
  "Category 1", "Category 2", "Category 3", "Category 4", "Category 5",
  "Category 6", "Category 7", "Category 8", "Category 9", "Category 10",
  "Category 11", "Category 12", "Category 13", "Category 14", "Category 15",
];

export default function EmissionsPage() {
  const { filteredActivities, metrics, openCalculation } = useDashboard();

  const byCategory = SCOPE3_CATS.map((cat) => ({
    category: cat,
    emissions: filteredActivities.filter((a) => a.category === cat).reduce((s, a) => s + activityToCalculation(a).emissionsTCO2e, 0),
  })).filter((c) => c.emissions > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emissions inventory"
        description="GHG Protocol-aligned breakdown of Scope 1, 2, and 3 emissions. Click any record to inspect the calculation."
      />

      <FilterBar />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard accent="scope1" icon={Factory} label="Scope 1" value={formatCO2(metrics.scope1)} tooltip="Direct — combustion, fleet, refrigerants, process" sub="Direct emissions" />
        <MetricCard accent="scope2" icon={Zap} label="Scope 2" value={formatCO2(metrics.scope2)} tooltip="Purchased electricity, heating, cooling, steam" sub="Energy indirect" />
        <MetricCard accent="scope3" icon={Cloud} label="Scope 3" value={formatCO2(metrics.scope3)} tooltip="Value chain — 15 GHG Protocol categories" sub="Value chain" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Scope 3 categories" tip="Emissions by GHG Protocol category" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byCategory} layout="vertical">
              <CartesianGrid {...CHART_GRID} />
              <XAxis type="number" {...CHART_AXIS} />
              <YAxis dataKey="category" type="category" width={80} tick={{ fontSize: 10, fill: CHART.tick }} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(1)} tCO₂e`, ""]} />
              <Bar dataKey="emissions" fill={CHART.scope3} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Scope split" tip="Proportional breakdown across scopes" icon={Cloud}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={[{ name: "Scope 1", value: metrics.scope1 }, { name: "Scope 2", value: metrics.scope2 }, { name: "Scope 3", value: metrics.scope3 }]} dataKey="value" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                <Cell fill={CHART.scope1} /><Cell fill={CHART.scope2} /><Cell fill={CHART.scope3} />
              </Pie>
              <Tooltip formatter={(v: number) => `${v.toFixed(1)} tCO₂e`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Activity records" tip="Click any row to open the calculation breakdown drawer." description={`${filteredActivities.length} records matching current filters`}>
        <DataTable>
          <table className="w-full">
            <DataTableHeader>
              <DataTableHead>Scope</DataTableHead>
              <DataTableHead>Category</DataTableHead>
              <DataTableHead>Subcategory</DataTableHead>
              <DataTableHead>Source</DataTableHead>
              <DataTableHead>Activity</DataTableHead>
              <DataTableHead>tCO₂e</DataTableHead>
              <DataTableHead>Method</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {filteredActivities.map((a) => (
                <DataTableRow key={a.id} onClick={() => openCalculation(a)}>
                  <DataTableCell><ScopeBadge scope={a.scope} /></DataTableCell>
                  <DataTableCell>{a.category}</DataTableCell>
                  <DataTableCell className="text-muted-foreground">{a.subcategory}</DataTableCell>
                  <DataTableCell className="font-medium">{a.source}</DataTableCell>
                  <DataTableCell>{a.activityValue} {a.activityUnit}</DataTableCell>
                  <DataTableCell className="tabular-nums font-semibold">{activityToCalculation(a).emissionsTCO2e.toFixed(3)}</DataTableCell>
                  <DataTableCell><Badge variant="secondary" className="text-[10px]">{a.method.replace(/_/g, " ")}</Badge></DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </table>
        </DataTable>
      </ChartCard>
    </div>
  );
}

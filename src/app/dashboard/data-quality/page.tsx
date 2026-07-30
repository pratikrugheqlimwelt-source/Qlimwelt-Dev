"use client";

import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { dataQualityScore } from "@/lib/calculations/engine";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { MetricCard } from "@/components/dashboard/shared/metric-card";
import { ChartCard } from "@/components/dashboard/shared/chart-card";
import { ScopeBadge } from "@/components/dashboard/shared/scope-badge";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/dashboard/shared/data-table";
import { useT } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/ui/badge";
import { HelpCorner } from "@/components/ui/tooltip";
import { ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";

export default function DataQualityPage() {
  const { filteredActivities } = useDashboard();
  const t = useT();

  const scores = filteredActivities.map((a) => dataQualityScore({
    completeness: a.dataQualityScore,
    recency: 85,
    factorQuality: a.emissionFactorYear >= 2024 ? 90 : 60,
    methodQuality: a.method === "spend_based" ? 40 : 85,
    evidence: a.evidenceStatus === "verified" ? 100 : a.evidenceStatus === "uploaded" ? 70 : 30,
    verification: a.evidenceStatus === "verified" ? 100 : 0,
  }));

  const avg = scores.length ? scores.reduce((s, d) => s + d.score, 0) / scores.length : 0;
  const byLabel = { high: 0, good: 0, moderate: 0, low: 0 };
  scores.forEach((s) => { byLabel[s.label]++; });

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.dataQuality.title")}
        description={t("pages.dataQuality.description")}
        tip="Scores each activity record for audit readiness using completeness, factor quality, method, evidence, and verification."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          accent="brand"
          icon={ShieldCheck}
          label="Average score"
          value={`${avg.toFixed(0)}%`}
          tooltip="Weighted average data-quality score across filtered activity records (completeness, evidence, method, and verification)."
        />
        {Object.entries(byLabel).map(([label, count]) => (
          <MetricCard
            key={label}
            accent={label === "high" || label === "good" ? "success" : label === "moderate" ? "warning" : "neutral"}
            label={`${label} quality`}
            value={String(count)}
            sub="records"
            tooltip={`Number of activity records currently scored as “${label}” quality under the audit readiness formula.`}
          />
        ))}
      </div>

      <ChartCard title="Record-level data quality" tip="Individual scores computed from completeness, recency, factor quality, method, evidence, and verification." icon={CheckCircle2}>
        <DataTable>
          <table className="w-full">
            <DataTableHeader>
              <DataTableHead>Source</DataTableHead>
              <DataTableHead>Scope</DataTableHead>
              <DataTableHead>Method</DataTableHead>
              <DataTableHead>Score</DataTableHead>
              <DataTableHead>Label</DataTableHead>
              <DataTableHead>Evidence</DataTableHead>
              <DataTableHead>Estimated?</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {filteredActivities.map((a, i) => (
                <DataTableRow key={a.id}>
                  <DataTableCell className="font-medium">{a.source}</DataTableCell>
                  <DataTableCell><ScopeBadge scope={a.scope} /></DataTableCell>
                  <DataTableCell className="capitalize">{a.method.replace(/_/g, " ")}</DataTableCell>
                  <DataTableCell className="dash-num">{scores[i]?.score.toFixed(0)}%</DataTableCell>
                  <DataTableCell>
                    <Badge variant={scores[i]?.label === "high" || scores[i]?.label === "good" ? "success" : "warning"} className="capitalize text-[10px]">
                      {scores[i]?.label}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell className="capitalize">{a.evidenceStatus}</DataTableCell>
                  <DataTableCell>{a.isEstimated ? "Yes" : "No"}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </table>
        </DataTable>
      </ChartCard>

      <div className="dash-card relative flex items-start gap-3 p-5 pr-12">
        <HelpCorner content="This formula shows how each activity record’s audit-readiness score is calculated. Weights can be configured per assurance framework." />
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="text-sm">
          <p className="font-semibold">Scoring formula</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            score = completeness×0.25 + recency×0.15 + factorQuality×0.20 + methodQuality×0.15 + evidence×0.15 + verification×0.10
          </p>
        </div>
      </div>
    </div>
  );
}

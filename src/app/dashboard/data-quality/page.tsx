"use client";

import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { dataQualityScore } from "@/lib/calculations/engine";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { MetricCard } from "@/components/dashboard/shared/metric-card";
import { ChartCard } from "@/components/dashboard/shared/chart-card";
import { ScopeBadge } from "@/components/dashboard/shared/scope-badge";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/dashboard/shared/data-table";
import { useT } from "@/components/i18n/locale-provider";
import { useDomainT } from "@/lib/i18n/use-domain-t";
import { Badge } from "@/components/ui/badge";
import { HelpCorner } from "@/components/ui/tooltip";
import { ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";

const QUALITY_LABEL_KEYS = {
  high: "dataQualityPage.highQuality",
  good: "dataQualityPage.goodQuality",
  moderate: "dataQualityPage.moderateQuality",
  low: "dataQualityPage.lowQuality",
} as const;

export default function DataQualityPage() {
  const { filteredActivities } = useDashboard();
  const t = useT();
  const d = useDomainT();

  const scores = filteredActivities.map((a) =>
    dataQualityScore({
      completeness: a.dataQualityScore,
      recency: 85,
      factorQuality: a.emissionFactorYear >= 2024 ? 90 : 60,
      methodQuality: a.method === "spend_based" ? 40 : 85,
      evidence: a.evidenceStatus === "verified" ? 100 : a.evidenceStatus === "uploaded" ? 70 : 30,
      verification: a.evidenceStatus === "verified" ? 100 : 0,
    })
  );

  const avg = scores.length ? scores.reduce((s, dq) => s + dq.score, 0) / scores.length : 0;
  const byLabel = { high: 0, good: 0, moderate: 0, low: 0 };
  scores.forEach((s) => {
    byLabel[s.label]++;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.dataQuality.title")}
        description={t("pages.dataQuality.description")}
        tip={t("dataQualityPage.tip")}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          accent="brand"
          icon={ShieldCheck}
          label={t("dataQualityPage.averageScore")}
          value={`${avg.toFixed(0)}%`}
          tooltip={t("dataQualityPage.averageTip")}
        />
        {(Object.keys(byLabel) as Array<keyof typeof byLabel>).map((label) => (
          <MetricCard
            key={label}
            accent={label === "high" || label === "good" ? "success" : label === "moderate" ? "warning" : "neutral"}
            label={t(QUALITY_LABEL_KEYS[label])}
            value={String(byLabel[label])}
            sub={t("dataQualityPage.records")}
            tooltip={t("dataQualityPage.qualityTip", { label: d.quality(label) })}
          />
        ))}
      </div>

      <ChartCard title={t("dataQualityPage.recordLevel")} tip={t("dataQualityPage.recordLevelTip")} icon={CheckCircle2}>
        <DataTable>
          <table className="w-full">
            <DataTableHeader>
              <DataTableHead>{t("dataQualityPage.colSource")}</DataTableHead>
              <DataTableHead>{t("dataQualityPage.colScope")}</DataTableHead>
              <DataTableHead>{t("dataQualityPage.colMethod")}</DataTableHead>
              <DataTableHead>{t("dataQualityPage.colScore")}</DataTableHead>
              <DataTableHead>{t("dataQualityPage.colLabel")}</DataTableHead>
              <DataTableHead>{t("dataQualityPage.colEvidence")}</DataTableHead>
              <DataTableHead>{t("dataQualityPage.colEstimated")}</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {filteredActivities.map((a, i) => (
                <DataTableRow key={a.id}>
                  <DataTableCell className="font-medium">{d.source(a.source)}</DataTableCell>
                  <DataTableCell>
                    <ScopeBadge scope={a.scope} />
                  </DataTableCell>
                  <DataTableCell>{d.method(a.method)}</DataTableCell>
                  <DataTableCell className="dash-num">{scores[i]?.score.toFixed(0)}%</DataTableCell>
                  <DataTableCell>
                    <Badge
                      variant={scores[i]?.label === "high" || scores[i]?.label === "good" ? "success" : "warning"}
                      className="text-[10px]"
                    >
                      {d.quality(scores[i]?.label ?? "moderate")}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell>{d.evidence(a.evidenceStatus)}</DataTableCell>
                  <DataTableCell>{d.yesNo(a.isEstimated)}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </table>
        </DataTable>
      </ChartCard>

      <div className="dash-card relative flex items-start gap-3 p-5 pr-12">
        <HelpCorner content={t("dataQualityPage.scoringTip")} />
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="text-sm">
          <p className="font-semibold">{t("dataQualityPage.scoringFormula")}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            score = completeness×0.25 + recency×0.15 + factorQuality×0.20 + methodQuality×0.15 + evidence×0.15 +
            verification×0.10
          </p>
        </div>
      </div>
    </div>
  );
}

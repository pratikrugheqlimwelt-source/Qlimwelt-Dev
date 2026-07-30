"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { useT } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCorner } from "@/components/ui/tooltip";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { Download, FileText, Eye, Clock, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn, formatCO2, formatCurrency } from "@/lib/utils";
import { buildCsrdPdf } from "@/lib/reports/csrd-pdf";
import { activityToCalculation } from "@/lib/calculations/engine";

const REPORT_IDS = [
  "ghg",
  "scope",
  "facility",
  "fleet",
  "travel",
  "supplier",
  "dq",
  "target",
  "reduction",
  "carbonCost",
] as const;

const REPORT_API_TYPE: Record<string, string> = {
  ghg: "ghg",
  scope: "scope",
  facility: "facility",
  fleet: "fleet",
  travel: "ghg",
  supplier: "ghg",
  dq: "summary",
  target: "target",
  reduction: "reduction",
  carbonCost: "summary",
};

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadFromApi(path: string, fallbackFilename: string): Promise<boolean> {
  try {
    const res = await fetch(path, { credentials: "include" });
    if (!res.ok) return false;
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition");
    const match = cd?.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] ?? fallbackFilename;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export default function ReportsPage() {
  const {
    metrics,
    facilities,
    vehicles,
    suppliers,
    reductionInitiatives,
    climateTarget,
    filters,
    company,
    filteredActivities,
  } = useDashboard();
  const t = useT();
  const [previewId, setPreviewId] = useState<string | null>(null);

  const reports = useMemo(
    () =>
      REPORT_IDS.map((id) => ({
        id,
        name: t(`reportsPage.catalog.${id}`),
        pages: t("reportsPage.csvPdf"),
        status: t("reportsPage.ready") as "Ready",
        updated: t("shell.live"),
      })),
    [t]
  );

  const periodLabel =
    filters.period === "all"
      ? t("reportsPage.fy2024AllMonths")
      : filters.period;

  const summaryLines = useMemo(() => {
    return [
      `Qlimwelt Report — ${company.name}`,
      `Period: ${periodLabel}`,
      `Generated: ${new Date().toISOString()}`,
      "",
      `Total emissions: ${formatCO2(metrics.totalTCO2e)}`,
      `Scope 1: ${formatCO2(metrics.scope1)}`,
      `Scope 2: ${formatCO2(metrics.scope2)}`,
      `Scope 3: ${formatCO2(metrics.scope3)}`,
      `YoY / MoM change: ${metrics.changePct.toFixed(1)}%`,
      `Activity records: ${filteredActivities.length}`,
      `Verified share: ${metrics.verifiedPct.toFixed(1)}%`,
      `Estimated share: ${metrics.estimatedPct.toFixed(1)}%`,
      `Carbon cost exposure: ${formatCurrency(metrics.carbonCostExposure)}`,
      `Target progress: ${metrics.targetProgress.toFixed(1)}%`,
      `Reduction opportunity: ${formatCO2(metrics.reductionOpportunity)}`,
      "",
      `Facilities: ${facilities.length}`,
      `Vehicles: ${vehicles.length}`,
      `Suppliers: ${suppliers.length}`,
      `Initiatives: ${reductionInitiatives.length}`,
      `Target: ${climateTarget.name} (${climateTarget.baselineYear} → ${climateTarget.targetYear}, −${climateTarget.targetReductionPct}%)`,
      "",
      "Top initiatives:",
      ...reductionInitiatives.slice(0, 8).map(
        (i) => `  • ${i.name} [${i.status}] — ${i.annualEmissionReductionTCO2e} tCO₂e/yr`
      ),
    ];
  }, [
    metrics,
    facilities,
    vehicles,
    suppliers,
    reductionInitiatives,
    climateTarget,
    periodLabel,
    company,
    filteredActivities,
  ]);

  const previewReport = reports.find((r) => r.id === previewId);

  const downloadPdf = (name: string) => {
    const byCat = new Map<string, number>();
    for (const a of filteredActivities) {
      byCat.set(a.category, (byCat.get(a.category) ?? 0) + activityToCalculation(a).emissionsTCO2e);
    }
    const byFac = new Map<string, { name: string; country: string; tCO2e: number }>();
    for (const a of filteredActivities) {
      const f = facilities.find((x) => x.id === a.facilityId);
      const key = a.facilityId;
      const cur = byFac.get(key) ?? {
        name: f?.name ?? a.facilityId,
        country: f?.country ?? a.country,
        tCO2e: 0,
      };
      cur.tCO2e += activityToCalculation(a).emissionsTCO2e;
      byFac.set(key, cur);
    }

    const pdf = buildCsrdPdf({
      companyName: company.name,
      periodLabel: filters.period === "all" ? t("shell.fy2024") : filters.period,
      generatedAt: new Date().toISOString(),
      totalTCO2e: metrics.totalTCO2e,
      scope1: metrics.scope1,
      scope2: metrics.scope2,
      scope3: metrics.scope3,
      activityCount: filteredActivities.length,
      verifiedPct: metrics.verifiedPct,
      targetName: climateTarget.name,
      targetYear: climateTarget.targetYear,
      targetReductionPct: climateTarget.targetReductionPct,
      baselineTCO2e: climateTarget.baselineEmissionsTCO2e,
      categories: [...byCat.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, tCO2e]) => ({ name, tCO2e })),
      initiatives: reductionInitiatives.map((i) => ({
        name: i.name,
        status: i.status,
        reduction: i.annualEmissionReductionTCO2e,
      })),
      facilities: [...byFac.values()].sort((a, b) => b.tCO2e - a.tCO2e),
    });

    downloadBlob(
      `${name.replace(/\s+/g, "-").toLowerCase()}-csrd.pdf`,
      pdf,
      "application/pdf"
    );
    toast({ title: t("reportsPage.toastPdfDownloaded"), description: t("reportsPage.toastPdfPages", { name }) });
  };

  const downloadExcel = async (reportId: string, name: string) => {
    const apiType = REPORT_API_TYPE[reportId] ?? "ghg";
    const period = filters.period || "all";
    const path =
      apiType === "summary"
        ? `/api/export/summary?format=csv&period=${encodeURIComponent(period)}`
        : `/api/export/report?type=${encodeURIComponent(apiType)}&format=csv&period=${encodeURIComponent(period)}`;

    const fromApi = await downloadFromApi(path, `${name.replace(/\s+/g, "-").toLowerCase()}.csv`);
    if (fromApi) {
      toast({ title: t("reportsPage.toastExcelApi"), description: name });
      return;
    }

    const csv = [
      ["Metric", "Value"],
      ["Company", company.name],
      ["Period", filters.period],
      ["Total tCO2e", metrics.totalTCO2e.toFixed(3)],
      ["Scope 1", metrics.scope1.toFixed(3)],
      ["Scope 2", metrics.scope2.toFixed(3)],
      ["Scope 3", metrics.scope3.toFixed(3)],
      ["Activities", String(filteredActivities.length)],
      ["Verified %", metrics.verifiedPct.toFixed(1)],
      ["Carbon cost EUR", metrics.carbonCostExposure.toFixed(2)],
      ["Target progress %", metrics.targetProgress.toFixed(1)],
      [],
      ["Initiative", "Status", "tCO2e/yr"],
      ...reductionInitiatives.map((i) => [
        i.name,
        i.status,
        String(i.annualEmissionReductionTCO2e),
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadBlob(`${name.replace(/\s+/g, "-").toLowerCase()}.csv`, csv, "text/csv;charset=utf-8");
    toast({ title: t("reportsPage.toastExcelFallback"), description: t("reportsPage.toastExcelFallbackDesc", { name }) });
  };

  const previewPeriod =
    filters.period === "all" ? t("shell.fy2024") : filters.period;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.reports.title")}
        description={t("pages.reports.description")}
        tip={t("reportsPage.tip")}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => void downloadFromApi(`/api/export/activities?format=csv&period=${encodeURIComponent(filters.period)}`, "activities.csv").then((ok) =>
            toast({ title: ok ? t("reportsPage.toastActivitiesExported") : t("reportsPage.toastExportUnavailable"), variant: ok ? "success" : "destructive" })
          )}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />{t("reportsPage.exportActivitiesApi")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => void downloadFromApi(`/api/export/summary?format=csv&period=${encodeURIComponent(filters.period)}`, "ghg-summary.csv").then((ok) =>
            toast({ title: ok ? t("reportsPage.toastGhgExported") : t("reportsPage.toastExportUnavailableShort"), variant: ok ? "success" : "destructive" })
          )}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />{t("reportsPage.exportSummaryApi")}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((r) => (
          <div key={r.id} className="dash-card group relative p-5 pr-12 transition-all hover:shadow-[0_8px_30px_rgba(15,23,42,0.07)]">
            <HelpCorner content={t("reportsPage.helpTemplate", { name: r.name, pages: r.pages, status: r.status.toLowerCase() })} />
            <div className="flex items-start gap-4">
              <div className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                "bg-brand/10 text-brand-dark"
              )}>
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold tracking-tight">{r.name}</h3>
                  <Badge variant="success" className="text-[10px]">{r.status}</Badge>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{r.pages}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.updated}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => downloadPdf(r.name)}>
                    <Download className="mr-1.5 h-3.5 w-3.5" />{t("reportsPage.pdf")}
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => void downloadExcel(r.id, r.name)}>
                    <Download className="mr-1.5 h-3.5 w-3.5" />{t("reportsPage.excel")}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setPreviewId(r.id)}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" />{t("reportsPage.preview")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPreviewId(null)}>
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl border border-border bg-background p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{previewReport.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {t("reportsPage.previewSummary", { period: previewPeriod })}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
              {summaryLines.join("\n")}
            </pre>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => downloadPdf(previewReport.name)}>{t("reportsPage.downloadPdf")}</Button>
              <Button size="sm" variant="outline" onClick={() => void downloadExcel(previewReport.id, previewReport.name)}>{t("reportsPage.downloadCsv")}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

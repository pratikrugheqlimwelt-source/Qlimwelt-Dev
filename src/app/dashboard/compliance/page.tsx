"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileText,
  FileUp,
  History,
  Loader2,
  MoreHorizontal,
  Scale,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { MetricCard } from "@/components/dashboard/shared/metric-card";
import { ChartCard } from "@/components/dashboard/shared/chart-card";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/dashboard/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { HelpCorner } from "@/components/ui/tooltip";
import { useLocale, useT } from "@/components/i18n/locale-provider";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getComplianceDashboardSeed } from "@/data/compliance-data";
import { mergeComplianceWithLive } from "@/lib/compliance/live-readiness";
import { buildBrandedReportPdf } from "@/lib/reports/branded-pdf";
import { activityToCalculation } from "@/lib/calculations/engine";
import type {
  ComplianceDashboardPayload,
  ComplianceEvidence,
  ComplianceFramework,
  ComplianceRequirement,
  ComplianceStatus,
  EvidenceVerification,
  RequirementStatus,
} from "@/types/compliance";

const ACCEPTED_EXT = ".pdf,.xlsx,.xls,.csv";

function statusAccent(score: number): "success" | "warning" | "brand" {
  if (score >= 85) return "success";
  if (score >= 65) return "warning";
  return "brand";
}

function frameworkStatusBadge(status: ComplianceStatus): {
  variant: "success" | "warning" | "destructive" | "secondary";
  key: string;
} {
  switch (status) {
    case "complete":
    case "on_track":
      return { variant: "success", key: "compliancePage.statusOnTrack" };
    case "at_risk":
      return { variant: "warning", key: "compliancePage.statusAtRisk" };
    case "critical":
      return { variant: "destructive", key: "compliancePage.statusCritical" };
    default:
      return { variant: "secondary", key: "compliancePage.statusOnTrack" };
  }
}

function progressIndicatorClass(pct: number) {
  if (pct >= 85) return "bg-emerald-500";
  if (pct >= 65) return "bg-amber-500";
  return "bg-red-500";
}

function ReqIcon({ status }: { status: RequirementStatus }) {
  if (status === "complete") {
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />;
  }
  if (status === "in_progress") {
    return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand" aria-hidden />;
  }
  return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />;
}

function VerificationBadge({ status, t }: { status: EvidenceVerification; t: (k: string) => string }) {
  const map: Record<EvidenceVerification, { variant: "success" | "warning" | "destructive"; label: string }> = {
    verified: { variant: "success", label: t("compliancePage.verified") },
    pending: { variant: "warning", label: t("compliancePage.pending") },
    rejected: { variant: "destructive", label: t("compliancePage.rejected") },
  };
  const m = map[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

function ComplianceSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-10 w-full max-w-xl rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}

export default function CompliancePage() {
  const t = useT();
  const { locale } = useLocale();
  const {
    filteredActivities,
    facilities,
    reductionInitiatives,
    climateTarget,
    company,
    metrics,
    filters,
  } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [baseData, setBaseData] = useState<ComplianceDashboardPayload | null>(null);
  const [selected, setSelected] = useState<ComplianceFramework | null>(null);
  const [expandedReq, setExpandedReq] = useState<string | null>(null);
  const [selectedReg, setSelectedReg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [extraEvidence, setExtraEvidence] = useState<ComplianceEvidence[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // API is still seed-backed; load locale seed so EN/DE content follows the language toggle.
      try {
        await fetch("/api/compliance", { credentials: "include" });
      } catch {
        /* offline / demo fallback */
      }
      if (!cancelled) {
        const seed = getComplianceDashboardSeed(locale);
        setBaseData(seed);
        setSelected((prev) => {
          if (!prev) return prev;
          return seed.frameworks.find((f) => f.id === prev.id) ?? null;
        });
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const data = useMemo(() => {
    if (!baseData) return null;
    const merged = mergeComplianceWithLive(baseData, filteredActivities, t);
    if (!extraEvidence.length) return merged;
    return { ...merged, evidence: [...extraEvidence, ...merged.evidence] };
  }, [baseData, filteredActivities, extraEvidence, t]);

  const evidence = data?.evidence ?? [];

  const queueReport = useCallback(
    async (templateId?: string, name?: string) => {
      const reportName = name ?? t("compliancePage.csrdReport");
      try {
        await fetch("/api/report/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ templateId: templateId ?? "csrd", name: reportName }),
        }).catch(() => null);

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

        let logoBytes: Uint8Array | null = null;
        try {
          const logoRes = await fetch("/logo-mark.png");
          if (logoRes.ok) logoBytes = new Uint8Array(await logoRes.arrayBuffer());
        } catch {
          logoBytes = null;
        }

        const pdfBytes = await buildBrandedReportPdf(
          {
            reportTitle: reportName,
            companyName: company.name,
            industry: company.industry,
            employeeCount: company.employeeCount,
            revenueEUR: company.revenueEUR,
            currency: company.currency,
            periodLabel: filters.period === "all" ? t("shell.fy2024") : filters.period,
            generatedAt: new Date().toLocaleString(),
            totalTCO2e: metrics.totalTCO2e,
            scope1: metrics.scope1,
            scope2: metrics.scope2,
            scope3: metrics.scope3,
            activityCount: filteredActivities.length,
            verifiedPct: metrics.verifiedPct,
            estimatedPct: metrics.estimatedPct,
            carbonCostEUR: metrics.carbonCostExposure,
            targetName: climateTarget.name,
            targetYear: climateTarget.targetYear,
            targetReductionPct: climateTarget.targetReductionPct,
            baselineTCO2e: climateTarget.baselineEmissionsTCO2e,
            baselineYear: climateTarget.baselineYear,
            categories: [...byCat.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([catName, tCO2e]) => ({ name: catName, tCO2e })),
            initiatives: reductionInitiatives.map((i) => ({
              name: i.name,
              status: i.status,
              reduction: i.annualEmissionReductionTCO2e,
            })),
            facilities: [...byFac.values()].sort((a, b) => b.tCO2e - a.tCO2e),
          },
          logoBytes
        );

        const copy = new Uint8Array(pdfBytes);
        const blob = new Blob([copy.buffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportName.replace(/\s+/g, "-").toLowerCase()}-qlimwelt.pdf`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: t("compliancePage.toastReportQueued"),
          description: t("compliancePage.toastReportQueuedDesc"),
          variant: "success",
        });
      } catch {
        toast({
          title: t("compliancePage.toastReportFailed"),
          variant: "destructive",
        });
      }
    },
    [
      t,
      filteredActivities,
      facilities,
      reductionInitiatives,
      climateTarget,
      company,
      metrics,
      filters.period,
    ]
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      setUploading(true);
      try {
        for (const file of list) {
          const form = new FormData();
          form.append("file", file);
          form.append("framework", "CSRD");
          const res = await fetch("/api/compliance/evidence", {
            method: "POST",
            credentials: "include",
            body: form,
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "upload failed");
          const created = json.evidence as ComplianceEvidence;
          setExtraEvidence((prev) => [created, ...prev]);
        }
        toast({
          title: t("compliancePage.toastUploadOk"),
          description: t("compliancePage.toastUploadOkDesc", { count: String(list.length) }),
          variant: "success",
        });
      } catch (e) {
        toast({
          title: t("compliancePage.toastUploadFailed"),
          description: e instanceof Error ? e.message : undefined,
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    },
    [t]
  );

  const askAi = (mode: "ask" | "explain" | "fix") => {
    const insight = data?.aiInsight ?? getComplianceDashboardSeed(locale).aiInsight;
    if (mode === "ask") {
      setAiMessage(insight);
      toast({ title: t("compliancePage.toastAiReady"), variant: "success" });
      return;
    }
    if (mode === "explain") {
      setAiMessage(t("compliancePage.aiExplainBody"));
      return;
    }
    setAiMessage(t("compliancePage.aiFixBody"));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={t("pages.compliance.title")}
          description={t("pages.compliance.description")}
          tip={t("compliancePage.tip")}
        />
        <ComplianceSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={t("pages.compliance.title")}
          description={t("pages.compliance.description")}
        />
        <div className="dash-card flex flex-col items-center justify-center gap-3 p-12 text-center">
          <ShieldCheck className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">{t("compliancePage.emptyTitle")}</h3>
          <p className="max-w-md text-sm text-muted-foreground">{t("compliancePage.emptyBody")}</p>
          <Button onClick={() => setBaseData(getComplianceDashboardSeed(locale))}>
            {t("compliancePage.loadDemo")}
          </Button>
        </div>
      </div>
    );
  }

  const ov = data.overview;
  const readiness = data.validation.readinessScore;
  const riskLabel =
    data.validation.auditRisk === "low"
      ? t("compliancePage.riskLow")
      : data.validation.auditRisk === "high"
        ? t("compliancePage.riskHigh")
        : t("compliancePage.riskMedium");
  const riskVariant =
    data.validation.auditRisk === "low"
      ? "success"
      : data.validation.auditRisk === "high"
        ? "destructive"
        : "warning";

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.compliance.title")}
        description={t("pages.compliance.description")}
        tip={t("compliancePage.tip")}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: t("compliancePage.toastEvidenceExport"),
                  description: t("compliancePage.toastEvidenceExportDesc"),
                });
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {t("compliancePage.exportEvidence")}
            </Button>
            <Button size="sm" onClick={() => queueReport("csrd", t("compliancePage.csrdReport"))}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              {t("compliancePage.generateReport")}
            </Button>
          </>
        }
      />

      {/* Readiness hero — Targets-style summary */}
      <div className="dash-card relative overflow-hidden">
        <HelpCorner content={t("compliancePage.readinessHeroHelp")} />
        <div className="border-b border-border/40 bg-gradient-to-r from-brand/5 to-transparent p-6 pr-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand-dark">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("compliancePage.readinessHeroLabel")}
                </p>
                <h2 className="text-xl font-semibold tracking-tight">
                  {t("compliancePage.readinessScore")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("compliancePage.auditRiskInline", { risk: riskLabel })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={riskVariant} className="text-sm">
                {riskLabel}
              </Badge>
              <span className="dash-num text-2xl font-semibold tracking-tight">{readiness}%</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium">{t("compliancePage.readinessScore")}</span>
              <span className="dash-num">{readiness}%</span>
            </div>
            <Progress
              value={Math.min(100, readiness)}
              className="h-2.5"
              indicatorClassName={progressIndicatorClass(readiness)}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="dash-tab-list h-auto w-full justify-start">
          <TabsTrigger value="overview" className="dash-tab-trigger">
            {t("compliancePage.tabOverview")}
          </TabsTrigger>
          <TabsTrigger value="frameworks" className="dash-tab-trigger">
            {t("compliancePage.tabFrameworks")}
          </TabsTrigger>
          <TabsTrigger value="progress" className="dash-tab-trigger">
            {t("compliancePage.tabProgress")}
          </TabsTrigger>
          <TabsTrigger value="evidence" className="dash-tab-trigger">
            {t("compliancePage.tabEvidence")}
          </TabsTrigger>
          <TabsTrigger value="export" className="dash-tab-trigger">
            {t("compliancePage.tabExport")}
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-0 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={t("compliancePage.overallCompliance")}
              value={`${ov.overallCompliance}%`}
              sub={t("compliancePage.overallSub")}
              icon={ShieldCheck}
              accent={statusAccent(ov.overallCompliance)}
              progress={ov.overallCompliance}
              size="compact"
              tooltip={t("compliancePage.overallTip")}
            />
            <MetricCard
              label={t("compliancePage.frameworksActive")}
              value={String(ov.frameworksActive)}
              sub={t("compliancePage.frameworksActiveSub")}
              icon={Scale}
              accent="teal"
              progress={Math.round((ov.frameworksActive / data.frameworks.length) * 100)}
              size="compact"
              tooltip={t("compliancePage.frameworksActiveTip")}
            />
            <MetricCard
              label={t("compliancePage.openIssues")}
              value={String(ov.openIssues)}
              sub={t("compliancePage.openIssuesSub")}
              icon={AlertTriangle}
              accent={ov.openIssues > 10 ? "warning" : "success"}
              progress={Math.max(5, 100 - ov.openIssues * 4)}
              size="compact"
              tooltip={t("compliancePage.openIssuesTip")}
            />
            <MetricCard
              label={t("compliancePage.upcomingDeadlines")}
              value={String(ov.upcomingDeadlines)}
              sub={t("compliancePage.upcomingDeadlinesSub")}
              icon={FileText}
              accent="indigo"
              progress={Math.max(10, 100 - ov.upcomingDeadlines * 20)}
              size="compact"
              tooltip={t("compliancePage.upcomingDeadlinesTip")}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title={t("compliancePage.reportValidation")}
              tip={t("compliancePage.reportValidationDesc")}
              icon={CheckCircle2}
              accent="brand"
              expandable={false}
            >
              <ul className="space-y-3">
                {data.validation.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2.5 text-sm">
                    {item.status === "pass" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
                    )}
                    <span className={item.status === "warn" ? "text-foreground" : "text-muted-foreground"}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/40 pt-4">
                <div>
                  <p className="dash-label">{t("compliancePage.readinessScore")}</p>
                  <p className="mt-0.5 text-2xl font-semibold tracking-tight dash-num">{readiness}%</p>
                </div>
                <div>
                  <p className="dash-label">{t("compliancePage.auditRisk")}</p>
                  <Badge variant={riskVariant} className="mt-1">
                    {riskLabel}
                  </Badge>
                </div>
              </div>
            </ChartCard>

            <ChartCard
              title={t("compliancePage.aiAdvisor")}
              tip={t("compliancePage.aiDesc")}
              description={t("compliancePage.aiAdvisorSub")}
              icon={Sparkles}
              accent="teal"
              expandable={false}
            >
              <div
                className="rounded-xl border border-border/50 bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-line text-foreground"
                role="status"
                aria-live="polite"
              >
                {aiMessage ?? data.aiInsight}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => askAi("ask")}>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  {t("compliancePage.askAi")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => askAi("explain")}>
                  {t("compliancePage.explainRequirement")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => askAi("fix")}>
                  {t("compliancePage.suggestFix")}
                </Button>
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        {/* Frameworks */}
        <TabsContent value="frameworks" className="mt-0 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.frameworks.map((fw) => {
              const badge = frameworkStatusBadge(fw.status);
              return (
                <button
                  key={fw.id}
                  type="button"
                  onClick={() => setSelected(fw)}
                  className="dash-card group relative overflow-hidden p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-dark ring-1 ring-brand/20">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold tracking-normal">{fw.shortName}</h3>
                        <Badge variant={badge.variant} className="text-[10px]">
                          {t(badge.key)}
                        </Badge>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{fw.name}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-muted-foreground">{t("compliancePage.completion")}</span>
                      <span className="dash-num font-medium">{fw.completion}%</span>
                    </div>
                    <Progress
                      value={fw.completion}
                      className="h-1.5"
                      indicatorClassName={progressIndicatorClass(fw.completion)}
                    />
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {t("compliancePage.lastUpdated")}
                      {": "}
                      {fw.updatedAt}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </TabsContent>

        {/* Progress */}
        <TabsContent value="progress" className="mt-0 space-y-4">
          <ChartCard
            title={t("compliancePage.progress")}
            tip={t("compliancePage.progressDesc")}
            icon={CheckCircle2}
            accent="brand"
            expandable={false}
            noPadding
          >
            <div className="divide-y divide-border/40">
              {data.progressChecklist.map((req) => (
                <RequirementRow
                  key={req.id}
                  req={req}
                  expanded={expandedReq === req.id}
                  onToggle={() => setExpandedReq((id) => (id === req.id ? null : req.id))}
                  t={t}
                />
              ))}
            </div>
          </ChartCard>
        </TabsContent>

        {/* Evidence */}
        <TabsContent value="evidence" className="mt-0 space-y-4">
          <div
            className={cn(
              "dash-card flex flex-col items-center justify-center gap-2 border-2 border-dashed p-6 text-center transition-colors",
              dragOver ? "border-brand bg-brand/5" : "border-border/60"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
            }}
          >
            <Upload className="h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium">{t("compliancePage.dropTitle")}</p>
            <p className="max-w-lg text-xs text-muted-foreground">{t("compliancePage.dropHint")}</p>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept={ACCEPTED_EXT}
              multiple
              onChange={(e) => {
                if (e.target.files?.length) void uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-1"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileUp className="mr-1.5 h-3.5 w-3.5" />
              )}
              {t("compliancePage.browseFiles")}
            </Button>
          </div>

          {evidence.length === 0 ? (
            <div className="dash-card flex flex-col items-center gap-2 p-10 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">{t("compliancePage.evidenceEmpty")}</p>
              <p className="text-xs text-muted-foreground">{t("compliancePage.evidenceEmptyBody")}</p>
            </div>
          ) : (
            <DataTable tip={t("compliancePage.evidenceDesc")}>
              <table className="w-full min-w-[720px]">
                <DataTableHeader>
                  <DataTableHead>{t("compliancePage.colDocument")}</DataTableHead>
                  <DataTableHead>{t("compliancePage.colFramework")}</DataTableHead>
                  <DataTableHead>{t("compliancePage.colUploadedBy")}</DataTableHead>
                  <DataTableHead>{t("compliancePage.colUploadDate")}</DataTableHead>
                  <DataTableHead>{t("compliancePage.colVerification")}</DataTableHead>
                  <DataTableHead>{t("compliancePage.colActions")}</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {evidence.map((row) => (
                    <DataTableRow key={row.id}>
                      <DataTableCell className="font-medium">{row.name}</DataTableCell>
                      <DataTableCell className="text-muted-foreground">{row.framework}</DataTableCell>
                      <DataTableCell>{row.uploadedBy}</DataTableCell>
                      <DataTableCell className="text-muted-foreground">{row.uploadDate}</DataTableCell>
                      <DataTableCell>
                        <VerificationBadge status={row.verified} t={t} />
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label={t("compliancePage.preview")}
                            onClick={() =>
                              toast({ title: t("compliancePage.toastPreview"), description: row.name })
                            }
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label={t("compliancePage.more")}
                            onClick={() =>
                              toast({ title: t("compliancePage.toastActions"), description: row.name })
                            }
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </table>
            </DataTable>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title={t("compliancePage.auditTrail")}
              tip={t("compliancePage.auditTrailDesc")}
              icon={History}
              accent="slate"
              expandable={false}
            >
              {data.auditLog.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("compliancePage.auditEmpty")}</p>
              ) : (
                <ol className="relative ml-3 space-y-0 border-l border-border/60">
                  {data.auditLog.map((entry) => (
                    <li key={entry.id} className="relative space-y-1 pb-6 pl-6 last:pb-0">
                      <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-background bg-brand ring-2 ring-brand/20" />
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground [word-spacing:0.25em]">
                        {entry.relativeLabel}
                      </p>
                      <p className="text-sm leading-relaxed">
                        <span className="font-medium">{entry.user}</span>
                        <span className="text-muted-foreground">{` ${entry.action}`}</span>
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </ChartCard>

            <ChartCard
              title={t("compliancePage.regulatoryUpdates")}
              tip={t("compliancePage.regulatoryDesc")}
              icon={FileText}
              accent="amber"
              expandable={false}
            >
              <div className="space-y-3">
                {data.regulations.map((reg) => (
                  <div key={reg.id} className="rounded-xl border border-border/50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {reg.publishedAt}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold tracking-tight">{reg.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{reg.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReg(reg.id === selectedReg ? null : reg.id);
                        }}
                      >
                        {t("compliancePage.readSummary")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          toast({
                            title: reg.title,
                            description: t("compliancePage.toastDetailsSoon"),
                          })
                        }
                      >
                        {t("compliancePage.viewDetails")}
                      </Button>
                    </div>
                    {selectedReg === reg.id && (
                      <p className="mt-3 rounded-lg bg-muted/40 p-3 text-xs leading-relaxed">{reg.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        {/* Export */}
        <TabsContent value="export" className="mt-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{t("compliancePage.exportCenterDesc")}</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/reports">
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                {t("compliancePage.openReports")}
              </Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.exports.map((exp) => (
              <div key={exp.id} className="dash-card flex flex-col p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand-dark">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">{exp.name}</h3>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{exp.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => queueReport(exp.id, exp.name)}>
                    {t("compliancePage.generate")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast({ title: t("compliancePage.toastPreview"), description: exp.name })}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    {t("compliancePage.preview")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      toast({
                        title: t("compliancePage.toastDownloadQueued"),
                        description: exp.name,
                      })
                    }
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    {t("compliancePage.download")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Framework detail panel */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.shortName}</SheetTitle>
                <SheetDescription>{selected.name}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant={frameworkStatusBadge(selected.status).variant}>
                      {t(frameworkStatusBadge(selected.status).key)}
                    </Badge>
                    <span className="dash-num text-sm font-medium">{selected.completion}%</span>
                  </div>
                  <Progress
                    value={selected.completion}
                    className="h-2"
                    indicatorClassName={progressIndicatorClass(selected.completion)}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("compliancePage.lastUpdated")}
                    {": "}
                    {selected.updatedAt}
                  </p>
                </div>

                <DetailBlock title={t("compliancePage.overview")}>{selected.overview}</DetailBlock>

                <div>
                  <h4 className="text-sm font-semibold">{t("compliancePage.requirementsChecklist")}</h4>
                  <ul className="mt-2 space-y-2">
                    {selected.requirements.map((r) => (
                      <li key={r.id} className="rounded-lg border border-border/50 p-3 text-sm">
                        <div className="flex items-start gap-2">
                          <ReqIcon status={r.status} />
                          <div>
                            <p className="font-medium">{r.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{r.recommendation}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <DetailBlock title={t("compliancePage.currentStatus")}>
                  {`${t("compliancePage.completion")}: ${selected.completion}% · ${t(frameworkStatusBadge(selected.status).key)}`}
                </DetailBlock>

                <div>
                  <h4 className="text-sm font-semibold">{t("compliancePage.missingData")}</h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {selected.missingData.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold">{t("compliancePage.recommendedActions")}</h4>
                  <ul className="mt-2 space-y-2">
                    {selected.recommendedActions.map((a) => (
                      <li key={a} className="rounded-lg bg-muted/40 p-3 text-sm">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                          {t("compliancePage.priorityHigh")}
                        </span>
                        <p className="mt-1">{a}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <DetailBlock title={t("compliancePage.estimatedTime")}>
                  {selected.estimatedTimeToComplete}
                </DetailBlock>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

function RequirementRow({
  req,
  expanded,
  onToggle,
  t,
}: {
  req: ComplianceRequirement;
  expanded: boolean;
  onToggle: () => void;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        aria-expanded={expanded}
      >
        <ReqIcon status={req.status} />
        <span className="min-w-0 flex-1 text-sm font-medium tracking-normal">{req.title}</span>
        <Badge variant={req.priority === "high" ? "warning" : "secondary"} className="text-[10px]">
          {req.priority === "high"
            ? t("compliancePage.priorityHigh")
            : req.priority === "medium"
              ? t("compliancePage.priorityMedium")
              : t("compliancePage.priorityLow")}
        </Badge>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")}
        />
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-border/30 bg-muted/10 px-4 py-3 pl-11 text-sm">
          {req.detail && <p className="text-muted-foreground">{req.detail}</p>}
          <p>
            <span className="font-medium">{t("compliancePage.recommendation")}: </span>
            {req.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

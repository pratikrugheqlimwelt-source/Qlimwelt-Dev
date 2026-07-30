import { activityToCalculation, dataQualityScore } from "@/lib/calculations/engine";
import type { EmissionActivity } from "@/types/carbon";
import type {
  ComplianceDashboardPayload,
  ComplianceRequirement,
  ValidationItem,
} from "@/types/compliance";

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export type LiveComplianceSignals = {
  overallCompliance: number;
  openIssues: number;
  upcomingDeadlines: number;
  readinessScore: number;
  auditRisk: "low" | "medium" | "high";
  validationItems: ValidationItem[];
  progressChecklist: ComplianceRequirement[];
  aiInsight: string;
  avgDataQuality: number;
  hasScope1: boolean;
  hasScope2: boolean;
  hasScope3: boolean;
  missingEvidenceCount: number;
};

function scoreActivity(a: EmissionActivity) {
  return dataQualityScore({
    completeness: a.dataQualityScore,
    recency: 85,
    factorQuality: a.emissionFactorYear >= 2024 ? 90 : 60,
    methodQuality: a.method === "spend_based" ? 40 : 85,
    evidence: a.evidenceStatus === "verified" ? 100 : a.evidenceStatus === "uploaded" ? 70 : 30,
    verification: a.evidenceStatus === "verified" ? 100 : 0,
  });
}

function hasScopeEmissions(activities: EmissionActivity[], scope: EmissionActivity["scope"]) {
  return activities.some((a) => a.scope === scope && activityToCalculation(a).emissionsTCO2e > 0);
}

const FALLBACK_SEED_TITLES = [
  "Organizational Boundary Defined",
  "Reporting Period Configured",
  "Climate Risk Assessment Missing",
  "Organisationsgrenze definiert",
  "Berichtszeitraum konfiguriert",
  "Klimarisikobewertung fehlt",
];

/** Derive compliance readiness signals from live inventory (reuse DQ engine). */
export function computeLiveComplianceSignals(
  activities: EmissionActivity[],
  seed: ComplianceDashboardPayload,
  t: TranslateFn = (k) => k
): LiveComplianceSignals {
  const hasScope1 = hasScopeEmissions(activities, "scope1");
  const hasScope2 = hasScopeEmissions(activities, "scope2");
  const hasScope3 = hasScopeEmissions(activities, "scope3");

  const scores = activities.map(scoreActivity);
  const avgDataQuality = scores.length
    ? scores.reduce((s, dq) => s + dq.score, 0) / scores.length
    : 0;

  const missingEvidenceCount = activities.filter(
    (a) => a.evidenceStatus === "none" || a.evidenceStatus === "pending"
  ).length;

  const lowQualityCount = scores.filter((s) => s.label === "low" || s.label === "moderate").length;
  const spendBasedScope3 = activities.filter(
    (a) => a.scope === "scope3" && a.method === "spend_based"
  ).length;

  const openIssues =
    missingEvidenceCount +
    lowQualityCount +
    (hasScope3 ? 0 : 1) +
    (spendBasedScope3 > 0 ? Math.min(5, Math.ceil(spendBasedScope3 / 3)) : 0);

  const scopeCoverage =
    (hasScope1 ? 34 : 0) + (hasScope2 ? 33 : 0) + (hasScope3 ? 33 : 0);

  const evidenceCoverage =
    activities.length === 0
      ? 0
      : Math.round(
          (activities.filter((a) => a.evidenceStatus === "verified" || a.evidenceStatus === "uploaded")
            .length /
            activities.length) *
            100
        );

  const liveScore = Math.round(
    scopeCoverage * 0.35 + avgDataQuality * 0.4 + evidenceCoverage * 0.25
  );

  const seedScore = seed.overview.overallCompliance;
  const overallCompliance =
    activities.length === 0 ? seedScore : Math.round(liveScore * 0.65 + seedScore * 0.35);

  const readinessScore = overallCompliance;
  const auditRisk: LiveComplianceSignals["auditRisk"] =
    readinessScore >= 85 && missingEvidenceCount < 5
      ? "low"
      : readinessScore >= 65
        ? "medium"
        : "high";

  const validationItems: ValidationItem[] = [
    {
      id: "live-v1",
      label: t("compliancePage.liveValScope1"),
      status: hasScope1 ? "pass" : "warn",
    },
    {
      id: "live-v2",
      label: t("compliancePage.liveValScope2"),
      status: hasScope2 ? "pass" : "warn",
    },
    {
      id: "live-v3",
      label: hasScope3
        ? t("compliancePage.liveValScope3Ok")
        : t("compliancePage.liveValScope3Missing"),
      status: hasScope3 ? "pass" : "warn",
    },
    {
      id: "live-v4",
      label:
        missingEvidenceCount === 0
          ? t("compliancePage.liveValEvidenceOk")
          : t("compliancePage.liveValEvidenceMissing", { count: missingEvidenceCount }),
      status: missingEvidenceCount === 0 ? "pass" : "warn",
    },
  ];

  const progressChecklist: ComplianceRequirement[] = [
    {
      id: "live-pc-1",
      frameworkId: "ghg",
      title: t("compliancePage.livePcScope1Title"),
      status: hasScope1 ? "complete" : "missing",
      priority: "high",
      recommendation: hasScope1
        ? t("compliancePage.livePcScope1RecOk")
        : t("compliancePage.livePcScope1RecMissing"),
      detail: hasScope1
        ? t("compliancePage.livePcScope1DetailOk")
        : t("compliancePage.livePcScope1DetailMissing"),
    },
    {
      id: "live-pc-2",
      frameworkId: "ghg",
      title: t("compliancePage.livePcScope2Title"),
      status: hasScope2 ? "complete" : "missing",
      priority: "high",
      recommendation: hasScope2
        ? t("compliancePage.livePcScope2RecOk")
        : t("compliancePage.livePcScope2RecMissing"),
      detail: hasScope2
        ? t("compliancePage.livePcScope2DetailOk")
        : t("compliancePage.livePcScope2DetailMissing"),
    },
    {
      id: "live-pc-3",
      frameworkId: "ghg",
      title:
        spendBasedScope3 > 0
          ? t("compliancePage.livePcScope3TitleWarn")
          : t("compliancePage.livePcScope3TitleOk"),
      status: !hasScope3 ? "missing" : spendBasedScope3 > 0 ? "warning" : "complete",
      priority: "high",
      recommendation: t("compliancePage.livePcScope3Rec"),
      detail: !hasScope3
        ? t("compliancePage.livePcScope3DetailMissing")
        : spendBasedScope3 > 0
          ? t("compliancePage.livePcScope3DetailWarn", { count: spendBasedScope3 })
          : t("compliancePage.livePcScope3DetailOk"),
    },
    {
      id: "live-pc-4",
      frameworkId: "csrd",
      title: t("compliancePage.livePcEvidenceTitle"),
      status:
        missingEvidenceCount === 0
          ? "complete"
          : missingEvidenceCount > 10
            ? "missing"
            : "warning",
      priority: "high",
      recommendation: t("compliancePage.livePcEvidenceRec"),
      detail: t("compliancePage.livePcEvidenceDetail", {
        ready: activities.length - missingEvidenceCount,
        total: activities.length,
      }),
    },
    ...seed.progressChecklist.filter((r) => FALLBACK_SEED_TITLES.includes(r.title)),
  ];

  const gapHint = !hasScope3
    ? t("compliancePage.liveGapScope3")
    : missingEvidenceCount > 0
      ? t("compliancePage.liveGapEvidence")
      : spendBasedScope3 > 0
        ? t("compliancePage.liveGapSupplier")
        : t("compliancePage.liveGapClimate");

  const lift = Math.max(3, Math.min(12, 100 - overallCompliance));

  const aiInsight = t("compliancePage.liveAiInsight", {
    pct: overallCompliance,
    dq: avgDataQuality.toFixed(0),
    gap: gapHint,
    lift,
  });

  return {
    overallCompliance,
    openIssues: Math.max(
      openIssues,
      seed.overview.openIssues > 0 && activities.length === 0 ? seed.overview.openIssues : openIssues
    ),
    upcomingDeadlines: seed.overview.upcomingDeadlines,
    readinessScore,
    auditRisk,
    validationItems,
    progressChecklist,
    aiInsight,
    avgDataQuality,
    hasScope1,
    hasScope2,
    hasScope3,
    missingEvidenceCount,
  };
}

/** Merge seed compliance payload with live inventory signals (frameworks unchanged). */
export function mergeComplianceWithLive(
  seed: ComplianceDashboardPayload,
  activities: EmissionActivity[],
  t: TranslateFn = (k) => k
): ComplianceDashboardPayload {
  const live = computeLiveComplianceSignals(activities, seed, t);
  return {
    ...seed,
    overview: {
      ...seed.overview,
      overallCompliance: live.overallCompliance,
      openIssues: live.openIssues,
      frameworksActive: seed.frameworks.filter((f) => f.completion > 0).length,
    },
    progressChecklist: live.progressChecklist,
    validation: {
      readinessScore: live.readinessScore,
      auditRisk: live.auditRisk,
      items: live.validationItems,
    },
    aiInsight: live.aiInsight,
  };
}

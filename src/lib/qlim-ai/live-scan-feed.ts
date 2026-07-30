import { activityToCalculation, sumByScope, sumEmissionsTCO2e } from "@/lib/calculations/engine";
import type { EmissionActivity, ReductionInitiative } from "@/types/carbon";

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export type LiveScanMessage = {
  id: string;
  kind: "scan" | "recommend";
  text: string;
  href?: string;
  priority?: "high" | "medium" | "low";
};

type MetricsSlice = {
  totalTCO2e: number;
  verifiedPct: number;
  changePct: number;
  estimatedPct: number;
};

/** Build a rotating feed of data-driven recommendation notifications. */
export function buildLiveScanFeed(
  activities: EmissionActivity[],
  initiatives: ReductionInitiative[],
  metrics: MetricsSlice,
  t: TranslateFn
): LiveScanMessage[] {
  const feed: LiveScanMessage[] = [];

  if (!activities.length) {
    feed.push({
      id: "rec-empty",
      kind: "recommend",
      text: t("shell.aiTicker.recEmpty"),
      href: "/dashboard/data-collection",
      priority: "medium",
    });
    return feed;
  }

  const total = sumEmissionsTCO2e(activities);
  const scopes = sumByScope(activities);
  const scope3Share = total > 0 ? (scopes.scope3 / total) * 100 : 0;

  if (scope3Share >= 40) {
    feed.push({
      id: "rec-scope3",
      kind: "recommend",
      text: t("shell.aiTicker.recScope3", { pct: Math.round(scope3Share) }),
      href: "/dashboard/emissions",
      priority: "high",
    });
  }

  const weak = activities.filter((a) => a.isEstimated || a.dataQualityScore < 60);
  if (weak.length > 0) {
    feed.push({
      id: "rec-dq",
      kind: "recommend",
      text: t("shell.aiTicker.recDq", { count: weak.length, total: activities.length }),
      href: "/dashboard/data-quality",
      priority: weak.length / activities.length > 0.3 ? "high" : "medium",
    });
  }

  const missingEvidence = activities.filter(
    (a) => a.evidenceStatus === "none" || a.evidenceStatus === "pending"
  ).length;
  if (missingEvidence > 0) {
    feed.push({
      id: "rec-evidence",
      kind: "recommend",
      text: t("shell.aiTicker.recEvidence", { count: missingEvidence }),
      href: "/dashboard/data-collection",
      priority: "medium",
    });
  }

  const byCat = new Map<string, number>();
  for (const a of activities) {
    byCat.set(a.category, (byCat.get(a.category) ?? 0) + activityToCalculation(a).emissionsTCO2e);
  }
  const topCat = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    feed.push({
      id: "rec-hotspot",
      kind: "recommend",
      text: t("shell.aiTicker.recHotspot", {
        category: topCat[0],
        tco2e: topCat[1].toFixed(1),
      }),
      href: "/dashboard/emissions",
      priority: "medium",
    });
  }

  const planned = [...initiatives]
    .filter((i) => i.status === "planned")
    .sort((a, b) => b.annualEmissionReductionTCO2e - a.annualEmissionReductionTCO2e)[0];
  if (planned) {
    feed.push({
      id: "rec-init",
      kind: "recommend",
      text: t("shell.aiTicker.recOpportunity", {
        name: planned.name,
        tco2e: planned.annualEmissionReductionTCO2e,
      }),
      href: "/dashboard/reduction-planner",
      priority: "high",
    });
  }

  if (metrics.verifiedPct < 70) {
    feed.push({
      id: "rec-verified",
      kind: "recommend",
      text: t("shell.aiTicker.recVerifiedLow", { pct: Math.round(metrics.verifiedPct) }),
      href: "/dashboard/data-quality",
      priority: "medium",
    });
  } else {
    feed.push({
      id: "rec-verified-ok",
      kind: "recommend",
      text: t("shell.aiTicker.recVerifiedOk", { pct: Math.round(metrics.verifiedPct) }),
      href: "/dashboard/climate-intelligence",
      priority: "low",
    });
  }

  if (Math.abs(metrics.changePct) >= 5) {
    feed.push({
      id: "rec-change",
      kind: "recommend",
      text: t("shell.aiTicker.recChange", {
        pct: Math.abs(Math.round(metrics.changePct)),
        direction: metrics.changePct >= 0 ? t("shell.aiTicker.up") : t("shell.aiTicker.down"),
      }),
      href: "/dashboard/overview",
      priority: metrics.changePct > 0 ? "high" : "low",
    });
  }

  if (scopes.scope2 > 0) {
    feed.push({
      id: "rec-scope2",
      kind: "recommend",
      text: t("shell.aiTicker.recScope2", { tco2e: scopes.scope2.toFixed(1) }),
      href: "/dashboard/reduction-planner",
      priority: "medium",
    });
  }

  feed.push({
    id: "rec-compliance",
    kind: "recommend",
    text: t("shell.aiTicker.recCompliance"),
    href: "/dashboard/compliance",
    priority: "medium",
  });

  return feed;
}

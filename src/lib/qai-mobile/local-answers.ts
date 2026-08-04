import { formatCO2, formatPercent } from "@/lib/utils";
import type { ClimateInsight, ReductionInitiative, Supplier } from "@/types/carbon";
import type { ClimateScoreResult } from "@/lib/qai-mobile/climate-score";

type AnswerCtx = {
  companyName: string;
  periodLabel: string;
  total: number;
  changePct: number;
  scope1: number;
  scope2: number;
  scope3: number;
  targetProgress: number;
  climateScore: ClimateScoreResult;
  topInsight: ClimateInsight | null;
  actions: ReductionInitiative[];
  suppliers: Supplier[];
  unreadCount: number;
};

/** Data-backed fallback when the LLM API is unavailable. */
export function answerFromDashboardData(prompt: string, ctx: AnswerCtx): string {
  const q = prompt.toLowerCase();
  const open = ctx.actions.filter((a) => a.status !== "completed");
  const weakSuppliers = ctx.suppliers
    .filter((s) => s.dataQualityScore < 60)
    .sort((a, b) => a.dataQualityScore - b.dataQualityScore)
    .slice(0, 3);

  if (q.includes("emission") && (q.includes("increase") || q.includes("why"))) {
    if (!ctx.total) {
      return `${ctx.companyName} has no inventory for ${ctx.periodLabel} yet. Add activities in Data Collection so QAI can explain changes.`;
    }
    const direction = ctx.changePct >= 0 ? "increased" : "decreased";
    const driver =
      ctx.scope3 >= ctx.scope2 && ctx.scope3 >= ctx.scope1
        ? "Scope 3 (value chain)"
        : ctx.scope2 >= ctx.scope1
          ? "Scope 2 (purchased energy)"
          : "Scope 1 (direct operations)";
    return (
      `For ${ctx.periodLabel}, total emissions are ${formatCO2(ctx.total)} — ${direction} ${formatPercent(ctx.changePct)} vs the prior period. ` +
      `${driver} is the largest share (${formatCO2(
        Math.max(ctx.scope1, ctx.scope2, ctx.scope3)
      )}). ` +
      (ctx.topInsight
        ? `Priority signal: ${ctx.topInsight.what} Recommended: ${ctx.topInsight.action}`
        : "Open Carbon Pulse for the monthly trend and scope mix.")
    );
  }

  if (q.includes("supplier") || q.includes("missing")) {
    if (!weakSuppliers.length) {
      return `No critical supplier data gaps stand out right now for ${ctx.companyName}. Keep monitoring data-quality scores in the dashboard.`;
    }
    return (
      `These suppliers need attention (low data quality):\n` +
      weakSuppliers
        .map((s) => `• ${s.name} — score ${s.dataQualityScore}/100 (${s.category})`)
        .join("\n") +
      `\nAsk them for primary activity data or invoices so Scope 3 confidence improves.`
    );
  }

  if (q.includes("target") || q.includes("on track") || q.includes("reduction")) {
    const status =
      ctx.climateScore.status === "on_track"
        ? "On track"
        : ctx.climateScore.status === "at_risk"
          ? "At risk"
          : ctx.climateScore.status === "off_track"
            ? "Off track"
            : "No data yet";
    return (
      `Climate score ${ctx.climateScore.score}/100 (${status}). ` +
      `Reduction-target progress is ${ctx.targetProgress.toFixed(0)}%. ` +
      (open[0]
        ? `Next lever: ${open[0].name} (~${formatCO2(open[0].annualEmissionReductionTCO2e)}/yr).`
        : "Add reduction initiatives to accelerate progress.")
    );
  }

  if (q.includes("compliance") || q.includes("urgent")) {
    return (
      `You have ${open.length} open reduction/action items` +
      (ctx.unreadCount ? ` and ${ctx.unreadCount} unread notifications` : "") +
      `. ` +
      (ctx.topInsight
        ? `Most urgent insight: ${ctx.topInsight.title} — ${ctx.topInsight.action}`
        : "Review Actions for deadlines and incomplete supplier records.")
    );
  }

  if (q.includes("next") || q.includes("should we do")) {
    if (ctx.topInsight) {
      return `Do this next: ${ctx.topInsight.action} (est. impact ${formatCO2(ctx.topInsight.emissionImpactTCO2e)}). Confidence ${Math.round(ctx.topInsight.confidence)}%.`;
    }
    if (open[0]) {
      return `Complete “${open[0].name}” next — estimated ${formatCO2(open[0].annualEmissionReductionTCO2e)} annual reduction.`;
    }
    return "Start by uploading an energy invoice or confirming missing supplier data so QAI has fresher signals.";
  }

  return (
    `Here's the live snapshot for ${ctx.companyName} (${ctx.periodLabel}): ` +
    `${formatCO2(ctx.total)} total, score ${ctx.climateScore.score}/100, ` +
    `change ${formatPercent(ctx.changePct)}. Ask about emissions drivers, suppliers, targets, or urgent compliance work.`
  );
}

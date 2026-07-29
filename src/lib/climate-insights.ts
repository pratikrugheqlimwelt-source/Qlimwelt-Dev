import type { ClimateInsight, EmissionActivity, ReductionInitiative } from "@/types/carbon";
import { activityToCalculation, sumByScope, sumEmissionsTCO2e } from "@/lib/calculations/engine";

/** Build insights from live inventory — not static demo copy. */
export function deriveClimateInsights(
  activities: EmissionActivity[],
  initiatives: ReductionInitiative[],
  carbonPrice: number
): ClimateInsight[] {
  if (!activities.length) {
    return [
      {
        id: "ins-empty",
        title: "No activity data yet",
        what: "Your inventory is empty — there is nothing to analyse yet.",
        why: "Insights appear once you add emission activities in Data Collection.",
        action: "Go to Data Collection and save your first activity record.",
        emissionImpactTCO2e: 0,
        financialImpactEUR: 0,
        confidence: 100,
        priority: "medium",
      },
    ];
  }

  const total = sumEmissionsTCO2e(activities);
  const scopes = sumByScope(activities);
  const insights: ClimateInsight[] = [];

  const scope3Share = total > 0 ? (scopes.scope3 / total) * 100 : 0;
  if (scope3Share >= 40) {
    insights.push({
      id: "ins-scope3",
      title: "Scope 3 is a large share of your footprint",
      what: `Scope 3 is ${scope3Share.toFixed(0)}% of filtered emissions (${scopes.scope3.toFixed(1)} tCO₂e).`,
      why: "Value-chain emissions usually dominate CSRD-relevant inventories.",
      action: "Prioritise supplier primary data and Category 1 activity records.",
      emissionImpactTCO2e: Number(scopes.scope3.toFixed(1)),
      financialImpactEUR: Number((scopes.scope3 * carbonPrice).toFixed(0)),
      confidence: 85,
      priority: "high",
    });
  }

  const estimated = activities.filter((a) => a.isEstimated || a.dataQualityScore < 60);
  if (estimated.length > 0) {
    const estT = estimated.reduce((s, a) => s + activityToCalculation(a).emissionsTCO2e, 0);
    insights.push({
      id: "ins-dq",
      title: "Low-confidence activity records detected",
      what: `${estimated.length} of ${activities.length} records are estimated or score below 60.`,
      why: "Weak evidence reduces audit confidence for disclosure.",
      action: "Replace spend-based estimates with activity data for the largest sources.",
      emissionImpactTCO2e: Number(estT.toFixed(1)),
      financialImpactEUR: 0,
      confidence: 80,
      priority: estimated.length / activities.length > 0.3 ? "high" : "medium",
    });
  }

  const byCat = new Map<string, number>();
  for (const a of activities) {
    byCat.set(a.category, (byCat.get(a.category) ?? 0) + activityToCalculation(a).emissionsTCO2e);
  }
  const topCat = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    insights.push({
      id: "ins-hotspot",
      title: `Hotspot: ${topCat[0]}`,
      what: `${topCat[0]} contributes ${topCat[1].toFixed(1)} tCO₂e in the current filter.`,
      why: "Focusing abatement on the largest category yields faster inventory reductions.",
      action: "Open Emissions, filter this category, and attach reduction initiatives.",
      emissionImpactTCO2e: Number(topCat[1].toFixed(1)),
      financialImpactEUR: Number((topCat[1] * carbonPrice).toFixed(0)),
      confidence: 90,
      priority: "medium",
    });
  }

  const planned = initiatives.filter((i) => i.status === "planned");
  const best = [...planned].sort((a, b) => b.annualEmissionReductionTCO2e - a.annualEmissionReductionTCO2e)[0];
  if (best) {
    insights.push({
      id: "ins-init",
      title: `Opportunity: ${best.name}`,
      what: `A planned initiative could reduce ~${best.annualEmissionReductionTCO2e} tCO₂e/yr.`,
      why: "Status is still planned — starting it moves reduction progress.",
      action: "Open Reduction Planner and start this initiative.",
      emissionImpactTCO2e: best.annualEmissionReductionTCO2e,
      financialImpactEUR: best.annualFinancialSaving,
      confidence: best.confidence,
      priority: "high",
    });
  }

  if (scopes.scope2 > 0) {
    insights.push({
      id: "ins-scope2",
      title: "Scope 2 electricity exposure",
      what: `Purchased energy totals ${scopes.scope2.toFixed(1)} tCO₂e in the current view.`,
      why: "Market-based instruments (PPAs) often cut Scope 2 with measurable ROI.",
      action: "Review renewable procurement options in Reduction Planner.",
      emissionImpactTCO2e: Number(scopes.scope2.toFixed(1)),
      financialImpactEUR: Number((scopes.scope2 * carbonPrice).toFixed(0)),
      confidence: 78,
      priority: "medium",
    });
  }

  return insights.slice(0, 6);
}

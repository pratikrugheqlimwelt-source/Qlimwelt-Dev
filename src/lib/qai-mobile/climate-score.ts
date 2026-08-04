/** Derive a 0–100 climate score from live dashboard metrics (no hardcoded demo score). */

export type ClimateScoreInput = {
  targetProgress: number;
  verifiedPct: number;
  changePct: number;
  hasInventory: boolean;
  openHighPriorityInsights: number;
  openInitiatives: number;
};

export type ClimateScoreResult = {
  score: number;
  status: "on_track" | "at_risk" | "off_track" | "no_data";
  emissionsProgress: number;
  reductionProgress: number;
  complianceHealth: number;
};

export function deriveClimateScore(input: ClimateScoreInput): ClimateScoreResult {
  if (!input.hasInventory) {
    return {
      score: 0,
      status: "no_data",
      emissionsProgress: 0,
      reductionProgress: 0,
      complianceHealth: 0,
    };
  }

  const reductionProgress = clamp(input.targetProgress, 0, 100);
  const emissionsProgress = clamp(100 - Math.min(Math.abs(input.changePct) * 2.2, 55), 35, 100);
  const dataHealth = clamp(input.verifiedPct, 0, 100);
  const insightPenalty = Math.min(input.openHighPriorityInsights * 6, 24);
  const initiativeBoost = Math.min(input.openInitiatives * 2, 10);
  const complianceHealth = clamp(dataHealth - insightPenalty + initiativeBoost, 20, 100);

  const score = Math.round(
    reductionProgress * 0.35 + emissionsProgress * 0.3 + complianceHealth * 0.35
  );

  let status: ClimateScoreResult["status"] = "on_track";
  if (score < 55) status = "off_track";
  else if (score < 72) status = "at_risk";

  return {
    score: clamp(score, 0, 100),
    status,
    emissionsProgress: Math.round(emissionsProgress),
    reductionProgress: Math.round(reductionProgress),
    complianceHealth: Math.round(complianceHealth),
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

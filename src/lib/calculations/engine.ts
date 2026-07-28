import type { EmissionActivity, DataQualityLabel, DataQualityResult } from "@/types/carbon";

/** emissionsKgCO2e = activityValue × emissionFactor × conversionFactor */
export function calculateEmissionsKg(
  activityValue: number,
  emissionFactor: number,
  conversionFactor = 1
): number {
  return activityValue * emissionFactor * conversionFactor;
}

/** emissionsTCO2e = emissionsKgCO2e ÷ 1000 */
export function kgToTonnes(kg: number): number {
  return kg / 1000;
}

export function calculateEmissionsTCO2e(
  activityValue: number,
  emissionFactor: number,
  conversionFactor = 1
): number {
  return kgToTonnes(calculateEmissionsKg(activityValue, emissionFactor, conversionFactor));
}

/** gasCO2e = gasMass × GWP */
export function calculateGasCO2e(gasMass: number, gwp: number): number {
  return gasMass * gwp;
}

/** Refrigerant leakage calculation */
export function refrigerantLeakage(
  added: number,
  beginningCharge: number,
  endingCharge: number,
  recovered: number
): number {
  return added + beginningCharge - endingCharge - recovered;
}

/** Simplified leakage rate method */
export function estimatedRefrigerantLeakage(charge: number, leakageRate: number): number {
  return charge * leakageRate;
}

/** Combined uncertainty */
export function combinedUncertainty(activityPct: number, factorPct: number): number {
  return Math.sqrt(activityPct ** 2 + factorPct ** 2);
}

export function uncertaintyRange(emissions: number, uncertaintyPct: number) {
  const u = uncertaintyPct / 100;
  return {
    lower: emissions * (1 - u),
    upper: emissions * (1 + u),
  };
}

/** Period comparison */
export function absoluteChange(current: number, previous: number): number {
  return current - previous;
}

export function percentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return (absoluteChange(current, previous) / previous) * 100;
}

export function categoryContribution(categoryEmissions: number, total: number): number {
  if (total === 0) return 0;
  return (categoryEmissions / total) * 100;
}

/** Intensity */
export function emissionsPerEmployee(totalTCO2e: number, employees: number): number {
  return employees > 0 ? totalTCO2e / employees : 0;
}

export function emissionsPerRevenue(totalTCO2e: number, revenueEUR: number): number {
  return revenueEUR > 0 ? totalTCO2e / revenueEUR : 0;
}

export function emissionsPerProduct(totalTCO2e: number, units: number): number {
  return units > 0 ? totalTCO2e / units : 0;
}

/** Target calculations */
export function absoluteTargetEmissions(baseline: number, reductionPct: number): number {
  return baseline * (1 - reductionPct / 100);
}

export function targetProgressPct(
  baseline: number,
  current: number,
  target: number
): number {
  const denom = baseline - target;
  if (denom === 0) return 100;
  return ((baseline - current) / denom) * 100;
}

export function annualLinearReduction(baseline: number, target: number, years: number): number {
  return years > 0 ? (baseline - target) / years : 0;
}

/** Reduction initiative economics */
export function netAnnualSaving(financialSaving: number, operatingCost: number): number {
  return financialSaving - operatingCost;
}

export function costPerTonneReduced(
  implementationCost: number,
  lifetimeReductionTCO2e: number
): number {
  return lifetimeReductionTCO2e > 0 ? implementationCost / lifetimeReductionTCO2e : 0;
}

export function simplePaybackPeriod(implementationCost: number, netSaving: number): number {
  return netSaving > 0 ? implementationCost / netSaving : Infinity;
}

export function lifetimeEmissionReduction(annual: number, years: number): number {
  return annual * years;
}

export function carbonCost(emissionsTCO2e: number, pricePerTonne: number): number {
  return emissionsTCO2e * pricePerTonne;
}

/** Freight */
export function freightEmissions(
  weightTonnes: number,
  distanceKm: number,
  factor: number
): number {
  return weightTonnes * distanceKm * factor;
}

/** Data quality score */
export function dataQualityScore(components: {
  completeness: number;
  recency: number;
  factorQuality: number;
  methodQuality: number;
  evidence: number;
  verification: number;
}): DataQualityResult {
  const score =
    components.completeness * 0.25 +
    components.recency * 0.15 +
    components.factorQuality * 0.2 +
    components.methodQuality * 0.15 +
    components.evidence * 0.15 +
    components.verification * 0.1;

  let label: DataQualityLabel = "low";
  if (score >= 85) label = "high";
  else if (score >= 70) label = "good";
  else if (score >= 40) label = "moderate";

  return { score, label, ...components };
}

export function activityToCalculation(activity: EmissionActivity) {
  const emissionsKgCO2e = calculateEmissionsKg(
    activity.activityValue,
    activity.emissionFactorValue,
    activity.conversionFactor
  );
  return {
    activityId: activity.id,
    emissionsKgCO2e,
    emissionsTCO2e: kgToTonnes(emissionsKgCO2e),
    gasCO2e: calculateGasCO2e(activity.activityValue, activity.gwp),
  };
}

/** Anomaly: value > rollingAvg + 2σ */
export function isAnomaly(current: number, rollingAvg: number, rollingStd: number): boolean {
  return current > rollingAvg + 2 * rollingStd;
}

/** Sum activities with pre-calculated tCO2e */
export function sumEmissionsTCO2e(
  activities: EmissionActivity[]
): number {
  return activities.reduce(
    (sum, a) => sum + activityToCalculation(a).emissionsTCO2e,
    0
  );
}

export function sumByScope(activities: EmissionActivity[]): Record<string, number> {
  const result: Record<string, number> = { scope1: 0, scope2: 0, scope3: 0 };
  for (const a of activities) {
    result[a.scope] += activityToCalculation(a).emissionsTCO2e;
  }
  return result;
}

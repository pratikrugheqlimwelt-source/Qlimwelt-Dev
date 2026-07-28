import {
  calculateEmissionsTCO2e,
  kgToTonnes,
  calculateEmissionsKg,
  absoluteChange,
  percentageChange,
  targetProgressPct,
  dataQualityScore,
  combinedUncertainty,
} from "./engine";

function assertClose(actual: number, expected: number, tolerance = 0.001) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Expected ${expected}, got ${actual}`);
  }
}

// Basic emission calculation
assertClose(calculateEmissionsTCO2e(1000, 0.5), 0.5);
assertClose(calculateEmissionsKg(500, 2.1, 1), 1050);
assertClose(kgToTonnes(1500), 1.5);

// Period change
assertClose(absoluteChange(120, 100), 20);
assertClose(percentageChange(120, 100), 20);

// Target progress: baseline 1000, current 800, target 600 → 50%
assertClose(targetProgressPct(1000, 800, 600), 50);

// Data quality
const dq = dataQualityScore({
  completeness: 100,
  recency: 90,
  factorQuality: 85,
  methodQuality: 80,
  evidence: 70,
  verification: 60,
});
if (dq.score < 70 || dq.score > 90) throw new Error(`Unexpected DQ score: ${dq.score}`);

// Uncertainty
assertClose(combinedUncertainty(10, 15), Math.sqrt(325));

console.log("All calculation engine tests passed.");

import type { BomItem } from "@/lib/bom/types";
import type { CarbonMapping, PcfCalculation } from "./types";

/** Stable fingerprint of BOM structure used for stale detection. */
export function bomFingerprint(items: BomItem[]): string {
  const rows = items
    .map(
      (i) =>
        `${i.id}|${i.parentItemId ?? ""}|${i.partNumber}|${i.quantity}|${i.unit}|${i.scrapRate}|${i.yieldRate}`
    )
    .sort();
  return hashish(rows.join(";"));
}

/** Stable fingerprint of mappings contributing to a calc. */
export function mappingFingerprint(mappings: CarbonMapping[]): string {
  const rows = mappings
    .filter((m) => m.status === "approved" || m.status === "suggested")
    .map((m) => `${m.bomItemId}|${m.emissionFactorId}|${m.status}|${m.confidence}|${m.method}`)
    .sort();
  return hashish(rows.join(";"));
}

function hashish(s: string): string {
  // Simple non-crypto fingerprint for local/compare use
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function detectStaleCalculation(
  calc: PcfCalculation,
  items: BomItem[],
  mappings: CarbonMapping[]
): { isStale: boolean; reason: string | null } {
  if (calc.status === "superseded" || calc.status === "failed") {
    return { isStale: false, reason: null };
  }
  const bomFp = bomFingerprint(items);
  const mapFp = mappingFingerprint(mappings);
  if (calc.bomFingerprint && calc.bomFingerprint !== bomFp) {
    return { isStale: true, reason: "BOM structure or quantities changed since calculation" };
  }
  if (calc.mappingFingerprint && calc.mappingFingerprint !== mapFp) {
    return { isStale: true, reason: "Carbon mappings changed since calculation" };
  }
  return { isStale: false, reason: null };
}

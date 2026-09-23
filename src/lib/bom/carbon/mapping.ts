import type { BomItem } from "@/lib/bom/types";
import type { EmissionFactor, MappingSuggestion } from "./types";

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Deterministic confidence score for suggesting an EF for a BOM item. */
export function scoreMappingConfidence(item: BomItem, factor: EmissionFactor): MappingSuggestion {
  const itemTokens = tokens(`${item.partNumber} ${item.description} ${item.itemType}`);
  const factorTokens = tokens(`${factor.factorCode} ${factor.name} ${factor.category}`);
  const overlap = jaccard(itemTokens, factorTokens);

  let confidence = overlap;
  const reasons: string[] = [];

  const part = item.partNumber.toLowerCase();
  const code = factor.factorCode.toLowerCase();
  const name = factor.name.toLowerCase();

  if (part && (code.includes(part) || name.includes(part) || part.includes(code.toLowerCase()))) {
    confidence = Math.max(confidence, 0.92);
    reasons.push("part number matched factor code/name");
  }
  if (
    (item.itemType === "material" || item.itemType === "component") &&
    /material|component|metal|polymer/.test(factor.category.toLowerCase())
  ) {
    confidence = Math.min(1, confidence + 0.08);
    reasons.push("category alignment");
  }
  if (overlap >= 0.35) reasons.push(`token overlap ${(overlap * 100).toFixed(0)}%`);
  if (reasons.length === 0) reasons.push("weak lexical match");

  confidence = Math.max(0, Math.min(1, Number(confidence.toFixed(3))));

  return {
    emissionFactorId: factor.id,
    confidence,
    matchReason: reasons.join("; "),
    factor,
  };
}

export function suggestMappings(
  item: BomItem,
  factors: EmissionFactor[],
  limit = 5
): MappingSuggestion[] {
  return factors
    .map((f) => scoreMappingConfidence(item, f))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

export function isMappingUsable(status: string, requireApproved: boolean): boolean {
  if (requireApproved) return status === "approved";
  return status === "approved" || status === "suggested";
}

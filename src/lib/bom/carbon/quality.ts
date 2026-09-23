import type { BomItem } from "@/lib/bom/types";
import type { CarbonMapping, DataQualityScore, EmissionFactor } from "./types";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function yearOf(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const y = Number(String(iso).slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

/**
 * Temporal DQ: newer / in-validity-window factors score higher.
 * Reference year defaults to current UTC year.
 */
export function scoreTemporal(
  factor: EmissionFactor,
  referenceYear = new Date().getUTCFullYear()
): number {
  const from = yearOf(factor.validFrom);
  const to = yearOf(factor.validTo);
  if (from != null && referenceYear < from) return 0.35;
  if (to != null && referenceYear > to) return 0.25;
  if (from == null && to == null) return 0.55;
  // In window — prefer recent validity start
  const age = from != null ? Math.max(0, referenceYear - from) : 5;
  return clamp01(1 - age / 15);
}

/**
 * Geographic DQ: exact match > regional > GLO fallback.
 */
export function scoreGeo(factor: EmissionFactor, productGeography = "GLO"): number {
  const fg = (factor.geography || "GLO").toUpperCase();
  const pg = (productGeography || "GLO").toUpperCase();
  if (fg === pg) return 1;
  if (fg === "GLO" || pg === "GLO") return 0.55;
  // crude region family: EU* / US* / CN*
  if (fg.slice(0, 2) === pg.slice(0, 2)) return 0.75;
  return 0.35;
}

/**
 * Technological DQ: mapping confidence + factor uncertainty + category alignment.
 */
export function scoreTech(
  item: BomItem,
  mapping: CarbonMapping,
  factor: EmissionFactor
): number {
  let score = clamp01(mapping.confidence);
  if (typeof factor.uncertainty === "number") {
    score = clamp01(score * (1 - factor.uncertainty * 0.5));
  }
  const cat = factor.category.toLowerCase();
  if (item.itemType === "material" && cat.includes("material")) score = clamp01(score + 0.08);
  if (item.itemType === "component" && cat.includes("component")) score = clamp01(score + 0.08);
  if (item.itemType === "packaging" && cat.includes("packaging")) score = clamp01(score + 0.08);
  if (item.itemType === "process" && (cat.includes("energy") || cat.includes("process"))) {
    score = clamp01(score + 0.08);
  }
  return Number(score.toFixed(3));
}

export function aggregateDataQuality(
  rows: Array<{ temporal: number; geo: number; tech: number }>
): DataQualityScore {
  if (rows.length === 0) {
    return {
      temporal: 0,
      geo: 0,
      tech: 0,
      overall: 0,
      notes: ["No mapped factors to score"],
    };
  }
  const avg = (key: "temporal" | "geo" | "tech") =>
    rows.reduce((s, r) => s + r[key], 0) / rows.length;
  const temporal = Number(avg("temporal").toFixed(3));
  const geo = Number(avg("geo").toFixed(3));
  const tech = Number(avg("tech").toFixed(3));
  const overall = Number(((temporal + geo + tech) / 3).toFixed(3));
  const notes: string[] = [];
  if (temporal < 0.5) notes.push("Temporal representativeness is weak");
  if (geo < 0.5) notes.push("Geographic representativeness is weak");
  if (tech < 0.5) notes.push("Technological representativeness is weak");
  if (overall >= 0.75) notes.push("Overall DQ is good");
  else if (overall >= 0.5) notes.push("Overall DQ is moderate");
  else notes.push("Overall DQ is poor — review mappings/factors");
  return { temporal, geo, tech, overall, notes };
}

export function scoreCalculationQuality(input: {
  items: BomItem[];
  mappings: CarbonMapping[];
  factors: EmissionFactor[];
  productGeography?: string;
  referenceYear?: number;
}): DataQualityScore {
  const factorById = new Map(input.factors.map((f) => [f.id, f]));
  const itemById = new Map(input.items.map((i) => [i.id, i]));
  const rows: Array<{ temporal: number; geo: number; tech: number }> = [];
  for (const m of input.mappings) {
    if (m.status !== "approved" && m.status !== "suggested") continue;
    const factor = factorById.get(m.emissionFactorId);
    const item = itemById.get(m.bomItemId);
    if (!factor || !item) continue;
    rows.push({
      temporal: scoreTemporal(factor, input.referenceYear),
      geo: scoreGeo(factor, input.productGeography),
      tech: scoreTech(item, m, factor),
    });
  }
  return aggregateDataQuality(rows);
}

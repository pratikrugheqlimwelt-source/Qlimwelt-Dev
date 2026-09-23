import { convertUnit } from "@/lib/calculations/units";

const UNIT_GROUPS: Record<string, Set<string>> = {
  mass: new Set(["g", "kg", "t", "tonne"]),
  volume: new Set(["l", "litre", "litres", "m3", "m³"]),
  energy: new Set(["kwh", "mwh", "gj", "mj"]),
  distance: new Set(["km", "mi", "mile", "miles"]),
  count: new Set(["piece", "pcs", "pc", "unit", "each", "ea"]),
};

export function normalizeUnit(unit: string): string {
  return unit.toLowerCase().trim();
}

export function unitGroup(unit: string): string | null {
  const u = normalizeUnit(unit);
  for (const [group, set] of Object.entries(UNIT_GROUPS)) {
    if (set.has(u)) return group;
  }
  return null;
}

export function unitsCompatible(from: string, to: string): boolean {
  const a = normalizeUnit(from);
  const b = normalizeUnit(to);
  if (a === b) return true;
  const ga = unitGroup(a);
  const gb = unitGroup(b);
  return ga != null && ga === gb;
}

/** Strict BOM convert — rejects incompatible units (no silent passthrough). */
export function convertBomUnit(value: number, from: string, to: string): number {
  if (!Number.isFinite(value)) {
    throw new Error("INCOMPATIBLE_UNIT: value must be finite");
  }
  const f = normalizeUnit(from);
  const t = normalizeUnit(to);
  if (f === t) return value;
  if (!unitsCompatible(f, t)) {
    throw new Error(`INCOMPATIBLE_UNIT: cannot convert ${from} → ${to}`);
  }
  if (unitGroup(f) === "count") return value;
  return convertUnit(value, f, t);
}

export function inputQuantityAfterScrap(netQty: number, scrapRate: number): number {
  if (scrapRate < 0 || scrapRate >= 1) {
    throw new Error("INVALID_SCRAP: scrap_rate must be in [0, 1)");
  }
  return netQty / (1 - scrapRate);
}

export function effectiveOutputQuantity(inputQty: number, yieldRate: number): number {
  if (yieldRate <= 0 || yieldRate > 1) {
    throw new Error("INVALID_YIELD: yield_rate must be in (0, 1]");
  }
  return inputQty * yieldRate;
}

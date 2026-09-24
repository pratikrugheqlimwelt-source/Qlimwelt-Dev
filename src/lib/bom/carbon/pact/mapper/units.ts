/**
 * Map internal declared units → PACT DeclaredUnitOfMeasurement enum.
 */

import {
  PACT_DECLARED_UNITS,
  type PactDeclaredUnit,
} from "../wire-types";

const ALIASES: Record<string, PactDeclaredUnit> = {
  piece: "piece",
  pcs: "piece",
  pc: "piece",
  each: "piece",
  unit: "piece",
  kg: "kilogram",
  kilogram: "kilogram",
  kilograms: "kilogram",
  g: "kilogram",
  gram: "kilogram",
  litre: "liter",
  liter: "liter",
  l: "liter",
  "cubic meter": "cubic meter",
  "cubic metre": "cubic meter",
  m3: "cubic meter",
  "kilowatt hour": "kilowatt hour",
  kwh: "kilowatt hour",
  megajoule: "megajoule",
  mj: "megajoule",
  "ton kilometer": "ton kilometer",
  "tonne kilometer": "ton kilometer",
  tkm: "ton kilometer",
  "square meter": "square meter",
  "square metre": "square meter",
  m2: "square meter",
  hour: "hour",
  h: "hour",
  "megabit second": "megabit second",
};

export function mapDeclaredUnit(
  internalUnit: string | null | undefined
): { unit: PactDeclaredUnit; amount: string } | null {
  const raw = (internalUnit ?? "").trim().toLowerCase();
  if (!raw) return null;
  const exact = PACT_DECLARED_UNITS.find((u) => u === raw);
  if (exact) return { unit: exact, amount: "1" };
  const mapped = ALIASES[raw];
  if (!mapped) return null;
  if (raw === "g" || raw === "gram") {
    return { unit: "kilogram", amount: "0.001" };
  }
  return { unit: mapped, amount: "1" };
}

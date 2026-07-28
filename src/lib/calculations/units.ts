/** Unit conversion service — converts activity data to factor denominator units */

const FACTORS: Record<string, Record<string, number>> = {
  mass: { g: 0.001, kg: 1, t: 1000, tonne: 1000 },
  volume: { l: 1, litre: 1, litres: 1, m3: 1000, "m³": 1000 },
  energy: { kwh: 1, mwh: 1000, gj: 277.778, mj: 0.277778 },
  distance: { km: 1, mi: 1.60934, mile: 1.60934, miles: 1.60934 },
};

export function convertUnit(value: number, from: string, to: string): number {
  const f = from.toLowerCase().trim();
  const t = to.toLowerCase().trim();
  if (f === t) return value;

  for (const group of Object.values(FACTORS)) {
    if (group[f] !== undefined && group[t] !== undefined) {
      return (value * group[f]) / group[t];
    }
  }
  return value;
}

export function milesToKm(miles: number): number {
  return miles * 1.60934;
}

export function gallonsToLitres(gallons: number, us = true): number {
  return gallons * (us ? 3.78541 : 4.54609);
}

export function poundsToKg(pounds: number): number {
  return pounds * 0.453592;
}

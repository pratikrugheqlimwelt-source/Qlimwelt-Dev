import type { LucideIcon } from "lucide-react";
import {
  Truck,
  Zap,
  Plane,
  ShoppingBag,
  Trash2,
  Flame,
  Snowflake,
  Bus,
  Ship,
  Thermometer,
  SlidersHorizontal,
  Factory,
  Fuel,
  Leaf,
  Building2,
  Droplets,
  CarFront,
  TrainFront,
} from "lucide-react";

/** Explicit icons for Data Collection activity-type cards (by preset id). */
const PRESET_ICONS: Record<string, LucideIcon> = {
  mobile: Truck,
  gas: Flame,
  refrigerants: Snowflake,
  electricity: Zap,
  heat: Thermometer,
  goods: ShoppingBag,
  freight: Ship,
  travel: Plane,
  commuting: CarFront,
  waste: Trash2,
  custom: SlidersHorizontal,
};

/** Resolve a designer Lucide icon from preset id / category / factor name. */
export function resolveActivityIcon(hint: string): LucideIcon {
  const raw = hint.trim();
  const id = raw.split(/\s+/)[0]?.toLowerCase() ?? "";
  if (id && PRESET_ICONS[id]) return PRESET_ICONS[id];

  const h = raw.toLowerCase();

  if (/\bcustom\b|\bmanual\b|slider/.test(h)) return SlidersHorizontal;
  if (/refrigerant|fugitive|coolant|snow|\bhfc\b|r-?134/.test(h)) return Snowflake;
  if (/\bcommuting\b|\bemployee commuting\b/.test(h)) return CarFront;
  if (/\bfreight\b|logistics|\bship\b|downstream transport|upstream transport|\bcargo\b/.test(h))
    return Ship;
  if (/\bpurchased heat\b|\bdistrict\b|\bsteam\b|thermal|thermometer/.test(h)) return Thermometer;
  if (/\btravel\b|\bflight\b|\bplane\b|aviation|passenger-km|business travel/.test(h)) return Plane;
  if (/\brail\b|\btrain\b/.test(h)) return TrainFront;
  if (/purchased goods|\bspend\b|shopping|\bsupplier\b|category 1/.test(h)) return ShoppingBag;
  if (/\bwaste\b|landfill|\btrash\b|category 5/.test(h)) return Trash2;
  if (/electric|\bgrid\b|\bpower\b|\bkwh\b|purchased electricity/.test(h)) return Zap;
  if (/natural gas|stationary|boiler|\bflame\b|\bgas\b/.test(h)) return Flame;
  if (/mobile combustion|\bdiesel\b|\bpetrol\b|gasoline|\bfleet\b|\bvehicle\b|\btruck\b|fuel_based|\blitre\b/.test(h))
    return Truck;
  if (/\bbus\b/.test(h)) return Bus;
  if (/\bfuel\b/.test(h)) return Fuel;
  if (/\bwater\b|droplet/.test(h)) return Droplets;
  if (/factory|process|industrial/.test(h)) return Factory;
  if (/building|office|facility/.test(h)) return Building2;
  if (/\bbio\b|\bleaf\b|renewable/.test(h)) return Leaf;

  return SlidersHorizontal;
}

export function scopeChipLabel(scope: string): string {
  if (scope === "scope1") return "S1";
  if (scope === "scope2") return "S2";
  if (scope === "scope3") return "S3";
  return scope;
}

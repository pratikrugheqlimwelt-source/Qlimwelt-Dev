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
} from "lucide-react";

/** Resolve a designer Lucide icon from preset id / category / factor name. */
export function resolveActivityIcon(hint: string): LucideIcon {
  const h = hint.toLowerCase();

  if (/custom|manual|slider/.test(h)) return SlidersHorizontal;
  if (/refrigerant|fugitive|coolant|snow|hfc|r-?134/.test(h)) return Snowflake;
  if (/commuting|employee|bus/.test(h)) return Bus;
  if (/freight|logistics|ship|downstream transport|upstream transport|cargo/.test(h)) return Ship;
  if (/heat|steam|district|thermal|thermometer/.test(h)) return Thermometer;
  if (/travel|flight|plane|aviation|passenger/.test(h)) return Plane;
  if (/goods|spend|purchased goods|shopping|supplier|category 1/.test(h)) return ShoppingBag;
  if (/waste|landfill|trash|category 5/.test(h)) return Trash2;
  if (/electric|grid|power|kwh|scope.?2/.test(h)) return Zap;
  if (/diesel|petrol|gasoline|mobile|fleet|vehicle|truck|fuel_based|litre/.test(h)) return Truck;
  if (/natural gas|stationary|boiler|combustion|flame|gas/.test(h)) return Flame;
  if (/fuel(?!_based)/.test(h)) return Fuel;
  if (/water|droplet/.test(h)) return Droplets;
  if (/factory|process|industrial/.test(h)) return Factory;
  if (/building|office|facility/.test(h)) return Building2;
  if (/bio|leaf|renewable/.test(h)) return Leaf;

  return SlidersHorizontal;
}

export function scopeChipLabel(scope: string): string {
  if (scope === "scope1") return "S1";
  if (scope === "scope2") return "S2";
  if (scope === "scope3") return "S3";
  return scope;
}

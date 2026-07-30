import type { ModuleId } from "@/types/assessment";
import type { Scope, CalculationMethod } from "@/types/carbon";

export type ModuleDef = {
  id: ModuleId;
  label: string;
  hint: string;
  scope: Scope;
  category: string;
  defaultUnit: string;
  defaultFactor: number;
  method: CalculationMethod;
};

export const PHASE1_MODULES: ModuleDef[] = [
  {
    id: "scope1_stationary",
    label: "Stationary combustion",
    hint: "Natural gas, heating oil, diesel, LPG at facilities",
    scope: "scope1",
    category: "Stationary combustion",
    defaultUnit: "kWh",
    defaultFactor: 0.202,
    method: "activity_specific",
  },
  {
    id: "scope1_mobile",
    label: "Company vehicles",
    hint: "Fleet fuel or distance-based data",
    scope: "scope1",
    category: "Mobile combustion",
    defaultUnit: "litre",
    defaultFactor: 2.68,
    method: "fuel_based",
  },
  {
    id: "scope1_refrigerants",
    label: "Refrigerants",
    hint: "AC, refrigeration, heat-pump leaks",
    scope: "scope1",
    category: "Fugitive emissions",
    defaultUnit: "kg",
    defaultFactor: 1430,
    method: "activity_specific",
  },
  {
    id: "scope1_process",
    label: "Process emissions",
    hint: "Industrial / manufacturing process gases",
    scope: "scope1",
    category: "Process emissions",
    defaultUnit: "kg",
    defaultFactor: 1,
    method: "activity_specific",
  },
  {
    id: "scope2_electricity",
    label: "Purchased electricity",
    hint: "Grid power — location- and market-based",
    scope: "scope2",
    category: "Purchased electricity",
    defaultUnit: "kWh",
    defaultFactor: 0.000385,
    method: "location_based",
  },
  {
    id: "scope2_heat",
    label: "Purchased heat / steam",
    hint: "District heating, cooling, steam",
    scope: "scope2",
    category: "Purchased heat",
    defaultUnit: "kWh",
    defaultFactor: 0.00022,
    method: "location_based",
  },
  {
    id: "scope3_purchased_goods",
    label: "Purchased goods & services",
    hint: "Spend-based Category 1 (Phase 1)",
    scope: "scope3",
    category: "Category 1",
    defaultUnit: "EUR",
    defaultFactor: 0.004,
    method: "spend_based",
  },
  {
    id: "scope3_waste",
    label: "Waste",
    hint: "Waste generated in operations",
    scope: "scope3",
    category: "Category 5",
    defaultUnit: "tonne",
    defaultFactor: 0.52,
    method: "average_data",
  },
  {
    id: "scope3_business_travel",
    label: "Business travel",
    hint: "Flights, rail, hotels",
    scope: "scope3",
    category: "Category 6",
    defaultUnit: "passenger-km",
    defaultFactor: 0.000156,
    method: "distance_based",
  },
  {
    id: "scope3_commuting",
    label: "Employee commuting",
    hint: "Commute modes and distances",
    scope: "scope3",
    category: "Category 7",
    defaultUnit: "passenger-km",
    defaultFactor: 0.00017,
    method: "distance_based",
  },
  {
    id: "scope3_upstream_transport",
    label: "Upstream transport",
    hint: "Inbound logistics",
    scope: "scope3",
    category: "Category 4",
    defaultUnit: "tonne-km",
    defaultFactor: 0.00011,
    method: "distance_based",
  },
  {
    id: "scope3_downstream_transport",
    label: "Downstream transport",
    hint: "Outbound product logistics",
    scope: "scope3",
    category: "Category 9",
    defaultUnit: "tonne-km",
    defaultFactor: 0.00011,
    method: "distance_based",
  },
];

export function getModule(id: ModuleId): ModuleDef | undefined {
  return PHASE1_MODULES.find((m) => m.id === id);
}

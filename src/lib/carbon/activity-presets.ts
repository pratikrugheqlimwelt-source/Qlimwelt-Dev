import type { CalculationMethod, Scope } from "@/types/carbon";

export type ActivityPreset = {
  id: string;
  label: string;
  hint: string;
  scope: Scope;
  category: string;
  factor: number;
  unit: string;
  method: CalculationMethod;
};

export const ACTIVITY_PRESETS: ActivityPreset[] = [
  {
    id: "mobile",
    label: "Mobile combustion",
    hint: "Fleet diesel / petrol litres",
    scope: "scope1",
    category: "Mobile combustion",
    factor: 2.68,
    unit: "litre",
    method: "fuel_based",
  },
  {
    id: "gas",
    label: "Natural gas",
    hint: "Stationary combustion (kWh)",
    scope: "scope1",
    category: "Stationary combustion",
    factor: 0.202,
    unit: "kWh",
    method: "activity_specific",
  },
  {
    id: "refrigerants",
    label: "Refrigerants",
    hint: "Fugitive leaks (kg refrigerant)",
    scope: "scope1",
    category: "Fugitive emissions",
    factor: 1430,
    unit: "kg",
    method: "activity_specific",
  },
  {
    id: "electricity",
    label: "Electricity",
    hint: "Purchased grid power",
    scope: "scope2",
    category: "Purchased electricity",
    factor: 0.000385,
    unit: "kWh",
    method: "location_based",
  },
  {
    id: "heat",
    label: "Purchased heat",
    hint: "District heat / steam",
    scope: "scope2",
    category: "Purchased heat",
    factor: 0.00022,
    unit: "kWh",
    method: "location_based",
  },
  {
    id: "goods",
    label: "Purchased goods",
    hint: "Category 1 spend-based",
    scope: "scope3",
    category: "Category 1",
    factor: 0.004,
    unit: "EUR",
    method: "spend_based",
  },
  {
    id: "freight",
    label: "Freight transport",
    hint: "Upstream / downstream logistics",
    scope: "scope3",
    category: "Category 4",
    factor: 0.00011,
    unit: "tonne-km",
    method: "distance_based",
  },
  {
    id: "travel",
    label: "Business travel",
    hint: "Flights & rail (passenger-km)",
    scope: "scope3",
    category: "Category 6",
    factor: 0.000156,
    unit: "passenger-km",
    method: "distance_based",
  },
  {
    id: "commuting",
    label: "Commuting",
    hint: "Employee commuting",
    scope: "scope3",
    category: "Category 7",
    factor: 0.00017,
    unit: "passenger-km",
    method: "distance_based",
  },
  {
    id: "waste",
    label: "Waste",
    hint: "Disposal & treatment",
    scope: "scope3",
    category: "Category 5",
    factor: 0.52,
    unit: "tonne",
    method: "average_data",
  },
  {
    id: "custom",
    label: "Custom",
    hint: "Pick a library factor or enter manually",
    scope: "scope1",
    category: "Custom",
    factor: 0,
    unit: "unit",
    method: "activity_specific",
  },
];

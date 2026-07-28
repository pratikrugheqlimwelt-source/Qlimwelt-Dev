import type {
  Company,
  Facility,
  BusinessUnit,
  Vehicle,
  Supplier,
  ReductionInitiative,
  ClimateTarget,
  ClimateInsight,
  EmissionActivity,
  EmissionFactor,
} from "@/types/carbon";

export const company: Company = {
  id: "co-nordic",
  name: "Nordic Manufacturing Group",
  industry: "Industrial Manufacturing",
  currency: "EUR",
  baselineYear: 2023,
  reportingYear: 2024,
  employeeCount: 842,
  revenueEUR: 124_500_000,
  unitsProduced: 2_450_000,
  carbonPricePerTonne: 85,
  discountRate: 0.08,
  isDemo: true,
};

export const businessUnits: BusinessUnit[] = [
  { id: "bu-ops", name: "Operations", headcount: 420 },
  { id: "bu-log", name: "Logistics", headcount: 156 },
  { id: "bu-rnd", name: "R&D", headcount: 98 },
  { id: "bu-sales", name: "Sales & Marketing", headcount: 112 },
  { id: "bu-corp", name: "Corporate", headcount: 56 },
];

export const facilities: Facility[] = [
  { id: "fac-mun", name: "Munich Plant", country: "Germany", businessUnitId: "bu-ops", type: "Factory", floorAreaM2: 42000 },
  { id: "fac-ham", name: "Hamburg Warehouse", country: "Germany", businessUnitId: "bu-log", type: "Warehouse", floorAreaM2: 18500 },
  { id: "fac-ams", name: "Amsterdam Office", country: "Netherlands", businessUnitId: "bu-corp", type: "Office", floorAreaM2: 6200 },
];

export const vehicles: Vehicle[] = Array.from({ length: 20 }, (_, i) => ({
  id: `veh-${i + 1}`,
  name: `Fleet Vehicle ${i + 1}`,
  manufacturer: ["VW", "Mercedes", "Ford", "Tesla", "Renault"][i % 5],
  model: ["Transporter", "Sprinter", "Transit", "Model 3", "Kangoo"][i % 5],
  category: i < 12 ? "Van" : i < 17 ? "Passenger car" : "Heavy goods vehicle",
  fuelType: i < 3 ? "Battery electric" : i < 8 ? "Diesel" : i < 14 ? "Petrol" : "Hybrid diesel",
  registration: `DE-NM-${1000 + i}`,
  ownership: "Company owned",
  facilityId: facilities[i % 3].id,
  country: i % 3 === 2 ? "Netherlands" : "Germany",
  year: 2018 + (i % 7),
  distanceKm: 8000 + i * 1200,
  fuelLitres: i < 3 ? 0 : 1200 + i * 80,
  electricityKwh: i < 3 ? 3200 + i * 200 : i < 8 ? 0 : 400,
  emissionFactor: i < 3 ? 0.25 : i < 8 ? 2.68 : 2.31,
  status: "active" as const,
}));

export const suppliers: Supplier[] = [
  { id: "sup-1", name: "MetalWorks SA", country: "Spain", category: "Raw materials", scope3TCO2e: 2840, dataQualityScore: 62, influenceScore: 88, reductionOpportunity: 72 },
  { id: "sup-2", name: "ChemBase AG", country: "Germany", category: "Chemicals", scope3TCO2e: 1920, dataQualityScore: 78, influenceScore: 75, reductionOpportunity: 65 },
  { id: "sup-3", name: "PackPro Ltd", country: "Poland", category: "Packaging", scope3TCO2e: 890, dataQualityScore: 55, influenceScore: 60, reductionOpportunity: 80 },
  { id: "sup-4", name: "CloudServe BV", country: "Netherlands", category: "Cloud services", scope3TCO2e: 420, dataQualityScore: 82, influenceScore: 45, reductionOpportunity: 55 },
  { id: "sup-5", name: "SteelCo GmbH", country: "Germany", category: "Steel", scope3TCO2e: 3100, dataQualityScore: 71, influenceScore: 92, reductionOpportunity: 68 },
  { id: "sup-6", name: "LogiTrans EU", country: "France", category: "Freight", scope3TCO2e: 1560, dataQualityScore: 68, influenceScore: 70, reductionOpportunity: 74 },
  { id: "sup-7", name: "OfficeDirect", country: "Germany", category: "Office supplies", scope3TCO2e: 180, dataQualityScore: 48, influenceScore: 30, reductionOpportunity: 40 },
  { id: "sup-8", name: "GreenEnergy Partners", country: "Germany", category: "Energy", scope3TCO2e: 0, dataQualityScore: 95, influenceScore: 85, reductionOpportunity: 90 },
  { id: "sup-9", name: "TechParts Inc", country: "Czech Republic", category: "Electronics", scope3TCO2e: 720, dataQualityScore: 58, influenceScore: 55, reductionOpportunity: 62 },
  { id: "sup-10", name: "CleanPack Solutions", country: "Sweden", category: "Packaging", scope3TCO2e: 340, dataQualityScore: 88, influenceScore: 50, reductionOpportunity: 85 },
];

export const reductionInitiatives: ReductionInitiative[] = [
  { id: "ri-1", name: "100% Renewable Electricity PPA", category: "Energy", source: "Scope 2", implementationCost: 340000, annualOperatingCost: 12000, annualFinancialSaving: 89000, annualEmissionReductionTCO2e: 2964, implementationDate: "2025-06-01", confidence: 92, status: "planned", expectedLifetimeYears: 10, difficulty: "medium" },
  { id: "ri-2", name: "Fleet Electrification Phase 1", category: "Transport", source: "Scope 1", implementationCost: 520000, annualOperatingCost: 8000, annualFinancialSaving: 67000, annualEmissionReductionTCO2e: 420, implementationDate: "2025-09-01", confidence: 85, status: "in_progress", expectedLifetimeYears: 8, difficulty: "high" },
  { id: "ri-3", name: "LED Lighting Retrofit", category: "Efficiency", source: "Scope 2", implementationCost: 45000, annualOperatingCost: 0, annualFinancialSaving: 22000, annualEmissionReductionTCO2e: 85, implementationDate: "2024-11-01", confidence: 98, status: "completed", expectedLifetimeYears: 12, difficulty: "low" },
  { id: "ri-4", name: "Supplier Engagement Programme", category: "Scope 3", source: "Category 1", implementationCost: 120000, annualOperatingCost: 35000, annualFinancialSaving: 0, annualEmissionReductionTCO2e: 890, implementationDate: "2025-03-01", confidence: 70, status: "planned", expectedLifetimeYears: 5, difficulty: "medium" },
  { id: "ri-5", name: "Solar Installation Munich Plant", category: "Energy", source: "Scope 2", implementationCost: 680000, annualOperatingCost: 5000, annualFinancialSaving: 95000, annualEmissionReductionTCO2e: 520, implementationDate: "2026-01-01", confidence: 88, status: "planned", expectedLifetimeYears: 20, difficulty: "high" },
];

export const climateTarget: ClimateTarget = {
  id: "tgt-1",
  name: "Science-Based Target 2030",
  baselineYear: 2023,
  targetYear: 2030,
  baselineEmissionsTCO2e: 14200,
  targetReductionPct: 42,
  type: "absolute",
};

export const climateInsights: ClimateInsight[] = [
  { id: "ins-1", title: "Scope 3 dominates footprint", what: "Scope 3 accounts for 68% of total emissions.", why: "Purchased goods and upstream transport are the largest drivers.", action: "Prioritise supplier engagement and primary data collection.", emissionImpactTCO2e: 890, financialImpactEUR: 75650, confidence: 88, priority: "high" },
  { id: "ins-2", title: "ChemBase AG anomaly detected", what: "Supplier emissions increased 18% vs prior quarter.", why: "May indicate data quality issue or real supply chain change.", action: "Request updated primary data from ChemBase AG.", emissionImpactTCO2e: 346, financialImpactEUR: 29410, confidence: 75, priority: "high" },
  { id: "ins-3", title: "Renewable PPA highest ROI", what: "100% renewable electricity offers 2.4 year payback.", why: "Scope 2 reduction with strong financial return.", action: "Accelerate PPA contract finalisation.", emissionImpactTCO2e: 2964, financialImpactEUR: 77000, confidence: 92, priority: "high" },
  { id: "ins-4", title: "Low data quality in Category 1", what: "34% of Category 1 records use spend-based estimates.", why: "Reduces audit confidence for CSRD disclosure.", action: "Switch top 5 suppliers to activity-based factors.", emissionImpactTCO2e: 0, financialImpactEUR: 0, confidence: 80, priority: "medium" },
  { id: "ins-5", title: "Fleet electrification opportunity", what: "8 diesel vans could save 420 tCO₂e/year.", why: "EV replacements available with acceptable TCO.", action: "Begin Phase 1 fleet electrification.", emissionImpactTCO2e: 420, financialImpactEUR: 59000, confidence: 85, priority: "medium" },
];

export const emissionFactors: EmissionFactor[] = [
  { id: "ef-ng", name: "Natural gas combustion", category: "Stationary combustion", subcategory: "Natural gas", country: "Germany", region: "DE", year: 2024, value: 0.202, numeratorUnit: "kgCO2e", denominatorUnit: "kWh", ghgCoverage: ["CO2", "CH4"], source: "UBA (demo)", validFrom: "2024-01-01", validUntil: "2024-12-31", method: "activity_specific", uncertaintyPct: 5, isDemo: true },
  { id: "ef-grid-de", name: "German grid electricity", category: "Purchased electricity", subcategory: "Grid mix", country: "Germany", region: "DE", year: 2024, value: 0.385, numeratorUnit: "kgCO2e", denominatorUnit: "kWh", ghgCoverage: ["CO2"], source: "UBA (demo)", validFrom: "2024-01-01", validUntil: "2024-12-31", method: "location_based", uncertaintyPct: 8, isDemo: true },
  { id: "ef-diesel", name: "Diesel road fuel", category: "Mobile combustion", subcategory: "Diesel", country: "EU", region: "EU", year: 2024, value: 2.68, numeratorUnit: "kgCO2e", denominatorUnit: "litre", ghgCoverage: ["CO2"], source: "DEFRA (demo)", validFrom: "2024-01-01", validUntil: "2024-12-31", method: "fuel_based", uncertaintyPct: 6, isDemo: true },
];

const MONTHS = ["2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12"];

function act(
  id: string,
  period: string,
  scope: "scope1" | "scope2" | "scope3",
  category: string,
  subcategory: string,
  source: string,
  value: number,
  unit: string,
  factor: number,
  facilityId: string,
  buId: string,
  country: string,
  method: EmissionActivity["method"],
  dq: number,
  estimated: boolean
): EmissionActivity {
  return {
    id,
    period,
    facilityId,
    country,
    businessUnitId: buId,
    scope,
    category,
    subcategory,
    source,
    activityValue: value,
    activityUnit: unit,
    emissionFactorId: "ef-demo",
    emissionFactorValue: factor,
    emissionFactorUnit: `kgCO2e/${unit}`,
    emissionFactorSource: "Demo factor library",
    emissionFactorYear: 2024,
    conversionFactor: 1,
    ghg: "CO2",
    gwp: 1,
    method,
    dataQualityScore: dq,
    uncertaintyPct: estimated ? 25 : 10,
    evidenceStatus: dq >= 85 ? "verified" : dq >= 60 ? "uploaded" : "pending",
    isEstimated: estimated,
  };
}

/** Realistic monthly drivers — heating peaks in winter, electricity in summer, production cycles */
const MONTHLY_PROFILES = {
  /** Natural gas / heating — strong winter peak */
  heating: [1.55, 1.48, 1.22, 0.82, 0.58, 0.48, 0.45, 0.52, 0.78, 1.05, 1.35, 1.52],
  /** Grid electricity — summer cooling + production load */
  electricity: [0.94, 0.92, 0.98, 1.05, 1.12, 1.22, 1.28, 1.25, 1.08, 0.98, 0.95, 0.97],
  /** Manufacturing output index */
  production: [0.85, 0.90, 1.02, 1.10, 1.14, 1.08, 0.78, 0.72, 1.05, 1.15, 1.20, 0.95],
  /** Fleet mileage — higher in business quarters */
  fleet: [0.92, 0.96, 1.05, 1.08, 1.10, 1.05, 0.82, 0.78, 1.02, 1.10, 1.05, 0.88],
  /** Business travel — spikes after summer and year-end */
  travel: [0.75, 0.85, 1.10, 1.15, 1.05, 0.90, 0.65, 0.55, 1.20, 1.25, 1.15, 0.70],
};

function monthDrivers(monthIdx: number) {
  const p = MONTHLY_PROFILES;
  const efficiency = 1 - monthIdx * 0.0035; // ~4% annual improvement from LED, PPA, etc.
  const noise = 1 + Math.sin(monthIdx * 2.17 + 1.3) * 0.035;
  return {
    heating: p.heating[monthIdx] * efficiency * noise,
    electricity: p.electricity[monthIdx] * efficiency * noise,
    production: p.production[monthIdx] * noise,
    fleet: p.fleet[monthIdx] * noise,
    travel: p.travel[monthIdx] * noise,
    efficiency,
  };
}

/** Generate 12 months of activity records with realistic seasonal variation */
export function generateActivities(): EmissionActivity[] {
  const activities: EmissionActivity[] = [];
  let idx = 0;

  for (const period of MONTHS) {
    const m = MONTHS.indexOf(period);
    const d = monthDrivers(m);

    // Scope 1 — combustion varies strongly with season (~18–28% of monthly total)
    activities.push(act(`a-${idx++}`, period, "scope1", "Stationary combustion", "Natural gas", "Munich boiler", Math.round(2340000 * d.heating), "kWh", 0.000202, "fac-mun", "bu-ops", "Germany", "fuel_based", 88, false));
    activities.push(act(`a-${idx++}`, period, "scope1", "Stationary combustion", "Natural gas", "Hamburg heating", Math.round(504000 * d.heating), "kWh", 0.000202, "fac-ham", "bu-log", "Germany", "fuel_based", 85, false));
    activities.push(act(`a-${idx++}`, period, "scope1", "Mobile combustion", "Diesel", "Fleet fuel — vans", Math.round(8160 * d.fleet), "litre", 0.00268, "fac-ham", "bu-log", "Germany", "fuel_based", 82, false));
    activities.push(act(`a-${idx++}`, period, "scope1", "Mobile combustion", "Petrol", "Fleet fuel — cars", Math.round(3840 * d.fleet), "litre", 0.00231, "fac-ams", "bu-sales", "Netherlands", "fuel_based", 80, false));
    activities.push(act(`a-${idx++}`, period, "scope1", "Fugitive emissions", "Refrigerants", "HVAC Munich", 0.1 + (m >= 5 && m <= 8 ? 0.08 : 0) + m * 0.004, "kg", 1430, "fac-mun", "bu-ops", "Germany", "activity_specific", 75, false));
    activities.push(act(`a-${idx++}`, period, "scope1", "Process emissions", "Industrial process", "Coating line", Math.round(4800 * d.production), "kg", 0.0028, "fac-mun", "bu-ops", "Germany", "activity_specific", 79, false));

    // Scope 2 — electricity tracks production + cooling (~12–18% of monthly total)
    activities.push(act(`a-${idx++}`, period, "scope2", "Purchased electricity", "Grid mix", "Munich plant", Math.round(2770000 * d.electricity * d.production), "kWh", 0.000385, "fac-mun", "bu-ops", "Germany", "location_based", 92, false));
    activities.push(act(`a-${idx++}`, period, "scope2", "Purchased electricity", "Grid mix", "Hamburg warehouse", Math.round(633000 * d.electricity), "kWh", 0.000385, "fac-ham", "bu-log", "Germany", "location_based", 90, false));
    activities.push(act(`a-${idx++}`, period, "scope2", "Purchased electricity", "Grid mix", "Amsterdam office", Math.round(230000 * d.electricity), "kWh", 0.000312, "fac-ams", "bu-corp", "Netherlands", "location_based", 88, false));
    activities.push(act(`a-${idx++}`, period, "scope2", "Purchased heating", "District heating", "Amsterdam office", Math.round(56000 * d.heating), "kWh", 0.00018, "fac-ams", "bu-corp", "Netherlands", "activity_specific", 78, false));
    activities.push(act(`a-${idx++}`, period, "scope2", "Purchased steam", "Process steam", "Munich plant", Math.round(34000 * d.production), "kWh", 0.00022, "fac-mun", "bu-ops", "Germany", "activity_specific", 84, false));

    // Scope 3 — value chain linked to production (~55–65% of monthly total)
    activities.push(act(`a-${idx++}`, period, "scope3", "Category 1", "Purchased goods", "Raw materials — steel", Math.round(920000 * d.production), "EUR", 0.005, "fac-mun", "bu-ops", "Germany", "spend_based", 52, true));
    activities.push(act(`a-${idx++}`, period, "scope3", "Category 1", "Purchased goods", "Components & parts", Math.round(540000 * d.production), "EUR", 0.0035, "fac-mun", "bu-ops", "Germany", "spend_based", 58, true));
    activities.push(act(`a-${idx++}`, period, "scope3", "Category 2", "Capital goods", "Machinery capex", m === 2 || m === 8 ? 180000 : 45000, "EUR", 0.0021, "fac-mun", "bu-ops", "Germany", "spend_based", 45, true));
    activities.push(act(`a-${idx++}`, period, "scope3", "Category 4", "Upstream transport", "Road freight inbound", Math.round(98000 * d.production), "tonne-km", 0.000112, "fac-ham", "bu-log", "Germany", "distance_based", 68, false));
    activities.push(act(`a-${idx++}`, period, "scope3", "Category 4", "Downstream transport", "Road freight outbound", Math.round(72000 * d.production), "tonne-km", 0.000098, "fac-ham", "bu-log", "Germany", "distance_based", 65, false));
    activities.push(act(`a-${idx++}`, period, "scope3", "Category 5", "Waste", "General waste", Math.round(22 * d.production), "tonne", 0.52, "fac-mun", "bu-ops", "Germany", "average_data", 72, false));
    activities.push(act(`a-${idx++}`, period, "scope3", "Category 6", "Business travel", "Flights — short haul", Math.round(38000 * d.travel), "passenger-km", 0.000156, "fac-ams", "bu-sales", "Netherlands", "distance_based", 65, false));
    activities.push(act(`a-${idx++}`, period, "scope3", "Category 6", "Business travel", "Flights — long haul", Math.round(12000 * d.travel), "passenger-km", 0.000195, "fac-ams", "bu-sales", "Netherlands", "distance_based", 62, false));
    activities.push(act(`a-${idx++}`, period, "scope3", "Category 7", "Employee commuting", "Car commute", Math.round(842 * 18 * d.fleet), "km", 0.00021, "fac-mun", "bu-ops", "Germany", "average_data", 58, true));
    activities.push(act(`a-${idx++}`, period, "scope3", "Category 7", "Employee commuting", "Public transit", Math.round(842 * 8 * d.fleet), "km", 0.000042, "fac-ams", "bu-corp", "Netherlands", "average_data", 55, true));
  }

  return activities;
}

export const allActivities = generateActivities();

export const PERIODS = ["all", ...MONTHS];
export const COUNTRIES = ["all", "Germany", "Netherlands"];
export const SCOPES = ["all", "scope1", "scope2", "scope3"];

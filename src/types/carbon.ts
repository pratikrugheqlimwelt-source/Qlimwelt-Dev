/** Qlimwelt Carbon Intelligence — core domain types */

export type Scope = "scope1" | "scope2" | "scope3";
export type GHG =
  | "CO2"
  | "CH4"
  | "N2O"
  | "HFCs"
  | "PFCs"
  | "SF6"
  | "NF3";

export type CalculationMethod =
  | "supplier_specific"
  | "activity_specific"
  | "average_data"
  | "spend_based"
  | "distance_based"
  | "fuel_based"
  | "location_based"
  | "market_based"
  | "estimated"
  | "modelled";

export type DataQualityLabel = "low" | "moderate" | "good" | "high";
export type EvidenceStatus = "verified" | "uploaded" | "pending" | "none";
export type ResourceType =
  | "facility"
  | "building"
  | "vehicle"
  | "machinery"
  | "meter"
  | "supplier"
  | "product"
  | "shipment"
  | "waste_stream"
  | "employee"
  | "reduction_initiative";

export type TargetStatus = "ahead" | "on_track" | "at_risk" | "off_track";

export interface Company {
  id: string;
  name: string;
  industry: string;
  currency: string;
  baselineYear: number;
  reportingYear: number;
  employeeCount: number;
  revenueEUR: number;
  unitsProduced: number;
  carbonPricePerTonne: number;
  discountRate: number;
  isDemo: boolean;
}

export interface Facility {
  id: string;
  name: string;
  country: string;
  businessUnitId: string;
  type: string;
  floorAreaM2: number;
}

export interface BusinessUnit {
  id: string;
  name: string;
  headcount: number;
}

export interface EmissionFactor {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  country: string;
  region: string;
  year: number;
  value: number;
  numeratorUnit: string;
  denominatorUnit: string;
  ghgCoverage: GHG[];
  source: string;
  validFrom: string;
  validUntil: string;
  method: CalculationMethod;
  uncertaintyPct: number;
  isDemo: boolean;
}

export interface EmissionActivity {
  id: string;
  period: string; // YYYY-MM
  facilityId: string;
  country: string;
  businessUnitId: string;
  scope: Scope;
  category: string;
  subcategory: string;
  source: string;
  activityValue: number;
  activityUnit: string;
  emissionFactorId: string;
  emissionFactorValue: number;
  emissionFactorUnit: string;
  emissionFactorSource: string;
  emissionFactorYear: number;
  conversionFactor: number;
  ghg: GHG;
  gwp: number;
  method: CalculationMethod;
  dataQualityScore: number;
  uncertaintyPct: number;
  evidenceStatus: EvidenceStatus;
  resourceId?: string;
  isEstimated: boolean;
}

export interface EmissionCalculation {
  activityId: string;
  emissionsKgCO2e: number;
  emissionsTCO2e: number;
  gasMass?: number;
  gasCO2e?: number;
}

export interface Vehicle {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  category: string;
  fuelType: string;
  registration: string;
  ownership: string;
  facilityId: string;
  country: string;
  year: number;
  distanceKm: number;
  fuelLitres: number;
  electricityKwh: number;
  emissionFactor: number;
  status: "active" | "archived";
}

export interface Supplier {
  id: string;
  name: string;
  country: string;
  category: string;
  scope3TCO2e: number;
  dataQualityScore: number;
  influenceScore: number;
  reductionOpportunity: number;
}

export interface ReductionInitiative {
  id: string;
  name: string;
  category: string;
  source: string;
  implementationCost: number;
  annualOperatingCost: number;
  annualFinancialSaving: number;
  annualEmissionReductionTCO2e: number;
  implementationDate: string;
  confidence: number;
  status: "planned" | "in_progress" | "completed";
  expectedLifetimeYears: number;
  difficulty: "low" | "medium" | "high";
}

export interface ClimateTarget {
  id: string;
  name: string;
  baselineYear: number;
  targetYear: number;
  baselineEmissionsTCO2e: number;
  targetReductionPct: number;
  type: "absolute" | "intensity";
}

export interface ClimateInsight {
  id: string;
  title: string;
  what: string;
  why: string;
  action: string;
  emissionImpactTCO2e: number;
  financialImpactEUR: number;
  confidence: number;
  priority: "high" | "medium" | "low";
}

export interface DataQualityResult {
  score: number;
  label: DataQualityLabel;
  completeness: number;
  recency: number;
  factorQuality: number;
  methodQuality: number;
  evidence: number;
  verification: number;
}

export interface DashboardFilters {
  period: string;
  facilityId: string;
  country: string;
  businessUnitId: string;
  scope: string;
  category: string;
  dataQuality: string;
  method: string;
}

export const DEFAULT_FILTERS: DashboardFilters = {
  period: "all",
  facilityId: "all",
  country: "all",
  businessUnitId: "all",
  scope: "all",
  category: "all",
  dataQuality: "all",
  method: "all",
};

import type {
  EmissionActivity,
  Facility,
  Vehicle,
  Supplier,
  ReductionInitiative,
  ClimateTarget,
  EmissionFactor,
} from "@/types/carbon";
import type { Assessment, AssessmentProfile, AssessmentBoundary, ModuleProgress, QuestionResponse, ModuleId, AssessmentStep, AssessmentStatus, AssessmentType } from "@/types/assessment";
import { emptyProfile, emptyBoundary } from "@/types/assessment";

export type DashboardNotification = {
  id: string;
  companyId: string;
  userId?: string | null;
  title: string;
  message: string;
  href?: string | null;
  read: boolean;
  createdAt: string;
};

export type CompanySettingsRow = {
  companyId: string;
  carbonPricePerTonne: number;
  discountRate: number;
  unitsProduced: number;
  baselineYear: number;
  reportingYear: number;
  customFactors: EmissionFactor[];
  seededAt: string | null;
  gwpValues?: Record<string, number>;
};

export type DashboardBundle = {
  settings: CompanySettingsRow | null;
  facilities: Facility[];
  vehicles: Vehicle[];
  suppliers: Supplier[];
  activities: EmissionActivity[];
  initiatives: ReductionInitiative[];
  climateTarget: ClimateTarget | null;
  notifications: DashboardNotification[];
  assessments: import("@/types/assessment").Assessment[];
};

export function mapFacility(row: Record<string, unknown>): Facility {
  return {
    id: String(row.id),
    name: String(row.name),
    country: String(row.country),
    businessUnitId: String(row.business_unit_id),
    type: String(row.type),
    floorAreaM2: Number(row.floor_area_m2),
  };
}

export function facilityToRow(f: Facility, companyId: string) {
  return {
    id: f.id,
    company_id: companyId,
    name: f.name,
    country: f.country,
    business_unit_id: f.businessUnitId,
    type: f.type,
    floor_area_m2: f.floorAreaM2,
  };
}

export function mapVehicle(row: Record<string, unknown>): Vehicle {
  return {
    id: String(row.id),
    name: String(row.name),
    manufacturer: String(row.manufacturer),
    model: String(row.model),
    category: String(row.category),
    fuelType: String(row.fuel_type),
    registration: String(row.registration),
    ownership: String(row.ownership),
    facilityId: String(row.facility_id),
    country: String(row.country),
    year: Number(row.year),
    distanceKm: Number(row.distance_km),
    fuelLitres: Number(row.fuel_litres),
    electricityKwh: Number(row.electricity_kwh),
    emissionFactor: Number(row.emission_factor),
    status: row.status === "archived" ? "archived" : "active",
  };
}

export function vehicleToRow(v: Vehicle, companyId: string) {
  return {
    id: v.id,
    company_id: companyId,
    name: v.name,
    manufacturer: v.manufacturer,
    model: v.model,
    category: v.category,
    fuel_type: v.fuelType,
    registration: v.registration,
    ownership: v.ownership,
    facility_id: v.facilityId,
    country: v.country,
    year: v.year,
    distance_km: v.distanceKm,
    fuel_litres: v.fuelLitres,
    electricity_kwh: v.electricityKwh,
    emission_factor: v.emissionFactor,
    status: v.status,
  };
}

export function mapSupplier(row: Record<string, unknown>): Supplier {
  return {
    id: String(row.id),
    name: String(row.name),
    country: String(row.country),
    category: String(row.category),
    scope3TCO2e: Number(row.scope3_tco2e),
    dataQualityScore: Number(row.data_quality_score),
    influenceScore: Number(row.influence_score),
    reductionOpportunity: Number(row.reduction_opportunity),
  };
}

export function supplierToRow(s: Supplier, companyId: string) {
  return {
    id: s.id,
    company_id: companyId,
    name: s.name,
    country: s.country,
    category: s.category,
    scope3_tco2e: s.scope3TCO2e,
    data_quality_score: s.dataQualityScore,
    influence_score: s.influenceScore,
    reduction_opportunity: s.reductionOpportunity,
  };
}

export function mapActivity(row: Record<string, unknown>): EmissionActivity {
  return {
    id: String(row.id),
    period: String(row.period),
    facilityId: String(row.facility_id),
    country: String(row.country),
    businessUnitId: String(row.business_unit_id),
    scope: row.scope as EmissionActivity["scope"],
    category: String(row.category),
    subcategory: String(row.subcategory),
    source: String(row.source),
    activityValue: Number(row.activity_value),
    activityUnit: String(row.activity_unit),
    emissionFactorId: String(row.emission_factor_id),
    emissionFactorValue: Number(row.emission_factor_value),
    emissionFactorUnit: String(row.emission_factor_unit),
    emissionFactorSource: String(row.emission_factor_source),
    emissionFactorYear: Number(row.emission_factor_year),
    conversionFactor: Number(row.conversion_factor),
    ghg: (row.ghg as EmissionActivity["ghg"]) ?? "CO2",
    gwp: Number(row.gwp),
    method: row.method as EmissionActivity["method"],
    dataQualityScore: Number(row.data_quality_score),
    uncertaintyPct: Number(row.uncertainty_pct),
    evidenceStatus: row.evidence_status as EmissionActivity["evidenceStatus"],
    resourceId: row.resource_id ? String(row.resource_id) : undefined,
    isEstimated: Boolean(row.is_estimated),
    assessmentId: row.assessment_id ? String(row.assessment_id) : undefined,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : undefined,
  };
}

export function activityToRow(a: EmissionActivity, companyId: string) {
  return {
    id: a.id,
    company_id: companyId,
    period: a.period,
    facility_id: a.facilityId,
    country: a.country,
    business_unit_id: a.businessUnitId,
    scope: a.scope,
    category: a.category,
    subcategory: a.subcategory,
    source: a.source,
    activity_value: a.activityValue,
    activity_unit: a.activityUnit,
    emission_factor_id: a.emissionFactorId,
    emission_factor_value: a.emissionFactorValue,
    emission_factor_unit: a.emissionFactorUnit,
    emission_factor_source: a.emissionFactorSource,
    emission_factor_year: a.emissionFactorYear,
    conversion_factor: a.conversionFactor,
    ghg: a.ghg,
    gwp: a.gwp,
    method: a.method,
    data_quality_score: a.dataQualityScore,
    uncertainty_pct: a.uncertaintyPct,
    evidence_status: a.evidenceStatus,
    resource_id: a.resourceId ?? null,
    is_estimated: a.isEstimated,
    assessment_id: a.assessmentId ?? null,
    metadata: a.metadata ?? {},
  };
}

export function mapInitiative(row: Record<string, unknown>): ReductionInitiative {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    source: String(row.source),
    implementationCost: Number(row.implementation_cost),
    annualOperatingCost: Number(row.annual_operating_cost),
    annualFinancialSaving: Number(row.annual_financial_saving),
    annualEmissionReductionTCO2e: Number(row.annual_emission_reduction_tco2e),
    implementationDate: String(row.implementation_date),
    confidence: Number(row.confidence),
    status: row.status as ReductionInitiative["status"],
    expectedLifetimeYears: Number(row.expected_lifetime_years),
    difficulty: row.difficulty as ReductionInitiative["difficulty"],
  };
}

export function initiativeToRow(i: ReductionInitiative, companyId: string) {
  return {
    id: i.id,
    company_id: companyId,
    name: i.name,
    category: i.category,
    source: i.source,
    implementation_cost: i.implementationCost,
    annual_operating_cost: i.annualOperatingCost,
    annual_financial_saving: i.annualFinancialSaving,
    annual_emission_reduction_tco2e: i.annualEmissionReductionTCO2e,
    implementation_date: i.implementationDate,
    confidence: i.confidence,
    status: i.status,
    expected_lifetime_years: i.expectedLifetimeYears,
    difficulty: i.difficulty,
  };
}

export function mapTarget(row: Record<string, unknown>): ClimateTarget {
  return {
    id: String(row.id),
    name: String(row.name),
    baselineYear: Number(row.baseline_year),
    targetYear: Number(row.target_year),
    baselineEmissionsTCO2e: Number(row.baseline_emissions_tco2e),
    targetReductionPct: Number(row.target_reduction_pct),
    type: row.type === "intensity" ? "intensity" : "absolute",
  };
}

export function targetToRow(t: ClimateTarget, companyId: string) {
  return {
    id: t.id,
    company_id: companyId,
    name: t.name,
    baseline_year: t.baselineYear,
    target_year: t.targetYear,
    baseline_emissions_tco2e: t.baselineEmissionsTCO2e,
    target_reduction_pct: t.targetReductionPct,
    type: t.type,
  };
}

export function mapNotification(row: Record<string, unknown>): DashboardNotification {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    userId: row.user_id ? String(row.user_id) : null,
    title: String(row.title),
    message: String(row.message ?? ""),
    href: row.href ? String(row.href) : null,
    read: Boolean(row.read),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function mapSettings(row: Record<string, unknown>): CompanySettingsRow {
  return {
    companyId: String(row.company_id),
    carbonPricePerTonne: Number(row.carbon_price_per_tonne),
    discountRate: Number(row.discount_rate),
    unitsProduced: Number(row.units_produced),
    baselineYear: Number(row.baseline_year),
    reportingYear: Number(row.reporting_year),
    customFactors: Array.isArray(row.custom_factors) ? (row.custom_factors as EmissionFactor[]) : [],
    seededAt: row.seeded_at ? String(row.seeded_at) : null,
    gwpValues:
      row.gwp_values && typeof row.gwp_values === "object"
        ? (row.gwp_values as Record<string, number>)
        : undefined,
  };
}

export function mapAssessment(row: Record<string, unknown>): Assessment {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    name: String(row.name),
    type: (row.type as AssessmentType) ?? "corporate",
    status: (row.status as AssessmentStatus) ?? "draft",
    currentStep: (row.current_step as AssessmentStep) ?? "profile",
    profile: (row.profile as AssessmentProfile) ?? emptyProfile(),
    boundary: (row.boundary as AssessmentBoundary) ?? emptyBoundary(),
    screening: (row.screening as Record<string, unknown>) ?? {},
    responses: Array.isArray(row.responses) ? (row.responses as QuestionResponse[]) : [],
    enabledModules: Array.isArray(row.enabled_modules) ? (row.enabled_modules as ModuleId[]) : [],
    moduleProgress: Array.isArray(row.module_progress) ? (row.module_progress as ModuleProgress[]) : [],
    assumptions: Array.isArray(row.assumptions) ? (row.assumptions as string[]) : [],
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export function assessmentToRow(a: Assessment, companyId: string) {
  return {
    id: a.id,
    company_id: companyId,
    name: a.name,
    type: a.type,
    status: a.status,
    current_step: a.currentStep,
    profile: a.profile,
    boundary: a.boundary,
    screening: a.screening,
    responses: a.responses,
    enabled_modules: a.enabledModules,
    module_progress: a.moduleProgress,
    assumptions: a.assumptions,
    updated_at: new Date().toISOString(),
  };
}

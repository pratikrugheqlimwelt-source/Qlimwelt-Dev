/** Guided assessment domain — corporate CCF MVP */

export type AssessmentType =
  | "corporate"
  | "product"
  | "event"
  | "supplier";

export type AssessmentStatus =
  | "draft"
  | "in_progress"
  | "ready_for_review"
  | "calculated"
  | "locked";

export type OrgStructure =
  | "one_office"
  | "multiple_offices"
  | "manufacturing"
  | "retail_hospitality"
  | "logistics_fleet"
  | "digital_software"
  | "mixed";

export type ConsolidationApproach =
  | "operational_control"
  | "financial_control"
  | "equity_share"
  | "not_sure";

export type ReportingStandard =
  | "ghg_corporate"
  | "ghg_product"
  | "pact_pcf"
  | "esrs_csrd"
  | "custom_internal";

export type ModuleId =
  | "scope1_stationary"
  | "scope1_mobile"
  | "scope1_refrigerants"
  | "scope1_process"
  | "scope2_electricity"
  | "scope2_heat"
  | "scope3_purchased_goods"
  | "scope3_waste"
  | "scope3_business_travel"
  | "scope3_commuting"
  | "scope3_upstream_transport"
  | "scope3_downstream_transport";

export type QuestionType =
  | "boolean"
  | "single_select"
  | "multi_select"
  | "text"
  | "number"
  | "date"
  | "textarea";

export type AssessmentStep =
  | "profile"
  | "boundary"
  | "screening"
  | "modules"
  | "review";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionActivation {
  when: { equals?: unknown; includes?: unknown };
  modules?: ModuleId[];
}

export interface QuestionVisibleWhen {
  questionId: string;
  equals?: unknown;
  includes?: unknown;
}

export interface QuestionDefinition {
  id: string;
  section: string;
  type: QuestionType;
  label: string;
  help?: string;
  required?: boolean;
  options?: QuestionOption[];
  activates?: QuestionActivation[];
  visibleWhen?: QuestionVisibleWhen;
  optionsFrom?: {
    questionId: string;
    mapping: Record<string, string[]>;
  };
  placeholder?: string;
}

export interface QuestionResponse {
  questionId: string;
  value: unknown;
}

export interface AssessmentBoundary {
  periodStart: string;
  periodEnd: string;
  baseYear: number;
  reportingStandard: ReportingStandard;
  consolidation: ConsolidationApproach;
  consolidationAssumed?: boolean;
  includedEntities: string;
  includedLocations: string;
  excludedLocations: string;
  currency: string;
  emissionUnit: "tCO2e" | "kgCO2e";
}

export interface AssessmentProfile {
  legalName: string;
  tradingName: string;
  industry: string;
  countryOfRegistration: string;
  headquarters: string;
  website: string;
  employees: number;
  revenueRange: string;
  currency: string;
  primaryContact: string;
  sustainabilityContact: string;
  orgStructure: OrgStructure | "";
  /** Structure-specific answers keyed by question id */
  structureAnswers: Record<string, unknown>;
}

export interface ModuleProgress {
  moduleId: ModuleId;
  status: "not_started" | "in_progress" | "complete" | "not_applicable";
  recordCount: number;
}

export interface Assessment {
  id: string;
  companyId: string;
  name: string;
  type: AssessmentType;
  status: AssessmentStatus;
  currentStep: AssessmentStep;
  profile: AssessmentProfile;
  boundary: AssessmentBoundary;
  screening: Record<string, unknown>;
  responses: QuestionResponse[];
  enabledModules: ModuleId[];
  moduleProgress: ModuleProgress[];
  assumptions: string[];
  createdAt: string;
  updatedAt: string;
}

export function emptyProfile(): AssessmentProfile {
  return {
    legalName: "",
    tradingName: "",
    industry: "",
    countryOfRegistration: "",
    headquarters: "",
    website: "",
    employees: 0,
    revenueRange: "",
    currency: "EUR",
    primaryContact: "",
    sustainabilityContact: "",
    orgStructure: "",
    structureAnswers: {},
  };
}

export function emptyBoundary(reportingYear = 2024): AssessmentBoundary {
  return {
    periodStart: `${reportingYear}-01-01`,
    periodEnd: `${reportingYear}-12-31`,
    baseYear: reportingYear - 1,
    reportingStandard: "ghg_corporate",
    consolidation: "operational_control",
    consolidationAssumed: false,
    includedEntities: "",
    includedLocations: "",
    excludedLocations: "",
    currency: "EUR",
    emissionUnit: "tCO2e",
  };
}

export function createBlankAssessment(
  companyId: string,
  input: { name: string; type: AssessmentType },
  reportingYear = 2024
): Assessment {
  const now = new Date().toISOString();
  return {
    id: `assess-${Date.now()}`,
    companyId,
    name: input.name.trim(),
    type: input.type,
    status: "draft",
    currentStep: "profile",
    profile: emptyProfile(),
    boundary: emptyBoundary(reportingYear),
    screening: {},
    responses: [],
    enabledModules: [],
    moduleProgress: [],
    assumptions: [],
    createdAt: now,
    updatedAt: now,
  };
}

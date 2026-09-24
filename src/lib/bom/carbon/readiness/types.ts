/** Phase 9 — PACT / Catena-X / DPP readiness export shapes (adapters only). */

export type ReadinessFormat = "pact" | "catena_x" | "dpp";
export type ReadinessCheckStatus = "pass" | "warn" | "fail";

export type ReadinessCheck = {
  id: string;
  label: string;
  status: ReadinessCheckStatus;
  detail: string;
};

export type ExchangeReadinessReport = {
  calculationId: string;
  bomId: string;
  productId: string | null;
  overall: ReadinessCheckStatus;
  checks: ReadinessCheck[];
  generatedAt: string;
  formats: ReadinessFormat[];
};

/** Simplified PACT Pathfinder ProductFootprint (readiness subset). */
export type PactProductFootprint = {
  id: string;
  specVersion: string;
  version: number;
  created: string;
  status: "Active" | "Deprecated";
  companyName: string;
  companyIds: Array<{ type: string; value: string }>;
  productIds: Array<{ type: string; value: string }>;
  productDescription: string;
  productCategoryCpc: string;
  productNameCompany: string;
  comment: string;
  pcf: {
    declaredUnit: string;
    unitaryProductAmount: number;
    pCfExcludingBiogenic: number;
    pCfIncludingBiogenic: number | null;
    fossilGhgEmissions: number;
    biogenicCarbonEmissions: number | null;
    characterizationFactors: string;
    crossSectoralStandardsUsed: string[];
    boundaryProcessesDescription: string;
    referencePeriodStart: string;
    referencePeriodEnd: string;
    secondaryEmissionFactorSources: Array<{ name: string }>;
    exemptedEmissionsPercent: number;
    exemptedEmissionsDescription: string;
    packagingEmissionsIncluded: boolean;
    dataQualityRating?: {
      coveragePercent: number;
      technologicalDQR: number;
      temporalDQR: number;
      geographicalDQR: number;
    };
  };
  extensions?: Record<string, unknown>;
};

/** Simplified Catena-X PCF exchange payload (readiness). */
export type CatenaXPcfPayload = {
  spec: "catena-x-pcf-readiness";
  specVersion: string;
  id: string;
  companyId: string;
  product: {
    id: string | null;
    partNumber: string;
    name: string;
    declaredUnit: string;
  };
  pcf: {
    carbonFootprint: number;
    unit: "kgCO2e";
    lifecycleBoundary: string;
    calculationMethod: string;
    primaryDataShare: number | null;
    dataQualityScore: number | null;
  };
  bom: {
    bomId: string;
    fingerprint: string | null;
  };
  approval: {
    status: string;
    approvedAt: string | null;
    approvedBy: string | null;
  };
  provenance: {
    calculationId: string;
    ledgerEntryCount: number;
    generatedAt: string;
  };
};

/** Digital Product Passport readiness stub — not a full DPP. */
export type DppReadinessPayload = {
  spec: "dpp-readiness";
  specVersion: string;
  passportId: string;
  product: {
    id: string | null;
    identifier: string;
    name: string;
    category: string;
  };
  carbon: {
    pcfKgco2e: number;
    declaredUnit: string;
    methodology: string;
    dataQualityOverall: number | null;
  };
  complianceHints: string[];
  missingForFullDpp: string[];
  calculationId: string;
  generatedAt: string;
};

export type ReadinessExportBundle = {
  format: ReadinessFormat;
  calculationId: string;
  payload: PactProductFootprint | CatenaXPcfPayload | DppReadinessPayload;
  readiness: ExchangeReadinessReport;
};

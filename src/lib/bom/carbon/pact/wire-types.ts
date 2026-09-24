/**
 * PACT V3 ProductFootprint wire types aligned to pinned OpenAPI 3.0.3.
 * Decimal fields are strings per the OpenAPI Decimal / Positive*Decimal schemas.
 */

export const PACT_OPENAPI_VERSION = "3.0.3" as const;

/** DeclaredUnitOfMeasurement enum from OpenAPI CarbonFootprint */
export const PACT_DECLARED_UNITS = [
  "liter",
  "kilogram",
  "cubic meter",
  "kilowatt hour",
  "megajoule",
  "ton kilometer",
  "square meter",
  "piece",
  "hour",
  "megabit second",
] as const;

export type PactDeclaredUnit = (typeof PACT_DECLARED_UNITS)[number];

export type PactPfStatus = "Active" | "Deprecated";

/** Recommended CrossSectoralStandard values (OpenAPI x-enum; hosts MUST accept later values) */
export const PACT_CROSS_SECTORAL_STANDARDS = [
  "ISO14067",
  "ISO14083",
  "ISO14040-44",
  "GHGP-Product",
  "PEF",
  "PACT-1.0",
  "PACT-2.0",
  "PACT-3.0",
  "PAS2050",
] as const;

export type PactEmissionFactorSource = {
  name: string;
  version: string;
};

export type PactCarbonFootprint = {
  declaredUnitOfMeasurement: PactDeclaredUnit;
  declaredUnitAmount: string;
  productMassPerDeclaredUnit: string;
  referencePeriodStart: string;
  referencePeriodEnd: string;
  geographyRegionOrSubregion?: string;
  geographyCountry?: string;
  geographyCountrySubdivision?: string;
  boundaryProcessesDescription?: string;
  pcfExcludingBiogenicUptake: string;
  pcfIncludingBiogenicUptake: string;
  fossilCarbonContent: string;
  biogenicCarbonContent?: string;
  recycledCarbonContent?: string;
  fossilGhgEmissions: string;
  packagingEmissionsIncluded?: boolean;
  packagingGhgEmissions?: string;
  ipccCharacterizationFactors: string[];
  crossSectoralStandards: string[];
  exemptedEmissionsPercent: string;
  exemptedEmissionsDescription?: string;
  allocationRulesDescription?: string;
  secondaryEmissionFactorSources?: PactEmissionFactorSource[];
  primaryDataShare?: string;
  dqi?: Record<string, unknown>;
  verification?: Record<string, unknown>;
  [key: string]: unknown;
};

export type PactProductFootprintV3 = {
  id: string;
  specVersion: string;
  precedingPfIds?: string[];
  created: string;
  status: PactPfStatus;
  validityPeriodStart?: string;
  validityPeriodEnd?: string;
  companyName: string;
  companyIds: string[];
  productDescription: string;
  productIds: string[];
  productClassifications?: string[];
  productNameCompany: string;
  comment?: string;
  pcf: PactCarbonFootprint;
  extensions?: unknown[];
};

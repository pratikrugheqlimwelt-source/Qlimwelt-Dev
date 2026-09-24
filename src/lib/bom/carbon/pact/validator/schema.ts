/**
 * Layer 1 schema validation for PACT ProductFootprint (OpenAPI 3.0.3).
 * Field names and constraints come from the pinned OpenAPI — not invented.
 */

import { z } from "zod";
import type { PactValidationIssue, PactValidationResult } from "../types";
import {
  PACT_DECLARED_UNITS,
  type PactProductFootprintV3,
} from "../wire-types";

const URN_RE = /^([uU][rR][nN]):/;
const SPEC_VERSION_RE = /^\d+\.\d+\.\d+(-\d{8})?$/;
const DECIMAL_RE = /^[+-]?\d+(\.\d+)?$/;
const POSITIVE_OR_ZERO_DECIMAL_RE = /^[+]?\d+(\.\d+)?$/;
const POSITIVE_NON_ZERO_DECIMAL_RE =
  /^[+]?(?:\d*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;
const IPCC_RE = /^AR\d+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const decimalString = z
  .string()
  .regex(DECIMAL_RE, "must be a decimal string per OpenAPI Decimal");

const positiveOrZeroDecimal = z
  .string()
  .regex(
    POSITIVE_OR_ZERO_DECIMAL_RE,
    "must be a >= 0 decimal string (PositiveOrZeroDecimal)"
  );

const positiveNonZeroDecimal = z
  .string()
  .regex(
    POSITIVE_NON_ZERO_DECIMAL_RE,
    "must be a > 0 decimal string (PositiveNonZeroDecimal)"
  );

const urn = z
  .string()
  .min(1)
  .regex(URN_RE, "must be a URN (OpenAPI Urn pattern)");

const dateTime = z.string().datetime({ offset: true });

const carbonFootprintSchema = z
  .object({
    declaredUnitOfMeasurement: z.enum(PACT_DECLARED_UNITS),
    declaredUnitAmount: positiveNonZeroDecimal,
    productMassPerDeclaredUnit: decimalString,
    referencePeriodStart: dateTime,
    referencePeriodEnd: dateTime,
    geographyRegionOrSubregion: z.string().optional(),
    geographyCountry: z.string().optional(),
    geographyCountrySubdivision: z.string().optional(),
    boundaryProcessesDescription: z.string().optional(),
    pcfExcludingBiogenicUptake: decimalString,
    pcfIncludingBiogenicUptake: decimalString,
    fossilCarbonContent: positiveOrZeroDecimal,
    biogenicCarbonContent: positiveOrZeroDecimal.optional(),
    recycledCarbonContent: positiveOrZeroDecimal.optional(),
    fossilGhgEmissions: positiveOrZeroDecimal,
    packagingEmissionsIncluded: z.boolean().optional(),
    packagingGhgEmissions: positiveOrZeroDecimal.optional(),
    ipccCharacterizationFactors: z
      .array(z.string().regex(IPCC_RE, "must match AR$VERSION$"))
      .min(1),
    crossSectoralStandards: z.array(z.string().min(1)).min(1),
    exemptedEmissionsPercent: decimalString,
    exemptedEmissionsDescription: z.string().optional(),
    allocationRulesDescription: z.string().optional(),
    secondaryEmissionFactorSources: z
      .array(
        z.object({
          name: z.string().min(1),
          version: z.string().min(1),
        })
      )
      .min(1)
      .optional(),
    primaryDataShare: decimalString.optional(),
    dqi: z.record(z.unknown()).optional(),
    verification: z.record(z.unknown()).optional(),
  })
  .passthrough();

const productFootprintSchema = z
  .object({
    id: z.string().regex(UUID_RE, "must be uuid"),
    specVersion: z
      .string()
      .regex(SPEC_VERSION_RE, "must be major.minor.patch"),
    precedingPfIds: z.array(z.string().regex(UUID_RE)).min(1).optional(),
    created: dateTime,
    status: z.enum(["Active", "Deprecated"]),
    validityPeriodStart: dateTime.optional(),
    validityPeriodEnd: dateTime.optional(),
    companyName: z.string().min(1),
    companyIds: z.array(urn).min(1),
    productDescription: z.string(),
    productIds: z.array(urn).min(1),
    productClassifications: z.array(z.string()).optional(),
    productNameCompany: z.string().min(1),
    comment: z.string().optional(),
    pcf: carbonFootprintSchema,
    extensions: z.array(z.unknown()).optional(),
  })
  .passthrough()
  .superRefine((val, ctx) => {
    if (new Set(val.companyIds).size !== val.companyIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyIds"],
        message: "companyIds must be unique",
      });
    }
    if (new Set(val.productIds).size !== val.productIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["productIds"],
        message: "productIds must be unique",
      });
    }
    if (
      new Set(val.pcf.ipccCharacterizationFactors).size !==
      val.pcf.ipccCharacterizationFactors.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pcf", "ipccCharacterizationFactors"],
        message: "ipccCharacterizationFactors must be unique",
      });
    }
  });

function zodIssuesToPact(issues: z.ZodIssue[]): PactValidationIssue[] {
  return issues.map((i) => ({
    path: i.path.join(".") || "(root)",
    message: i.message,
    category: "SCHEMA_INVALID" as const,
  }));
}

export function validateProductFootprintSchema(
  payload: unknown
): PactValidationResult {
  const parsed = productFootprintSchema.safeParse(payload);
  if (parsed.success) {
    return { ok: true, issues: [] };
  }
  return { ok: false, issues: zodIssuesToPact(parsed.error.issues) };
}

/** Parse + validate; returns typed footprint or validation result. */
export function parseProductFootprint(
  payload: unknown
):
  | { ok: true; value: PactProductFootprintV3 }
  | { ok: false; result: PactValidationResult } {
  const parsed = productFootprintSchema.safeParse(payload);
  if (parsed.success) {
    return { ok: true, value: parsed.data as PactProductFootprintV3 };
  }
  return {
    ok: false,
    result: { ok: false, issues: zodIssuesToPact(parsed.error.issues) },
  };
}

export { productFootprintSchema, carbonFootprintSchema };

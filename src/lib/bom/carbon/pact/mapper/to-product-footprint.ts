/**
 * PACT V3 export mapper — PcfCalculation → ProductFootprint (OpenAPI 3.0.3).
 * Hard gates: completed, approved, not stale, not scenario, confirmed URNs, mappable unit.
 */

import type { Product } from "@/lib/bom/types";
import { newEntityId } from "@/lib/bom/local-store";
import type { PcfCalculation } from "../../types";
import { listIdentityMappings } from "../identity/mapping-service";
import type { PactValidationIssue, PactValidationResult } from "../types";
import {
  PACT_OPENAPI_VERSION,
  type PactProductFootprintV3,
} from "../wire-types";
import { mapDeclaredUnit } from "./units";

export type ExportMapperInput = {
  companyId: string;
  companyName?: string | null;
  calculation: PcfCalculation;
  product: Product | null;
  companyIds?: string[];
  productIds?: string[];
};

export type ExportMapperResult =
  | { ok: true; footprint: PactProductFootprintV3 }
  | { ok: false; result: PactValidationResult };

function fail(issues: PactValidationIssue[]): ExportMapperResult {
  return { ok: false, result: { ok: false, issues } };
}

function issue(
  path: string,
  message: string,
  category: PactValidationIssue["category"] = "SEMANTIC_INVALID"
): PactValidationIssue {
  return { path, message, category };
}

function decimalString(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return String(Number(n.toFixed(6)));
}

function toIsoStart(dateOnlyOrIso: string): string {
  if (dateOnlyOrIso.includes("T")) return dateOnlyOrIso;
  return `${dateOnlyOrIso}T00:00:00Z`;
}

function toIsoEnd(dateOnlyOrIso: string): string {
  if (dateOnlyOrIso.includes("T")) return dateOnlyOrIso;
  return `${dateOnlyOrIso}T23:59:59Z`;
}

function resolveCompanyIds(companyId: string, override?: string[]): string[] {
  if (override && override.length > 0) return [...new Set(override)];
  return listIdentityMappings(companyId)
    .filter((m) => m.scheme === "company" && m.status === "confirmed")
    .map((m) => m.urn);
}

function resolveProductIds(
  companyId: string,
  productId: string | null | undefined,
  override?: string[]
): string[] {
  if (override && override.length > 0) return [...new Set(override)];
  return listIdentityMappings(companyId, productId ? { productId } : undefined)
    .filter(
      (m) =>
        m.status === "confirmed" &&
        m.scheme !== "company" &&
        (!productId || m.productId === productId)
    )
    .map((m) => m.urn);
}

/**
 * Map an approved baseline PCF calculation to a PACT V3 ProductFootprint.
 * Does not mutate the calculation engine.
 */
export function toProductFootprint(input: ExportMapperInput): ExportMapperResult {
  const c = input.calculation;
  const issues: PactValidationIssue[] = [];

  if (c.companyId !== input.companyId) {
    issues.push(issue("companyId", "Calculation does not belong to company", "AUTH"));
  }
  if (c.status !== "completed") {
    issues.push(
      issue("status", `Calculation status must be completed (got ${c.status})`)
    );
  }
  if (c.approvalStatus !== "approved") {
    issues.push(
      issue(
        "approvalStatus",
        `Calculation must be approved (got ${c.approvalStatus})`
      )
    );
  }
  if (c.isStale) {
    issues.push(issue("isStale", "Stale calculations cannot be exported"));
  }
  if (c.scenarioId) {
    issues.push(
      issue(
        "scenarioId",
        "Scenario/what-if calculations cannot be exported as PACT footprints"
      )
    );
  }

  const unitMap = mapDeclaredUnit(c.declaredUnit);
  if (!unitMap) {
    issues.push(
      issue(
        "declaredUnit",
        `Declared unit "${c.declaredUnit}" cannot be mapped to a PACT DeclaredUnitOfMeasurement`
      )
    );
  }

  const companyIds = resolveCompanyIds(input.companyId, input.companyIds);
  const productIds = resolveProductIds(
    input.companyId,
    c.productId ?? input.product?.id,
    input.productIds
  );
  if (companyIds.length === 0) {
    issues.push(
      issue(
        "companyIds",
        "At least one confirmed company identity URN is required for export"
      )
    );
  }
  if (productIds.length === 0) {
    issues.push(
      issue(
        "productIds",
        "At least one confirmed product identity URN is required for export"
      )
    );
  }

  if (issues.length > 0) return fail(issues);

  const created = c.completedAt || c.createdAt;
  const year = created.slice(0, 4);
  const refStart = c.referencePeriodStart || `${year}-01-01`;
  const refEnd = c.referencePeriodEnd || `${year}-12-31`;
  const pcfValue = decimalString(c.totalKgco2e);
  const product = input.product;
  const footprintId = c.pactFootprintId || newEntityId("fp");

  const footprint: PactProductFootprintV3 = {
    id: footprintId,
    specVersion: PACT_OPENAPI_VERSION,
    created: created.includes("T") ? created : `${created}T00:00:00Z`,
    status: "Active",
    companyName:
      input.companyName?.trim() || `Company ${input.companyId.slice(0, 8)}`,
    companyIds,
    productDescription:
      product?.description || product?.name || `BOM ${c.bomId}`,
    productIds,
    productNameCompany: product?.name || product?.productNumber || c.bomId,
    comment: `Qlimwelt PACT V3 export from calculation ${c.id}`,
    pcf: {
      declaredUnitOfMeasurement: unitMap!.unit,
      declaredUnitAmount: unitMap!.amount,
      productMassPerDeclaredUnit:
        unitMap!.unit === "kilogram" ? unitMap!.amount : "0",
      referencePeriodStart: toIsoStart(refStart),
      referencePeriodEnd: toIsoEnd(refEnd),
      boundaryProcessesDescription: c.methodology || "bom_recursive_v1",
      pcfExcludingBiogenicUptake: pcfValue,
      pcfIncludingBiogenicUptake: pcfValue,
      fossilCarbonContent: "0",
      fossilGhgEmissions: pcfValue,
      packagingEmissionsIncluded: false,
      ipccCharacterizationFactors: ["AR6"],
      crossSectoralStandards: ["ISO14067", "PACT-3.0"],
      exemptedEmissionsPercent: "0",
      secondaryEmissionFactorSources: [
        { name: "Qlimwelt emission factor library", version: "1.0.0" },
      ],
      ...(c.dq
        ? {
            dqi: {
              coveragePercent: Math.round(Math.min(100, c.dq.overall * 100)),
              technologicalDQR: Number((1 + (1 - c.dq.tech) * 2).toFixed(2)),
              temporalDQR: Number((1 + (1 - c.dq.temporal) * 2).toFixed(2)),
              geographicalDQR: Number((1 + (1 - c.dq.geo) * 2).toFixed(2)),
            },
          }
        : {}),
    },
    extensions: [
      {
        specVersion: "1.0.0",
        dataSchema:
          "https://qlimwelt.example/schemas/pact-export-extension.json",
        data: {
          calculationId: c.id,
          bomId: c.bomId,
          bomFingerprint: c.bomFingerprint ?? null,
          mappingFingerprint: c.mappingFingerprint ?? null,
          ledgerEntryCount: c.ledger?.length ?? 0,
        },
      },
    ],
  };

  return { ok: true, footprint };
}

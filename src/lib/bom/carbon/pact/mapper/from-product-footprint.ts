/**
 * Import mapper — ProductFootprint → SupplierPcfRecord fields (Phase 4).
 * Callers must schema-validate the payload before mapping.
 */

import {
  findExactConfirmedByUrn,
  listIdentityMappings,
} from "../identity/mapping-service";
import type { SupplierPcfRecord } from "../types";
import type { PactProductFootprintV3 } from "../wire-types";

export type ImportMappingCandidate = {
  urn: string;
  productId?: string | null;
  bomItemId?: string | null;
  mappingId?: string | null;
  status: "confirmed" | "candidate" | "unmapped";
};

function parseDecimal(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function dateOnly(iso: string | undefined | null): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

export function resolveImportIdentityCandidates(
  companyId: string,
  productIds: string[]
): ImportMappingCandidate[] {
  return productIds.map((urn) => {
    const confirmed = findExactConfirmedByUrn(companyId, urn);
    if (confirmed) {
      return {
        urn,
        productId: confirmed.productId ?? null,
        bomItemId: confirmed.bomItemId ?? null,
        mappingId: confirmed.id,
        status: "confirmed" as const,
      };
    }
    const valueTail = decodeURIComponent(urn.split(":").pop() ?? urn);
    const candidates = listIdentityMappings(companyId).filter(
      (m) =>
        m.status === "candidate" && (m.urn === urn || m.value === valueTail)
    );
    if (candidates.length === 1) {
      const m = candidates[0]!;
      return {
        urn,
        productId: m.productId ?? null,
        bomItemId: m.bomItemId ?? null,
        mappingId: m.id,
        status: "candidate" as const,
      };
    }
    return { urn, status: "unmapped" as const };
  });
}

export type FromProductFootprintResult = {
  recordInput: Partial<
    Omit<SupplierPcfRecord, "id" | "companyId" | "createdAt" | "updatedAt">
  > & { rawPayload: Record<string, unknown> };
  candidates: ImportMappingCandidate[];
  footprintId: string;
};

export function fromProductFootprint(input: {
  companyId: string;
  footprint: PactProductFootprintV3;
}): FromProductFootprintResult {
  const fp = input.footprint;
  const pcf = fp.pcf;
  const candidates = resolveImportIdentityCandidates(
    input.companyId,
    fp.productIds
  );
  const confirmedBom = candidates.find(
    (c) => c.status === "confirmed" && c.bomItemId
  );

  return {
    footprintId: fp.id,
    candidates,
    recordInput: {
      productIdentityUrns: [...fp.productIds],
      declaredUnit: pcf.declaredUnitOfMeasurement,
      declaredUnitAmount: parseDecimal(pcf.declaredUnitAmount),
      pcfExcludingBiogenic: parseDecimal(pcf.pcfExcludingBiogenicUptake),
      pcfIncludingBiogenic: parseDecimal(pcf.pcfIncludingBiogenicUptake),
      referencePeriodStart: dateOnly(pcf.referencePeriodStart),
      referencePeriodEnd: dateOnly(pcf.referencePeriodEnd),
      validityPeriodStart: dateOnly(fp.validityPeriodStart),
      validityPeriodEnd: dateOnly(fp.validityPeriodEnd),
      geography: pcf.geographyCountry || pcf.geographyRegionOrSubregion || null,
      crossSectoralStandards: [...(pcf.crossSectoralStandards ?? [])],
      secondaryEmissionFactorSources: (
        pcf.secondaryEmissionFactorSources ?? []
      ).map((s) => ({ name: s.name })),
      verificationJson:
        (pcf.verification as Record<string, unknown> | undefined) ?? null,
      dqiJson: (pcf.dqi as Record<string, unknown> | undefined) ?? null,
      pactSpecVersion: fp.specVersion,
      rawPayload: fp as unknown as Record<string, unknown>,
      status: confirmedBom ? "mapped" : "received",
      mappedBomItemId: confirmedBom?.bomItemId ?? null,
    },
  };
}

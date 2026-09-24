import type { Product } from "@/lib/bom/types";
import type { CarbonLedgerEntry, PcfCalculation } from "../types";
import type {
  CatenaXPcfPayload,
  DppReadinessPayload,
  ExchangeReadinessReport,
  PactProductFootprint,
  ReadinessCheck,
  ReadinessCheckStatus,
  ReadinessExportBundle,
  ReadinessFormat,
} from "./types";

export type ReadinessContext = {
  companyId: string;
  companyName?: string | null;
  product: Product | null;
  calculation: PcfCalculation;
  ledger: CarbonLedgerEntry[];
};

function worstStatus(statuses: ReadinessCheckStatus[]): ReadinessCheckStatus {
  if (statuses.includes("fail")) return "fail";
  if (statuses.includes("warn")) return "warn";
  return "pass";
}

/** Gap analysis for exchange readiness — does not mutate calculation. */
export function assessExchangeReadiness(ctx: ReadinessContext): ExchangeReadinessReport {
  const c = ctx.calculation;
  const checks: ReadinessCheck[] = [];

  checks.push({
    id: "status_completed",
    label: "Calculation completed",
    status: c.status === "completed" ? "pass" : "fail",
    detail:
      c.status === "completed"
        ? "PCF run finished successfully"
        : `Calculation status is ${c.status}`,
  });

  checks.push({
    id: "approval",
    label: "Calculation approved",
    status: c.approvalStatus === "approved" ? "pass" : "fail",
    detail:
      c.approvalStatus === "approved"
        ? `Approved${c.approvedAt ? ` at ${c.approvedAt}` : ""}`
        : `Approval status is ${c.approvalStatus} — exchange formats expect an approved PCF`,
  });

  checks.push({
    id: "not_stale",
    label: "Not stale",
    status: c.isStale ? "fail" : "pass",
    detail: c.isStale
      ? c.staleReason || "Calculation is marked stale — recalculate before exchange"
      : "Calculation fingerprints are current",
  });

  checks.push({
    id: "not_scenario",
    label: "Baseline (non-scenario) result",
    status: c.scenarioId ? "warn" : "pass",
    detail: c.scenarioId
      ? "This is a what-if scenario result — prefer baseline for external exchange"
      : "Baseline calculation",
  });

  checks.push({
    id: "has_ledger",
    label: "Carbon ledger present",
    status: ctx.ledger.length > 0 ? "pass" : "warn",
    detail:
      ctx.ledger.length > 0
        ? `${ctx.ledger.length} ledger entries available for provenance`
        : "No ledger entries — provenance depth will be limited",
  });

  checks.push({
    id: "product_identity",
    label: "Product identity",
    status: ctx.product ? "pass" : "warn",
    detail: ctx.product
      ? `Product ${ctx.product.productNumber} · ${ctx.product.name}`
      : "No product linked — adapters will use BOM id as fallback identity",
  });

  checks.push({
    id: "data_quality",
    label: "Data quality score",
    status: c.dq && c.dq.overall >= 0.5 ? "pass" : "warn",
    detail: c.dq
      ? `Overall DQ ${(c.dq.overall * 100).toFixed(0)}% (T${c.dq.temporal}/G${c.dq.geo}/Tech${c.dq.tech})`
      : "No DQ score attached — PACT DQR block will be omitted or defaulted",
  });

  const supplierShare =
    ctx.ledger.length === 0
      ? 0
      : ctx.ledger.filter((e) => e.method === "supplier_pcf").length / ctx.ledger.length;
  checks.push({
    id: "primary_data_share",
    label: "Primary / supplier data share",
    status: supplierShare >= 0.2 ? "pass" : "warn",
    detail: `${(supplierShare * 100).toFixed(0)}% of ledger entries use supplier_pcf method`,
  });

  return {
    calculationId: c.id,
    bomId: c.bomId,
    productId: c.productId,
    overall: worstStatus(checks.map((x) => x.status)),
    checks,
    generatedAt: new Date().toISOString(),
    formats: ["pact", "catena_x", "dpp"],
  };
}

export function buildPactProductFootprint(ctx: ReadinessContext): PactProductFootprint {
  const c = ctx.calculation;
  const product = ctx.product;
  const created = c.completedAt || c.createdAt;
  const year = created.slice(0, 4);
  return {
    id: `urn:qlimwelt:pcf:${c.id}`,
    specVersion: "2.2.0-readiness",
    version: 1,
    created,
    status: c.approvalStatus === "approved" && !c.isStale ? "Active" : "Deprecated",
    companyName: ctx.companyName || ctx.companyId,
    companyIds: [{ type: "Custom", value: ctx.companyId }],
    productIds: [
      {
        type: "Custom",
        value: product?.productNumber || c.productId || c.bomId,
      },
    ],
    productDescription: product?.description || product?.name || `BOM ${c.bomId}`,
    productCategoryCpc: product?.category || "unspecified",
    productNameCompany: product?.name || product?.productNumber || c.bomId,
    comment: `Qlimwelt readiness export from calculation ${c.id}`,
    pcf: {
      declaredUnit: c.declaredUnit || "piece",
      unitaryProductAmount: 1,
      pCfExcludingBiogenic: c.totalKgco2e,
      pCfIncludingBiogenic: null,
      fossilGhgEmissions: c.totalKgco2e,
      biogenicCarbonEmissions: null,
      characterizationFactors: "AR6",
      crossSectoralStandardsUsed: ["ISO14067", "GHGProtocol"],
      boundaryProcessesDescription: c.methodology || "bom_recursive_v1",
      referencePeriodStart: `${year}-01-01`,
      referencePeriodEnd: `${year}-12-31`,
      secondaryEmissionFactorSources: [{ name: "Qlimwelt emission factor library" }],
      exemptedEmissionsPercent: 0,
      exemptedEmissionsDescription: "None declared in readiness export",
      packagingEmissionsIncluded: false,
      ...(c.dq
        ? {
            dataQualityRating: {
              coveragePercent: Math.round(Math.min(100, c.dq.overall * 100)),
              technologicalDQR: Number((1 + (1 - c.dq.tech) * 2).toFixed(2)),
              temporalDQR: Number((1 + (1 - c.dq.temporal) * 2).toFixed(2)),
              geographicalDQR: Number((1 + (1 - c.dq.geo) * 2).toFixed(2)),
            },
          }
        : {}),
    },
    extensions: {
      qlimwelt: {
        calculationId: c.id,
        bomId: c.bomId,
        bomFingerprint: c.bomFingerprint ?? null,
        mappingFingerprint: c.mappingFingerprint ?? null,
        ledgerEntryCount: ctx.ledger.length,
      },
    },
  };
}

export function buildCatenaXPcfPayload(ctx: ReadinessContext): CatenaXPcfPayload {
  const c = ctx.calculation;
  const product = ctx.product;
  const supplierEntries = ctx.ledger.filter((e) => e.method === "supplier_pcf").length;
  const primaryShare = ctx.ledger.length > 0 ? supplierEntries / ctx.ledger.length : null;

  return {
    spec: "catena-x-pcf-readiness",
    specVersion: "1.0.0-readiness",
    id: `cx-pcf-${c.id}`,
    companyId: ctx.companyId,
    product: {
      id: product?.id ?? c.productId,
      partNumber: product?.productNumber || c.bomId,
      name: product?.name || "Unnamed product",
      declaredUnit: c.declaredUnit || product?.declaredUnit || "piece",
    },
    pcf: {
      carbonFootprint: c.totalKgco2e,
      unit: "kgCO2e",
      lifecycleBoundary: "cradle-to-gate",
      calculationMethod: c.methodology || "bom_recursive_v1",
      primaryDataShare: primaryShare,
      dataQualityScore: c.dq?.overall ?? null,
    },
    bom: {
      bomId: c.bomId,
      fingerprint: c.bomFingerprint ?? null,
    },
    approval: {
      status: c.approvalStatus,
      approvedAt: c.approvedAt ?? null,
      approvedBy: c.approvedBy ?? null,
    },
    provenance: {
      calculationId: c.id,
      ledgerEntryCount: ctx.ledger.length,
      generatedAt: new Date().toISOString(),
    },
  };
}

export function buildDppReadinessPayload(ctx: ReadinessContext): DppReadinessPayload {
  const c = ctx.calculation;
  const product = ctx.product;
  const missing: string[] = [];
  if (!product) missing.push("Stable product master identity");
  if (c.approvalStatus !== "approved") missing.push("Approved PCF calculation");
  if (c.isStale) missing.push("Fresh (non-stale) calculation");
  if (!c.dq) missing.push("Documented data quality rating");
  missing.push("Unique product identifier scheme (GTIN / EAN / UUID registry)");
  missing.push("Circularity / material composition passport sections");
  missing.push("Economic operator & conformity credentials");

  return {
    spec: "dpp-readiness",
    specVersion: "0.1.0",
    passportId: `dpp-ready:${c.id}`,
    product: {
      id: product?.id ?? c.productId,
      identifier: product?.productNumber || c.bomId,
      name: product?.name || "Unnamed product",
      category: product?.category || "unspecified",
    },
    carbon: {
      pcfKgco2e: c.totalKgco2e,
      declaredUnit: c.declaredUnit || "piece",
      methodology: c.methodology || "bom_recursive_v1",
      dataQualityOverall: c.dq?.overall ?? null,
    },
    complianceHints: [
      "Keep PCF methodology and fingerprints versioned with the passport.",
      "Link supplier primary data to raise primary-data share.",
      "Do not treat this stub as a legal DPP — readiness scaffolding only.",
    ],
    missingForFullDpp: missing,
    calculationId: c.id,
    generatedAt: new Date().toISOString(),
  };
}

export function buildReadinessExport(
  ctx: ReadinessContext,
  format: ReadinessFormat
): ReadinessExportBundle {
  const readiness = assessExchangeReadiness(ctx);
  let payload: ReadinessExportBundle["payload"];
  if (format === "pact") payload = buildPactProductFootprint(ctx);
  else if (format === "catena_x") payload = buildCatenaXPcfPayload(ctx);
  else payload = buildDppReadinessPayload(ctx);
  return {
    format,
    calculationId: ctx.calculation.id,
    payload,
    readiness,
  };
}

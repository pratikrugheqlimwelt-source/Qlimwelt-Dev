/**
 * PACT V3 Phase 7 — product PCF summary helpers (pure, UI-agnostic).
 */

import type { BomItem } from "../../types";
import type { CarbonMapping, PcfCalculation } from "../types";
import type {
  PactExchange,
  ProductIdentityMapping,
  SupplierPcfRecord,
} from "./types";

export type PactConnectionStatus =
  | "not_configured"
  | "local_ready"
  | "exchanging"
  | "export_ready";

export type ProductPcfSummary = {
  totalKgco2e: number | null;
  declaredUnit: string | null;
  calculationId: string | null;
  calculationApproval: string | null;
  calculationStale: boolean;
  bomItemCount: number;
  mappableItemCount: number;
  approvedMappingCount: number;
  coveragePercent: number;
  supplierRecordsTotal: number;
  supplierRecordsPending: number;
  supplierRecordsAccepted: number;
  identityMappingsConfirmed: number;
  exchangeCount: number;
  lastExchangeAt: string | null;
  lastExportAt: string | null;
  pactConnection: PactConnectionStatus;
  pactConnectionLabel: string;
};

function isMappableItem(item: BomItem): boolean {
  return item.parentItemId != null || item.itemType !== "product";
}

export function buildProductPcfSummary(input: {
  items: BomItem[];
  mappings: CarbonMapping[];
  calculations: PcfCalculation[];
  supplierRecords: SupplierPcfRecord[];
  identityMappings: ProductIdentityMapping[];
  exchanges: PactExchange[];
}): ProductPcfSummary {
  const baseline = input.calculations
    .filter((c) => !c.scenarioId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const preferred =
    baseline.find(
      (c) =>
        c.status === "completed" &&
        c.approvalStatus === "approved" &&
        !c.isStale
    ) ||
    baseline.find((c) => c.status === "completed" && !c.isStale) ||
    baseline.find((c) => c.status === "completed") ||
    null;

  const mappable = input.items.filter(isMappableItem);
  const approvedMappings = input.mappings.filter((m) => m.status === "approved");
  const coveredIds = new Set(approvedMappings.map((m) => m.bomItemId));
  const covered = mappable.filter((i) => coveredIds.has(i.id)).length;
  const coveragePercent =
    mappable.length === 0 ? 0 : Math.round((covered / mappable.length) * 100);

  const pendingRecords = input.supplierRecords.filter(
    (r) => r.status === "received" || r.status === "mapped"
  );
  const acceptedRecords = input.supplierRecords.filter(
    (r) => r.status === "accepted"
  );
  const confirmedIdentity = input.identityMappings.filter(
    (m) => m.status === "confirmed"
  );

  const exchanges = [...input.exchanges].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const lastExchangeAt = exchanges[0]?.createdAt ?? null;
  const lastExport = exchanges.find(
    (e) => e.kind === "export" && e.status === "completed"
  );
  const lastExportAt = lastExport?.completedAt || lastExport?.createdAt || null;

  let pactConnection: PactConnectionStatus = "local_ready";
  if (
    lastExport &&
    preferred?.approvalStatus === "approved" &&
    !preferred.isStale
  ) {
    pactConnection = "export_ready";
  } else if (exchanges.length > 0) {
    pactConnection = "exchanging";
  } else if (confirmedIdentity.length === 0 && acceptedRecords.length === 0) {
    pactConnection = "not_configured";
  }

  const labels: Record<PactConnectionStatus, string> = {
    not_configured: "Not configured",
    local_ready: "Local host stubs ready",
    exchanging: "Exchanges recorded",
    export_ready: "Export-ready (approved baseline)",
  };

  return {
    totalKgco2e: preferred ? preferred.totalKgco2e : null,
    declaredUnit: preferred?.declaredUnit ?? null,
    calculationId: preferred?.id ?? null,
    calculationApproval: preferred?.approvalStatus ?? null,
    calculationStale: preferred?.isStale ?? false,
    bomItemCount: input.items.length,
    mappableItemCount: mappable.length,
    approvedMappingCount: approvedMappings.length,
    coveragePercent,
    supplierRecordsTotal: input.supplierRecords.length,
    supplierRecordsPending: pendingRecords.length,
    supplierRecordsAccepted: acceptedRecords.length,
    identityMappingsConfirmed: confirmedIdentity.length,
    exchangeCount: exchanges.length,
    lastExchangeAt,
    lastExportAt,
    pactConnection,
    pactConnectionLabel: labels[pactConnection],
  };
}

/**
 * Local PACT V3 import + accept orchestration (Phase 4).
 */

import {
  loadBomLocal,
  newEntityId,
  updateBomLocal,
} from "../../local-store";
import type { CarbonMapping, EmissionFactor } from "../types";
import { beginExchange, completeExchange } from "./exchange/service";
import {
  fromProductFootprint,
  type ImportMappingCandidate,
} from "./mapper/from-product-footprint";
import {
  localCreateSupplierPcfRecord,
  localGetSupplierPcfRecord,
  localUpdateSupplierPcfRecord,
} from "./store";
import type { PactValidationResult, SupplierPcfRecord } from "./types";
import { parseProductFootprint } from "./validator/schema";
import { validateImportSemantics } from "./validator/semantic";
import type { PactProductFootprintV3 } from "./wire-types";

function ensureSupplierPcfDataset(companyId: string) {
  const state = loadBomLocal(companyId);
  const existing = state.carbonDatasets.find((d) => d.code === "SUPPLIER_PCF");
  if (existing) return existing;
  const now = new Date().toISOString();
  const dataset = {
    id: newEntityId("cds"),
    companyId,
    code: "SUPPLIER_PCF",
    name: "Supplier primary PCF factors",
    source: "supplier_portal",
    geography: "GLO",
    methodology: "supplier_declared",
    versionLabel: "1",
    status: "active" as const,
    notes: "Synthetic factors created from accepted PACT supplier footprints",
    createdAt: now,
    updatedAt: now,
  };
  updateBomLocal(companyId, (s) => ({
    ...s,
    carbonDatasets: [...s.carbonDatasets, dataset],
  }));
  return dataset;
}

export type PactImportBundle = {
  record: SupplierPcfRecord;
  footprint: PactProductFootprintV3;
  candidates: ImportMappingCandidate[];
  exchangeId: string;
  schema: PactValidationResult;
  semantics: PactValidationResult;
};

export function localImportPactV3(
  companyId: string,
  payload: unknown,
  options?: { idempotencyKey?: string; supplierId?: string | null }
): PactImportBundle {
  const footprintHint =
    typeof payload === "object" &&
    payload &&
    "id" in payload &&
    typeof (payload as { id: unknown }).id === "string"
      ? String((payload as { id: string }).id)
      : newEntityId("imp");

  const exchange = beginExchange(companyId, {
    direction: "inbound",
    kind: "import",
    idempotencyKey: options?.idempotencyKey || `import:${footprintHint}`,
    requestPayload:
      typeof payload === "object" && payload
        ? (payload as Record<string, unknown>)
        : { payload },
  });

  const parsed = parseProductFootprint(payload);
  if (!parsed.ok) {
    completeExchange(companyId, exchange.id, {
      status: "failed",
      httpStatus: 422,
      errorCode: "SCHEMA_INVALID",
      errorDetail: parsed.result.issues.map((i) => i.message).join("; "),
      responsePayload: { issues: parsed.result.issues },
    });
    const err = new Error(
      parsed.result.issues.map((i) => i.message).join("; ") || "Schema invalid"
    );
    Object.assign(err, {
      issues: parsed.result.issues,
      exchangeId: exchange.id,
    });
    throw err;
  }

  const footprint = parsed.value;
  const semantics = validateImportSemantics({
    productIds: footprint.productIds,
    declaredUnit: footprint.pcf.declaredUnitOfMeasurement,
    validityPeriodEnd: footprint.validityPeriodEnd,
  });

  const mapped = fromProductFootprint({ companyId, footprint });
  const record = localCreateSupplierPcfRecord(companyId, {
    ...mapped.recordInput,
    supplierId: options?.supplierId ?? null,
    pactExchangeId: exchange.id,
    rawPayload: mapped.recordInput.rawPayload,
  });

  completeExchange(companyId, exchange.id, {
    status: "completed",
    httpStatus: 200,
    footprintId: footprint.id,
    supplierPcfRecordId: record.id,
    responsePayload: {
      recordId: record.id,
      candidates: mapped.candidates,
      semanticIssues: semantics.issues,
    },
  });

  return {
    record,
    footprint,
    candidates: mapped.candidates,
    exchangeId: exchange.id,
    schema: { ok: true, issues: [] },
    semantics,
  };
}

export function localAcceptSupplierPcfRecord(
  companyId: string,
  recordId: string,
  input: {
    bomItemId: string;
    acceptedBy?: string | null;
    notes?: string | null;
  }
): SupplierPcfRecord {
  const record = localGetSupplierPcfRecord(companyId, recordId);
  if (!record) throw new Error("Supplier PCF record not found");
  if (record.status === "accepted") return record;
  if (record.status === "rejected" || record.status === "expired") {
    throw new Error(`Cannot accept record in status ${record.status}`);
  }
  if (
    record.pcfExcludingBiogenic == null ||
    !Number.isFinite(record.pcfExcludingBiogenic)
  ) {
    throw new Error("Record is missing pcfExcludingBiogenic");
  }

  const state = loadBomLocal(companyId);
  const bomItem = state.items.find((i) => i.id === input.bomItemId);
  if (!bomItem) throw new Error("BOM item not found");

  const dataset = ensureSupplierPcfDataset(companyId);
  const now = new Date().toISOString();
  const unit = record.declaredUnit || bomItem.unit || "kg";

  const factor: EmissionFactor = {
    id: newEntityId("ef"),
    companyId,
    datasetId: dataset.id,
    factorCode: `PACT_${record.id.slice(-8)}`.toUpperCase(),
    name: `PACT supplier PCF · ${record.productIdentityUrns[0] ?? record.id}`,
    category: "supplier_pcf",
    activityUnit: unit,
    valueKgco2e: record.pcfExcludingBiogenic,
    uncertainty: null,
    geography: record.geography || "GLO",
    validFrom: record.referencePeriodStart || now.slice(0, 10),
    validTo: record.validityPeriodEnd || null,
    metadata: {
      source: "pact_import",
      recordId: record.id,
      footprintId: (record.rawPayload as { id?: string }).id ?? null,
      productIdentityUrns: record.productIdentityUrns,
    },
    createdAt: now,
    updatedAt: now,
  };

  const prior = state.carbonMappings.find(
    (m) => m.bomItemId === input.bomItemId
  );
  const mapping: CarbonMapping = {
    id: prior?.id ?? newEntityId("map"),
    companyId,
    bomItemId: input.bomItemId,
    emissionFactorId: factor.id,
    method: "supplier_pcf",
    confidence: 0.95,
    status: "approved",
    matchReason: "pact_supplier_pcf_accepted",
    approvedBy: input.acceptedBy ?? "local-user",
    approvedAt: now,
    notes: input.notes ?? "Accepted PACT ProductFootprint import",
    createdAt: prior?.createdAt ?? now,
    updatedAt: now,
  };

  updateBomLocal(companyId, (s) => ({
    ...s,
    emissionFactors: [
      ...s.emissionFactors.filter((f) => f.id !== factor.id),
      factor,
    ],
    carbonMappings: [
      ...s.carbonMappings.filter((m) => m.bomItemId !== mapping.bomItemId),
      mapping,
    ],
  }));

  return localUpdateSupplierPcfRecord(companyId, recordId, {
    status: "accepted",
    mappedBomItemId: input.bomItemId,
    resultingFactorId: factor.id,
    resultingMappingId: mapping.id,
  });
}

export function localRejectSupplierPcfRecord(
  companyId: string,
  recordId: string
): SupplierPcfRecord {
  const record = localGetSupplierPcfRecord(companyId, recordId);
  if (!record) throw new Error("Supplier PCF record not found");
  if (record.status === "accepted") {
    throw new Error("Cannot reject an already accepted record");
  }
  return localUpdateSupplierPcfRecord(companyId, recordId, {
    status: "rejected",
  });
}

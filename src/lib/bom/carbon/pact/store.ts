/**
 * PACT V3 Phase 3a — local persistence stubs (mirror of additive tables).
 * Full mapper / OpenAPI validation arrives in Phase 3b+.
 */

import { loadBomLocal, newEntityId, updateBomLocal } from "../../local-store";
import type {
  PactEndpoint,
  PactExchange,
  ProductIdentityMapping,
  SupplierPcfRecord,
} from "./types";
import { PACT_SPEC_VERSION } from "./types";

function nowIso() {
  return new Date().toISOString();
}

// ─── Endpoints ─────────────────────────────────────────────────────────────

export function localListPactEndpoints(companyId: string): PactEndpoint[] {
  return [...(loadBomLocal(companyId).pactEndpoints ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function localGetPactEndpoint(
  companyId: string,
  endpointId: string
): PactEndpoint | null {
  return localListPactEndpoints(companyId).find((e) => e.id === endpointId) ?? null;
}

export function localCreatePactEndpoint(
  companyId: string,
  input: {
    name: string;
    baseUrl: string;
    protocolVersion?: string;
    clientId?: string | null;
    clientSecretRef?: string | null;
  }
): PactEndpoint {
  const name = input.name.trim();
  if (!name) throw new Error("endpoint name is required");
  const baseUrl = input.baseUrl.trim();
  if (!baseUrl) throw new Error("baseUrl is required");
  if (localListPactEndpoints(companyId).some((e) => e.name === name)) {
    throw new Error(`endpoint name already exists: ${name}`);
  }
  const ts = nowIso();
  const endpoint: PactEndpoint = {
    id: newEntityId(),
    companyId,
    name,
    baseUrl,
    protocolVersion: input.protocolVersion?.trim() || PACT_SPEC_VERSION,
    authType: "oauth2_client_credentials",
    clientId: input.clientId ?? null,
    clientSecretRef: input.clientSecretRef ?? null,
    status: "active",
    lastSuccessAt: null,
    lastError: null,
    createdAt: ts,
    updatedAt: ts,
  };
  updateBomLocal(companyId, (s) => ({
    ...s,
    pactEndpoints: [...(s.pactEndpoints ?? []), endpoint],
  }));
  return endpoint;
}

// ─── Identity mappings ─────────────────────────────────────────────────────

export function localListProductIdentityMappings(
  companyId: string,
  filter?: { productId?: string; bomItemId?: string }
): ProductIdentityMapping[] {
  return (loadBomLocal(companyId).productIdentityMappings ?? []).filter((m) => {
    if (filter?.productId && m.productId !== filter.productId) return false;
    if (filter?.bomItemId && m.bomItemId !== filter.bomItemId) return false;
    return true;
  });
}

export function localCreateProductIdentityMapping(
  companyId: string,
  input: {
    productId?: string | null;
    bomItemId?: string | null;
    scheme: ProductIdentityMapping["scheme"];
    value: string;
    urn: string;
    status?: ProductIdentityMapping["status"];
    confidence?: number | null;
    source?: ProductIdentityMapping["source"];
  }
): ProductIdentityMapping {
  const value = input.value.trim();
  const urn = input.urn.trim();
  if (!value || !urn) throw new Error("value and urn are required");
  if (!input.productId && !input.bomItemId && input.scheme !== "company") {
    throw new Error("productId or bomItemId required (unless scheme=company)");
  }
  if (localListProductIdentityMappings(companyId).some((m) => m.urn === urn)) {
    throw new Error(`identity URN already mapped: ${urn}`);
  }
  const ts = nowIso();
  const mapping: ProductIdentityMapping = {
    id: newEntityId(),
    companyId,
    productId: input.productId ?? null,
    bomItemId: input.bomItemId ?? null,
    scheme: input.scheme,
    value,
    urn,
    status: input.status ?? "candidate",
    confidence: input.confidence ?? null,
    source: input.source ?? "manual",
    createdAt: ts,
    updatedAt: ts,
  };
  updateBomLocal(companyId, (s) => ({
    ...s,
    productIdentityMappings: [...(s.productIdentityMappings ?? []), mapping],
  }));
  return mapping;
}

// ─── Supplier PCF records ──────────────────────────────────────────────────

export function localListSupplierPcfRecords(
  companyId: string,
  filter?: { status?: SupplierPcfRecord["status"] }
): SupplierPcfRecord[] {
  return (loadBomLocal(companyId).supplierPcfRecords ?? []).filter((r) => {
    if (filter?.status && r.status !== filter.status) return false;
    return true;
  });
}

export function localGetSupplierPcfRecord(
  companyId: string,
  recordId: string
): SupplierPcfRecord | null {
  return localListSupplierPcfRecords(companyId).find((r) => r.id === recordId) ?? null;
}

export function localCreateSupplierPcfRecord(
  companyId: string,
  input: Partial<Omit<SupplierPcfRecord, "id" | "companyId" | "createdAt" | "updatedAt">> & {
    rawPayload: Record<string, unknown>;
  }
): SupplierPcfRecord {
  const ts = nowIso();
  const record: SupplierPcfRecord = {
    id: newEntityId(),
    companyId,
    supplierId: input.supplierId ?? null,
    productIdentityUrns: input.productIdentityUrns ?? [],
    declaredUnit: input.declaredUnit ?? null,
    declaredUnitAmount: input.declaredUnitAmount ?? null,
    pcfExcludingBiogenic: input.pcfExcludingBiogenic ?? null,
    pcfIncludingBiogenic: input.pcfIncludingBiogenic ?? null,
    referencePeriodStart: input.referencePeriodStart ?? null,
    referencePeriodEnd: input.referencePeriodEnd ?? null,
    validityPeriodStart: input.validityPeriodStart ?? null,
    validityPeriodEnd: input.validityPeriodEnd ?? null,
    geography: input.geography ?? null,
    crossSectoralStandards: input.crossSectoralStandards ?? [],
    secondaryEmissionFactorSources: input.secondaryEmissionFactorSources ?? [],
    verificationJson: input.verificationJson ?? null,
    dqiJson: input.dqiJson ?? null,
    pactSpecVersion: input.pactSpecVersion ?? "3.0.0",
    rawPayload: input.rawPayload,
    status: input.status ?? "received",
    mappedBomItemId: input.mappedBomItemId ?? null,
    resultingFactorId: input.resultingFactorId ?? null,
    resultingMappingId: input.resultingMappingId ?? null,
    pactExchangeId: input.pactExchangeId ?? null,
    createdAt: ts,
    updatedAt: ts,
  };
  updateBomLocal(companyId, (s) => ({
    ...s,
    supplierPcfRecords: [...(s.supplierPcfRecords ?? []), record],
  }));
  return record;
}

// ─── Exchanges ─────────────────────────────────────────────────────────────

export function localListPactExchanges(
  companyId: string,
  filter?: { direction?: PactExchange["direction"]; kind?: PactExchange["kind"] }
): PactExchange[] {
  return (loadBomLocal(companyId).pactExchanges ?? [])
    .filter((e) => {
      if (filter?.direction && e.direction !== filter.direction) return false;
      if (filter?.kind && e.kind !== filter.kind) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function localGetPactExchange(
  companyId: string,
  exchangeId: string
): PactExchange | null {
  return localListPactExchanges(companyId).find((e) => e.id === exchangeId) ?? null;
}

export function localFindPactExchangeByIdempotencyKey(
  companyId: string,
  idempotencyKey: string
): PactExchange | null {
  return (
    (loadBomLocal(companyId).pactExchanges ?? []).find(
      (e) => e.idempotencyKey === idempotencyKey
    ) ?? null
  );
}

export function localCreatePactExchange(
  companyId: string,
  input: {
    direction: PactExchange["direction"];
    kind: PactExchange["kind"];
    idempotencyKey: string;
    endpointId?: string | null;
    correlationId?: string | null;
    requestId?: string | null;
    calculationId?: string | null;
    footprintId?: string | null;
    supplierPcfRecordId?: string | null;
    requestPayload?: Record<string, unknown> | null;
    status?: PactExchange["status"];
  }
): PactExchange {
  const key = input.idempotencyKey.trim();
  if (!key) throw new Error("idempotencyKey is required");
  const existing = localFindPactExchangeByIdempotencyKey(companyId, key);
  if (existing) return existing;

  const exchange: PactExchange = {
    id: newEntityId(),
    companyId,
    direction: input.direction,
    kind: input.kind,
    endpointId: input.endpointId ?? null,
    idempotencyKey: key,
    correlationId: input.correlationId ?? null,
    requestId: input.requestId ?? null,
    status: input.status ?? "pending",
    httpStatus: null,
    errorCode: null,
    errorDetail: null,
    footprintId: input.footprintId ?? null,
    calculationId: input.calculationId ?? null,
    supplierPcfRecordId: input.supplierPcfRecordId ?? null,
    requestPayload: input.requestPayload ?? null,
    responsePayload: null,
    createdAt: nowIso(),
    completedAt: null,
  };
  updateBomLocal(companyId, (s) => ({
    ...s,
    pactExchanges: [...(s.pactExchanges ?? []), exchange],
  }));
  return exchange;
}

export function localUpdatePactExchange(
  companyId: string,
  exchangeId: string,
  patch: Partial<
    Pick<
      PactExchange,
      | "status"
      | "httpStatus"
      | "errorCode"
      | "errorDetail"
      | "footprintId"
      | "supplierPcfRecordId"
      | "responsePayload"
      | "completedAt"
    >
  >
): PactExchange {
  const existing = localGetPactExchange(companyId, exchangeId);
  if (!existing) throw new Error(`pact exchange not found: ${exchangeId}`);
  const updated: PactExchange = { ...existing, ...patch };
  updateBomLocal(companyId, (s) => ({
    ...s,
    pactExchanges: (s.pactExchanges ?? []).map((e) =>
      e.id === exchangeId ? updated : e
    ),
  }));
  return updated;
}


export function localUpdateSupplierPcfRecord(
  companyId: string,
  recordId: string,
  patch: Partial<
    Pick<
      SupplierPcfRecord,
      | "status"
      | "mappedBomItemId"
      | "resultingFactorId"
      | "resultingMappingId"
      | "pactExchangeId"
      | "supplierId"
    >
  >
): SupplierPcfRecord {
  const existing = localGetSupplierPcfRecord(companyId, recordId);
  if (!existing) throw new Error(`supplier PCF record not found: ${recordId}`);
  const updated: SupplierPcfRecord = {
    ...existing,
    ...patch,
    updatedAt: nowIso(),
  };
  updateBomLocal(companyId, (s) => ({
    ...s,
    supplierPcfRecords: (s.supplierPcfRecords ?? []).map((r) =>
      r.id === recordId ? updated : r
    ),
  }));
  return updated;
}

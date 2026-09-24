/**
 * PACT V3 Phase 8 — Supabase CRUD for additive PACT tables (migration 011).
 * Routes prefer these; on failure they fall back to local-store.
 */

import type { ExportAuthContext } from "@/lib/export/auth";
import type {
  PactEndpoint,
  PactExchange,
  ProductIdentityMapping,
  SupplierPcfRecord,
} from "./types";
import { PACT_SPEC_VERSION } from "./types";

function asRecord(row: unknown): Record<string, unknown> {
  return (row ?? {}) as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v));
}

function asNameArray(value: unknown): Array<{ name: string }> {
  if (!Array.isArray(value)) return [];
  return value.map((v) => {
    if (v && typeof v === "object" && "name" in v) {
      return { name: String((v as { name: unknown }).name) };
    }
    return { name: String(v) };
  });
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function mapPactEndpoint(row: Record<string, unknown>): PactEndpoint {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    name: String(row.name),
    baseUrl: String(row.base_url),
    protocolVersion: String(row.protocol_version ?? PACT_SPEC_VERSION),
    authType: (row.auth_type as PactEndpoint["authType"]) ?? "oauth2_client_credentials",
    clientId: (row.client_id as string | null) ?? null,
    clientSecretRef: (row.client_secret_ref as string | null) ?? null,
    status: (row.status as PactEndpoint["status"]) ?? "active",
    lastSuccessAt: (row.last_success_at as string | null) ?? null,
    lastError: (row.last_error as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapProductIdentityMapping(
  row: Record<string, unknown>
): ProductIdentityMapping {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    productId: (row.product_id as string | null) ?? null,
    bomItemId: (row.bom_item_id as string | null) ?? null,
    scheme: row.scheme as ProductIdentityMapping["scheme"],
    value: String(row.value),
    urn: String(row.urn),
    status: (row.status as ProductIdentityMapping["status"]) ?? "candidate",
    confidence:
      row.confidence == null || row.confidence === ""
        ? null
        : Number(row.confidence),
    source: (row.source as ProductIdentityMapping["source"]) ?? "manual",
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapSupplierPcfRecord(
  row: Record<string, unknown>
): SupplierPcfRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    supplierId: (row.supplier_id as string | null) ?? null,
    productIdentityUrns: asStringArray(row.product_identity_urns),
    declaredUnit: (row.declared_unit as string | null) ?? null,
    declaredUnitAmount:
      row.declared_unit_amount == null ? null : Number(row.declared_unit_amount),
    pcfExcludingBiogenic:
      row.pcf_excluding_biogenic == null
        ? null
        : Number(row.pcf_excluding_biogenic),
    pcfIncludingBiogenic:
      row.pcf_including_biogenic == null
        ? null
        : Number(row.pcf_including_biogenic),
    referencePeriodStart: (row.reference_period_start as string | null) ?? null,
    referencePeriodEnd: (row.reference_period_end as string | null) ?? null,
    validityPeriodStart: (row.validity_period_start as string | null) ?? null,
    validityPeriodEnd: (row.validity_period_end as string | null) ?? null,
    geography: (row.geography as string | null) ?? null,
    crossSectoralStandards: asStringArray(row.cross_sectoral_standards),
    secondaryEmissionFactorSources: asNameArray(
      row.secondary_emission_factor_sources
    ),
    verificationJson: asObject(row.verification_json),
    dqiJson: asObject(row.dqi_json),
    pactSpecVersion: String(row.pact_spec_version ?? "3.0.0"),
    rawPayload: asObject(row.raw_payload) ?? {},
    status: (row.status as SupplierPcfRecord["status"]) ?? "received",
    mappedBomItemId: (row.mapped_bom_item_id as string | null) ?? null,
    resultingFactorId: (row.resulting_factor_id as string | null) ?? null,
    resultingMappingId: (row.resulting_mapping_id as string | null) ?? null,
    pactExchangeId: (row.pact_exchange_id as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapPactExchange(row: Record<string, unknown>): PactExchange {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    direction: row.direction as PactExchange["direction"],
    kind: row.kind as PactExchange["kind"],
    endpointId: (row.endpoint_id as string | null) ?? null,
    idempotencyKey: String(row.idempotency_key),
    correlationId: (row.correlation_id as string | null) ?? null,
    requestId: (row.request_id as string | null) ?? null,
    status: (row.status as PactExchange["status"]) ?? "pending",
    httpStatus: row.http_status == null ? null : Number(row.http_status),
    errorCode: (row.error_code as string | null) ?? null,
    errorDetail: (row.error_detail as string | null) ?? null,
    footprintId: (row.footprint_id as string | null) ?? null,
    calculationId: (row.calculation_id as string | null) ?? null,
    supplierPcfRecordId: (row.supplier_pcf_record_id as string | null) ?? null,
    requestPayload: asObject(row.request_payload),
    responsePayload: asObject(row.response_payload),
    createdAt: String(row.created_at),
    completedAt: (row.completed_at as string | null) ?? null,
  };
}

function endpointInsert(companyId: string, input: {
  name: string;
  baseUrl: string;
  protocolVersion?: string;
  clientId?: string | null;
  clientSecretRef?: string | null;
}) {
  return {
    company_id: companyId,
    name: input.name.trim(),
    base_url: input.baseUrl.trim(),
    protocol_version: input.protocolVersion?.trim() || PACT_SPEC_VERSION,
    auth_type: "oauth2_client_credentials",
    client_id: input.clientId ?? null,
    client_secret_ref: input.clientSecretRef ?? null,
    status: "active",
  };
}

function identityInsert(
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
) {
  return {
    company_id: companyId,
    product_id: input.productId ?? null,
    bom_item_id: input.bomItemId ?? null,
    scheme: input.scheme,
    value: input.value.trim(),
    urn: input.urn.trim(),
    status: input.status ?? "candidate",
    confidence: input.confidence ?? null,
    source: input.source ?? "manual",
  };
}

function supplierRecordInsert(
  companyId: string,
  input: Partial<Omit<SupplierPcfRecord, "id" | "companyId" | "createdAt" | "updatedAt">> & {
    rawPayload: Record<string, unknown>;
    id?: string;
  }
) {
  const row: Record<string, unknown> = {
    company_id: companyId,
    supplier_id: input.supplierId ?? null,
    product_identity_urns: input.productIdentityUrns ?? [],
    declared_unit: input.declaredUnit ?? null,
    declared_unit_amount: input.declaredUnitAmount ?? null,
    pcf_excluding_biogenic: input.pcfExcludingBiogenic ?? null,
    pcf_including_biogenic: input.pcfIncludingBiogenic ?? null,
    reference_period_start: input.referencePeriodStart ?? null,
    reference_period_end: input.referencePeriodEnd ?? null,
    validity_period_start: input.validityPeriodStart ?? null,
    validity_period_end: input.validityPeriodEnd ?? null,
    geography: input.geography ?? null,
    cross_sectoral_standards: input.crossSectoralStandards ?? [],
    secondary_emission_factor_sources: input.secondaryEmissionFactorSources ?? [],
    verification_json: input.verificationJson ?? null,
    dqi_json: input.dqiJson ?? null,
    pact_spec_version: input.pactSpecVersion ?? "3.0.0",
    raw_payload: input.rawPayload,
    status: input.status ?? "received",
    mapped_bom_item_id: input.mappedBomItemId ?? null,
    resulting_factor_id: input.resultingFactorId ?? null,
    resulting_mapping_id: input.resultingMappingId ?? null,
    pact_exchange_id: input.pactExchangeId ?? null,
  };
  if (input.id) row.id = input.id;
  return row;
}

function exchangeInsert(
  companyId: string,
  input: {
    id?: string;
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
    responsePayload?: Record<string, unknown> | null;
    status?: PactExchange["status"];
    httpStatus?: number | null;
    errorCode?: string | null;
    errorDetail?: string | null;
    completedAt?: string | null;
  }
) {
  const row: Record<string, unknown> = {
    company_id: companyId,
    direction: input.direction,
    kind: input.kind,
    endpoint_id: input.endpointId ?? null,
    idempotency_key: input.idempotencyKey.trim(),
    correlation_id: input.correlationId ?? null,
    request_id: input.requestId ?? null,
    status: input.status ?? "pending",
    http_status: input.httpStatus ?? null,
    error_code: input.errorCode ?? null,
    error_detail: input.errorDetail ?? null,
    footprint_id: input.footprintId ?? null,
    calculation_id: input.calculationId ?? null,
    supplier_pcf_record_id: input.supplierPcfRecordId ?? null,
    request_payload: input.requestPayload ?? null,
    response_payload: input.responsePayload ?? null,
    completed_at: input.completedAt ?? null,
  };
  if (input.id) row.id = input.id;
  return row;
}

// ─── Endpoints ─────────────────────────────────────────────────────────────

export async function dbListPactEndpoints(
  ctx: ExportAuthContext
): Promise<PactEndpoint[]> {
  const { data, error } = await ctx.supabase
    .from("pact_endpoints")
    .select("*")
    .eq("company_id", ctx.companyId)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => mapPactEndpoint(asRecord(r)));
}

export async function dbCreatePactEndpoint(
  ctx: ExportAuthContext,
  input: {
    name: string;
    baseUrl: string;
    protocolVersion?: string;
    clientId?: string | null;
    clientSecretRef?: string | null;
  }
): Promise<PactEndpoint> {
  const name = input.name.trim();
  const baseUrl = input.baseUrl.trim();
  if (!name) throw new Error("endpoint name is required");
  if (!baseUrl) throw new Error("baseUrl is required");

  const { data, error } = await ctx.supabase
    .from("pact_endpoints")
    .insert(endpointInsert(ctx.companyId, input))
    .select("*")
    .single();
  if (error) throw error;
  return mapPactEndpoint(asRecord(data));
}

// ─── Identity mappings ─────────────────────────────────────────────────────

export async function dbListProductIdentityMappings(
  ctx: ExportAuthContext,
  filter?: { productId?: string; bomItemId?: string }
): Promise<ProductIdentityMapping[]> {
  let q = ctx.supabase
    .from("product_identity_mappings")
    .select("*")
    .eq("company_id", ctx.companyId)
    .order("created_at", { ascending: false });
  if (filter?.productId) q = q.eq("product_id", filter.productId);
  if (filter?.bomItemId) q = q.eq("bom_item_id", filter.bomItemId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => mapProductIdentityMapping(asRecord(r)));
}

export async function dbGetProductIdentityMapping(
  ctx: ExportAuthContext,
  mappingId: string
): Promise<ProductIdentityMapping | null> {
  const { data, error } = await ctx.supabase
    .from("product_identity_mappings")
    .select("*")
    .eq("company_id", ctx.companyId)
    .eq("id", mappingId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProductIdentityMapping(asRecord(data)) : null;
}

export async function dbCreateProductIdentityMapping(
  ctx: ExportAuthContext,
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
): Promise<ProductIdentityMapping> {
  const value = input.value.trim();
  const urn = input.urn.trim();
  if (!value || !urn) throw new Error("value and urn are required");
  if (!input.productId && !input.bomItemId && input.scheme !== "company") {
    throw new Error("productId or bomItemId required (unless scheme=company)");
  }

  const { data, error } = await ctx.supabase
    .from("product_identity_mappings")
    .insert(identityInsert(ctx.companyId, input))
    .select("*")
    .single();
  if (error) throw error;
  return mapProductIdentityMapping(asRecord(data));
}

export async function dbUpdateProductIdentityMapping(
  ctx: ExportAuthContext,
  mappingId: string,
  patch: Partial<
    Pick<
      ProductIdentityMapping,
      | "status"
      | "productId"
      | "bomItemId"
      | "confidence"
      | "scheme"
      | "value"
      | "urn"
    >
  >
): Promise<ProductIdentityMapping> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.productId !== undefined) row.product_id = patch.productId;
  if (patch.bomItemId !== undefined) row.bom_item_id = patch.bomItemId;
  if (patch.confidence !== undefined) row.confidence = patch.confidence;
  if (patch.scheme !== undefined) row.scheme = patch.scheme;
  if (patch.value !== undefined) row.value = patch.value.trim();
  if (patch.urn !== undefined) row.urn = patch.urn.trim();

  const { data, error } = await ctx.supabase
    .from("product_identity_mappings")
    .update(row)
    .eq("company_id", ctx.companyId)
    .eq("id", mappingId)
    .select("*")
    .single();
  if (error) throw error;
  return mapProductIdentityMapping(asRecord(data));
}

// ─── Supplier PCF records ──────────────────────────────────────────────────

export async function dbListSupplierPcfRecords(
  ctx: ExportAuthContext,
  filter?: { status?: SupplierPcfRecord["status"] }
): Promise<SupplierPcfRecord[]> {
  let q = ctx.supabase
    .from("supplier_pcf_records")
    .select("*")
    .eq("company_id", ctx.companyId)
    .order("created_at", { ascending: false });
  if (filter?.status) q = q.eq("status", filter.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => mapSupplierPcfRecord(asRecord(r)));
}

export async function dbGetSupplierPcfRecord(
  ctx: ExportAuthContext,
  recordId: string
): Promise<SupplierPcfRecord | null> {
  const { data, error } = await ctx.supabase
    .from("supplier_pcf_records")
    .select("*")
    .eq("company_id", ctx.companyId)
    .eq("id", recordId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSupplierPcfRecord(asRecord(data)) : null;
}

export async function dbCreateSupplierPcfRecord(
  ctx: ExportAuthContext,
  input: Partial<Omit<SupplierPcfRecord, "id" | "companyId" | "createdAt" | "updatedAt">> & {
    rawPayload: Record<string, unknown>;
    id?: string;
  }
): Promise<SupplierPcfRecord> {
  const { data, error } = await ctx.supabase
    .from("supplier_pcf_records")
    .insert(supplierRecordInsert(ctx.companyId, input))
    .select("*")
    .single();
  if (error) throw error;
  return mapSupplierPcfRecord(asRecord(data));
}

export async function dbUpdateSupplierPcfRecord(
  ctx: ExportAuthContext,
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
): Promise<SupplierPcfRecord> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.mappedBomItemId !== undefined) {
    row.mapped_bom_item_id = patch.mappedBomItemId;
  }
  if (patch.resultingFactorId !== undefined) {
    row.resulting_factor_id = patch.resultingFactorId;
  }
  if (patch.resultingMappingId !== undefined) {
    row.resulting_mapping_id = patch.resultingMappingId;
  }
  if (patch.pactExchangeId !== undefined) {
    row.pact_exchange_id = patch.pactExchangeId;
  }
  if (patch.supplierId !== undefined) row.supplier_id = patch.supplierId;

  const { data, error } = await ctx.supabase
    .from("supplier_pcf_records")
    .update(row)
    .eq("company_id", ctx.companyId)
    .eq("id", recordId)
    .select("*")
    .single();
  if (error) throw error;
  return mapSupplierPcfRecord(asRecord(data));
}

export async function dbUpsertSupplierPcfRecord(
  ctx: ExportAuthContext,
  record: SupplierPcfRecord
): Promise<SupplierPcfRecord> {
  const { data, error } = await ctx.supabase
    .from("supplier_pcf_records")
    .upsert(
      {
        ...supplierRecordInsert(ctx.companyId, { ...record, id: record.id }),
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return mapSupplierPcfRecord(asRecord(data));
}

// ─── Exchanges ─────────────────────────────────────────────────────────────

export async function dbListPactExchanges(
  ctx: ExportAuthContext,
  filter?: { direction?: PactExchange["direction"]; kind?: PactExchange["kind"] }
): Promise<PactExchange[]> {
  let q = ctx.supabase
    .from("pact_exchanges")
    .select("*")
    .eq("company_id", ctx.companyId)
    .order("created_at", { ascending: false });
  if (filter?.direction) q = q.eq("direction", filter.direction);
  if (filter?.kind) q = q.eq("kind", filter.kind);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => mapPactExchange(asRecord(r)));
}

export async function dbGetPactExchange(
  ctx: ExportAuthContext,
  exchangeId: string
): Promise<PactExchange | null> {
  const { data, error } = await ctx.supabase
    .from("pact_exchanges")
    .select("*")
    .eq("company_id", ctx.companyId)
    .eq("id", exchangeId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPactExchange(asRecord(data)) : null;
}

export async function dbFindPactExchangeByIdempotencyKey(
  ctx: ExportAuthContext,
  idempotencyKey: string
): Promise<PactExchange | null> {
  const { data, error } = await ctx.supabase
    .from("pact_exchanges")
    .select("*")
    .eq("company_id", ctx.companyId)
    .eq("idempotency_key", idempotencyKey.trim())
    .maybeSingle();
  if (error) throw error;
  return data ? mapPactExchange(asRecord(data)) : null;
}

export async function dbCreatePactExchange(
  ctx: ExportAuthContext,
  input: {
    id?: string;
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
): Promise<PactExchange> {
  const key = input.idempotencyKey.trim();
  if (!key) throw new Error("idempotencyKey is required");

  const existing = await dbFindPactExchangeByIdempotencyKey(ctx, key);
  if (existing) return existing;

  const { data, error } = await ctx.supabase
    .from("pact_exchanges")
    .insert(exchangeInsert(ctx.companyId, { ...input, idempotencyKey: key }))
    .select("*")
    .single();
  if (error) {
    // Concurrent insert with same key — return winner
    if (String(error.code) === "23505") {
      const again = await dbFindPactExchangeByIdempotencyKey(ctx, key);
      if (again) return again;
    }
    throw error;
  }
  return mapPactExchange(asRecord(data));
}

export async function dbUpdatePactExchange(
  ctx: ExportAuthContext,
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
): Promise<PactExchange> {
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.httpStatus !== undefined) row.http_status = patch.httpStatus;
  if (patch.errorCode !== undefined) row.error_code = patch.errorCode;
  if (patch.errorDetail !== undefined) row.error_detail = patch.errorDetail;
  if (patch.footprintId !== undefined) row.footprint_id = patch.footprintId;
  if (patch.supplierPcfRecordId !== undefined) {
    row.supplier_pcf_record_id = patch.supplierPcfRecordId;
  }
  if (patch.responsePayload !== undefined) {
    row.response_payload = patch.responsePayload;
  }
  if (patch.completedAt !== undefined) row.completed_at = patch.completedAt;

  const { data, error } = await ctx.supabase
    .from("pact_exchanges")
    .update(row)
    .eq("company_id", ctx.companyId)
    .eq("id", exchangeId)
    .select("*")
    .single();
  if (error) throw error;
  return mapPactExchange(asRecord(data));
}

export async function dbUpsertPactExchange(
  ctx: ExportAuthContext,
  exchange: PactExchange
): Promise<PactExchange> {
  const { data, error } = await ctx.supabase
    .from("pact_exchanges")
    .upsert(
      {
        ...exchangeInsert(ctx.companyId, {
          id: exchange.id,
          direction: exchange.direction,
          kind: exchange.kind,
          idempotencyKey: exchange.idempotencyKey,
          endpointId: exchange.endpointId,
          correlationId: exchange.correlationId,
          requestId: exchange.requestId,
          calculationId: exchange.calculationId,
          footprintId: exchange.footprintId,
          supplierPcfRecordId: exchange.supplierPcfRecordId,
          requestPayload: exchange.requestPayload,
          responsePayload: exchange.responsePayload,
          status: exchange.status,
          httpStatus: exchange.httpStatus,
          errorCode: exchange.errorCode,
          errorDetail: exchange.errorDetail,
          completedAt: exchange.completedAt,
        }),
        created_at: exchange.createdAt,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return mapPactExchange(asRecord(data));
}

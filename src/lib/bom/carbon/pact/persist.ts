/**
 * PACT V3 Phase 8 — API persistence: try Supabase, fall back to local-store.
 */

import type { ExportAuthContext } from "@/lib/export/auth";
import {
  dbCreatePactEndpoint,
  dbCreatePactExchange,
  dbCreateProductIdentityMapping,
  dbCreateSupplierPcfRecord,
  dbGetProductIdentityMapping,
  dbGetSupplierPcfRecord,
  dbListPactEndpoints,
  dbListPactExchanges,
  dbListProductIdentityMappings,
  dbListSupplierPcfRecords,
  dbUpdatePactExchange,
  dbUpdateProductIdentityMapping,
  dbUpdateSupplierPcfRecord,
  dbUpsertPactExchange,
  dbUpsertSupplierPcfRecord,
} from "./db-service";
import {
  localCreatePactEndpoint,
  localCreatePactExchange,
  localCreateProductIdentityMapping,
  localCreateSupplierPcfRecord,
  localGetProductIdentityMapping,
  localGetSupplierPcfRecord,
  localListPactEndpoints,
  localListPactExchanges,
  localListProductIdentityMappings,
  localListSupplierPcfRecords,
  localUpdatePactExchange,
  localUpdateProductIdentityMapping,
  localUpdateSupplierPcfRecord,
} from "./store";
import type {
  PactEndpoint,
  PactExchange,
  ProductIdentityMapping,
  SupplierPcfRecord,
} from "./types";

async function withDbFallback<T>(
  dbOp: () => Promise<T>,
  localOp: () => T
): Promise<{ value: T; source: "db" | "local" }> {
  try {
    const value = await dbOp();
    return { value, source: "db" };
  } catch {
    return { value: localOp(), source: "local" };
  }
}

// ─── Endpoints ─────────────────────────────────────────────────────────────

export async function persistListPactEndpoints(
  ctx: ExportAuthContext
): Promise<PactEndpoint[]> {
  const { value } = await withDbFallback(
    () => dbListPactEndpoints(ctx),
    () => localListPactEndpoints(ctx.companyId)
  );
  return value;
}

export async function persistCreatePactEndpoint(
  ctx: ExportAuthContext,
  input: Parameters<typeof localCreatePactEndpoint>[1]
): Promise<PactEndpoint> {
  const { value } = await withDbFallback(
    () => dbCreatePactEndpoint(ctx, input),
    () => localCreatePactEndpoint(ctx.companyId, input)
  );
  return value;
}

// ─── Identity mappings ─────────────────────────────────────────────────────

export async function persistListProductIdentityMappings(
  ctx: ExportAuthContext,
  filter?: { productId?: string; bomItemId?: string }
): Promise<ProductIdentityMapping[]> {
  const { value } = await withDbFallback(
    () => dbListProductIdentityMappings(ctx, filter),
    () => localListProductIdentityMappings(ctx.companyId, filter)
  );
  return value;
}

export async function persistCreateProductIdentityMapping(
  ctx: ExportAuthContext,
  input: Parameters<typeof localCreateProductIdentityMapping>[1]
): Promise<ProductIdentityMapping> {
  const { value } = await withDbFallback(
    () => dbCreateProductIdentityMapping(ctx, input),
    () => localCreateProductIdentityMapping(ctx.companyId, input)
  );
  return value;
}

export async function persistUpdateProductIdentityMapping(
  ctx: ExportAuthContext,
  mappingId: string,
  patch: Parameters<typeof localUpdateProductIdentityMapping>[2]
): Promise<ProductIdentityMapping> {
  const { value } = await withDbFallback(
    () => dbUpdateProductIdentityMapping(ctx, mappingId, patch),
    () => localUpdateProductIdentityMapping(ctx.companyId, mappingId, patch)
  );
  return value;
}

export async function persistGetProductIdentityMapping(
  ctx: ExportAuthContext,
  mappingId: string
): Promise<ProductIdentityMapping | null> {
  const { value } = await withDbFallback(
    () => dbGetProductIdentityMapping(ctx, mappingId),
    () => localGetProductIdentityMapping(ctx.companyId, mappingId)
  );
  return value;
}

// ─── Supplier PCF records ──────────────────────────────────────────────────

export async function persistListSupplierPcfRecords(
  ctx: ExportAuthContext,
  filter?: { status?: SupplierPcfRecord["status"] }
): Promise<SupplierPcfRecord[]> {
  const { value } = await withDbFallback(
    () => dbListSupplierPcfRecords(ctx, filter),
    () => localListSupplierPcfRecords(ctx.companyId, filter)
  );
  return value;
}

export async function persistGetSupplierPcfRecord(
  ctx: ExportAuthContext,
  recordId: string
): Promise<SupplierPcfRecord | null> {
  const { value } = await withDbFallback(
    () => dbGetSupplierPcfRecord(ctx, recordId),
    () => localGetSupplierPcfRecord(ctx.companyId, recordId)
  );
  return value;
}

export async function persistCreateSupplierPcfRecord(
  ctx: ExportAuthContext,
  input: Parameters<typeof localCreateSupplierPcfRecord>[1]
): Promise<SupplierPcfRecord> {
  const { value } = await withDbFallback(
    () => dbCreateSupplierPcfRecord(ctx, input),
    () => localCreateSupplierPcfRecord(ctx.companyId, input)
  );
  return value;
}

export async function persistUpdateSupplierPcfRecord(
  ctx: ExportAuthContext,
  recordId: string,
  patch: Parameters<typeof localUpdateSupplierPcfRecord>[2]
): Promise<SupplierPcfRecord> {
  const { value } = await withDbFallback(
    () => dbUpdateSupplierPcfRecord(ctx, recordId, patch),
    () => localUpdateSupplierPcfRecord(ctx.companyId, recordId, patch)
  );
  return value;
}

/** Best-effort mirror of a local-written record into Postgres (import/accept). */
export async function mirrorSupplierPcfRecordToDb(
  ctx: ExportAuthContext,
  record: SupplierPcfRecord
): Promise<"db" | "local"> {
  try {
    await dbUpsertSupplierPcfRecord(ctx, record);
    return "db";
  } catch {
    return "local";
  }
}

// ─── Exchanges ─────────────────────────────────────────────────────────────

export async function persistListPactExchanges(
  ctx: ExportAuthContext,
  filter?: { direction?: PactExchange["direction"]; kind?: PactExchange["kind"] }
): Promise<PactExchange[]> {
  const { value } = await withDbFallback(
    () => dbListPactExchanges(ctx, filter),
    () => localListPactExchanges(ctx.companyId, filter)
  );
  return value;
}

export async function persistCreatePactExchange(
  ctx: ExportAuthContext,
  input: Parameters<typeof localCreatePactExchange>[1]
): Promise<PactExchange> {
  const { value } = await withDbFallback(
    () => dbCreatePactExchange(ctx, input),
    () => localCreatePactExchange(ctx.companyId, input)
  );
  return value;
}

export async function persistUpdatePactExchange(
  ctx: ExportAuthContext,
  exchangeId: string,
  patch: Parameters<typeof localUpdatePactExchange>[2]
): Promise<PactExchange> {
  const { value } = await withDbFallback(
    () => dbUpdatePactExchange(ctx, exchangeId, patch),
    () => localUpdatePactExchange(ctx.companyId, exchangeId, patch)
  );
  return value;
}

/** Best-effort mirror of a local-written exchange into Postgres (export/import). */
export async function mirrorPactExchangeToDb(
  ctx: ExportAuthContext,
  exchange: PactExchange
): Promise<"db" | "local"> {
  try {
    await dbUpsertPactExchange(ctx, exchange);
    return "db";
  } catch {
    return "local";
  }
}

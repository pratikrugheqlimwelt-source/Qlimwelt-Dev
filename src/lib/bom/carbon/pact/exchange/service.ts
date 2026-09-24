/**
 * Phase 3a/8 exchange service — idempotent create/list over local store + DB persist.
 */

import type { ExportAuthContext } from "@/lib/export/auth";
import {
  persistCreatePactExchange,
  persistListPactExchanges,
  persistUpdatePactExchange,
} from "../persist";
import {
  localCreatePactExchange,
  localGetPactExchange,
  localListPactExchanges,
  localUpdatePactExchange,
} from "../store";
import type { PactExchange } from "../types";

export function listExchanges(
  companyId: string,
  filter?: { direction?: PactExchange["direction"]; kind?: PactExchange["kind"] }
): PactExchange[] {
  return localListPactExchanges(companyId, filter);
}

export async function listExchangesPersisted(
  ctx: ExportAuthContext,
  filter?: { direction?: PactExchange["direction"]; kind?: PactExchange["kind"] }
): Promise<PactExchange[]> {
  return persistListPactExchanges(ctx, filter);
}

export function getExchange(companyId: string, exchangeId: string): PactExchange | null {
  return localGetPactExchange(companyId, exchangeId);
}

export function beginExchange(
  companyId: string,
  input: Parameters<typeof localCreatePactExchange>[1]
): PactExchange {
  return localCreatePactExchange(companyId, input);
}

export async function beginExchangePersisted(
  ctx: ExportAuthContext,
  input: Parameters<typeof localCreatePactExchange>[1]
): Promise<PactExchange> {
  return persistCreatePactExchange(ctx, input);
}

export function completeExchange(
  companyId: string,
  exchangeId: string,
  patch: {
    status: PactExchange["status"];
    httpStatus?: number | null;
    errorCode?: string | null;
    errorDetail?: string | null;
    footprintId?: string | null;
    supplierPcfRecordId?: string | null;
    responsePayload?: Record<string, unknown> | null;
  }
): PactExchange {
  return localUpdatePactExchange(companyId, exchangeId, {
    ...patch,
    completedAt: new Date().toISOString(),
  });
}

export async function completeExchangePersisted(
  ctx: ExportAuthContext,
  exchangeId: string,
  patch: {
    status: PactExchange["status"];
    httpStatus?: number | null;
    errorCode?: string | null;
    errorDetail?: string | null;
    footprintId?: string | null;
    supplierPcfRecordId?: string | null;
    responsePayload?: Record<string, unknown> | null;
  }
): Promise<PactExchange> {
  return persistUpdatePactExchange(ctx, exchangeId, {
    ...patch,
    completedAt: new Date().toISOString(),
  });
}

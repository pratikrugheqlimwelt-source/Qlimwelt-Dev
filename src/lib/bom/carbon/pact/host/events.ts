/**
 * PACT V3 Phase 6 — Events intake stub (CloudEvents structured mode).
 */

import { beginExchange, completeExchange } from "../exchange/service";
import type { PactExchangeKind } from "../types";

export type PactCloudEvent = {
  type?: string;
  id?: string;
  source?: string;
  specversion?: string;
  data?: unknown;
  [key: string]: unknown;
};

function mapEventKind(type: string | undefined): PactExchangeKind {
  const t = (type || "").toLowerCase();
  if (t.includes("fulfilled")) return "event_fulfilled";
  if (t.includes("rejected")) return "event_rejected";
  if (t.includes("published")) return "event_published";
  return "event_request_created";
}

export function acceptHostEvent(
  companyId: string,
  event: PactCloudEvent,
  options?: { idempotencyKey?: string }
): { exchangeId: string; kind: PactExchangeKind } {
  if (!event || typeof event !== "object") {
    throw Object.assign(new Error("Invalid CloudEvent body"), {
      code: "BadRequest",
      status: 400,
    });
  }
  if (!event.type || typeof event.type !== "string") {
    throw Object.assign(new Error("CloudEvent type is required"), {
      code: "BadRequest",
      status: 400,
    });
  }

  const kind = mapEventKind(event.type);
  const idempotencyKey =
    options?.idempotencyKey ||
    `event:${event.type}:${event.id || "anon"}:${companyId}`;

  const exchange = beginExchange(companyId, {
    direction: "inbound",
    kind,
    idempotencyKey,
    correlationId: typeof event.id === "string" ? event.id : null,
    requestPayload: event as Record<string, unknown>,
  });

  completeExchange(companyId, exchange.id, {
    status: "completed",
    httpStatus: 200,
    responsePayload: { accepted: true },
  });

  return { exchangeId: exchange.id, kind };
}

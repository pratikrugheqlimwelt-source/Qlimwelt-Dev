/**
 * PACT V3 Phase 6 — outbound peer client helpers (no auto network).
 * Use baseUrl `local:<companyId>` to hit the in-process host catalog (tests/demo).
 */

import type { PactProductFootprintV3 } from "../wire-types";
import { issueClientCredentialsToken } from "./auth";
import {
  getHostedProductFootprint,
  listHostedProductFootprints,
} from "./catalog";

export type PactPeerClientConfig = {
  baseUrl: string;
  accessToken: string;
};

export async function fetchPeerAccessToken(input: {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  companyId?: string;
}): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}> {
  if (!input.tokenUrl || input.tokenUrl === "local:" || input.tokenUrl.startsWith("local:")) {
    return issueClientCredentialsToken({
      clientId: input.clientId,
      clientSecret: input.clientSecret,
      scope: input.scope,
      companyId: input.companyId,
    });
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: input.clientId,
    client_secret: input.clientSecret,
  });
  if (input.scope) body.set("scope", input.scope);

  const res = await fetch(input.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token request failed: HTTP ${res.status}`);
  return (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope?: string;
  };
}

export async function listPeerFootprints(
  config: PactPeerClientConfig,
  filter?: { productId?: string[]; limit?: number; status?: string }
): Promise<PactProductFootprintV3[]> {
  if (config.baseUrl.startsWith("local:")) {
    const companyId = config.baseUrl.slice("local:".length) || "co-pact-host";
    return listHostedProductFootprints(companyId, {
      productId: filter?.productId,
      limit: filter?.limit,
      status: filter?.status,
    });
  }

  const params = new URLSearchParams();
  if (filter?.limit != null) params.set("limit", String(filter.limit));
  if (filter?.status) params.set("status", filter.status);
  for (const id of filter?.productId ?? []) params.append("productId", id);
  const qs = params.toString();
  const url = `${config.baseUrl.replace(/\/$/, "")}/3/footprints${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${config.accessToken}` },
  });
  if (!res.ok) throw new Error(`ListFootprints failed: HTTP ${res.status}`);
  const json = (await res.json()) as { data?: PactProductFootprintV3[] };
  return json.data ?? [];
}

export async function getPeerFootprint(
  config: PactPeerClientConfig,
  footprintId: string
): Promise<PactProductFootprintV3 | null> {
  if (config.baseUrl.startsWith("local:")) {
    const companyId = config.baseUrl.slice("local:".length) || "co-pact-host";
    return getHostedProductFootprint(companyId, footprintId);
  }

  const url = `${config.baseUrl.replace(/\/$/, "")}/3/footprints/${encodeURIComponent(footprintId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${config.accessToken}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GetFootprint failed: HTTP ${res.status}`);
  const json = (await res.json()) as { data?: PactProductFootprintV3 };
  return json.data ?? null;
}

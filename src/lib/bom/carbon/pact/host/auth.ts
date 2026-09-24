/**
 * PACT V3 Phase 6 — OAuth2 client_credentials stub (local/demo only).
 * Not a production IdP; tokens are opaque signed stubs for host route guards.
 */

export const PACT_HOST_DEFAULT_CLIENT_ID = "pact-demo-client";
export const PACT_HOST_DEFAULT_CLIENT_SECRET = "pact-demo-secret";
export const PACT_HOST_DEFAULT_COMPANY_ID = "co-pact-host";
export const PACT_HOST_TOKEN_TTL_SECONDS = 3600;

export type PactHostTokenClaims = {
  sub: string;
  companyId: string;
  scope: string;
  iat: number;
  exp: number;
};

function hostClientId() {
  return process.env.PACT_HOST_CLIENT_ID || PACT_HOST_DEFAULT_CLIENT_ID;
}

function hostClientSecret() {
  return process.env.PACT_HOST_CLIENT_SECRET || PACT_HOST_DEFAULT_CLIENT_SECRET;
}

function hostCompanyId() {
  return process.env.PACT_HOST_COMPANY_ID || PACT_HOST_DEFAULT_COMPANY_ID;
}

function b64url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input: string): string {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

function sign(payloadB64: string, secret: string): string {
  let h = 0;
  const s = `${payloadB64}.${secret}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return b64url(String(h));
}

export function issueClientCredentialsToken(input: {
  clientId: string;
  clientSecret: string;
  scope?: string;
  companyId?: string;
}): {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  scope: string;
} {
  if (input.clientId !== hostClientId() || input.clientSecret !== hostClientSecret()) {
    const err = new Error("invalid_client");
    Object.assign(err, { oauthError: "invalid_client", status: 401 });
    throw err;
  }
  const now = Math.floor(Date.now() / 1000);
  const scope = (input.scope || "footprint:list footprint:read").trim();
  const claims: PactHostTokenClaims = {
    sub: input.clientId,
    companyId: input.companyId?.trim() || hostCompanyId(),
    scope,
    iat: now,
    exp: now + PACT_HOST_TOKEN_TTL_SECONDS,
  };
  const payload = b64url(JSON.stringify(claims));
  const sig = sign(payload, hostClientSecret());
  return {
    access_token: `pact1.${payload}.${sig}`,
    token_type: "bearer",
    expires_in: PACT_HOST_TOKEN_TTL_SECONDS,
    scope,
  };
}

export function verifyAccessToken(token: string): PactHostTokenClaims | null {
  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts[0] !== "pact1") return null;
  const [, payload, sig] = parts;
  if (sign(payload, hostClientSecret()) !== sig) return null;
  try {
    const claims = JSON.parse(fromB64url(payload)) as PactHostTokenClaims;
    if (!claims?.companyId || !claims.exp) return null;
    if (claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

export function requireBearerAuth(
  authorization: string | null
):
  | { ok: true; claims: PactHostTokenClaims }
  | { ok: false; status: number; body: { code: string; message: string } } {
  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return {
      ok: false,
      status: 401,
      body: { code: "AccessDenied", message: "Missing or invalid Authorization header" },
    };
  }
  const claims = verifyAccessToken(authorization.slice(7).trim());
  if (!claims) {
    return {
      ok: false,
      status: 401,
      body: { code: "TokenExpired", message: "Access token invalid or expired" },
    };
  }
  return { ok: true, claims };
}

export function hasScope(claims: PactHostTokenClaims, required: string): boolean {
  const scopes = new Set(claims.scope.split(/\s+/).filter(Boolean));
  return scopes.has(required) || scopes.has("openid");
}

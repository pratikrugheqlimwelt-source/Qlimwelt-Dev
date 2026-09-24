/**
 * PACT product / company identifier URN helpers.
 * Matching is always exact — never silent fuzzy assign.
 */

export type ParsedUrn = {
  raw: string;
  kind: "product" | "company" | "unknown";
  scheme?: string;
  value?: string;
};

const URN_PREFIX = /^urn:/i;

export function isUrn(value: string): boolean {
  return URN_PREFIX.test(value.trim());
}

/** OpenAPI Urn pattern: must start with urn: (case-insensitive). */
export function assertUrn(value: string): string {
  const v = value.trim();
  if (!isUrn(v)) {
    throw new Error(`Not a URN: ${value}`);
  }
  return v;
}

/** Custom product: urn:pathfinder:product:custom:{namespace}:{value} */
export function buildCustomProductUrn(namespace: string, value: string): string {
  const ns = namespace.trim();
  const v = value.trim();
  if (!ns || !v) throw new Error("namespace and value required for custom URN");
  return `urn:pathfinder:product:custom:${encodeURIComponent(ns)}:${encodeURIComponent(v)}`;
}

/** Company: urn:pathfinder:company:{scheme}:{value} */
export function buildCompanyUrn(scheme: string, value: string): string {
  const s = scheme.trim();
  const v = value.trim();
  if (!s || !v) throw new Error("scheme and value required for company URN");
  return `urn:pathfinder:company:${encodeURIComponent(s)}:${encodeURIComponent(v)}`;
}

/** GTIN product: urn:pathfinder:product:id:gtin:{digits} */
export function buildGtinProductUrn(gtin: string): string {
  const digits = gtin.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 14) {
    throw new Error("GTIN must be 8–14 digits");
  }
  return `urn:pathfinder:product:id:gtin:${digits}`;
}

export function parsePactUrn(raw: string): ParsedUrn {
  const urn = raw.trim();
  if (!isUrn(urn)) {
    return { raw: urn, kind: "unknown" };
  }
  const productMatch = /^urn:pathfinder:product:([^:]+):(.+)$/i.exec(urn);
  if (productMatch) {
    return {
      raw: urn,
      kind: "product",
      scheme: decodeURIComponent(productMatch[1]),
      value: decodeURIComponent(productMatch[2]),
    };
  }
  const companyMatch = /^urn:pathfinder:company:([^:]+):(.+)$/i.exec(urn);
  if (companyMatch) {
    return {
      raw: urn,
      kind: "company",
      scheme: decodeURIComponent(companyMatch[1]),
      value: decodeURIComponent(companyMatch[2]),
    };
  }
  return { raw: urn, kind: "unknown" };
}

export function normalizeUrnList(ids: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const u = assertUrn(id);
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

/**
 * Phase 3a URN helpers (minimal parse/build; full PACT § forms in 3b).
 */

export function buildCustomProductUrn(namespace: string, value: string): string {
  const ns = namespace.trim();
  const v = value.trim();
  if (!ns || !v) throw new Error("namespace and value required for custom URN");
  return `urn:pathfinder:product:custom:${encodeURIComponent(ns)}:${encodeURIComponent(v)}`;
}

export function buildCompanyUrn(scheme: string, value: string): string {
  const s = scheme.trim();
  const v = value.trim();
  if (!s || !v) throw new Error("scheme and value required for company URN");
  return `urn:pathfinder:company:${encodeURIComponent(s)}:${encodeURIComponent(v)}`;
}

export type ParsedUrn = {
  raw: string;
  kind: "product" | "company" | "unknown";
  scheme?: string;
  value?: string;
};

export function parsePactUrn(raw: string): ParsedUrn {
  const urn = raw.trim();
  if (!urn.startsWith("urn:")) {
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

/**
 * Phase 3a identity mapping service — thin local CRUD; fuzzy match forbidden.
 */

import {
  localCreateProductIdentityMapping,
  localListProductIdentityMappings,
} from "../store";
import type { ProductIdentityMapping } from "../types";
import { parsePactUrn } from "./urn";

export function listIdentityMappings(
  companyId: string,
  filter?: { productId?: string; bomItemId?: string }
): ProductIdentityMapping[] {
  return localListProductIdentityMappings(companyId, filter);
}

export function findExactConfirmedByUrn(
  companyId: string,
  urn: string
): ProductIdentityMapping | null {
  const normalized = urn.trim();
  return (
    localListProductIdentityMappings(companyId).find(
      (m) => m.urn === normalized && m.status === "confirmed"
    ) ?? null
  );
}

export function listCandidatesForUrn(
  companyId: string,
  urn: string
): ProductIdentityMapping[] {
  const parsed = parsePactUrn(urn);
  return localListProductIdentityMappings(companyId).filter((m) => {
    if (m.urn === urn.trim()) return true;
    if (parsed.value && m.value === parsed.value) return m.status === "candidate";
    return false;
  });
}

export function createManualIdentityMapping(
  companyId: string,
  input: {
    productId?: string | null;
    bomItemId?: string | null;
    scheme: ProductIdentityMapping["scheme"];
    value: string;
    urn: string;
    status?: ProductIdentityMapping["status"];
  }
): ProductIdentityMapping {
  return localCreateProductIdentityMapping(companyId, {
    ...input,
    source: "manual",
  });
}

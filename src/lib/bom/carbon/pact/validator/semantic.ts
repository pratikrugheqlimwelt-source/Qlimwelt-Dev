/**
 * Export semantic / business rules (Layer 2) for PACT ProductFootprint.
 */

import { isUrn } from "../identity/urn";
import type { PactValidationIssue, PactValidationResult } from "../types";
import type { PactProductFootprintV3 } from "../wire-types";

function issue(
  path: string,
  message: string,
  category: PactValidationIssue["category"] = "SEMANTIC_INVALID"
): PactValidationIssue {
  return { path, message, category };
}

export function validateExportSemantics(
  footprint: PactProductFootprintV3
): PactValidationResult {
  const issues: PactValidationIssue[] = [];

  if (!footprint.companyIds?.length) {
    issues.push(issue("companyIds", "companyIds must be a non-empty URN set"));
  } else {
    for (const [i, id] of footprint.companyIds.entries()) {
      if (!isUrn(id)) {
        issues.push(issue(`companyIds[${i}]`, "companyIds entries must be URNs"));
      }
    }
  }

  if (!footprint.productIds?.length) {
    issues.push(issue("productIds", "productIds must be a non-empty URN set"));
  } else {
    for (const [i, id] of footprint.productIds.entries()) {
      if (!isUrn(id)) {
        issues.push(issue(`productIds[${i}]`, "productIds entries must be URNs"));
      }
    }
  }

  const start = Date.parse(footprint.pcf.referencePeriodStart);
  const end = Date.parse(footprint.pcf.referencePeriodEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    issues.push(
      issue(
        "pcf.referencePeriod",
        "referencePeriodStart/End must be valid date-times"
      )
    );
  } else if (end < start) {
    issues.push(
      issue(
        "pcf.referencePeriodEnd",
        "referencePeriodEnd must be on or after referencePeriodStart"
      )
    );
  }

  if (!footprint.pcf.crossSectoralStandards?.length) {
    issues.push(
      issue(
        "pcf.crossSectoralStandards",
        "At least one cross-sectoral standard is required"
      )
    );
  }

  if (footprint.status !== "Active" && footprint.status !== "Deprecated") {
    issues.push(issue("status", `Invalid status ${String(footprint.status)}`));
  }

  return { ok: issues.length === 0, issues };
}

/** Kept for Phase 4 import path. */
export function validateImportSemantics(_ctx: {
  productIds: string[];
  declaredUnit?: string | null;
}): PactValidationResult {
  return {
    ok: false,
    issues: [
      {
        path: "",
        message: "Semantic import validator not implemented (Phase 4)",
        category: "NOT_IMPLEMENTED",
      },
    ],
  };
}

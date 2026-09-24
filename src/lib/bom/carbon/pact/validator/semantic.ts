/**
 * Phase 3a stubs — semantic / business rules in Phase 3b–4.
 */

import type { PactValidationResult } from "../types";

export function validateExportSemantics(_ctx: {
  calculationId: string;
  companyIds: string[];
  productIds: string[];
}): PactValidationResult {
  return {
    ok: false,
    issues: [
      {
        path: "",
        message: "Semantic export validator not implemented (Phase 3b)",
        category: "NOT_IMPLEMENTED",
      },
    ],
  };
}

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

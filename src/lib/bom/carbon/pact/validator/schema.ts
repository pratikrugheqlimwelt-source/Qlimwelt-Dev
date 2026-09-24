/**
 * Phase 3a stubs — implemented in Phase 3b+ against pinned OpenAPI 3.0.3.
 */

import type { PactValidationResult } from "../types";

export function validateProductFootprintSchema(
  _payload: unknown
): PactValidationResult {
  return {
    ok: false,
    issues: [
      {
        path: "",
        message: "Schema validator not implemented (Phase 3b)",
        category: "NOT_IMPLEMENTED",
      },
    ],
  };
}

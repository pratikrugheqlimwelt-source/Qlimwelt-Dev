/**
 * Local PACT V3 export orchestration — map, validate, log exchange.
 */

import { loadBomLocal, updateBomLocal } from "../../local-store";
import { localGetCalculation } from "../local-service";
import { beginExchange, completeExchange } from "./exchange/service";
import { toProductFootprint } from "./mapper/to-product-footprint";
import type { PactValidationResult } from "./types";
import { validateProductFootprintSchema } from "./validator/schema";
import { validateExportSemantics } from "./validator/semantic";
import type { PactProductFootprintV3 } from "./wire-types";

export type PactExportBundle = {
  footprint: PactProductFootprintV3;
  exchangeId: string;
  schema: PactValidationResult;
  semantics: PactValidationResult;
};

export function localExportPactV3(
  companyId: string,
  calculationId: string,
  options?: { companyName?: string | null; idempotencyKey?: string }
): PactExportBundle {
  const calculation = localGetCalculation(companyId, calculationId);
  if (!calculation) {
    const err = new Error("Calculation not found");
    Object.assign(err, {
      issues: [
        {
          path: "calculationId",
          message: "Calculation not found",
          category: "NOT_FOUND" as const,
        },
      ],
    });
    throw err;
  }

  const state = loadBomLocal(companyId);
  const product =
    (calculation.productId
      ? state.products.find((p) => p.id === calculation.productId) ?? null
      : null) ?? null;

  const exchange = beginExchange(companyId, {
    direction: "outbound",
    kind: "export",
    idempotencyKey:
      options?.idempotencyKey ||
      `export:${calculationId}:${calculation.pactFootprintId || calculation.id}`,
    calculationId,
    requestPayload: { calculationId },
  });

  const mapped = toProductFootprint({
    companyId,
    companyName: options?.companyName ?? null,
    calculation,
    product,
  });

  if (!mapped.ok) {
    completeExchange(companyId, exchange.id, {
      status: "failed",
      httpStatus: 422,
      errorCode: "SEMANTIC_INVALID",
      errorDetail: mapped.result.issues.map((i) => i.message).join("; "),
      responsePayload: { issues: mapped.result.issues },
    });
    const err = new Error(
      mapped.result.issues.map((i) => i.message).join("; ") || "Export rejected"
    );
    Object.assign(err, { issues: mapped.result.issues, exchangeId: exchange.id });
    throw err;
  }

  if (!calculation.pactFootprintId) {
    updateBomLocal(companyId, (s) => ({
      ...s,
      pcfCalculations: s.pcfCalculations.map((c) =>
        c.id === calculationId
          ? { ...c, pactFootprintId: mapped.footprint.id }
          : c
      ),
    }));
  }

  const schema = validateProductFootprintSchema(mapped.footprint);
  if (!schema.ok) {
    completeExchange(companyId, exchange.id, {
      status: "failed",
      httpStatus: 422,
      errorCode: "SCHEMA_INVALID",
      errorDetail: schema.issues.map((i) => i.message).join("; "),
      footprintId: mapped.footprint.id,
      responsePayload: { issues: schema.issues, footprint: mapped.footprint },
    });
    const err = new Error(
      schema.issues.map((i) => i.message).join("; ") || "Schema validation failed"
    );
    Object.assign(err, { issues: schema.issues, exchangeId: exchange.id });
    throw err;
  }

  const semantics = validateExportSemantics(mapped.footprint);
  if (!semantics.ok) {
    completeExchange(companyId, exchange.id, {
      status: "failed",
      httpStatus: 422,
      errorCode: "SEMANTIC_INVALID",
      errorDetail: semantics.issues.map((i) => i.message).join("; "),
      footprintId: mapped.footprint.id,
      responsePayload: { issues: semantics.issues, footprint: mapped.footprint },
    });
    const err = new Error(
      semantics.issues.map((i) => i.message).join("; ") || "Semantic validation failed"
    );
    Object.assign(err, { issues: semantics.issues, exchangeId: exchange.id });
    throw err;
  }

  completeExchange(companyId, exchange.id, {
    status: "completed",
    httpStatus: 200,
    footprintId: mapped.footprint.id,
    responsePayload: mapped.footprint as unknown as Record<string, unknown>,
  });

  return {
    footprint: mapped.footprint,
    exchangeId: exchange.id,
    schema,
    semantics,
  };
}

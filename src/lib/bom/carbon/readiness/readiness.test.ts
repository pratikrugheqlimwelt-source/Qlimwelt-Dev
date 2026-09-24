/**
 * BOM Phase 9 readiness adapter tests — run: npm run test:bom:readiness
 */
import { clearBomLocal, newEntityId, updateBomLocal } from "@/lib/bom/local-store";
import type { BomItem, Product } from "@/lib/bom/types";
import {
  ensureCarbonLibrary,
  localApproveCalculation,
  localApproveMapping,
  localAssessExchangeReadiness,
  localExportReadiness,
  localGetCalculation,
  localRunCalculation,
  localUpsertMapping,
} from "../index";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const companyId = "co-phase9-readiness";
clearBomLocal(companyId);

const { factors } = ensureCarbonLibrary(companyId);
const steel = factors.find((f) => f.factorCode === "STEEL_CRUDE");
assert(steel, "demo steel factor present");

const productId = newEntityId("prod");
const bomId = "bom-ready-1";
const rootId = newEntityId("item");
const steelId = newEntityId("item");
const now = new Date().toISOString();

const product: Product = {
  id: productId,
  companyId,
  productNumber: "WIDGET-9",
  name: "Phase 9 Widget",
  description: "Readiness demo product",
  category: "machinery",
  declaredUnit: "piece",
  status: "active",
  createdAt: now,
  updatedAt: now,
};

function item(
  partial: Partial<BomItem> & {
    id: string;
    partNumber: string;
    parentItemId: string | null;
  }
): BomItem {
  return {
    companyId,
    bomId,
    description: partial.partNumber,
    itemType: "material",
    quantity: 1,
    unit: "kg",
    scrapRate: 0,
    yieldRate: 1,
    sequenceNo: 0,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

updateBomLocal(companyId, (s) => ({
  ...s,
  products: [...s.products, product],
  items: [
    item({
      id: rootId,
      partNumber: "WIDGET-9",
      parentItemId: null,
      itemType: "product",
      unit: "piece",
      quantity: 1,
    }),
    item({
      id: steelId,
      partNumber: "STEEL_CRUDE",
      parentItemId: rootId,
      quantity: 2,
      sequenceNo: 1,
    }),
  ],
}));

const mapping = localUpsertMapping(companyId, {
  bomItemId: steelId,
  emissionFactorId: steel!.id,
  confidence: 0.9,
  status: "suggested",
});
localApproveMapping(companyId, mapping.id);

const calc = localRunCalculation(companyId, {
  bomId,
  productId,
  requireApproved: true,
});
assert(calc.status === "completed", "calc completed");
assert(calc.totalKgco2e > 0, "has footprint");

const before = localAssessExchangeReadiness(companyId, calc.id);
assert(before.overall === "fail", "unapproved overall fail");
assert(
  before.checks.some((c) => c.id === "approval" && c.status === "fail"),
  "approval check fails before approve"
);

const approved = localApproveCalculation(companyId, calc.id, {
  approvedBy: "reviewer-9",
});
assert(approved.approvalStatus === "approved", "approved");

const after = localAssessExchangeReadiness(companyId, approved.id);
assert(
  after.checks.find((c) => c.id === "approval")?.status === "pass",
  "approval check pass"
);
assert(
  after.checks.find((c) => c.id === "product_identity")?.status === "pass",
  "product identity pass"
);

const pact = localExportReadiness(companyId, approved.id, "pact");
assert(pact.format === "pact", "pact format");
assert("pcf" in pact.payload, "pact has pcf");
const pactPayload = pact.payload as {
  pcf: { pCfExcludingBiogenic: number };
  status: string;
};
assert(pactPayload.pcf.pCfExcludingBiogenic === approved.totalKgco2e, "pact value matches");
assert(pactPayload.status === "Active", "approved non-stale is Active");

const catena = localExportReadiness(companyId, approved.id, "catena_x");
assert(catena.format === "catena_x", "catena format");
const cx = catena.payload as {
  spec: string;
  pcf: { carbonFootprint: number };
  approval: { status: string };
};
assert(cx.spec === "catena-x-pcf-readiness", "catena spec");
assert(cx.pcf.carbonFootprint === approved.totalKgco2e, "catena value");
assert(cx.approval.status === "approved", "catena approval");

const dpp = localExportReadiness(companyId, approved.id, "dpp");
assert(dpp.format === "dpp", "dpp format");
const dppPayload = dpp.payload as {
  spec: string;
  carbon: { pcfKgco2e: number };
  missingForFullDpp: string[];
};
assert(dppPayload.spec === "dpp-readiness", "dpp spec");
assert(dppPayload.carbon.pcfKgco2e === approved.totalKgco2e, "dpp value");
assert(dppPayload.missingForFullDpp.length > 0, "dpp lists gaps for full passport");

const still = localGetCalculation(companyId, approved.id);
assert(still?.totalKgco2e === approved.totalKgco2e, "total unchanged");
assert(still?.approvalStatus === "approved", "approval unchanged");

console.log("readiness.test.ts: all assertions passed");

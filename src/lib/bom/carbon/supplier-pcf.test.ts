/**
 * BOM Phase 7 supplier PCF portal tests — run: npm run test:bom:supplier-pcf
 */
import { clearBomLocal, newEntityId, updateBomLocal } from "@/lib/bom/local-store";
import type { BomItem } from "@/lib/bom/types";
import {
  canTransitionSupplierPcf,
  ensureCarbonLibrary,
  localApproveSupplierPcfRequest,
  localCancelSupplierPcfRequest,
  localCreateSupplierPcfRequest,
  localGetSupplierPcfByToken,
  localGetSupplierPcfRequest,
  localListMappings,
  localListFactors,
  localRejectSupplierPcfRequest,
  localRunCalculation,
  localSendSupplierPcfRequest,
  localSubmitSupplierPcfByToken,
  localUpsertMapping,
} from "./index";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const companyId = "co-phase7-supplier-pcf";
clearBomLocal(companyId);

const { factors } = ensureCarbonLibrary(companyId);
const steel = factors.find((f) => f.factorCode === "STEEL_CRUDE");
assert(steel, "demo steel factor present");

const bomId = "bom-spc-1";
const rootId = newEntityId("item");
const steelId = newEntityId("item");
const now = new Date().toISOString();

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
  items: [
    item({
      id: rootId,
      partNumber: "PROD",
      parentItemId: null,
      itemType: "product",
      unit: "piece",
      quantity: 1,
    }),
    item({ id: steelId, partNumber: "STEEL_CRUDE", parentItemId: rootId, quantity: 2, sequenceNo: 1 }),
  ],
}));

localUpsertMapping(companyId, {
  bomItemId: steelId,
  emissionFactorId: steel!.id,
  confidence: 0.8,
  status: "approved",
  method: "qty_x_ef",
});

const baseline = localRunCalculation(companyId, {
  bomId,
  requireApproved: true,
});
assert(baseline.status === "completed", "baseline calc ok");
const baselineTotal = baseline.totalKgco2e;
assert(Math.abs(baselineTotal - 2 * steel!.valueKgco2e) < 1e-9, "baseline = 2 × steel EF");

assert(canTransitionSupplierPcf("draft", "sent"), "draft→sent");
assert(!canTransitionSupplierPcf("draft", "approved"), "draft cannot approve");

const draft = localCreateSupplierPcfRequest(companyId, {
  bomId,
  bomItemId: steelId,
  supplierName: "MetalWorks SA",
  supplierEmail: "pcf@metalworks.example",
  message: "Need 2024 cradle-to-gate PCF",
});
assert(draft.status === "draft", "starts draft");
assert(draft.accessToken.startsWith("spc-"), "token minted");
assert(draft.partNumber === "STEEL_CRUDE", "part stamped from item");

const sent = localSendSupplierPcfRequest(companyId, draft.id);
assert(sent.status === "sent", "sent");

const portal = localGetSupplierPcfByToken(sent.accessToken);
assert(portal, "token resolves");
assert(portal!.portal.canSubmit, "portal can submit");
assert(portal!.portal.partNumber === "STEEL_CRUDE", "portal shows part");

const submittedView = localSubmitSupplierPcfByToken(sent.accessToken, {
  declaredKgco2ePerUnit: 1.2,
  declaredUnit: "kg",
  methodology: "ISO 14067",
  evidenceNotes: "LCA-2024-STEEL",
});
assert(submittedView.status === "submitted", "submitted");
assert(submittedView.declaredKgco2ePerUnit === 1.2, "value stored");

const preApproveMaps = localListMappings(companyId, bomId);
const steelMapBefore = preApproveMaps.find((m) => m.bomItemId === steelId);
assert(steelMapBefore?.emissionFactorId === steel!.id, "baseline mapping unchanged before approve");
assert(steelMapBefore?.method === "qty_x_ef", "method still qty_x_ef before approve");

const approved = localApproveSupplierPcfRequest(companyId, draft.id, {
  reviewedBy: "reviewer-1",
  reviewNotes: "Verified LCA pack",
});
assert(approved.status === "approved", "approved");
assert(approved.resultingFactorId, "factor created");
assert(approved.resultingMappingId, "mapping linked");

const maps = localListMappings(companyId, bomId);
const steelMap = maps.find((m) => m.bomItemId === steelId);
assert(steelMap, "mapping present");
assert(steelMap!.method === "supplier_pcf", "method supplier_pcf");
assert(steelMap!.status === "approved", "mapping approved");
assert(steelMap!.emissionFactorId === approved.resultingFactorId, "points at synthetic EF");

const factorsAfter = localListFactors(companyId);
const synth = factorsAfter.find((f) => f.id === approved.resultingFactorId);
assert(synth, "synthetic factor exists");
assert(synth!.valueKgco2e === 1.2, "factor value = declared");
assert(synth!.activityUnit === "kg", "factor unit");
assert(synth!.category === "supplier_pcf", "category stamped");

const after = localRunCalculation(companyId, { bomId, requireApproved: true });
assert(after.status === "completed", "recalc ok");
assert(Math.abs(after.totalKgco2e - 2 * 1.2) < 1e-9, "calc uses supplier primary (still qty×EF)");
assert(Math.abs(after.totalKgco2e - baselineTotal) > 0.01, "total changed vs secondary baseline");

const ledgerEntry = after.ledger?.find((e) => e.bomItemId === steelId);
assert(ledgerEntry?.method === "supplier_pcf", "ledger method reflects supplier_pcf");

const draft2 = localCreateSupplierPcfRequest(companyId, {
  bomId,
  bomItemId: steelId,
  supplierName: "ChemBase AG",
});
const sent2 = localSendSupplierPcfRequest(companyId, draft2.id);
localSubmitSupplierPcfByToken(sent2.accessToken, {
  declaredKgco2ePerUnit: 9.9,
  declaredUnit: "kg",
});

const rejected = localRejectSupplierPcfRequest(companyId, draft2.id, {
  reviewedBy: "reviewer-1",
  reviewNotes: "Boundary incomplete",
});
assert(rejected.status === "rejected", "rejected");
assert(
  localGetSupplierPcfRequest(companyId, draft2.id)?.status === "rejected",
  "persisted rejected"
);

const draft3 = localCreateSupplierPcfRequest(companyId, {
  bomId,
  bomItemId: steelId,
  supplierName: "Temp Co",
});
const cancelled = localCancelSupplierPcfRequest(companyId, draft3.id);
assert(cancelled.status === "cancelled", "cancelled");

let threw = false;
try {
  localSubmitSupplierPcfByToken(cancelled.accessToken, {
    declaredKgco2ePerUnit: 1,
    declaredUnit: "kg",
  });
} catch {
  threw = true;
}
assert(threw, "cancelled token cannot submit");

console.log("supplier-pcf.test.ts: all assertions passed");

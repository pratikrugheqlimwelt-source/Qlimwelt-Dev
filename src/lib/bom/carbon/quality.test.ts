/**
 * BOM Phase 1C — DQ, stale, approval, audit tests
 * run: npx tsx src/lib/bom/carbon/quality.test.ts
 */
import { clearBomLocal, newEntityId, updateBomLocal } from "@/lib/bom/local-store";
import type { BomItem } from "@/lib/bom/types";
import {
  detectStaleCalculation,
  ensureCarbonLibrary,
  listAuditEvents,
  localApproveCalculation,
  localApproveMapping,
  localRefreshStaleFlags,
  localRejectCalculation,
  localRunCalculation,
  localUpsertMapping,
  scoreCalculationQuality,
} from "./index";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const companyId = "co-1c-test";
clearBomLocal(companyId);

const { factors } = ensureCarbonLibrary(companyId);
const steel = factors.find((f) => f.factorCode === "STEEL_CRUDE");
assert(steel, "steel factor");

const rootId = newEntityId("item");
const childId = newEntityId("item");
const bomId = "bom-1c";
const now = new Date().toISOString();

updateBomLocal(companyId, (s) => ({
  ...s,
  items: [
    {
      id: rootId,
      companyId,
      bomId,
      parentItemId: null,
      partNumber: "PROD",
      description: "Product",
      itemType: "product",
      quantity: 1,
      unit: "piece",
      scrapRate: 0,
      yieldRate: 1,
      sequenceNo: 0,
      createdAt: now,
      updatedAt: now,
    } satisfies BomItem,
    {
      id: childId,
      companyId,
      bomId,
      parentItemId: rootId,
      partNumber: "STEEL_CRUDE",
      description: "Steel crude",
      itemType: "material",
      quantity: 2,
      unit: "kg",
      scrapRate: 0,
      yieldRate: 1,
      sequenceNo: 1,
      createdAt: now,
      updatedAt: now,
    } satisfies BomItem,
  ],
}));

const mapping = localUpsertMapping(companyId, {
  bomItemId: childId,
  emissionFactorId: steel!.id,
  confidence: 0.9,
  matchReason: "test",
  status: "suggested",
});
localApproveMapping(companyId, mapping.id);

const dq = scoreCalculationQuality({
  items: [
    {
      id: childId,
      companyId,
      bomId,
      parentItemId: rootId,
      partNumber: "STEEL_CRUDE",
      description: "Steel crude",
      itemType: "material",
      quantity: 2,
      unit: "kg",
      scrapRate: 0,
      yieldRate: 1,
      sequenceNo: 1,
      createdAt: now,
      updatedAt: now,
    },
  ],
  mappings: [{ ...mapping, status: "approved" }],
  factors,
});
assert(dq.overall > 0, "DQ overall > 0");
assert(dq.temporal >= 0 && dq.temporal <= 1, "temporal in range");
assert(dq.geo >= 0 && dq.geo <= 1, "geo in range");
assert(dq.tech >= 0 && dq.tech <= 1, "tech in range");

const calc = localRunCalculation(companyId, { bomId, requireApproved: true });
assert(calc.approvalStatus === "pending", "calc starts pending approval");
assert(calc.isStale === false, "fresh calc not stale");
assert(calc.dq && calc.dq.overall > 0, "calc has DQ");
assert(!!calc.bomFingerprint && !!calc.mappingFingerprint, "fingerprints present");

const approved = localApproveCalculation(companyId, calc.id, {
  approvedBy: "tester",
  notes: "looks good",
});
assert(approved.approvalStatus === "approved", "approved");
assert(approved.approvedBy === "tester", "approver set");

// Change BOM qty → stale
updateBomLocal(companyId, (s) => ({
  ...s,
  items: s.items.map((i) =>
    i.id === childId ? { ...i, quantity: 3, updatedAt: new Date().toISOString() } : i
  ),
}));
const staleCheck = detectStaleCalculation(
  approved,
  [
    {
      id: rootId,
      companyId,
      bomId,
      parentItemId: null,
      partNumber: "PROD",
      description: "Product",
      itemType: "product",
      quantity: 1,
      unit: "piece",
      scrapRate: 0,
      yieldRate: 1,
      sequenceNo: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: childId,
      companyId,
      bomId,
      parentItemId: rootId,
      partNumber: "STEEL_CRUDE",
      description: "Steel crude",
      itemType: "material",
      quantity: 3,
      unit: "kg",
      scrapRate: 0,
      yieldRate: 1,
      sequenceNo: 1,
      createdAt: now,
      updatedAt: now,
    },
  ],
  [{ ...mapping, status: "approved" }]
);
assert(staleCheck.isStale, "qty change marks stale");
assert(staleCheck.reason && /BOM/i.test(staleCheck.reason), "stale reason mentions BOM");

const refreshed = localRefreshStaleFlags(companyId, bomId);
assert(refreshed.some((c) => c.id === calc.id && c.isStale), "refresh flags calc stale");

let blocked = false;
try {
  localApproveCalculation(companyId, calc.id, { approvedBy: "tester" });
} catch {
  blocked = true;
}
assert(blocked, "cannot re-approve stale calculation");

const rejected = localRunCalculation(companyId, { bomId, requireApproved: true });
localRejectCalculation(companyId, rejected.id, { notes: "needs better factors" });

const events = listAuditEvents(companyId, { limit: 20 });
assert(events.length >= 3, `expected audit events, got ${events.length}`);
assert(
  events.some((e) => e.action === "calculated" || e.action === "calc_approved" || e.action === "marked_stale"),
  "audit contains calc lifecycle actions"
);

clearBomLocal(companyId);
console.log("BOM Phase 1C quality/audit tests passed.");

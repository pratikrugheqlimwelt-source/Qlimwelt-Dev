import { buildBomTree } from "@/lib/bom/graph";
import { newEntityId } from "@/lib/bom/local-store";
import type { BomItem, BomTreeNode } from "@/lib/bom/types";
import { convertBomUnit, inputQuantityAfterScrap } from "@/lib/bom/units";
import { isMappingUsable } from "./mapping";
import type {
  CalculateBomInput,
  CarbonLedgerEntry,
  CarbonMapping,
  EmissionFactor,
  MappingMethod,
  PcfCalculation,
} from "./types";

export type CalculateContext = {
  items: BomItem[];
  mappings: CarbonMapping[];
  factors: EmissionFactor[];
  declaredUnit?: string;
};

function requiredActivityQty(item: BomItem, rolledNetQty: number): number {
  const afterScrap = inputQuantityAfterScrap(rolledNetQty, item.scrapRate ?? 0);
  const yieldRate = item.yieldRate > 0 ? item.yieldRate : 1;
  return afterScrap / yieldRate;
}

/** Deterministic recursive BOM PCF with scrap/yield and unit normalization. */
export function calculateBomPcf(
  input: CalculateBomInput,
  ctx: CalculateContext
): PcfCalculation {
  const requireApproved = input.requireApproved !== false;
  const now = new Date().toISOString();
  const calcId = newEntityId("pcf");
  const warnings: string[] = [];
  const mappingByItem = new Map(ctx.mappings.map((m) => [m.bomItemId, m]));
  const factorById = new Map(ctx.factors.map((f) => [f.id, f]));
  const ledger: CarbonLedgerEntry[] = [];
  let seq = 0;

  const roots = buildBomTree(ctx.items);

  function walk(
    node: BomTreeNode,
    parentRolledQty: number,
    parentEntryId: string | null
  ): number {
    const rolledNet = parentRolledQty * node.quantity;
    let ownKg = 0;
    let childKg = 0;
    const mapping = mappingByItem.get(node.id);

    const entryId = newEntityId("led");
    let activityQuantity = 0;
    let activityUnit = node.unit;
    let emissionFactorId: string | null = null;
    let mappingId: string | null = null;
    let method: MappingMethod = "qty_x_ef";
    let confidence: number | null = null;
    const provenance: Record<string, unknown> = {
      scrapRate: node.scrapRate,
      yieldRate: node.yieldRate,
      rolledNetQty: rolledNet,
      parentRolledQty,
    };

    if (mapping && isMappingUsable(mapping.status, requireApproved)) {
      const factor = factorById.get(mapping.emissionFactorId);
      if (!factor) {
        warnings.push(`Mapping for ${node.partNumber} references missing emission factor`);
      } else {
        try {
          const activity = requiredActivityQty(node, rolledNet);
          const converted = convertBomUnit(activity, node.unit, factor.activityUnit);
          ownKg = converted * factor.valueKgco2e;
          activityQuantity = converted;
          activityUnit = factor.activityUnit;
          emissionFactorId = factor.id;
          mappingId = mapping.id;
          method = mapping.method;
          confidence = mapping.confidence;
          provenance.factorCode = factor.factorCode;
          provenance.factorValueKgco2e = factor.valueKgco2e;
          provenance.datasetId = factor.datasetId;
          provenance.matchReason = mapping.matchReason;
        } catch (e) {
          warnings.push(
            e instanceof Error ? e.message : `Unit error on ${node.partNumber}`
          );
        }
      }
    } else if (node.children.length === 0) {
      warnings.push(
        requireApproved
          ? `No approved mapping for leaf ${node.partNumber}`
          : `No mapping for leaf ${node.partNumber}`
      );
    }

    for (const child of node.children) {
      childKg += walk(child, rolledNet, entryId);
    }

    const contribution = ownKg + childKg;
    ledger.push({
      id: entryId,
      companyId: input.companyId,
      calculationId: calcId,
      bomItemId: node.id,
      parentEntryId,
      partNumber: node.partNumber,
      contributionKgco2e: Number(contribution.toFixed(9)),
      activityQuantity: Number(activityQuantity.toFixed(9)),
      activityUnit,
      emissionFactorId,
      mappingId,
      method,
      confidence,
      provenance,
      sequenceNo: seq++,
      createdAt: now,
    });
    return contribution;
  }

  let total = 0;
  for (const root of roots) {
    total += walk(root, 1, null);
  }

  if (ctx.items.length === 0) {
    warnings.push("BOM has no items");
  }

  return {
    id: calcId,
    companyId: input.companyId,
    productId: input.productId ?? null,
    bomId: input.bomId,
    assessmentId: input.assessmentId ?? null,
    status: "completed",
    totalKgco2e: Number(total.toFixed(9)),
    declaredUnit: ctx.declaredUnit ?? "piece",
    methodology: "bom_recursive_v1",
    warnings,
    errorMessage: null,
    createdBy: input.createdBy ?? null,
    createdAt: now,
    completedAt: now,
    ledger,
  };
}

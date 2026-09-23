import type { BomImportPreview, BomItem } from "../types";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `bom-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Map import preview rows to BomItem records (parent resolved by part number). */
export function previewRowsToBomItems(
  companyId: string,
  bomId: string,
  preview: BomImportPreview,
  now = new Date().toISOString()
): BomItem[] {
  const idByPart = new Map<string, string>();
  for (const row of preview.rows) {
    if (row.partNumber && !idByPart.has(row.partNumber)) {
      idByPart.set(row.partNumber, newId());
    }
  }

  return preview.rows
    .filter((r) => r.partNumber)
    .map((r) => {
      const id = idByPart.get(r.partNumber)!;
      const parentItemId = r.parentPartNumber ? idByPart.get(r.parentPartNumber) ?? null : null;
      return {
        id,
        companyId,
        bomId,
        parentItemId,
        partNumber: r.partNumber,
        description: r.description,
        itemType: r.itemType,
        quantity: r.quantity,
        unit: r.unit,
        scrapRate: r.scrapRate,
        yieldRate: r.yieldRate,
        sequenceNo: r.sequenceNo,
        supplierId: null,
        materialId: null,
        createdAt: now,
        updatedAt: now,
      } satisfies BomItem;
    });
}

import { detectCycles, findOrphans } from "./graph";
import type { BomIssue, BomItem } from "./types";
import { unitsCompatible } from "./units";

export function validateBomItem(item: BomItem, row?: number): BomIssue[] {
  const issues: BomIssue[] = [];
  if (!item.partNumber?.trim()) {
    issues.push({
      code: "MISSING_PART_NUMBER",
      message: "Part number is required",
      itemId: item.id,
      row,
    });
  }
  if (!(item.quantity >= 0) || !Number.isFinite(item.quantity)) {
    issues.push({
      code: "INVALID_QUANTITY",
      message: `Invalid quantity for ${item.partNumber || item.id}`,
      itemId: item.id,
      partNumber: item.partNumber,
      row,
    });
  }
  if (!(item.scrapRate >= 0 && item.scrapRate < 1)) {
    issues.push({
      code: "INVALID_SCRAP",
      message: `Scrap rate must be in [0, 1) for ${item.partNumber}`,
      itemId: item.id,
      partNumber: item.partNumber,
      row,
    });
  }
  if (!(item.yieldRate > 0 && item.yieldRate <= 1)) {
    issues.push({
      code: "INVALID_YIELD",
      message: `Yield rate must be in (0, 1] for ${item.partNumber}`,
      itemId: item.id,
      partNumber: item.partNumber,
      row,
    });
  }
  if (!item.unit?.trim()) {
    issues.push({
      code: "INCOMPATIBLE_UNIT",
      message: `Unit is required for ${item.partNumber}`,
      itemId: item.id,
      partNumber: item.partNumber,
      row,
    });
  }
  return issues;
}

export function validateBomStructure(items: BomItem[]): BomIssue[] {
  const issues: BomIssue[] = [];
  for (const item of items) issues.push(...validateBomItem(item));
  issues.push(...findOrphans(items));
  issues.push(...detectCycles(items));
  for (const item of items) {
    if (item.parentItemId === item.id) {
      issues.push({
        code: "CIRCULAR_BOM",
        message: `Item ${item.partNumber} cannot be its own parent`,
        itemId: item.id,
        partNumber: item.partNumber,
      });
    }
  }
  return issues;
}

export function assertUnitCompatible(from: string, to: string): BomIssue | null {
  if (unitsCompatible(from, to)) return null;
  return { code: "INCOMPATIBLE_UNIT", message: `Cannot convert ${from} → ${to}` };
}

export function hasBlockingErrors(issues: BomIssue[]): boolean {
  const blocking: BomIssue["code"][] = [
    "CIRCULAR_BOM",
    "ORPHAN_ITEM",
    "INVALID_QUANTITY",
    "INVALID_SCRAP",
    "INVALID_YIELD",
    "MISSING_PART_NUMBER",
    "IMPORT_PARSE_ERROR",
  ];
  return issues.some((i) => blocking.includes(i.code));
}

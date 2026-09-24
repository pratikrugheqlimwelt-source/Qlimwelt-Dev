import type {
  BomImportColumnMapping,
  BomImportPreview,
  BomImportRow,
  BomIssue,
  BomItem,
  BomItemType,
} from "../types";
import { validateBomItem } from "../validate";

const HEADER_ALIASES: Record<keyof BomImportColumnMapping, string[]> = {
  partNumber: ["part_number", "partnumber", "part", "item", "component", "sku", "material"],
  parentPartNumber: ["parent_part_number", "parent", "parent_part", "parentpart", "assembly", "parent_sku"],
  description: ["description", "desc", "name", "part_name", "component_name"],
  quantity: ["quantity", "qty", "qty_per", "amount", "count"],
  unit: ["unit", "uom", "units", "measure"],
  itemType: ["item_type", "type", "level_type", "component_type"],
  scrapRate: ["scrap_rate", "scrap", "scrap_%", "scrap_pct"],
  yieldRate: ["yield_rate", "yield", "yield_%", "yield_pct"],
  sequenceNo: ["sequence", "seq", "sequence_no", "line", "line_no", "position"],
};

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

export function detectColumnMapping(headers: string[]): BomImportColumnMapping {
  const normalized = headers.map(normHeader);
  const find = (keys: string[]) => {
    const idx = normalized.findIndex((h) => keys.includes(h));
    return idx >= 0 ? headers[idx] : undefined;
  };

  const partNumber = find(HEADER_ALIASES.partNumber) ?? headers[0] ?? "part_number";
  return {
    partNumber,
    parentPartNumber: find(HEADER_ALIASES.parentPartNumber),
    description: find(HEADER_ALIASES.description),
    quantity: find(HEADER_ALIASES.quantity),
    unit: find(HEADER_ALIASES.unit),
    itemType: find(HEADER_ALIASES.itemType),
    scrapRate: find(HEADER_ALIASES.scrapRate),
    yieldRate: find(HEADER_ALIASES.yieldRate),
    sequenceNo: find(HEADER_ALIASES.sequenceNo),
  };
}

/** Parse CSV text into string matrix (handles quoted fields). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

function parseNumber(raw: string | undefined, fallback: number): number {
  if (raw == null || raw.trim() === "") return fallback;
  const cleaned = raw.replace(/%/g, "").replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

function parseItemType(raw: string | undefined): BomItemType {
  const v = (raw ?? "component").toLowerCase().trim();
  const allowed: BomItemType[] = [
    "product",
    "assembly",
    "component",
    "material",
    "process",
    "packaging",
    "other",
  ];
  return (allowed.includes(v as BomItemType) ? v : "component") as BomItemType;
}

function cell(row: Record<string, string>, key: string | undefined): string {
  if (!key) return "";
  return row[key] ?? row[normHeader(key)] ?? "";
}

export function buildImportPreview(
  matrix: string[][],
  mapping?: Partial<BomImportColumnMapping>
): BomImportPreview {
  if (matrix.length === 0) {
    return {
      rows: [],
      issues: [{ code: "IMPORT_PARSE_ERROR", message: "File is empty" }],
      validCount: 0,
      warningCount: 0,
      errorCount: 1,
      detectedColumns: [],
    };
  }

  const headers = matrix[0].map((h) => h.trim());
  const auto = detectColumnMapping(headers);
  const map: BomImportColumnMapping = {
    ...auto,
    ...mapping,
    partNumber: mapping?.partNumber || auto.partNumber,
  };

  const dataRows = matrix.slice(1);
  const rows: BomImportRow[] = [];
  const issues: BomIssue[] = [];
  const seenPaths = new Set<string>();

  dataRows.forEach((cols, idx) => {
    const rowNum = idx + 2;
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = cols[i] ?? "";
      record[normHeader(h)] = cols[i] ?? "";
    });

    const partNumber = cell(record, map.partNumber).trim();
    const parentPartNumber = cell(record, map.parentPartNumber).trim() || null;
    const description = cell(record, map.description).trim() || partNumber;
    const quantity = parseNumber(cell(record, map.quantity), 1);
    let scrapRate = parseNumber(cell(record, map.scrapRate), 0);
    let yieldRate = parseNumber(cell(record, map.yieldRate), 1);
    if (scrapRate > 1) scrapRate = scrapRate / 100;
    if (yieldRate > 1) yieldRate = yieldRate / 100;

    const importRow: BomImportRow = {
      row: rowNum,
      partNumber,
      parentPartNumber,
      description,
      quantity,
      unit: cell(record, map.unit).trim() || "piece",
      itemType: parseItemType(cell(record, map.itemType)),
      scrapRate,
      yieldRate,
      sequenceNo: parseNumber(cell(record, map.sequenceNo), idx),
    };
    rows.push(importRow);

    const pathKey = `${parentPartNumber ?? ""}::${partNumber}`;
    if (seenPaths.has(pathKey) && partNumber) {
      issues.push({
        code: "DUPLICATE_PART_PATH",
        message: `Duplicate part under same parent: ${partNumber}`,
        partNumber,
        row: rowNum,
      });
    }
    seenPaths.add(pathKey);

    const stubItem: BomItem = {
      id: `preview-${rowNum}`,
      companyId: "",
      bomId: "",
      parentItemId: null,
      partNumber: importRow.partNumber,
      description: importRow.description,
      itemType: importRow.itemType,
      quantity: importRow.quantity,
      unit: importRow.unit,
      scrapRate: importRow.scrapRate,
      yieldRate: importRow.yieldRate,
      sequenceNo: importRow.sequenceNo,
      createdAt: "",
      updatedAt: "",
    };
    issues.push(...validateBomItem(stubItem, rowNum));
  });

  const parts = new Set(rows.map((r) => r.partNumber).filter(Boolean));
  for (const r of rows) {
    if (r.parentPartNumber && !parts.has(r.parentPartNumber)) {
      issues.push({
        code: "ORPHAN_ITEM",
        message: `Parent part ${r.parentPartNumber} not found in file for ${r.partNumber}`,
        partNumber: r.partNumber,
        row: r.row,
      });
    }
  }

  const errorCodes: BomIssue["code"][] = [
    "IMPORT_PARSE_ERROR",
    "MISSING_PART_NUMBER",
    "INVALID_QUANTITY",
    "INVALID_SCRAP",
    "INVALID_YIELD",
    "ORPHAN_ITEM",
    "CIRCULAR_BOM",
  ];
  const errorCount = issues.filter((i) => errorCodes.includes(i.code)).length;
  const warningCount = issues.length - errorCount;

  return {
    rows,
    issues,
    validCount: rows.filter((r) => r.partNumber && r.quantity >= 0).length,
    warningCount,
    errorCount,
    detectedColumns: headers,
  };
}

export function previewFromCsvText(
  text: string,
  mapping?: Partial<BomImportColumnMapping>
): BomImportPreview {
  return buildImportPreview(parseCsv(text), mapping);
}

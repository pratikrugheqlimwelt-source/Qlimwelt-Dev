import * as XLSX from "xlsx";
import { detectColumnMapping, buildImportPreview, parseCsv } from "./parse";
import type { BomImportColumnMapping, BomImportPreview } from "../types";

export type SpreadsheetMatrix = {
  headers: string[];
  matrix: string[][];
  sheetName?: string;
};

/** Parse CSV/TSV text or Excel (.xlsx/.xls) ArrayBuffer into a string matrix. */
export function parseSpreadsheetFile(
  fileName: string,
  payload: string | ArrayBuffer
): SpreadsheetMatrix {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".xlsm")) {
    if (typeof payload === "string") {
      throw new Error("Excel files must be read as binary (ArrayBuffer)");
    }
    const workbook = XLSX.read(payload, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { headers: [], matrix: [] };
    }
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    }) as (string | number | boolean | null)[][];
    const matrix = rows.map((row) =>
      row.map((cell) => (cell == null ? "" : String(cell)))
    );
    const headers = (matrix[0] ?? []).map((h) => h.trim());
    return { headers, matrix, sheetName };
  }

  const text = typeof payload === "string" ? payload : new TextDecoder().decode(payload);
  const matrix = parseCsv(text);
  const headers = (matrix[0] ?? []).map((h) => h.trim());
  return { headers, matrix };
}

export function previewFromSpreadsheet(
  fileName: string,
  payload: string | ArrayBuffer,
  mapping?: Partial<BomImportColumnMapping>
): BomImportPreview {
  const { matrix } = parseSpreadsheetFile(fileName, payload);
  return buildImportPreview(matrix, mapping);
}

export function autoMappingForFile(
  fileName: string,
  payload: string | ArrayBuffer
): { headers: string[]; mapping: BomImportColumnMapping; matrix: string[][] } {
  const { headers, matrix } = parseSpreadsheetFile(fileName, payload);
  return { headers, mapping: detectColumnMapping(headers), matrix };
}

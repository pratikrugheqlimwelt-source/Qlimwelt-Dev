import type {
  BomConnectorKind,
  CanonicalBomLine,
  ConnectorNormalizeResult,
} from "./types";
import { getConnectorProfile } from "./profiles";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  return String(v).trim();
}

function num(v: unknown, fallback: number): number {
  if (v == null || v === "") return fallback;
  const n = Number(String(v).replace(/,/g, "").replace(/%/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function canonicalLinesToCsv(lines: CanonicalBomLine[]): string {
  const header = [
    "part_number",
    "parent_part_number",
    "description",
    "quantity",
    "unit",
    "item_type",
    "scrap_rate",
    "yield_rate",
    "sequence_no",
  ];
  const rows = lines.map((l) =>
    [
      l.partNumber,
      l.parentPartNumber ?? "",
      l.description,
      String(l.quantity),
      l.unit,
      l.itemType,
      String(l.scrapRate),
      String(l.yieldRate),
      String(l.sequenceNo),
    ]
      .map(csvEscape)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

function line(
  partial: Partial<CanonicalBomLine> & { partNumber: string }
): CanonicalBomLine {
  return {
    partNumber: partial.partNumber,
    parentPartNumber: partial.parentPartNumber ?? null,
    description: partial.description || partial.partNumber,
    quantity: partial.quantity ?? 1,
    unit: partial.unit || "piece",
    itemType: partial.itemType || "component",
    scrapRate: partial.scrapRate ?? 0,
    yieldRate: partial.yieldRate ?? 1,
    sequenceNo: partial.sequenceNo ?? 0,
  };
}

/** Parse SAP-like JSON or CSV text into canonical lines. */
export function normalizeSapBom(payload: string): ConnectorNormalizeResult {
  const warnings: string[] = [];
  const lines: CanonicalBomLine[] = [];
  const trimmed = payload.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as unknown;
    const root = asRecord(parsed);
    const parent =
      str(root?.parent) ||
      str(root?.MATNR) ||
      str(root?.parent_matnr) ||
      str(root?.headerMaterial);

    if (parent) {
      lines.push(
        line({
          partNumber: parent,
          description: str(root?.parent_desc || root?.MAKTX || parent),
          quantity: 1,
          unit: "piece",
          itemType: "product",
          sequenceNo: 0,
        })
      );
    }

    const components =
      (Array.isArray(root?.components) && root!.components) ||
      (Array.isArray(root?.items) && root!.items) ||
      (Array.isArray(parsed) ? parsed : null);

    if (!components) {
      throw new Error("SAP payload needs components[] or a BOM item array");
    }

    components.forEach((c, idx) => {
      const row = asRecord(c) ?? {};
      const material =
        str(row.material) || str(row.IDNRK) || str(row.component) || str(row.matnr);
      if (!material) {
        warnings.push(`SAP row ${idx + 1}: missing material/IDNRK`);
        return;
      }
      lines.push(
        line({
          partNumber: material,
          parentPartNumber: parent || str(row.parent) || str(row.MATNR) || null,
          description: str(row.desc || row.description || row.MAKTX || material),
          quantity: num(row.qty ?? row.MENGE ?? row.quantity, 1),
          unit: str(row.uom || row.MEINS || row.unit || "kg").toLowerCase(),
          itemType: "material",
          scrapRate: num(row.scrap ?? row.AUSCH, 0),
          sequenceNo: num(row.posnr ?? row.POSNR ?? idx + 1, idx + 1),
        })
      );
    });
  } else {
    // CSV with SAP-ish headers → remapped via field sniffing in generic csv path
    const { lines: csvLines, warnings: w } = normalizeVendorCsv(trimmed, "sap_bom");
    lines.push(...csvLines);
    warnings.push(...w);
  }

  if (lines.length === 0) throw new Error("SAP connector produced no BOM lines");
  return {
    kind: "sap_bom",
    sourceSystem: "sap",
    lines,
    csvText: canonicalLinesToCsv(lines),
    warnings,
  };
}

export function normalizePlmBom(payload: string): ConnectorNormalizeResult {
  const warnings: string[] = [];
  const lines: CanonicalBomLine[] = [];
  const trimmed = payload.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as unknown;
    const root = asRecord(parsed);
    const items =
      (Array.isArray(root?.items) && root!.items) ||
      (Array.isArray(root?.bom_lines) && root!.bom_lines) ||
      (Array.isArray(parsed) ? parsed : null);
    if (!items) throw new Error("PLM payload needs items[] / bom_lines[]");

    items.forEach((c, idx) => {
      const row = asRecord(c) ?? {};
      const part =
        str(row.item_id) || str(row.itemId) || str(row.id) || str(row.part_number);
      if (!part) {
        warnings.push(`PLM row ${idx + 1}: missing item_id`);
        return;
      }
      const parent =
        str(row.parent_item_id) ||
        str(row.parentItemId) ||
        str(row.parent_id) ||
        str(row.parent) ||
        "";
      lines.push(
        line({
          partNumber: part,
          parentPartNumber: parent || null,
          description: str(row.name || row.description || row.revision_name || part),
          quantity: num(row.qty ?? row.quantity ?? row.qty_per, parent ? 1 : 1),
          unit: str(row.uom || row.unit || "piece").toLowerCase(),
          itemType: parent ? "component" : "product",
          sequenceNo: num(row.find_no ?? row.sequence ?? idx, idx),
        })
      );
    });
  } else {
    const { lines: csvLines, warnings: w } = normalizeVendorCsv(trimmed, "plm_bom");
    lines.push(...csvLines);
    warnings.push(...w);
  }

  if (lines.length === 0) throw new Error("PLM connector produced no BOM lines");
  return {
    kind: "plm_bom",
    sourceSystem: "plm",
    lines,
    csvText: canonicalLinesToCsv(lines),
    warnings,
  };
}

export function normalizePdmBom(payload: string): ConnectorNormalizeResult {
  const warnings: string[] = [];
  const lines: CanonicalBomLine[] = [];
  const trimmed = payload.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as unknown;
    const root = asRecord(parsed);
    const rows =
      (Array.isArray(root?.rows) && root!.rows) ||
      (Array.isArray(root?.components) && root!.components) ||
      (Array.isArray(parsed) ? parsed : null);
    if (!rows) throw new Error("PDM payload needs rows[] / components[]");

    rows.forEach((c, idx) => {
      const row = asRecord(c) ?? {};
      const file =
        str(row.FileName) ||
        str(row.fileName) ||
        str(row.file_name) ||
        str(row.part) ||
        str(row.name);
      if (!file) {
        warnings.push(`PDM row ${idx + 1}: missing FileName`);
        return;
      }
      const part = file.replace(/\.(sldprt|sldasm|prt|asm)$/i, "");
      const parentRaw =
        str(row.Parent) || str(row.parent) || str(row.parent_file) || str(row.ParentFileName);
      const parent = parentRaw ? parentRaw.replace(/\.(sldprt|sldasm|prt|asm)$/i, "") : "";
      lines.push(
        line({
          partNumber: part,
          parentPartNumber: parent || null,
          description: str(row.Configuration || row.description || part),
          quantity: num(row.Qty ?? row.qty ?? row.quantity, 1),
          unit: "piece",
          itemType: parent ? "component" : "product",
          sequenceNo: idx,
        })
      );
    });
  } else {
    const { lines: csvLines, warnings: w } = normalizeVendorCsv(trimmed, "pdm_bom");
    lines.push(...csvLines);
    warnings.push(...w);
  }

  if (lines.length === 0) throw new Error("PDM connector produced no BOM lines");
  return {
    kind: "pdm_bom",
    sourceSystem: "pdm",
    lines,
    csvText: canonicalLinesToCsv(lines),
    warnings,
  };
}

export function normalizeGenericJson(payload: string): ConnectorNormalizeResult {
  const warnings: string[] = [];
  const parsed = JSON.parse(payload.trim()) as unknown;
  const root = asRecord(parsed);
  const items =
    (Array.isArray(root?.items) && root!.items) ||
    (Array.isArray(parsed) ? parsed : null);
  if (!items) throw new Error("generic_json needs items[] or a top-level array");

  const lines: CanonicalBomLine[] = [];
  items.forEach((c, idx) => {
    const row = asRecord(c) ?? {};
    const part = str(row.partNumber || row.part_number || row.id);
    if (!part) {
      warnings.push(`generic row ${idx + 1}: missing partNumber`);
      return;
    }
    lines.push(
      line({
        partNumber: part,
        parentPartNumber:
          str(row.parentPartNumber || row.parent_part_number || row.parent) || null,
        description: str(row.description || row.name || part),
        quantity: num(row.quantity ?? row.qty, 1),
        unit: str(row.unit || "piece").toLowerCase(),
        itemType: str(row.itemType || row.item_type || "component").toLowerCase(),
        scrapRate: num(row.scrapRate ?? row.scrap_rate, 0),
        yieldRate: num(row.yieldRate ?? row.yield_rate, 1),
        sequenceNo: num(row.sequenceNo ?? row.sequence_no ?? idx, idx),
      })
    );
  });

  if (lines.length === 0) throw new Error("generic_json produced no BOM lines");
  return {
    kind: "generic_json",
    sourceSystem: "generic",
    lines,
    csvText: canonicalLinesToCsv(lines),
    warnings,
  };
}

function normalizeVendorCsv(
  csvText: string,
  kind: Exclude<BomConnectorKind, "generic_json">
): { lines: CanonicalBomLine[]; warnings: string[] } {
  const warnings: string[] = [];
  const matrix = parseSimpleCsv(csvText);
  if (matrix.length < 2) throw new Error("CSV has no data rows");
  const headers = matrix[0].map((h) => h.trim());
  const norm = headers.map((h) => h.toLowerCase().replace(/\s+/g, "_"));

  const find = (...aliases: string[]) => {
    const idx = norm.findIndex((h) => aliases.includes(h));
    return idx >= 0 ? idx : -1;
  };

  let partIdx = -1;
  let parentIdx = -1;
  let qtyIdx = -1;
  let unitIdx = -1;
  let descIdx = -1;

  if (kind === "sap_bom") {
    partIdx = find("idnrk", "component", "material", "matnr_comp", "part_number");
    parentIdx = find("matnr", "parent", "parent_matnr", "header", "parent_part_number");
    qtyIdx = find("menge", "qty", "quantity");
    unitIdx = find("meins", "uom", "unit");
    descIdx = find("maktx", "description", "desc");
  } else if (kind === "plm_bom") {
    partIdx = find("item_id", "itemid", "id", "part_number", "part");
    parentIdx = find("parent_item_id", "parentitemid", "parent_id", "parent");
    qtyIdx = find("qty", "quantity", "qty_per");
    unitIdx = find("uom", "unit");
    descIdx = find("name", "description", "revision_name");
  } else {
    partIdx = find("filename", "file_name", "part", "name", "part_number");
    parentIdx = find("parent", "parentfilename", "parent_file", "parent_file_name");
    qtyIdx = find("qty", "quantity");
    unitIdx = find("unit", "uom");
    descIdx = find("configuration", "description", "desc");
  }

  if (partIdx < 0) throw new Error(`${kind} CSV: could not detect part column`);

  const lines: CanonicalBomLine[] = [];
  matrix.slice(1).forEach((cols, idx) => {
    let part = (cols[partIdx] ?? "").trim();
    if (!part) {
      warnings.push(`CSV row ${idx + 2}: empty part`);
      return;
    }
    if (kind === "pdm_bom") part = part.replace(/\.(sldprt|sldasm|prt|asm)$/i, "");
    let parent = parentIdx >= 0 ? (cols[parentIdx] ?? "").trim() : "";
    if (kind === "pdm_bom" && parent) {
      parent = parent.replace(/\.(sldprt|sldasm|prt|asm)$/i, "");
    }
    lines.push(
      line({
        partNumber: part,
        parentPartNumber: parent || null,
        description: descIdx >= 0 ? (cols[descIdx] ?? "").trim() || part : part,
        quantity: qtyIdx >= 0 ? num(cols[qtyIdx], 1) : 1,
        unit: (unitIdx >= 0 ? (cols[unitIdx] ?? "piece") : "piece").toLowerCase(),
        itemType: parent ? "component" : "product",
        sequenceNo: idx,
      })
    );
  });

  return { lines, warnings };
}

function parseSimpleCsv(text: string): string[][] {
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

export function normalizeConnectorPayload(
  kind: BomConnectorKind,
  payload: string
): ConnectorNormalizeResult {
  getConnectorProfile(kind);
  const text = payload.trim();
  if (!text) throw new Error("Payload is empty");
  switch (kind) {
    case "sap_bom":
      return normalizeSapBom(text);
    case "plm_bom":
      return normalizePlmBom(text);
    case "pdm_bom":
      return normalizePdmBom(text);
    case "generic_json":
      return normalizeGenericJson(text);
    default:
      throw new Error(`Unsupported connector: ${kind}`);
  }
}

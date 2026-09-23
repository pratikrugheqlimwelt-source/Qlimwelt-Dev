/**
 * BOM Phase 1A unit tests — run: npx tsx src/lib/bom/bom.test.ts
 */
import {
  buildBomTree,
  detectCycles,
  findOrphans,
  flattenBomTree,
} from "./graph";
import { previewFromCsvText } from "./import/parse";
import { previewRowsToBomItems } from "./import/commit";
import { convertBomUnit, inputQuantityAfterScrap, unitsCompatible } from "./units";
import { hasBlockingErrors, validateBomStructure } from "./validate";
import type { BomItem } from "./types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function item(partial: Partial<BomItem> & { id: string; partNumber: string }): BomItem {
  return {
    companyId: "co-1",
    bomId: "bom-1",
    parentItemId: null,
    description: partial.partNumber,
    itemType: "component",
    quantity: 1,
    unit: "piece",
    scrapRate: 0,
    yieldRate: 1,
    sequenceNo: 0,
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

// --- cycles ---
{
  const items = [
    item({ id: "a", partNumber: "A", parentItemId: "c" }),
    item({ id: "b", partNumber: "B", parentItemId: "a" }),
    item({ id: "c", partNumber: "C", parentItemId: "b" }),
  ];
  const cycles = detectCycles(items);
  assert(cycles.some((i) => i.code === "CIRCULAR_BOM"), "expected circular BOM detection");
  assert(hasBlockingErrors(validateBomStructure(items)), "circular BOM should block");
}

// --- orphans ---
{
  const items = [item({ id: "x", partNumber: "X", parentItemId: "missing" })];
  const orphans = findOrphans(items);
  assert(orphans.some((i) => i.code === "ORPHAN_ITEM"), "expected orphan detection");
}

// --- tree + flatten ---
{
  const items = [
    item({ id: "root", partNumber: "LAPTOP", itemType: "product", sequenceNo: 0 }),
    item({ id: "mb", partNumber: "MB", parentItemId: "root", sequenceNo: 1 }),
    item({ id: "cpu", partNumber: "CPU", parentItemId: "mb", sequenceNo: 1 }),
  ];
  const tree = buildBomTree(items);
  assert(tree.length === 1 && tree[0].partNumber === "LAPTOP", "root should be LAPTOP");
  assert(tree[0].children[0]?.partNumber === "MB", "child should be MB");
  const flat = flattenBomTree(tree, new Set(["root", "mb"]));
  assert(flat.map((n) => n.partNumber).join(",") === "LAPTOP,MB,CPU", "flatten order");
}

// --- units ---
{
  assert(unitsCompatible("kg", "g"), "kg/g compatible");
  assert(!unitsCompatible("kg", "kwh"), "kg/kwh incompatible");
  assert(Math.abs(convertBomUnit(2, "kg", "g") - 2000) < 1e-6, "2kg -> 2000g");
  let threw = false;
  try {
    convertBomUnit(1, "kg", "kwh");
  } catch {
    threw = true;
  }
  assert(threw, "incompatible units must throw");
  assert(Math.abs(inputQuantityAfterScrap(8, 0.05) - 8 / 0.95) < 1e-9, "scrap math");
}

// --- import preview + commit mapping ---
{
  const csv = [
    "part_number,parent_part_number,description,quantity,unit",
    "LAPTOP,,Laptop X,1,piece",
    "MB,LAPTOP,Mainboard,1,piece",
    "AL,MB,Aluminium,0.8,kg",
  ].join("\n");
  const preview = previewFromCsvText(csv);
  assert(preview.rows.length === 3, "3 import rows");
  assert(preview.errorCount === 0, `no import errors: ${JSON.stringify(preview.issues)}`);
  const items = previewRowsToBomItems("co-1", "bom-1", preview);
  assert(items.length === 3, "3 bom items");
  const al = items.find((i) => i.partNumber === "AL");
  const mb = items.find((i) => i.partNumber === "MB");
  assert(al && mb && al.parentItemId === mb.id, "AL parent should be MB");
  assert(!hasBlockingErrors(validateBomStructure(items)), "imported structure valid");
}

// --- Excel spreadsheet parse + column map ---
{
  const XLSX = require("xlsx") as typeof import("xlsx");
  const { autoMappingForFile, previewFromSpreadsheet } = require("./import/spreadsheet") as typeof import("./import/spreadsheet");
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Part Number", "Parent", "Qty", "UOM", "Name"],
    ["ROOT", "", "1", "piece", "Product"],
    ["CHILD", "ROOT", "2", "piece", "Child"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "BOM");
  const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const auto = autoMappingForFile("fixture.xlsx", buffer);
  assert(auto.headers.includes("Part Number"), "excel headers");
  assert(auto.mapping.partNumber === "Part Number", "auto-map part number");
  assert(auto.mapping.parentPartNumber === "Parent", "auto-map parent");
  const preview = previewFromSpreadsheet("fixture.xlsx", buffer, auto.mapping);
  assert(preview.rows.length === 2, "excel preview rows");
  assert(preview.errorCount === 0, `excel preview clean: ${JSON.stringify(preview.issues)}`);
}

// --- local-service: create product → import preview/commit → reload tree ---
{
  const {
    clearBomLocal,
  } = require("./local-store") as typeof import("./local-store");
  const {
    localCreateProduct,
    localPreviewImport,
    localCommitImport,
    localListBomItems,
    localGetProductBundle,
  } = require("./local-service") as typeof import("./local-service");

  const companyId = "co-audit-1a";
  clearBomLocal(companyId);
  const bundle = localCreateProduct(companyId, {
    productNumber: "SKU-AUDIT",
    name: "Audit Product",
  });
  assert(bundle.product.productNumber === "SKU-AUDIT", "product created");
  assert(bundle.versions.length === 1, "version created");
  assert(bundle.boms.length === 1, "bom shell created");
  const bomId = bundle.boms[0].id;

  const csv = [
    "part_number,parent_part_number,description,quantity,unit",
    "PROD,,Product,1,piece",
    "ASM,PROD,Assembly,1,piece",
    "MAT,ASM,Material,0.5,kg",
  ].join("\n");
  const job = localPreviewImport(companyId, bomId, "fixture.csv", csv);
  assert(job.errorCount === 0, `preview clean: ${JSON.stringify(job.preview.issues)}`);
  const { items } = localCommitImport(companyId, job.id);
  assert(items.length === 3, "commit wrote 3 items");

  const reloaded = localListBomItems(companyId, bomId);
  assert(reloaded.length === 3, "reload matches commit");
  const tree = buildBomTree(reloaded);
  assert(tree.length === 1 && tree[0].partNumber === "PROD", "tree root PROD");
  assert(tree[0].children[0]?.partNumber === "ASM", "tree child ASM");
  assert(tree[0].children[0]?.children[0]?.partNumber === "MAT", "tree grandchild MAT");

  const again = localGetProductBundle(companyId, bundle.product.id);
  assert(again?.boms.some((b) => b.id === bomId), "bundle still has BOM");
  clearBomLocal(companyId);
}

console.log("BOM Phase 1A tests passed.");

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

console.log("BOM Phase 1A tests passed.");

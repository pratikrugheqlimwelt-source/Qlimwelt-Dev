/**
 * BOM Phase 8 connector tests — run: npm run test:bom:connectors
 */
import { clearBomLocal, newEntityId, updateBomLocal } from "@/lib/bom/local-store";
import type { BomItem } from "@/lib/bom/types";
import {
  normalizeConnectorPayload,
  normalizeGenericJson,
  normalizePdmBom,
  normalizePlmBom,
  normalizeSapBom,
} from "./normalize";
import { localCommitImport, localPreviewConnectorImport } from "../local-service";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const companyId = "co-phase8-connectors";
clearBomLocal(companyId);

const bomId = "bom-conn-1";
const rootId = newEntityId("item");
const now = new Date().toISOString();

updateBomLocal(companyId, (s) => ({
  ...s,
  items: [
    {
      id: rootId,
      companyId,
      bomId,
      parentItemId: null,
      partNumber: "PLACEHOLDER",
      description: "Placeholder root",
      itemType: "product",
      quantity: 1,
      unit: "piece",
      scrapRate: 0,
      yieldRate: 1,
      sequenceNo: 0,
      createdAt: now,
      updatedAt: now,
    } satisfies BomItem,
  ],
}));

const sap = normalizeSapBom(
  JSON.stringify({
    parent: "FG-100",
    parent_desc: "Finished good",
    components: [
      { material: "RM-STEEL", qty: 2, uom: "KG", desc: "Steel plate" },
      { material: "RM-ALU", qty: 0.5, uom: "KG", desc: "Aluminium" },
    ],
  })
);
assert(sap.kind === "sap_bom", "sap kind");
assert(sap.lines.length === 3, "sap parent + 2 components");
assert(sap.lines[0].partNumber === "FG-100", "sap parent part");
assert(sap.lines[1].parentPartNumber === "FG-100", "sap child parent");
assert(sap.lines[1].quantity === 2, "sap qty");
assert(sap.csvText.includes("part_number"), "sap csv header");

const plm = normalizePlmBom(
  JSON.stringify({
    items: [
      { item_id: "ASM-1", name: "Top assembly" },
      { item_id: "CMP-1", parent_item_id: "ASM-1", qty: 4, uom: "EA", name: "Bracket" },
    ],
  })
);
assert(plm.lines.length === 2, "plm lines");
assert(plm.lines[1].parentPartNumber === "ASM-1", "plm parent link");

const pdm = normalizePdmBom(
  JSON.stringify({
    rows: [
      { FileName: "Product.sldasm", Qty: 1 },
      { FileName: "Housing.sldprt", Parent: "Product.sldasm", Qty: 1 },
      { FileName: "Screw.sldprt", Parent: "Housing.sldprt", Qty: 8 },
    ],
  })
);
assert(pdm.lines[0].partNumber === "Product", "pdm strips asm");
assert(pdm.lines[1].parentPartNumber === "Product", "pdm parent stripped");
assert(pdm.lines[2].quantity === 8, "pdm qty");

const generic = normalizeGenericJson(
  JSON.stringify({
    items: [
      { partNumber: "PROD", quantity: 1, unit: "piece", itemType: "product" },
      {
        partNumber: "STEEL",
        parentPartNumber: "PROD",
        quantity: 2,
        unit: "kg",
        itemType: "material",
      },
    ],
  })
);
assert(generic.lines.length === 2, "generic lines");

const routed = normalizeConnectorPayload(
  "generic_json",
  JSON.stringify({
    items: [
      { partNumber: "PROD", quantity: 1, unit: "piece", itemType: "product" },
      { partNumber: "STEEL", parentPartNumber: "PROD", quantity: 2, unit: "kg" },
    ],
  })
);
assert(routed.lines.length === 2, "router works");

const { job, normalized } = localPreviewConnectorImport(
  companyId,
  bomId,
  "generic_json",
  JSON.stringify({
    items: [
      { partNumber: "PROD", quantity: 1, unit: "piece", itemType: "product" },
      { partNumber: "STEEL", parentPartNumber: "PROD", quantity: 2, unit: "kg" },
      { partNumber: "ALU", parentPartNumber: "PROD", quantity: 0.5, unit: "kg" },
    ],
  })
);
assert(job.connectorKind === "generic_json", "job stamped with connector");
assert(job.sourceSystem === "generic", "source stamped");
assert(job.errorCount === 0, `no preview errors: ${JSON.stringify(job.preview.issues)}`);
assert(normalized.lines.length === 3, "normalized 3 lines");
assert(job.rowCount === 3, "job rows");

const committed = localCommitImport(companyId, job.id);
assert(committed.job.status === "committed", "committed");
assert(committed.items.length === 3, "3 items after commit");
assert(
  committed.items.some((i) => i.partNumber === "STEEL" && i.quantity === 2),
  "steel qty preserved"
);
assert(
  !committed.items.some((i) => i.partNumber === "PLACEHOLDER"),
  "placeholder replaced — connector commits into canonical BOM"
);

const sapCsv = normalizeSapBom(
  ["MATNR,IDNRK,MENGE,MEINS,MAKTX", "FG-200,RM-COPPER,1.5,KG,Copper wire"].join("\n")
);
assert(sapCsv.lines.length >= 1, "sap csv lines");
assert(sapCsv.lines.some((l) => l.partNumber === "RM-COPPER"), "sap csv component");

console.log("connectors.test.ts: all assertions passed");

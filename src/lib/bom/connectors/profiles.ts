import type { BomConnectorKind, BomConnectorProfile } from "./types";

export const BOM_CONNECTOR_PROFILES: BomConnectorProfile[] = [
  {
    kind: "sap_bom",
    label: "SAP-style BOM (CS03 / STPO)",
    description: "Maps MATNR / IDNRK / MENGE / MEINS style exports into canonical BOM lines.",
    acceptedFormats: ["json", "csv"],
    sampleHint:
      '{"parent":"FG-100","components":[{"material":"RM-STEEL","qty":2,"uom":"KG","desc":"Steel"}]}',
  },
  {
    kind: "plm_bom",
    label: "PLM BOM (Teamcenter-like)",
    description: "Maps item_id / parent_item_id / qty / uom / revision payloads.",
    acceptedFormats: ["json", "csv"],
    sampleHint:
      '{"items":[{"item_id":"ASM-1","name":"Assembly"},{"item_id":"CMP-1","parent_item_id":"ASM-1","qty":4,"uom":"EA"}]}',
  },
  {
    kind: "pdm_bom",
    label: "PDM BOM (SolidWorks-like)",
    description: "Maps FileName / Parent / Qty / Configuration style exports.",
    acceptedFormats: ["json", "csv"],
    sampleHint:
      '{"rows":[{"FileName":"Housing.sldprt","Parent":"Product.sldasm","Qty":1},{"FileName":"Screw.sldprt","Parent":"Housing.sldprt","Qty":8}]}',
  },
  {
    kind: "generic_json",
    label: "Generic JSON BOM",
    description: "Canonical JSON: partNumber, parentPartNumber, quantity, unit, itemType.",
    acceptedFormats: ["json"],
    sampleHint:
      '{"items":[{"partNumber":"PROD","quantity":1,"unit":"piece","itemType":"product"},{"partNumber":"STEEL","parentPartNumber":"PROD","quantity":2,"unit":"kg"}]}',
  },
];

export function getConnectorProfile(kind: BomConnectorKind): BomConnectorProfile {
  const found = BOM_CONNECTOR_PROFILES.find((p) => p.kind === kind);
  if (!found) throw new Error(`Unknown connector kind: ${kind}`);
  return found;
}

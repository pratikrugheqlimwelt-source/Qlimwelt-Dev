/** Phase 8 — ERP / PLM / PDM connector adapters → canonical BOM import */

export type BomConnectorKind = "sap_bom" | "plm_bom" | "pdm_bom" | "generic_json";

export type BomConnectorProfile = {
  kind: BomConnectorKind;
  label: string;
  description: string;
  acceptedFormats: Array<"json" | "csv">;
  sampleHint: string;
};

/** Normalized line before CSV / import preview (canonical BOM shape). */
export type CanonicalBomLine = {
  partNumber: string;
  parentPartNumber: string | null;
  description: string;
  quantity: number;
  unit: string;
  itemType: string;
  scrapRate: number;
  yieldRate: number;
  sequenceNo: number;
};

export type ConnectorNormalizeResult = {
  kind: BomConnectorKind;
  sourceSystem: string;
  lines: CanonicalBomLine[];
  csvText: string;
  warnings: string[];
};

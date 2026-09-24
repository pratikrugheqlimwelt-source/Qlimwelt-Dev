/** BOM / Product domain — Phase 1A structure only */

export type ProductStatus = "draft" | "active" | "archived";
export type VersionStatus = "draft" | "active" | "superseded" | "archived";
export type BomType = "engineering" | "manufacturing" | "packaging" | "service";
export type BomItemType =
  | "product"
  | "assembly"
  | "component"
  | "material"
  | "process"
  | "packaging"
  | "other";
export type MaterialType =
  | "raw"
  | "alloy"
  | "polymer"
  | "electronic"
  | "chemical"
  | "packaging"
  | "other";
export type ImportJobStatus = "preview" | "committed" | "failed" | "cancelled";

export type BomErrorCode =
  | "BOM_INVALID"
  | "CIRCULAR_BOM"
  | "ORPHAN_ITEM"
  | "INVALID_QUANTITY"
  | "INVALID_SCRAP"
  | "INVALID_YIELD"
  | "INCOMPATIBLE_UNIT"
  | "MISSING_PART_NUMBER"
  | "DUPLICATE_PART_PATH"
  | "IMPORT_PARSE_ERROR";

export interface BomIssue {
  code: BomErrorCode;
  message: string;
  itemId?: string;
  partNumber?: string;
  row?: number;
}

export interface Material {
  id: string;
  companyId: string;
  materialCode: string;
  name: string;
  category: string;
  subcategory?: string | null;
  materialType: MaterialType;
  density?: number | null;
  defaultUnit: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  companyId: string;
  productNumber: string;
  name: string;
  description?: string | null;
  category: string;
  declaredUnit: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVersion {
  id: string;
  companyId: string;
  productId: string;
  versionLabel: string;
  status: VersionStatus;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Bom {
  id: string;
  companyId: string;
  productVersionId: string;
  bomType: BomType;
  versionLabel: string;
  status: VersionStatus;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BomItem {
  id: string;
  companyId: string;
  bomId: string;
  parentItemId: string | null;
  partNumber: string;
  description: string;
  itemType: BomItemType;
  quantity: number;
  unit: string;
  scrapRate: number;
  yieldRate: number;
  sequenceNo: number;
  supplierId?: string | null;
  materialId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BomTreeNode extends BomItem {
  depth: number;
  children: BomTreeNode[];
}

export interface BomImportColumnMapping {
  partNumber: string;
  parentPartNumber?: string;
  description?: string;
  quantity?: string;
  unit?: string;
  itemType?: string;
  scrapRate?: string;
  yieldRate?: string;
  sequenceNo?: string;
}

export interface BomImportRow {
  row: number;
  partNumber: string;
  parentPartNumber: string | null;
  description: string;
  quantity: number;
  unit: string;
  itemType: BomItemType;
  scrapRate: number;
  yieldRate: number;
  sequenceNo: number;
}

export interface BomImportPreview {
  rows: BomImportRow[];
  issues: BomIssue[];
  validCount: number;
  warningCount: number;
  errorCount: number;
  detectedColumns: string[];
}

export interface BomImportJob {
  id: string;
  companyId: string;
  bomId: string | null;
  fileName: string;
  status: ImportJobStatus;
  rowCount: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  columnMapping: BomImportColumnMapping;
  preview: BomImportPreview;
  errorMessage?: string | null;
  createdAt: string;
  committedAt?: string | null;
}

export interface ProductBundle {
  product: Product;
  versions: ProductVersion[];
  boms: Bom[];
}

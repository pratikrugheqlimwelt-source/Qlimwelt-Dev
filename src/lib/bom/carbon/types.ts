/** BOM Phase 1B — carbon mapping, calculation, ledger */

export type CarbonDatasetStatus = "draft" | "active" | "archived";
export type MappingStatus = "suggested" | "approved" | "rejected" | "stale";
export type MappingMethod =
  | "qty_x_ef"
  | "supplier_pcf"
  | "activity_data"
  | "spend"
  | "process";
export type CalculationStatus = "draft" | "completed" | "failed" | "superseded";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface DataQualityScore {
  temporal: number;
  geo: number;
  tech: number;
  overall: number;
  notes: string[];
}

export interface BomAuditEvent {
  id: string;
  companyId: string;
  entityType:
    | "product"
    | "bom"
    | "bom_item"
    | "mapping"
    | "calculation"
    | "emission_factor"
    | "dataset";
  entityId: string;
  action: string;
  actorId?: string | null;
  actorLabel?: string | null;
  summary: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CarbonDataset {
  id: string;
  companyId: string;
  code: string;
  name: string;
  source: string;
  geography: string;
  methodology: string;
  versionLabel: string;
  status: CarbonDatasetStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmissionFactor {
  id: string;
  companyId: string;
  datasetId: string;
  factorCode: string;
  name: string;
  category: string;
  activityUnit: string;
  valueKgco2e: number;
  uncertainty?: number | null;
  geography: string;
  validFrom?: string | null;
  validTo?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CarbonMapping {
  id: string;
  companyId: string;
  bomItemId: string;
  emissionFactorId: string;
  method: MappingMethod;
  confidence: number;
  status: MappingStatus;
  matchReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CarbonLedgerEntry {
  id: string;
  companyId: string;
  calculationId: string;
  bomItemId: string | null;
  parentEntryId: string | null;
  partNumber: string;
  contributionKgco2e: number;
  activityQuantity: number;
  activityUnit: string;
  emissionFactorId: string | null;
  mappingId: string | null;
  method: MappingMethod;
  confidence: number | null;
  provenance: Record<string, unknown>;
  sequenceNo: number;
  createdAt: string;
}

export interface PcfCalculation {
  id: string;
  companyId: string;
  productId: string | null;
  bomId: string;
  assessmentId: string | null;
  status: CalculationStatus;
  totalKgco2e: number;
  declaredUnit: string;
  methodology: string;
  warnings: string[];
  errorMessage?: string | null;
  createdBy?: string | null;
  createdAt: string;
  completedAt?: string | null;
  ledger?: CarbonLedgerEntry[];
  /** Phase 1C */
  approvalStatus: ApprovalStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  approvalNotes?: string | null;
  isStale: boolean;
  staleReason?: string | null;
  staleAt?: string | null;
  dq?: DataQualityScore | null;
  bomFingerprint?: string | null;
  mappingFingerprint?: string | null;
}

export interface MappingSuggestion {
  emissionFactorId: string;
  confidence: number;
  matchReason: string;
  factor: EmissionFactor;
}

export interface CalculateBomInput {
  companyId: string;
  bomId: string;
  productId?: string | null;
  assessmentId?: string | null;
  createdBy?: string | null;
  /** Default true: only approved mappings contribute */
  requireApproved?: boolean;
}

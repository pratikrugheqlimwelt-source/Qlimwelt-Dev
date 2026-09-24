/**
 * PACT V3 Phase 3a — adapter domain types (internal persistence).
 * Wire ProductFootprint shapes land in Phase 3b against pinned OpenAPI 3.0.3.
 */

export const PACT_SPEC_VERSION = "3.0.3" as const;
export const PACT_PRODUCT_FOOTPRINT_SPEC_VERSION = "3.0.0" as const;

export type PactEndpointStatus = "active" | "disabled";
export type PactAuthType = "oauth2_client_credentials";

export type PactEndpoint = {
  id: string;
  companyId: string;
  name: string;
  baseUrl: string;
  protocolVersion: string;
  authType: PactAuthType;
  clientId?: string | null;
  /** Vault / env reference — never store plaintext secrets here */
  clientSecretRef?: string | null;
  status: PactEndpointStatus;
  lastSuccessAt?: string | null;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IdentityScheme = "custom" | "gtin" | "supplier_part" | "urn" | "company";
export type IdentityMappingStatus = "candidate" | "confirmed" | "rejected";
export type IdentityMappingSource = "manual" | "import" | "connector";

export type ProductIdentityMapping = {
  id: string;
  companyId: string;
  productId?: string | null;
  bomItemId?: string | null;
  scheme: IdentityScheme;
  value: string;
  urn: string;
  status: IdentityMappingStatus;
  confidence?: number | null;
  source: IdentityMappingSource;
  createdAt: string;
  updatedAt: string;
};

export type SupplierPcfRecordStatus =
  | "received"
  | "mapped"
  | "accepted"
  | "rejected"
  | "expired";

export type SupplierPcfRecord = {
  id: string;
  companyId: string;
  supplierId?: string | null;
  productIdentityUrns: string[];
  declaredUnit?: string | null;
  declaredUnitAmount?: number | null;
  pcfExcludingBiogenic?: number | null;
  pcfIncludingBiogenic?: number | null;
  referencePeriodStart?: string | null;
  referencePeriodEnd?: string | null;
  validityPeriodStart?: string | null;
  validityPeriodEnd?: string | null;
  geography?: string | null;
  crossSectoralStandards: string[];
  secondaryEmissionFactorSources: Array<{ name: string }>;
  verificationJson?: Record<string, unknown> | null;
  dqiJson?: Record<string, unknown> | null;
  pactSpecVersion: string;
  rawPayload: Record<string, unknown>;
  status: SupplierPcfRecordStatus;
  mappedBomItemId?: string | null;
  resultingFactorId?: string | null;
  resultingMappingId?: string | null;
  pactExchangeId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PactExchangeDirection = "inbound" | "outbound";
export type PactExchangeKind =
  | "list"
  | "get"
  | "export"
  | "import"
  | "event_request_created"
  | "event_fulfilled"
  | "event_rejected"
  | "event_published";
export type PactExchangeStatus =
  | "pending"
  | "validated"
  | "mapped"
  | "completed"
  | "failed";

export type PactErrorCategory =
  | "SCHEMA_INVALID"
  | "SEMANTIC_INVALID"
  | "AUTH"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UPSTREAM"
  | "NOT_IMPLEMENTED";

export type PactExchange = {
  id: string;
  companyId: string;
  direction: PactExchangeDirection;
  kind: PactExchangeKind;
  endpointId?: string | null;
  idempotencyKey: string;
  correlationId?: string | null;
  requestId?: string | null;
  status: PactExchangeStatus;
  httpStatus?: number | null;
  errorCode?: string | null;
  errorDetail?: string | null;
  footprintId?: string | null;
  calculationId?: string | null;
  supplierPcfRecordId?: string | null;
  requestPayload?: Record<string, unknown> | null;
  responsePayload?: Record<string, unknown> | null;
  createdAt: string;
  completedAt?: string | null;
};

export type PactValidationIssue = {
  path: string;
  message: string;
  category: PactErrorCategory;
};

export type PactValidationResult = {
  ok: boolean;
  issues: PactValidationIssue[];
};

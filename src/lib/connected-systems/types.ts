export type ConnectorStatus = "available" | "coming_soon";

export type ConnectionStatus = "connected" | "disconnected" | "pending" | "failed";

export type ConnectionHealth = "healthy" | "warning" | "disconnected" | "failed";

export type AuthMethod = "api_key" | "oauth" | "client_secret";

export type SyncSchedule = "realtime" | "hourly" | "daily" | "weekly" | "manual";

export type ConnectorCategoryId =
  | "erp"
  | "accounting"
  | "procurement"
  | "cloud"
  | "energy"
  | "logistics"
  | "hr"
  | "travel"
  | "manufacturing"
  | "documents"
  | "future";

export type ConnectorDef = {
  id: string;
  name: string;
  category: ConnectorCategoryId;
  description: string;
  status: ConnectorStatus;
  features: string[];
  authMethods: AuthMethod[];
  /** Short initials used as logo mark */
  mark: string;
};

export type ConnectorCategory = {
  id: ConnectorCategoryId;
  label: string;
  description: string;
};

export type SystemConnection = {
  id: string;
  companyId: string;
  connectorId: string;
  connectorName: string;
  connectorType: ConnectorCategoryId;
  authenticationType: AuthMethod;
  status: ConnectionStatus;
  health: ConnectionHealth;
  region: string | null;
  endpoint: string | null;
  description: string | null;
  connectionName: string;
  ownerUserId: string | null;
  ownerLabel: string;
  lastSync: string | null;
  nextSync: string | null;
  syncSchedule: SyncSchedule;
  createdAt: string;
  updatedAt: string;
  /** Diagnostics from last sync — never includes secrets */
  lastDiagnostic?: string | null;
};

export type SyncLog = {
  id: string;
  connectionId: string;
  importedRecords: number;
  failedRecords: number;
  durationMs: number;
  status: "success" | "warning" | "failed";
  log: string;
  createdAt: string;
};

export type ConnectPayload = {
  connectorId: string;
  connectionName: string;
  authenticationType: AuthMethod;
  apiKey?: string;
  clientSecret?: string;
  endpoint?: string;
  region?: string;
  description?: string;
  syncSchedule?: SyncSchedule;
};

export type CompanyApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  revokedAt: string | null;
};

export type ConnectionHealthSummary = {
  healthy: number;
  warning: number;
  disconnected: number;
  failed: number;
  total: number;
};

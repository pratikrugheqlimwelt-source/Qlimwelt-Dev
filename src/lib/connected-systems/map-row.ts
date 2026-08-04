import type { AuthMethod, ConnectionHealth, ConnectionStatus, SyncSchedule, SystemConnection, SyncLog } from "./types";
import type { ConnectorCategoryId } from "./types";

type ConnectionRow = {
  id: string;
  company_id: string;
  connector_id: string;
  connector_name: string;
  connector_type: string;
  authentication_type: string;
  connection_name: string;
  status: string;
  health: string;
  region: string | null;
  endpoint: string | null;
  description: string | null;
  owner_user_id: string | null;
  last_sync: string | null;
  next_sync: string | null;
  sync_schedule: string;
  last_diagnostic: string | null;
  created_at: string;
  updated_at: string;
};

export function mapConnectionRow(row: ConnectionRow, ownerLabel = "Admin"): SystemConnection {
  return {
    id: row.id,
    companyId: row.company_id,
    connectorId: row.connector_id,
    connectorName: row.connector_name,
    connectorType: row.connector_type as ConnectorCategoryId,
    authenticationType: row.authentication_type as AuthMethod,
    status: row.status as ConnectionStatus,
    health: row.health as ConnectionHealth,
    region: row.region,
    endpoint: row.endpoint,
    description: row.description,
    connectionName: row.connection_name,
    ownerUserId: row.owner_user_id,
    ownerLabel,
    lastSync: row.last_sync,
    nextSync: row.next_sync,
    syncSchedule: row.sync_schedule as SyncSchedule,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastDiagnostic: row.last_diagnostic,
  };
}

type SyncLogRow = {
  id: string;
  connection_id: string;
  imported_records: number;
  failed_records: number;
  duration_ms: number;
  status: string;
  log: string;
  created_at: string;
};

export function mapSyncLogRow(row: SyncLogRow): SyncLog {
  return {
    id: row.id,
    connectionId: row.connection_id,
    importedRecords: row.imported_records,
    failedRecords: row.failed_records,
    durationMs: row.duration_ms,
    status: row.status as SyncLog["status"],
    log: row.log,
    createdAt: row.created_at,
  };
}

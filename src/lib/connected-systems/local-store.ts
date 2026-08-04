import type {
  CompanyApiKey,
  ConnectPayload,
  ConnectionHealthSummary,
  SyncLog,
  SyncSchedule,
  SystemConnection,
} from "./types";
import { runConnectorSync, runConnectorTest } from "./adapters";
import { getConnectorById } from "./catalog";
import { nextSyncFromSchedule } from "./schedule";

const CONNECTIONS_KEY = "qlimwelt.connected_systems.connections";
const LOGS_KEY = "qlimwelt.connected_systems.sync_logs";
const INTEREST_KEY = "qlimwelt.connected_systems.interest";
const KEYS_KEY = "qlimwelt.connected_systems.api_keys";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return crypto.randomUUID();
}

export function localListConnections(companyId: string): SystemConnection[] {
  return readJson<SystemConnection[]>(CONNECTIONS_KEY, []).filter((c) => c.companyId === companyId);
}

export function localListSyncLogs(companyId: string): SyncLog[] {
  const ids = new Set(localListConnections(companyId).map((c) => c.id));
  return readJson<SyncLog[]>(LOGS_KEY, [])
    .filter((l) => ids.has(l.connectionId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function localListInterest(companyId: string): string[] {
  return readJson<Record<string, string[]>>(INTEREST_KEY, {})[companyId] ?? [];
}

export function localRequestInterest(companyId: string, connectorId: string) {
  const all = readJson<Record<string, string[]>>(INTEREST_KEY, {});
  const set = new Set(all[companyId] ?? []);
  set.add(connectorId);
  all[companyId] = [...set];
  writeJson(INTEREST_KEY, all);
}

export function localConnect(
  companyId: string,
  ownerUserId: string,
  ownerLabel: string,
  payload: ConnectPayload
): SystemConnection {
  const connector = getConnectorById(payload.connectorId);
  if (!connector) throw new Error("Unknown connector");

  const now = new Date().toISOString();
  const schedule = payload.syncSchedule ?? "daily";
  const conn: SystemConnection = {
    id: uid(),
    companyId,
    connectorId: connector.id,
    connectorName: connector.name,
    connectorType: connector.category,
    authenticationType: payload.authenticationType,
    status: "connected",
    health: "healthy",
    region: payload.region ?? null,
    endpoint: payload.endpoint ?? null,
    description: payload.description ?? null,
    connectionName: payload.connectionName || connector.name,
    ownerUserId,
    ownerLabel,
    lastSync: null,
    nextSync: nextSyncFromSchedule(schedule),
    syncSchedule: schedule,
    createdAt: now,
    updatedAt: now,
    lastDiagnostic: "Connection saved locally. Credentials are not stored in the browser.",
  };

  const all = readJson<SystemConnection[]>(CONNECTIONS_KEY, []);
  all.unshift(conn);
  writeJson(CONNECTIONS_KEY, all);
  return conn;
}

export function localDisconnect(companyId: string, connectionId: string) {
  const all = readJson<SystemConnection[]>(CONNECTIONS_KEY, []);
  const next = all.map((c) =>
    c.companyId === companyId && c.id === connectionId
      ? {
          ...c,
          status: "disconnected" as const,
          health: "disconnected" as const,
          updatedAt: new Date().toISOString(),
          lastDiagnostic: "Disconnected by user.",
        }
      : c
  );
  writeJson(CONNECTIONS_KEY, next);
}

export function localSync(companyId: string, connectionId: string): SyncLog {
  const all = readJson<SystemConnection[]>(CONNECTIONS_KEY, []);
  const idx = all.findIndex((c) => c.companyId === companyId && c.id === connectionId);
  if (idx < 0) throw new Error("Connection not found");
  const conn = all[idx];
  if (conn.status !== "connected") throw new Error("Connection is not active");

  const result = runConnectorSync({
    connectionId,
    connectorId: conn.connectorId,
    connectorName: conn.connectorName,
    connectorType: conn.connectorType,
    schedule: conn.syncSchedule,
  });
  const now = result.lastSync;
  const log: SyncLog = {
    id: uid(),
    connectionId,
    importedRecords: result.log.importedRecords,
    failedRecords: result.log.failedRecords,
    durationMs: result.log.durationMs,
    status: result.log.status,
    log: result.log.log,
    createdAt: now,
  };

  const logs = readJson<SyncLog[]>(LOGS_KEY, []);
  logs.unshift(log);
  writeJson(LOGS_KEY, logs.slice(0, 200));

  all[idx] = {
    ...conn,
    lastSync: now,
    nextSync: result.nextSync,
    health: result.health,
    updatedAt: now,
    lastDiagnostic: result.diagnostic,
  };
  writeJson(CONNECTIONS_KEY, all);
  return log;
}

export function localUpdateSchedule(companyId: string, connectionId: string, schedule: SyncSchedule) {
  const all = readJson<SystemConnection[]>(CONNECTIONS_KEY, []);
  writeJson(
    CONNECTIONS_KEY,
    all.map((c) =>
      c.companyId === companyId && c.id === connectionId
        ? {
            ...c,
            syncSchedule: schedule,
            nextSync: nextSyncFromSchedule(schedule),
            updatedAt: new Date().toISOString(),
          }
        : c
    )
  );
}

export function localHealth(companyId: string): ConnectionHealthSummary {
  const list = localListConnections(companyId);
  const summary: ConnectionHealthSummary = {
    healthy: 0,
    warning: 0,
    disconnected: 0,
    failed: 0,
    total: list.length,
  };
  for (const c of list) summary[c.health] += 1;
  return summary;
}

export function localListApiKeys(companyId: string): CompanyApiKey[] {
  return readJson<Array<CompanyApiKey & { companyId: string }>>(KEYS_KEY, []).filter(
    (k) => k.companyId === companyId && !k.revokedAt
  );
}

export function localCreateApiKey(companyId: string, name: string): { key: CompanyApiKey; raw: string } {
  const raw = `qw_local_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  const key: CompanyApiKey & { companyId: string } = {
    id: uid(),
    companyId,
    name: name || "Default key",
    keyPrefix: raw.slice(0, 10),
    createdAt: new Date().toISOString(),
    revokedAt: null,
  };
  const all = readJson<Array<CompanyApiKey & { companyId: string }>>(KEYS_KEY, []);
  all.unshift(key);
  writeJson(KEYS_KEY, all);
  return { key, raw };
}

export function localRevokeApiKey(companyId: string, keyId: string) {
  const all = readJson<Array<CompanyApiKey & { companyId: string }>>(KEYS_KEY, []);
  writeJson(
    KEYS_KEY,
    all.map((k) =>
      k.companyId === companyId && k.id === keyId
        ? { ...k, revokedAt: new Date().toISOString() }
        : k
    )
  );
}

export function localTestConnection(payload: ConnectPayload): { ok: boolean; message: string } {
  return runConnectorTest(payload);
}

export function localImportFile(
  companyId: string,
  ownerUserId: string,
  ownerLabel: string,
  fileName: string,
  connectorId = "csv"
): SyncLog {
  const existing = localListConnections(companyId).find(
    (c) => c.connectorId === connectorId && c.status === "connected"
  );
  const connection =
    existing ??
    localConnect(companyId, ownerUserId, ownerLabel, {
      connectorId,
      connectionName: `${getConnectorById(connectorId)?.name ?? "CSV"} Import`,
      authenticationType: "api_key",
      apiKey: "import-session",
      description: `Import source: ${fileName}`,
      syncSchedule: "manual",
    });
  return localSync(companyId, connection.id);
}

import {
  CONNECTOR_CATALOG,
  CONNECTOR_CATEGORIES,
} from "./catalog";
import {
  localConnect,
  localCreateApiKey,
  localDisconnect,
  localHealth,
  localImportFile,
  localListApiKeys,
  localListConnections,
  localListInterest,
  localListSyncLogs,
  localRequestInterest,
  localRevokeApiKey,
  localSync,
  localTestConnection,
  localUpdateSchedule,
} from "./local-store";
import type {
  CompanyApiKey,
  ConnectPayload,
  ConnectionHealthSummary,
  SyncLog,
  SyncSchedule,
  SystemConnection,
} from "./types";

async function tryJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchCatalog(companyId: string) {
  try {
    const res = await fetch("/api/connectors");
    if (res.ok) {
      const data = await tryJson<{
        categories: typeof CONNECTOR_CATEGORIES;
        connectors: typeof CONNECTOR_CATALOG;
        interested: string[];
      }>(res);
      if (data) return data;
    }
  } catch {
    /* local fallback */
  }
  return {
    categories: CONNECTOR_CATEGORIES,
    connectors: CONNECTOR_CATALOG,
    interested: localListInterest(companyId),
  };
}

export async function fetchConnections(companyId: string): Promise<SystemConnection[]> {
  try {
    const res = await fetch("/api/connections");
    if (res.ok) {
      const data = await tryJson<{ connections: SystemConnection[] }>(res);
      if (data?.connections) return data.connections;
    }
  } catch {
    /* local */
  }
  return localListConnections(companyId);
}

export async function fetchSyncLogs(companyId: string): Promise<SyncLog[]> {
  try {
    const res = await fetch("/api/sync-logs");
    if (res.ok) {
      const data = await tryJson<{ logs: SyncLog[] }>(res);
      if (data?.logs) return data.logs;
    }
  } catch {
    /* local */
  }
  return localListSyncLogs(companyId);
}

export async function fetchHealth(companyId: string): Promise<ConnectionHealthSummary> {
  try {
    const res = await fetch("/api/connection-health");
    if (res.ok) {
      const data = await tryJson<{ health: ConnectionHealthSummary }>(res);
      if (data?.health) return data.health;
    }
  } catch {
    /* local */
  }
  return localHealth(companyId);
}

export async function testConnection(payload: ConnectPayload) {
  try {
    const res = await fetch("/api/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await tryJson<{ ok: boolean; message: string }>(res);
    if (data) return data;
  } catch {
    /* local */
  }
  return localTestConnection(payload);
}

export async function connectSystem(
  companyId: string,
  ownerUserId: string,
  ownerLabel: string,
  payload: ConnectPayload
): Promise<{ connection?: SystemConnection; error?: string; code?: string }> {
  try {
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await tryJson<{ connection?: SystemConnection; error?: string; code?: string }>(res);
    if (res.ok && data?.connection) return { connection: data.connection };
    if (res.status !== 401 && res.status !== 503) {
      return { error: data?.error ?? "Failed to connect" };
    }
  } catch {
    /* local */
  }
  try {
    return { connection: localConnect(companyId, ownerUserId, ownerLabel, payload) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to connect" };
  }
}

export async function disconnectSystem(companyId: string, connectionId: string) {
  try {
    const res = await fetch("/api/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionId }),
    });
    if (res.ok) return;
  } catch {
    /* local */
  }
  localDisconnect(companyId, connectionId);
}

export async function syncConnection(companyId: string, connectionId: string): Promise<SyncLog> {
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionId }),
    });
    if (res.ok) {
      const data = await tryJson<{ log: SyncLog }>(res);
      if (data?.log) return data.log;
    }
  } catch {
    /* local */
  }
  return localSync(companyId, connectionId);
}

export async function requestEarlyAccess(companyId: string, connectorId: string, note?: string) {
  try {
    const res = await fetch("/api/connector-interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectorId, note }),
    });
    if (res.ok) return;
  } catch {
    /* local */
  }
  localRequestInterest(companyId, connectorId);
}

export async function updateSchedule(
  companyId: string,
  connectionId: string,
  schedule: SyncSchedule
) {
  try {
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "schedule", connectionId, syncSchedule: schedule }),
    });
    if (res.ok) return;
  } catch {
    /* local */
  }
  localUpdateSchedule(companyId, connectionId, schedule);
}

/** @deprecated use updateSchedule */
export async function updateScheduleLocal(
  companyId: string,
  connectionId: string,
  schedule: SyncSchedule
) {
  return updateSchedule(companyId, connectionId, schedule);
}

export async function importFile(
  companyId: string,
  ownerUserId: string,
  ownerLabel: string,
  fileName: string,
  connectorId = "csv"
): Promise<SyncLog> {
  try {
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, connectorId }),
    });
    if (res.ok) {
      const data = await tryJson<{ log: SyncLog }>(res);
      if (data?.log) return data.log;
    }
  } catch {
    /* local */
  }
  return localImportFile(companyId, ownerUserId, ownerLabel, fileName, connectorId);
}

export async function fetchApiKeys(companyId: string): Promise<CompanyApiKey[]> {
  try {
    const res = await fetch("/api/company-api-keys");
    if (res.ok) {
      const data = await tryJson<{ keys: CompanyApiKey[] }>(res);
      if (data?.keys) return data.keys;
    }
  } catch {
    /* local */
  }
  return localListApiKeys(companyId);
}

export async function createApiKey(
  companyId: string,
  name: string
): Promise<{ key: CompanyApiKey; raw: string }> {
  try {
    const res = await fetch("/api/company-api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await tryJson<{ key: CompanyApiKey; raw: string }>(res);
      if (data?.key && data.raw) return data;
    }
  } catch {
    /* local */
  }
  return localCreateApiKey(companyId, name);
}

export async function revokeApiKey(companyId: string, keyId: string) {
  try {
    const res = await fetch("/api/company-api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke", keyId }),
    });
    if (res.ok) return;
  } catch {
    /* local */
  }
  localRevokeApiKey(companyId, keyId);
}

export const QAI_OPEN_EVENT = "qlimwelt:open-qai";

export function openQaiAssistant(prompt?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(QAI_OPEN_EVENT, { detail: { prompt } }));
}

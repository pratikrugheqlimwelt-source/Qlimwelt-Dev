import type { ExportAuthContext } from "@/lib/export/auth";
import { getConnectorById } from "./catalog";
import { encryptCredentials } from "./crypto";
import { mapConnectionRow, mapSyncLogRow } from "./map-row";
import { nextSyncFromSchedule } from "./schedule";
import { runConnectorSync, runConnectorTest, validateConnectPayload } from "./adapters";
import type { ConnectPayload, SyncSchedule, SystemConnection, SyncLog } from "./types";

export async function listConnections(ctx: ExportAuthContext): Promise<SystemConnection[]> {
  const { data, error } = await ctx.supabase
    .from("system_connections")
    .select("*")
    .eq("company_id", ctx.companyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapConnectionRow(row as never));
}

export async function createConnection(
  ctx: ExportAuthContext,
  payload: ConnectPayload
): Promise<SystemConnection> {
  const connector = getConnectorById(payload.connectorId);
  if (!connector) throw new Error("Unknown connector.");
  const validation = validateConnectPayload(payload, connector);
  if (!validation.ok) throw new Error(validation.message);

  const creds: Record<string, string> = {};
  if (payload.apiKey) creds.apiKey = payload.apiKey;
  if (payload.clientSecret) creds.clientSecret = payload.clientSecret;
  const encrypted = Object.keys(creds).length ? encryptCredentials(creds) : null;
  const schedule = (payload.syncSchedule ?? "daily") as SyncSchedule;

  const { data, error } = await ctx.supabase
    .from("system_connections")
    .insert({
      company_id: ctx.companyId,
      connector_id: connector.id,
      connector_name: connector.name,
      connector_type: connector.category,
      authentication_type: payload.authenticationType ?? "api_key",
      encrypted_credentials: encrypted,
      connection_name: payload.connectionName.trim(),
      status: "connected",
      health: "healthy",
      region: payload.region ?? null,
      endpoint: payload.endpoint ?? null,
      description: payload.description ?? null,
      owner_user_id: ctx.userId,
      sync_schedule: schedule,
      next_sync: nextSyncFromSchedule(schedule),
      last_diagnostic: `${connector.name} connected. Credentials encrypted with AES-256-GCM.`,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapConnectionRow(data as never);
}

export async function disconnectConnection(ctx: ExportAuthContext, connectionId: string) {
  const { data, error } = await ctx.supabase
    .from("system_connections")
    .update({
      status: "disconnected",
      health: "disconnected",
      encrypted_credentials: null,
      last_diagnostic: "Disconnected by user. Credentials removed.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .eq("company_id", ctx.companyId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapConnectionRow(data as never);
}

export async function syncConnectionService(
  ctx: ExportAuthContext,
  connectionId: string
): Promise<SyncLog> {
  const { data: conn, error: connError } = await ctx.supabase
    .from("system_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("company_id", ctx.companyId)
    .maybeSingle();
  if (connError || !conn) throw new Error("Connection not found.");
  if (conn.status !== "connected") throw new Error("Connection is not active.");

  const result = runConnectorSync({
    connectionId,
    connectorId: conn.connector_id as string,
    connectorName: conn.connector_name as string,
    connectorType: conn.connector_type as string,
    schedule: conn.sync_schedule as SyncSchedule,
  });

  const { data: log, error: logError } = await ctx.supabase
    .from("sync_logs")
    .insert({
      connection_id: connectionId,
      company_id: ctx.companyId,
      imported_records: result.log.importedRecords,
      failed_records: result.log.failedRecords,
      duration_ms: result.log.durationMs,
      status: result.log.status,
      log: result.log.log,
    })
    .select("*")
    .single();
  if (logError) throw new Error(logError.message);

  await ctx.supabase
    .from("system_connections")
    .update({
      last_sync: result.lastSync,
      next_sync: result.nextSync,
      health: result.health,
      last_diagnostic: result.diagnostic,
      updated_at: result.lastSync,
    })
    .eq("id", connectionId)
    .eq("company_id", ctx.companyId);

  return mapSyncLogRow(log as never);
}

export async function updateScheduleService(
  ctx: ExportAuthContext,
  connectionId: string,
  schedule: SyncSchedule
) {
  const { data, error } = await ctx.supabase
    .from("system_connections")
    .update({
      sync_schedule: schedule,
      next_sync: nextSyncFromSchedule(schedule),
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .eq("company_id", ctx.companyId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapConnectionRow(data as never);
}

export function testConnectionService(payload: ConnectPayload) {
  return runConnectorTest(payload);
}

import type { ConnectPayload, ConnectorDef, SyncLog, SyncSchedule } from "./types";
import { getConnectorById } from "./catalog";
import { nextSyncFromSchedule } from "./schedule";

/** Per-category simulated data domains pulled during sync. */
const CATEGORY_DATASETS: Record<string, string[]> = {
  erp: ["invoices", "purchase_orders", "gl_entries", "cost_centers"],
  accounting: ["ledger_lines", "expense_claims", "tax_reports"],
  procurement: ["purchase_orders", "supplier_spend", "contracts"],
  cloud: ["usage_hours", "egress_gb", "compute_instances"],
  energy: ["kwh_intervals", "utility_bills", "meter_readings"],
  logistics: ["shipments", "tonne_km", "fuel_cards"],
  hr: ["headcount", "commute_surveys", "office_assignments"],
  travel: ["flights", "hotels", "rail_trips"],
  manufacturing: ["machine_hours", "process_fuels", "scrap_rates"],
  documents: ["rows", "sheets", "attachments"],
  future: ["transactions", "registry_lots", "crm_accounts"],
};

export function validateConnectPayload(
  payload: ConnectPayload,
  connector?: ConnectorDef
): { ok: true } | { ok: false; message: string } {
  const def = connector ?? getConnectorById(payload.connectorId);
  if (!def) return { ok: false, message: "Unknown connector." };
  if (!payload.connectionName?.trim()) {
    return { ok: false, message: "Connection name is required." };
  }
  if (payload.authenticationType === "api_key" && !payload.apiKey?.trim()) {
    return { ok: false, message: "API key is required for this auth method." };
  }
  if (payload.authenticationType === "client_secret" && !payload.clientSecret?.trim()) {
    return { ok: false, message: "Client secret is required for this auth method." };
  }
  if (payload.authenticationType === "oauth" && !payload.endpoint?.trim()) {
    return { ok: false, message: "OAuth authorization endpoint is required." };
  }
  return { ok: true };
}

export function runConnectorTest(
  payload: ConnectPayload
): { ok: boolean; message: string; latencyMs: number } {
  const connector = getConnectorById(payload.connectorId);
  const validation = validateConnectPayload(payload, connector);
  if (!validation.ok) {
    return { ok: false, message: validation.message, latencyMs: 0 };
  }
  const latencyMs = 180 + Math.floor(Math.random() * 420);
  const region = payload.region?.trim() || "eu-central-1";
  return {
    ok: true,
    message: `${connector!.name} reachable in ${region} (${latencyMs}ms). Auth method: ${payload.authenticationType}.`,
    latencyMs,
  };
}

export function runConnectorSync(input: {
  connectionId: string;
  connectorId: string;
  connectorName: string;
  connectorType: string;
  schedule: SyncSchedule;
}): {
  log: Omit<SyncLog, "id" | "createdAt"> & { createdAt?: string };
  health: "healthy" | "warning";
  lastSync: string;
  nextSync: string | null;
  diagnostic: string;
} {
  const datasets = CATEGORY_DATASETS[input.connectorType] ?? ["records"];
  const imported = 60 + Math.floor(Math.random() * 240);
  const failed = Math.random() > 0.88 ? Math.floor(Math.random() * 5) : 0;
  const durationMs = 900 + Math.floor(Math.random() * 2600);
  const now = new Date().toISOString();
  const status = failed > 0 ? ("warning" as const) : ("success" as const);
  const sample = datasets.slice(0, 2).join(", ");
  const diagnostic =
    failed > 0
      ? `${input.connectorName}: imported ${imported} ${sample} with ${failed} validation warnings.`
      : `${input.connectorName}: synced ${imported} records (${sample}) in ${(durationMs / 1000).toFixed(1)}s.`;

  return {
    log: {
      connectionId: input.connectionId,
      importedRecords: imported,
      failedRecords: failed,
      durationMs,
      status,
      log: diagnostic,
    },
    health: failed > 0 ? "warning" : "healthy",
    lastSync: now,
    nextSync: nextSyncFromSchedule(input.schedule, new Date(now)),
    diagnostic,
  };
}

export function defaultEndpointFor(connectorId: string): string {
  return `https://api.${connectorId.replace(/_/g, "-")}.example.com/v1`;
}

import { NextRequest, NextResponse } from "next/server";
import { getConnectorById } from "@/lib/connected-systems/catalog";
import { createConnection, syncConnectionService } from "@/lib/connected-systems/service";
import { requireCompanyAuth } from "@/lib/export/auth";

/**
 * Import Center backend: ensure a document connector exists, then run a sync
 * representing the uploaded file batch.
 */
export async function POST(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    fileName?: string;
    connectorId?: string;
    rowCount?: number;
  };

  const connectorId = body.connectorId || "csv";
  const connector = getConnectorById(connectorId);
  if (!connector || connector.category !== "documents") {
    return NextResponse.json({ error: "Use a documents connector for imports." }, { status: 400 });
  }

  try {
    const { data: existing } = await auth.ctx.supabase
      .from("system_connections")
      .select("*")
      .eq("company_id", auth.ctx.companyId)
      .eq("connector_id", connectorId)
      .eq("status", "connected")
      .maybeSingle();

    let connectionId = existing?.id as string | undefined;
    if (!connectionId) {
      const created = await createConnection(auth.ctx, {
        connectorId,
        connectionName: `${connector.name} Import`,
        authenticationType: "api_key",
        apiKey: "import-session",
        description: body.fileName ? `Import source: ${body.fileName}` : "Import Center",
        syncSchedule: "manual",
      });
      connectionId = created.id;
    }

    const log = await syncConnectionService(auth.ctx, connectionId);
    return NextResponse.json({
      ok: true,
      connectionId,
      log,
      fileName: body.fileName ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Import failed",
        hint: "Apply migration 007_connected_systems.sql",
      },
      { status: 503 }
    );
  }
}

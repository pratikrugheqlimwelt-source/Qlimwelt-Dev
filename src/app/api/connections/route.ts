import { NextRequest, NextResponse } from "next/server";
import type { ConnectPayload, SyncSchedule } from "@/lib/connected-systems/types";
import {
  createConnection,
  listConnections,
  updateScheduleService,
} from "@/lib/connected-systems/service";
import { requireCompanyAuth } from "@/lib/export/auth";

export async function GET() {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  try {
    const connections = await listConnections(auth.ctx);
    return NextResponse.json({ connections });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to list connections",
        hint: "Apply migration 007_connected_systems.sql",
      },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as ConnectPayload & {
    action?: string;
    connectionId?: string;
    syncSchedule?: SyncSchedule;
  };

  if (body.action === "schedule" && body.connectionId && body.syncSchedule) {
    try {
      const connection = await updateScheduleService(
        auth.ctx,
        body.connectionId,
        body.syncSchedule
      );
      return NextResponse.json({ connection });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Failed to update schedule" },
        { status: 503 }
      );
    }
  }

  try {
    const connection = await createConnection(auth.ctx, body);
    return NextResponse.json({ connection }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to connect";
    const status = message.includes("required") || message.includes("Unknown") ? 400 : 503;
    return NextResponse.json(
      { error: message, hint: status === 503 ? "Apply migration 007_connected_systems.sql" : undefined },
      { status }
    );
  }
}

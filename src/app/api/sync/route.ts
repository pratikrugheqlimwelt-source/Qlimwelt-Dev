import { NextRequest, NextResponse } from "next/server";
import { syncConnectionService } from "@/lib/connected-systems/service";
import { requireCompanyAuth } from "@/lib/export/auth";

export async function POST(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const { connectionId } = (await request.json()) as { connectionId?: string };
  if (!connectionId) {
    return NextResponse.json({ error: "connectionId is required." }, { status: 400 });
  }

  try {
    const log = await syncConnectionService(auth.ctx, connectionId);
    return NextResponse.json({ log });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    const status = message.includes("not found") || message.includes("not active") ? 400 : 503;
    return NextResponse.json({ error: message }, { status });
  }
}

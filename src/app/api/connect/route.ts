import { NextRequest, NextResponse } from "next/server";
import type { ConnectPayload } from "@/lib/connected-systems/types";
import { createConnection } from "@/lib/connected-systems/service";
import { requireCompanyAuth } from "@/lib/export/auth";

/** Alias for POST /api/connections — create an active connector. */
export async function POST(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as ConnectPayload;
  try {
    const connection = await createConnection(auth.ctx, body);
    return NextResponse.json({ connection }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to connect";
    const status = message.includes("required") || message.includes("Unknown") ? 400 : 503;
    return NextResponse.json({ error: message }, { status });
  }
}

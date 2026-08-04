import { NextRequest, NextResponse } from "next/server";
import { disconnectConnection } from "@/lib/connected-systems/service";
import { requireCompanyAuth } from "@/lib/export/auth";

export async function POST(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const { connectionId } = (await request.json()) as { connectionId?: string };
  if (!connectionId) {
    return NextResponse.json({ error: "connectionId is required." }, { status: 400 });
  }

  try {
    const connection = await disconnectConnection(auth.ctx, connectionId);
    return NextResponse.json({ connection });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Disconnect failed" },
      { status: 503 }
    );
  }
}

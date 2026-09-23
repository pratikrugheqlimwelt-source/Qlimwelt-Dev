import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localListAuditEvents } from "@/lib/bom/carbon/local-service";

export async function GET(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const sp = request.nextUrl.searchParams;
  const limitRaw = sp.get("limit");
  try {
    const events = localListAuditEvents(auth.ctx.companyId, {
      entityType: sp.get("entityType") ?? undefined,
      entityId: sp.get("entityId") ?? undefined,
      limit: limitRaw ? Number(limitRaw) : 50,
    });
    return NextResponse.json({ events });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list audit events" },
      { status: 503 }
    );
  }
}

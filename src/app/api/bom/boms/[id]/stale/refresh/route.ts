import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localRefreshStaleFlags } from "@/lib/bom/carbon/local-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id: bomId } = await context.params;
  try {
    const calculations = localRefreshStaleFlags(auth.ctx.companyId, bomId);
    return NextResponse.json({ calculations });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Stale refresh failed" },
      { status: 400 }
    );
  }
}

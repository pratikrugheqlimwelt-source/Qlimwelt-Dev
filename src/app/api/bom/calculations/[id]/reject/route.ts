import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localRejectCalculation } from "@/lib/bom/carbon/local-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { notes?: string };
  try {
    const calculation = localRejectCalculation(auth.ctx.companyId, id, {
      notes: body.notes,
      actorId: auth.ctx.userId,
    });
    return NextResponse.json({ calculation });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reject failed" },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localApproveCalculation } from "@/lib/bom/carbon/local-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { notes?: string };
  try {
    const calculation = localApproveCalculation(auth.ctx.companyId, id, {
      approvedBy: auth.ctx.userId,
      notes: body.notes,
    });
    return NextResponse.json({ calculation });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Approve failed" },
      { status: 400 }
    );
  }
}

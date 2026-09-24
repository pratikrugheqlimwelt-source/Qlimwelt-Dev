import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localRunCalculation } from "@/lib/bom/carbon/local-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id: bomId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    productId?: string | null;
    assessmentId?: string | null;
    requireApproved?: boolean;
  };
  try {
    const calculation = localRunCalculation(auth.ctx.companyId, {
      bomId,
      productId: body.productId,
      assessmentId: body.assessmentId,
      requireApproved: body.requireApproved,
      createdBy: auth.ctx.userId,
    });
    return NextResponse.json({ calculation });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Calculation failed",
        hint: "Approve item mappings first, or set requireApproved=false",
      },
      { status: 400 }
    );
  }
}

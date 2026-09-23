import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localRunScenario } from "@/lib/bom/carbon/local-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      productId?: string | null;
      requireApproved?: boolean;
    };
    const result = localRunScenario(auth.ctx.companyId, id, {
      productId: body.productId,
      requireApproved: body.requireApproved,
      createdBy: auth.ctx.userId,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to run scenario" },
      { status: 503 }
    );
  }
}

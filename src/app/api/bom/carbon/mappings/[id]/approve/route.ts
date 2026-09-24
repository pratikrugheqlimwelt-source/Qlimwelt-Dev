import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localApproveMapping } from "@/lib/bom/carbon/local-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    const mapping = localApproveMapping(auth.ctx.companyId, id, auth.ctx.userId);
    return NextResponse.json({ mapping });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Approve failed" },
      { status: 400 }
    );
  }
}

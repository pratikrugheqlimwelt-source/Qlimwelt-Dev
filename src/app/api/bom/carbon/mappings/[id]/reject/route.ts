import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localRejectMapping } from "@/lib/bom/carbon/local-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    const mapping = localRejectMapping(auth.ctx.companyId, id);
    return NextResponse.json({ mapping });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reject failed" },
      { status: 400 }
    );
  }
}

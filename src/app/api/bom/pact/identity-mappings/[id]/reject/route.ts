import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { rejectIdentityMapping } from "@/lib/bom/carbon/pact/identity/mapping-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;

  try {
    const mapping = rejectIdentityMapping(auth.ctx.companyId, id);
    return NextResponse.json({ mapping });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reject failed" },
      { status: 400 }
    );
  }
}

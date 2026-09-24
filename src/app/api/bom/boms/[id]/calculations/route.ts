import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localListCalculations } from "@/lib/bom/carbon/local-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id: bomId } = await context.params;
  try {
    return NextResponse.json({
      calculations: localListCalculations(auth.ctx.companyId, bomId),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list calculations" },
      { status: 503 }
    );
  }
}

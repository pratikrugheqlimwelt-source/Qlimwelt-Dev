import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { ensureCarbonLibrary, localListFactors } from "@/lib/bom/carbon/local-service";

export async function GET() {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  try {
    ensureCarbonLibrary(auth.ctx.companyId);
    return NextResponse.json({ factors: localListFactors(auth.ctx.companyId) });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to list factors",
        hint: "Apply migration 009_bom_carbon.sql",
      },
      { status: 503 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localCompareCalculations } from "@/lib/bom/carbon/local-service";

export async function GET(request: Request) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const leftId = url.searchParams.get("left");
  const rightId = url.searchParams.get("right");
  if (!leftId || !rightId) {
    return NextResponse.json(
      { error: "Query params left and right (calculation ids) are required" },
      { status: 400 }
    );
  }
  try {
    const comparison = localCompareCalculations(auth.ctx.companyId, leftId, rightId);
    return NextResponse.json({ comparison });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to compare calculations" },
      { status: 503 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localGetBomAnalytics } from "@/lib/bom/carbon/local-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id: bomId } = await context.params;
  const url = new URL(request.url);
  const calculationId = url.searchParams.get("calculationId") ?? undefined;
  try {
    const analytics = localGetBomAnalytics(auth.ctx.companyId, bomId, calculationId);
    if (!analytics) {
      return NextResponse.json({ error: "No calculation available for analytics" }, { status: 404 });
    }
    return NextResponse.json({ analytics });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load analytics" },
      { status: 503 }
    );
  }
}

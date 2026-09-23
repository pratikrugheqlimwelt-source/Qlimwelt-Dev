import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { dbGetBom } from "@/lib/bom/db-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    const bom = await dbGetBom(auth.ctx, id);
    if (!bom) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ bom });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to load BOM",
        hint: "Apply migration 008_products_bom.sql",
      },
      { status: 503 }
    );
  }
}

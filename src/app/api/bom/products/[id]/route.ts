import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { dbGetProductBundle } from "@/lib/bom/db-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    const bundle = await dbGetProductBundle(auth.ctx, id);
    if (!bundle) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(bundle);
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to load product",
        hint: "Apply migration 008_products_bom.sql",
      },
      { status: 503 }
    );
  }
}

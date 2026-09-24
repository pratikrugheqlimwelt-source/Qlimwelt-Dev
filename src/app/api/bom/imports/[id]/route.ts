import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { dbGetImportJob } from "@/lib/bom/db-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    const job = await dbGetImportJob(auth.ctx, id);
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ job });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to load import job",
        hint: "Apply migration 008_products_bom.sql",
      },
      { status: 503 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { dbCommitImport } from "@/lib/bom/db-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    const result = await dbCommitImport(auth.ctx, id);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Commit failed";
    const status =
      message.toLowerCase().includes("blocking") || message.toLowerCase().includes("invalid")
        ? 400
        : 503;
    return NextResponse.json(
      {
        error: message,
        hint: status === 503 ? "Apply migration 008_products_bom.sql" : undefined,
      },
      { status }
    );
  }
}

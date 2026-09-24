import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localAcceptSupplierPcfRecord } from "@/lib/bom/carbon/pact/import";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;

  let body: { bomItemId?: string; notes?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.bomItemId?.trim()) {
    return NextResponse.json(
      { error: "bomItemId is required" },
      { status: 400 }
    );
  }

  try {
    const record = localAcceptSupplierPcfRecord(auth.ctx.companyId, id, {
      bomItemId: body.bomItemId.trim(),
      acceptedBy: auth.ctx.userId,
      notes: body.notes ?? null,
    });
    return NextResponse.json({ record });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Accept failed" },
      { status: 400 }
    );
  }
}

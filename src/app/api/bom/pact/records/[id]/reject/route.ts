import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localRejectSupplierPcfRecord } from "@/lib/bom/carbon/pact/import";
import { mirrorSupplierPcfRecordToDb } from "@/lib/bom/carbon/pact/persist";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    const record = localRejectSupplierPcfRecord(auth.ctx.companyId, id);
    await mirrorSupplierPcfRecordToDb(auth.ctx, record);
    return NextResponse.json({ record });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reject failed" },
      { status: 400 }
    );
  }
}

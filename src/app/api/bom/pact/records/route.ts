import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localListSupplierPcfRecords } from "@/lib/bom/carbon/pact/store";
import type { SupplierPcfRecord } from "@/lib/bom/carbon/pact/types";

export async function GET(request: Request) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as SupplierPcfRecord["status"] | null;

  const records = localListSupplierPcfRecords(auth.ctx.companyId, {
    status: status || undefined,
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ records });
}

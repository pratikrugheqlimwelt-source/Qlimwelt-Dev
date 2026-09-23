import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import {
  localCreateSupplierPcfRequest,
  localListSupplierPcfRequests,
  localSendSupplierPcfRequest,
} from "@/lib/bom/carbon/local-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id: bomId } = await context.params;
  try {
    return NextResponse.json({
      requests: localListSupplierPcfRequests(auth.ctx.companyId, bomId),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list supplier PCF requests" },
      { status: 503 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id: bomId } = await context.params;
  try {
    const body = (await request.json()) as {
      bomItemId?: string;
      supplierName?: string;
      supplierEmail?: string | null;
      message?: string | null;
      send?: boolean;
    };
    if (!body.bomItemId?.trim()) {
      return NextResponse.json({ error: "bomItemId is required" }, { status: 400 });
    }
    if (!body.supplierName?.trim()) {
      return NextResponse.json({ error: "supplierName is required" }, { status: 400 });
    }
    let created = localCreateSupplierPcfRequest(auth.ctx.companyId, {
      bomId,
      bomItemId: body.bomItemId,
      supplierName: body.supplierName,
      supplierEmail: body.supplierEmail,
      message: body.message,
    });
    if (body.send) {
      created = localSendSupplierPcfRequest(auth.ctx.companyId, created.id);
    }
    return NextResponse.json({ request: created });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create supplier PCF request" },
      { status: 503 }
    );
  }
}

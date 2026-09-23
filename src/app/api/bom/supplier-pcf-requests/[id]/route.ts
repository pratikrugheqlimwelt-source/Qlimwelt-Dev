import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import {
  localApproveSupplierPcfRequest,
  localCancelSupplierPcfRequest,
  localGetSupplierPcfRequest,
  localRejectSupplierPcfRequest,
  localSendSupplierPcfRequest,
} from "@/lib/bom/carbon/local-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const request = localGetSupplierPcfRequest(auth.ctx.companyId, id);
  if (!request) {
    return NextResponse.json({ error: "Supplier PCF request not found" }, { status: 404 });
  }
  return NextResponse.json({ request });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    const body = (await request.json()) as {
      action?: "send" | "cancel" | "approve" | "reject";
      reviewNotes?: string | null;
    };
    const action = body.action;
    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    let updated;
    if (action === "send") {
      updated = localSendSupplierPcfRequest(auth.ctx.companyId, id);
    } else if (action === "cancel") {
      updated = localCancelSupplierPcfRequest(auth.ctx.companyId, id);
    } else if (action === "approve") {
      updated = localApproveSupplierPcfRequest(auth.ctx.companyId, id, {
        reviewedBy: auth.ctx.userId,
        reviewNotes: body.reviewNotes,
      });
    } else if (action === "reject") {
      updated = localRejectSupplierPcfRequest(auth.ctx.companyId, id, {
        reviewedBy: auth.ctx.userId,
        reviewNotes: body.reviewNotes,
      });
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ request: updated });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update supplier PCF request" },
      { status: 503 }
    );
  }
}

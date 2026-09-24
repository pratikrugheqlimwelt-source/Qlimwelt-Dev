import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { confirmIdentityMappingPersisted } from "@/lib/bom/carbon/pact/identity/mapping-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;

  let body: { productId?: string | null; bomItemId?: string | null } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  try {
    const mapping = await confirmIdentityMappingPersisted(auth.ctx, id, {
      productId: body.productId,
      bomItemId: body.bomItemId,
    });
    return NextResponse.json({ mapping });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Confirm failed" },
      { status: 400 }
    );
  }
}

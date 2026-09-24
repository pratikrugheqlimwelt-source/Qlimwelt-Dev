import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import {
  ensureCarbonLibrary,
  localListMappings,
  localUpsertMapping,
} from "@/lib/bom/carbon/local-service";

export async function GET(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const bomId = request.nextUrl.searchParams.get("bomId") ?? undefined;
  try {
    ensureCarbonLibrary(auth.ctx.companyId);
    return NextResponse.json({
      mappings: localListMappings(auth.ctx.companyId, bomId),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list mappings" },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const body = (await request.json()) as {
    bomItemId?: string;
    emissionFactorId?: string;
    confidence?: number;
    matchReason?: string;
    status?: "suggested" | "approved" | "rejected" | "stale";
  };
  if (!body.bomItemId || !body.emissionFactorId) {
    return NextResponse.json(
      { error: "bomItemId and emissionFactorId are required" },
      { status: 400 }
    );
  }
  try {
    const mapping = localUpsertMapping(auth.ctx.companyId, {
      bomItemId: body.bomItemId,
      emissionFactorId: body.emissionFactorId,
      confidence: body.confidence,
      matchReason: body.matchReason,
      status: body.status,
    });
    return NextResponse.json({ mapping });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to upsert mapping" },
      { status: 503 }
    );
  }
}

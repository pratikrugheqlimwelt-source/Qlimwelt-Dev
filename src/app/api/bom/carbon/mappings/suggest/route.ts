import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localSuggestForItem } from "@/lib/bom/carbon/local-service";
import type { BomItem } from "@/lib/bom/types";

export async function POST(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const body = (await request.json()) as { item?: BomItem };
  if (!body.item) {
    return NextResponse.json({ error: "item is required" }, { status: 400 });
  }
  try {
    return NextResponse.json({
      suggestions: localSuggestForItem(auth.ctx.companyId, body.item),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Suggest failed" },
      { status: 503 }
    );
  }
}

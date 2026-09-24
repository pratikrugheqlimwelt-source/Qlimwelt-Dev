import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localListPactExchanges } from "@/lib/bom/carbon/pact/store";
import type { PactExchange } from "@/lib/bom/carbon/pact/types";

export async function GET(request: Request) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction") as PactExchange["direction"] | null;
  const kind = searchParams.get("kind") as PactExchange["kind"] | null;

  const exchanges = localListPactExchanges(auth.ctx.companyId, {
    direction: direction || undefined,
    kind: kind || undefined,
  });
  return NextResponse.json({ exchanges });
}

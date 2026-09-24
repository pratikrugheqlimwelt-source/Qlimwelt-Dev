import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import {
  localAssessExchangeReadiness,
  localExportReadiness,
} from "@/lib/bom/carbon/local-service";
import type { ReadinessFormat } from "@/lib/bom/carbon/readiness";

const FORMATS = new Set<ReadinessFormat>(["pact", "catena_x", "dpp"]);

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id: calculationId } = await context.params;
  const url = new URL(request.url);
  const format = url.searchParams.get("format") as ReadinessFormat | null;

  try {
    if (!format) {
      const readiness = localAssessExchangeReadiness(auth.ctx.companyId, calculationId);
      return NextResponse.json({ readiness });
    }
    if (!FORMATS.has(format)) {
      return NextResponse.json(
        { error: "format must be pact | catena_x | dpp" },
        { status: 400 }
      );
    }
    const bundle = localExportReadiness(auth.ctx.companyId, calculationId, format);
    return NextResponse.json(bundle);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Readiness export failed" },
      { status: 400 }
    );
  }
}

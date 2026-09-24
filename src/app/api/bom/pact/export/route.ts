import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localExportPactV3 } from "@/lib/bom/carbon/pact/export";
import { getExchange } from "@/lib/bom/carbon/pact/exchange/service";
import { mirrorPactExchangeToDb } from "@/lib/bom/carbon/pact/persist";

export async function POST(request: Request) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  let body: { calculationId?: string; companyName?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const calculationId = body.calculationId?.trim();
  if (!calculationId) {
    return NextResponse.json(
      { error: "calculationId is required" },
      { status: 400 }
    );
  }

  try {
    const bundle = localExportPactV3(auth.ctx.companyId, calculationId, {
      companyName: body.companyName ?? null,
    });
    const exchange = getExchange(auth.ctx.companyId, bundle.exchangeId);
    if (exchange) {
      await mirrorPactExchangeToDb(auth.ctx, exchange);
    }
    return NextResponse.json({
      footprint: bundle.footprint,
      exchangeId: bundle.exchangeId,
      schemaOk: bundle.schema.ok,
      semanticsOk: bundle.semantics.ok,
    });
  } catch (e) {
    const err = e as Error & {
      issues?: Array<{ path: string; message: string; category: string }>;
      exchangeId?: string;
    };
    if (err.exchangeId) {
      const exchange = getExchange(auth.ctx.companyId, err.exchangeId);
      if (exchange) {
        await mirrorPactExchangeToDb(auth.ctx, exchange);
      }
    }
    const status =
      err.message === "Calculation not found"
        ? 404
        : Array.isArray(err.issues)
          ? 422
          : 400;
    return NextResponse.json(
      {
        error: err.message || "PACT export failed",
        issues: err.issues ?? [],
        exchangeId: err.exchangeId,
      },
      { status }
    );
  }
}

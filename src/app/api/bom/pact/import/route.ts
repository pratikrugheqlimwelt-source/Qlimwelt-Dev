import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localImportPactV3 } from "@/lib/bom/carbon/pact/import";

export async function POST(request: Request) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  let body: { footprint?: unknown; idempotencyKey?: string; supplierId?: string } =
    {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const footprint = body.footprint ?? body;
  try {
    const bundle = localImportPactV3(auth.ctx.companyId, footprint, {
      idempotencyKey: body.idempotencyKey,
      supplierId: body.supplierId ?? null,
    });
    return NextResponse.json({
      record: bundle.record,
      candidates: bundle.candidates,
      exchangeId: bundle.exchangeId,
      schemaOk: bundle.schema.ok,
      semanticsOk: bundle.semantics.ok,
      semanticIssues: bundle.semantics.issues,
    });
  } catch (e) {
    const err = e as Error & {
      issues?: unknown[];
      exchangeId?: string;
    };
    return NextResponse.json(
      {
        error: err.message || "PACT import failed",
        issues: err.issues ?? [],
        exchangeId: err.exchangeId,
      },
      { status: Array.isArray(err.issues) ? 422 : 400 }
    );
  }
}

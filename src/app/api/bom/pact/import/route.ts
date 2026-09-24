import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localImportPactV3 } from "@/lib/bom/carbon/pact/import";
import { getExchange } from "@/lib/bom/carbon/pact/exchange/service";
import {
  mirrorPactExchangeToDb,
  mirrorSupplierPcfRecordToDb,
} from "@/lib/bom/carbon/pact/persist";

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
    // Circular FK: exchange → record → exchange. Write exchange first
    // without supplier_pcf_record_id, then record, then patch exchange.
    const exchange = getExchange(auth.ctx.companyId, bundle.exchangeId);
    if (exchange) {
      await mirrorPactExchangeToDb(auth.ctx, {
        ...exchange,
        supplierPcfRecordId: null,
      });
    }
    await mirrorSupplierPcfRecordToDb(auth.ctx, bundle.record);
    if (exchange) {
      await mirrorPactExchangeToDb(auth.ctx, exchange);
    }
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
    if (err.exchangeId) {
      const exchange = getExchange(auth.ctx.companyId, err.exchangeId);
      if (exchange) {
        await mirrorPactExchangeToDb(auth.ctx, exchange);
      }
    }
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

import { NextResponse } from "next/server";
import { beginExchange, completeExchange } from "@/lib/bom/carbon/pact/exchange/service";
import { hasScope, requireBearerAuth } from "@/lib/bom/carbon/pact/host/auth";
import { listHostedProductFootprints } from "@/lib/bom/carbon/pact/host/catalog";

function allValues(params: URLSearchParams, key: string): string[] {
  const values = params.getAll(key);
  if (values.length) return values.filter(Boolean);
  const single = params.get(key);
  return single ? [single] : [];
}

/** PACT Action ListFootprints — GET /3/footprints */
export async function GET(request: Request) {
  const auth = requireBearerAuth(request.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  if (!hasScope(auth.claims, "footprint:list") && !hasScope(auth.claims, "footprint:read")) {
    return NextResponse.json(
      { code: "AccessDenied", message: "Missing footprint:list scope" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const limitRaw = searchParams.get("limit");
  const limit = limitRaw != null ? Number(limitRaw) : undefined;
  if (limitRaw != null && (!Number.isFinite(limit) || (limit as number) < 0)) {
    return NextResponse.json(
      { code: "BadRequest", message: "limit must be a non-negative integer" },
      { status: 400 }
    );
  }

  const companyId = auth.claims.companyId;
  const exchange = beginExchange(companyId, {
    direction: "inbound",
    kind: "list",
    idempotencyKey: `host-list:${companyId}:${searchParams.toString()}:${Date.now()}`,
    requestPayload: Object.fromEntries(searchParams.entries()),
  });

  try {
    const data = listHostedProductFootprints(companyId, {
      productId: allValues(searchParams, "productId"),
      companyIdFilter: allValues(searchParams, "companyId"),
      status: searchParams.get("status") || undefined,
      limit: Number.isFinite(limit) ? (limit as number) : undefined,
    });

    completeExchange(companyId, exchange.id, {
      status: "completed",
      httpStatus: 200,
      responsePayload: { count: data.length },
    });

    return NextResponse.json({ data });
  } catch (e) {
    completeExchange(companyId, exchange.id, {
      status: "failed",
      httpStatus: 500,
      errorCode: "InternalError",
      errorDetail: e instanceof Error ? e.message : "List failed",
    });
    return NextResponse.json(
      { code: "InternalError", message: "Failed to list footprints" },
      { status: 500 }
    );
  }
}

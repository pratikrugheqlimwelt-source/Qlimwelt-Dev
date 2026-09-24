import { NextResponse } from "next/server";
import { beginExchange, completeExchange } from "@/lib/bom/carbon/pact/exchange/service";
import { hasScope, requireBearerAuth } from "@/lib/bom/carbon/pact/host/auth";
import { getHostedProductFootprint } from "@/lib/bom/carbon/pact/host/catalog";

/** PACT Action GetFootprint — GET /3/footprints/{id} */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireBearerAuth(request.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  if (!hasScope(auth.claims, "footprint:read") && !hasScope(auth.claims, "footprint:list")) {
    return NextResponse.json(
      { code: "AccessDenied", message: "Missing footprint:read scope" },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json(
      { code: "BadRequest", message: "Footprint id is required" },
      { status: 400 }
    );
  }

  const companyId = auth.claims.companyId;
  const exchange = beginExchange(companyId, {
    direction: "inbound",
    kind: "get",
    idempotencyKey: `host-get:${companyId}:${id}:${Date.now()}`,
    footprintId: id,
    requestPayload: { id },
  });

  const footprint = getHostedProductFootprint(companyId, id);
  if (!footprint) {
    completeExchange(companyId, exchange.id, {
      status: "failed",
      httpStatus: 404,
      errorCode: "NotFound",
      errorDetail: `Footprint not found: ${id}`,
    });
    return NextResponse.json(
      { code: "NotFound", message: "The requested footprint could not be found." },
      { status: 404 }
    );
  }

  completeExchange(companyId, exchange.id, {
    status: "completed",
    httpStatus: 200,
    footprintId: footprint.id,
    responsePayload: footprint as unknown as Record<string, unknown>,
  });

  return NextResponse.json({ data: footprint });
}

import { NextResponse } from "next/server";
import { requireBearerAuth } from "@/lib/bom/carbon/pact/host/auth";
import { acceptHostEvent } from "@/lib/bom/carbon/pact/host/events";

/** PACT Action Events — POST /3/events */
export async function POST(request: Request) {
  const auth = requireBearerAuth(request.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: "BadRequest", message: "Invalid JSON CloudEvent body" },
      { status: 400 }
    );
  }

  try {
    acceptHostEvent(auth.claims.companyId, body as Record<string, unknown>);
    return new NextResponse(null, { status: 200 });
  } catch (e) {
    const err = e as Error & { code?: string; status?: number };
    return NextResponse.json(
      {
        code: err.code || "BadRequest",
        message: err.message || "Event rejected",
      },
      { status: err.status || 400 }
    );
  }
}

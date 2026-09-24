import { NextResponse } from "next/server";
import {
  localGetSupplierPcfByToken,
  localSubmitSupplierPcfByToken,
} from "@/lib/bom/carbon/local-service";

/** Public supplier portal — token-gated, no company auth. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const found = localGetSupplierPcfByToken(token);
  if (!found) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }
  return NextResponse.json({ portal: found.portal });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  try {
    const body = (await request.json()) as {
      declaredKgco2ePerUnit?: number;
      declaredUnit?: string | null;
      methodology?: string | null;
      evidenceNotes?: string | null;
    };
    if (body.declaredKgco2ePerUnit == null) {
      return NextResponse.json(
        { error: "declaredKgco2ePerUnit is required" },
        { status: 400 }
      );
    }
    const portal = localSubmitSupplierPcfByToken(token, {
      declaredKgco2ePerUnit: body.declaredKgco2ePerUnit,
      declaredUnit: body.declaredUnit,
      methodology: body.methodology,
      evidenceNotes: body.evidenceNotes,
    });
    return NextResponse.json({ portal });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to submit";
    const status = message.includes("Invalid") || message.includes("Cannot") ? 400 : 503;
    return NextResponse.json({ error: message }, { status });
  }
}

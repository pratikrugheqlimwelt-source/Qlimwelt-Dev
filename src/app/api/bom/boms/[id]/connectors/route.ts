import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import {
  BOM_CONNECTOR_PROFILES,
  type BomConnectorKind,
} from "@/lib/bom/connectors";
import { localPreviewConnectorImport } from "@/lib/bom/local-service";

export async function GET() {
  return NextResponse.json({ profiles: BOM_CONNECTOR_PROFILES });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id: bomId } = await context.params;
  try {
    const body = (await request.json()) as {
      kind?: BomConnectorKind;
      payload?: string;
      fileName?: string;
    };
    if (!body.kind) {
      return NextResponse.json({ error: "kind is required" }, { status: 400 });
    }
    if (!body.payload?.trim()) {
      return NextResponse.json({ error: "payload is required" }, { status: 400 });
    }
    const result = localPreviewConnectorImport(
      auth.ctx.companyId,
      bomId,
      body.kind,
      body.payload,
      body.fileName
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Connector preview failed" },
      { status: 400 }
    );
  }
}

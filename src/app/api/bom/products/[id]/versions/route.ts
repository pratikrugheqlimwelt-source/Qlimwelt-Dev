import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { dbCreateProductVersion, dbListProductVersions } from "@/lib/bom/db-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    const versions = await dbListProductVersions(auth.ctx, id);
    return NextResponse.json({ versions });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to list versions",
        hint: "Apply migration 008_products_bom.sql",
      },
      { status: 503 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const body = (await request.json()) as {
    versionLabel?: string;
    notes?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
  };
  if (!body.versionLabel?.trim()) {
    return NextResponse.json({ error: "versionLabel is required" }, { status: 400 });
  }
  try {
    const version = await dbCreateProductVersion(auth.ctx, id, {
      versionLabel: body.versionLabel.trim(),
      notes: body.notes,
      effectiveFrom: body.effectiveFrom,
      effectiveTo: body.effectiveTo,
    });
    return NextResponse.json({ version });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to create version",
        hint: "Apply migration 008_products_bom.sql",
      },
      { status: 503 }
    );
  }
}

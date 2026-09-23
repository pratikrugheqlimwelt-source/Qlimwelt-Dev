import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { dbPreviewImport } from "@/lib/bom/db-service";
import type { BomImportColumnMapping } from "@/lib/bom/types";

export async function POST(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const body = (await request.json()) as {
    bomId?: string;
    fileName?: string;
    csvText?: string;
    mapping?: Partial<BomImportColumnMapping>;
  };
  if (!body.bomId || !body.csvText || !body.fileName) {
    return NextResponse.json(
      { error: "bomId, fileName, and csvText are required" },
      { status: 400 }
    );
  }
  try {
    const job = await dbPreviewImport(auth.ctx, {
      bomId: body.bomId,
      fileName: body.fileName,
      csvText: body.csvText,
      mapping: body.mapping,
    });
    return NextResponse.json({ job });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Import preview failed",
        hint: "Apply migration 008_products_bom.sql",
      },
      { status: 503 }
    );
  }
}

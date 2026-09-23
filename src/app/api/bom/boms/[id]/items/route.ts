import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { dbDeleteBomItem, dbListBomItems, dbUpsertBomItem } from "@/lib/bom/db-service";
import type { BomItem } from "@/lib/bom/types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    const items = await dbListBomItems(auth.ctx, id);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to list BOM items",
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
  const body = (await request.json()) as Partial<BomItem> & {
    partNumber?: string;
    quantity?: number;
    unit?: string;
  };
  if (!body.partNumber?.trim() || body.quantity == null || !body.unit) {
    return NextResponse.json(
      { error: "partNumber, quantity, and unit are required" },
      { status: 400 }
    );
  }
  try {
    const item = await dbUpsertBomItem(auth.ctx, id, {
      ...body,
      partNumber: body.partNumber,
      quantity: Number(body.quantity),
      unit: body.unit,
    });
    return NextResponse.json({ item });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save BOM item";
    const status = message.toLowerCase().includes("circular") ? 400 : 503;
    return NextResponse.json(
      { error: message, hint: status === 503 ? "Apply migration 008_products_bom.sql" : undefined },
      { status }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  await context.params;
  const itemId = request.nextUrl.searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  try {
    await dbDeleteBomItem(auth.ctx, itemId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to delete item",
        hint: "Apply migration 008_products_bom.sql",
      },
      { status: 503 }
    );
  }
}

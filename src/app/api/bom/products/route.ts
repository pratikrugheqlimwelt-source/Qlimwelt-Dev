import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { dbCreateProduct, dbListProducts } from "@/lib/bom/db-service";

export async function GET() {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  try {
    const products = await dbListProducts(auth.ctx);
    return NextResponse.json({ products });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to list products",
        hint: "Apply migration 008_products_bom.sql",
      },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const body = (await request.json()) as {
    productNumber?: string;
    name?: string;
    category?: string;
    declaredUnit?: string;
    description?: string;
  };
  if (!body.productNumber?.trim() || !body.name?.trim()) {
    return NextResponse.json({ error: "productNumber and name are required" }, { status: 400 });
  }
  try {
    const bundle = await dbCreateProduct(auth.ctx, {
      productNumber: body.productNumber,
      name: body.name,
      category: body.category,
      declaredUnit: body.declaredUnit,
      description: body.description,
    });
    return NextResponse.json(bundle);
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to create product",
        hint: "Apply migration 008_products_bom.sql",
      },
      { status: 503 }
    );
  }
}

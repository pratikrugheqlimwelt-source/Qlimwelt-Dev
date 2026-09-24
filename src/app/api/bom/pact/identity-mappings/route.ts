import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import {
  createManualIdentityMapping,
  listIdentityMappings,
} from "@/lib/bom/carbon/pact/identity/mapping-service";
import type { ProductIdentityMapping } from "@/lib/bom/carbon/pact/types";
import { assertUrn, buildCustomProductUrn, buildGtinProductUrn } from "@/lib/bom/carbon/pact/identity/urn";

export async function GET(request: Request) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId") || undefined;
  const bomItemId = searchParams.get("bomItemId") || undefined;

  const mappings = listIdentityMappings(auth.ctx.companyId, { productId, bomItemId });
  return NextResponse.json({ mappings });
}

export async function POST(request: Request) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  let body: {
    productId?: string | null;
    bomItemId?: string | null;
    scheme?: ProductIdentityMapping["scheme"];
    value?: string;
    urn?: string;
    status?: ProductIdentityMapping["status"];
    namespace?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const scheme = body.scheme ?? "custom";
  const value = body.value?.trim();
  if (!value) {
    return NextResponse.json({ error: "value is required" }, { status: 400 });
  }

  let urn = body.urn?.trim();
  try {
    if (!urn) {
      if (scheme === "gtin") {
        urn = buildGtinProductUrn(value);
      } else if (scheme === "custom") {
        const ns = body.namespace?.trim() || auth.ctx.companyId;
        urn = buildCustomProductUrn(ns, value);
      } else {
        return NextResponse.json(
          { error: "urn is required for this scheme" },
          { status: 400 }
        );
      }
    }
    assertUrn(urn);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid URN" },
      { status: 400 }
    );
  }

  try {
    const mapping = createManualIdentityMapping(auth.ctx.companyId, {
      productId: body.productId ?? null,
      bomItemId: body.bomItemId ?? null,
      scheme,
      value,
      urn,
      status: body.status ?? "confirmed",
    });
    return NextResponse.json({ mapping }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 400 }
    );
  }
}

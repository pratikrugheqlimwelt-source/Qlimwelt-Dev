import { NextRequest, NextResponse } from "next/server";
import { generateApiKey } from "@/lib/connected-systems/crypto";
import { requireCompanyAuth } from "@/lib/export/auth";

export async function GET() {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const { supabase, companyId } = auth.ctx;
  const { data, error } = await supabase
    .from("company_api_keys")
    .select("id, name, key_prefix, created_at, revoked_at")
    .eq("company_id", companyId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: "Apply migration 007_connected_systems.sql" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    keys: (data ?? []).map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.key_prefix,
      createdAt: k.created_at,
      revokedAt: k.revoked_at,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { name?: string; action?: string; keyId?: string };
  const { supabase, companyId } = auth.ctx;

  if (body.action === "revoke") {
    if (!body.keyId) {
      return NextResponse.json({ error: "keyId is required." }, { status: 400 });
    }
    const { error } = await supabase
      .from("company_api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", body.keyId)
      .eq("company_id", companyId);
    if (error) return NextResponse.json({ error: error.message }, { status: 503 });
    return NextResponse.json({ ok: true });
  }

  const generated = generateApiKey();
  const { data, error } = await supabase
    .from("company_api_keys")
    .insert({
      company_id: companyId,
      name: body.name?.trim() || "Default key",
      key_prefix: generated.prefix,
      key_hash: generated.hash,
    })
    .select("id, name, key_prefix, created_at, revoked_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: "Apply migration 007_connected_systems.sql" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    key: {
      id: data.id,
      name: data.name,
      keyPrefix: data.key_prefix,
      createdAt: data.created_at,
      revokedAt: data.revoked_at,
    },
    raw: generated.raw,
  });
}

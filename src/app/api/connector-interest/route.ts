import { NextRequest, NextResponse } from "next/server";
import { getConnectorById } from "@/lib/connected-systems/catalog";
import { requireCompanyAuth } from "@/lib/export/auth";

export async function POST(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const { connectorId, note } = (await request.json()) as {
    connectorId?: string;
    note?: string;
  };
  if (!connectorId || !getConnectorById(connectorId)) {
    return NextResponse.json({ error: "Unknown connector." }, { status: 400 });
  }

  const { supabase, companyId } = auth.ctx;
  const { error } = await supabase.from("connector_interest").upsert(
    {
      company_id: companyId,
      connector_id: connectorId,
      note: note ?? null,
    },
    { onConflict: "company_id,connector_id" }
  );

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: "Apply migration 007_connected_systems.sql" },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true });
}

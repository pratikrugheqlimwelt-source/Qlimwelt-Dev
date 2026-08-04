import { NextResponse } from "next/server";
import { mapSyncLogRow } from "@/lib/connected-systems/map-row";
import { requireCompanyAuth } from "@/lib/export/auth";

export async function GET() {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const { supabase, companyId } = auth.ctx;
  const { data, error } = await supabase
    .from("sync_logs")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: "Apply migration 007_connected_systems.sql" },
      { status: 503 }
    );
  }

  return NextResponse.json({ logs: (data ?? []).map((row) => mapSyncLogRow(row as never)) });
}

import { NextResponse } from "next/server";
import type { ConnectionHealthSummary } from "@/lib/connected-systems/types";
import { requireCompanyAuth } from "@/lib/export/auth";

export async function GET() {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const { supabase, companyId } = auth.ctx;
  const { data, error } = await supabase
    .from("system_connections")
    .select("health")
    .eq("company_id", companyId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  const summary: ConnectionHealthSummary = {
    healthy: 0,
    warning: 0,
    disconnected: 0,
    failed: 0,
    total: data?.length ?? 0,
  };
  for (const row of data ?? []) {
    const h = row.health as "healthy" | "warning" | "disconnected" | "failed";
    if (h === "healthy" || h === "warning" || h === "disconnected" || h === "failed") {
      summary[h] += 1;
    }
  }

  return NextResponse.json({ health: summary });
}

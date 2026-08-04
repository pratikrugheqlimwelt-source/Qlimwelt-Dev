import { NextResponse } from "next/server";
import { CONNECTOR_CATALOG, CONNECTOR_CATEGORIES } from "@/lib/connected-systems/catalog";
import { requireCompanyAuth } from "@/lib/export/auth";

export async function GET() {
  const auth = await requireCompanyAuth();
  if (!auth.ok) {
    // Public catalog still useful for demo; return without interest flags
    if (auth.response.status === 503 || auth.response.status === 401) {
      return NextResponse.json({
        categories: CONNECTOR_CATEGORIES,
        connectors: CONNECTOR_CATALOG,
        interested: [] as string[],
        mode: "catalog",
      });
    }
    return auth.response;
  }

  const { supabase, companyId } = auth.ctx;
  const { data } = await supabase
    .from("connector_interest")
    .select("connector_id")
    .eq("company_id", companyId);

  return NextResponse.json({
    categories: CONNECTOR_CATEGORIES,
    connectors: CONNECTOR_CATALOG,
    interested: (data ?? []).map((r) => r.connector_id as string),
    mode: "supabase",
  });
}

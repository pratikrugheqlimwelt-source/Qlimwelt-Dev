import { NextRequest } from "next/server";
import {
  attachmentResponse,
  requireCompanyAuth,
  toCsv,
} from "@/lib/export/auth";
import { brandedCsvPreamble } from "@/lib/reports/branded-pdf";
import { activityToCalculation } from "@/lib/calculations/engine";
import { mapActivity } from "@/services/carbon/mappers";
import type { EmissionActivity } from "@/types/carbon";

export async function GET(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const { supabase, companyId } = auth.ctx;
  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  const period = request.nextUrl.searchParams.get("period");

  let query = supabase
    .from("emission_activities")
    .select("*")
    .eq("company_id", companyId)
    .order("period", { ascending: false });

  if (period && period !== "all") {
    query = query.eq("period", period);
  }

  const [{ data, error }, { data: company }] = await Promise.all([
    query,
    supabase.from("companies").select("name, industry").eq("id", companyId).maybeSingle(),
  ]);

  if (error) {
    return attachmentResponse(
      format === "json" ? "[]" : "id,period,scope,category,source,activity_value,unit,tco2e\n",
      `activities.${format === "json" ? "json" : "csv"}`,
      format
    );
  }

  const activities = (data ?? []).map((row) => mapActivity(row as Record<string, unknown>)) as EmissionActivity[];
  const generatedAt = new Date().toISOString();
  const periodLabel = period ?? "all";

  if (format === "json") {
    const payload = {
      meta: {
        platform: "Qlimwelt Climate Intelligence",
        company: company?.name ?? "",
        industry: company?.industry ?? "",
        period: periodLabel,
        generatedAt,
      },
      activities: activities.map((a) => ({
        ...a,
        tCO2e: activityToCalculation(a).emissionsTCO2e,
      })),
    };
    return attachmentResponse(JSON.stringify(payload, null, 2), "activities.json", "json");
  }

  const rows: (string | number)[][] = [
    ...brandedCsvPreamble({
      reportTitle: "Activity Emissions Ledger",
      companyName: company?.name ?? "",
      industry: company?.industry ?? "",
      periodLabel,
      generatedAt,
    }),
    ["id", "period", "scope", "category", "source", "activity_value", "unit", "factor", "tco2e", "facility_id"],
    ...activities.map((a) => {
      const t = activityToCalculation(a).emissionsTCO2e;
      return [
        a.id,
        a.period,
        a.scope,
        a.category,
        a.source,
        a.activityValue,
        a.activityUnit,
        a.emissionFactorValue,
        Number(t.toFixed(6)),
        a.facilityId,
      ];
    }),
  ];

  return attachmentResponse(toCsv(rows), "activities.csv", "csv");
}

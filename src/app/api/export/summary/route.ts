import { NextRequest } from "next/server";
import {
  attachmentResponse,
  requireCompanyAuth,
  toCsv,
} from "@/lib/export/auth";
import { sumByScope, sumEmissionsTCO2e } from "@/lib/calculations/engine";
import { mapActivity, mapTarget } from "@/services/carbon/mappers";
import type { EmissionActivity } from "@/types/carbon";

export async function GET(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const { supabase, companyId } = auth.ctx;
  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  const period = request.nextUrl.searchParams.get("period");

  let query = supabase.from("emission_activities").select("*").eq("company_id", companyId);
  if (period && period !== "all") query = query.eq("period", period);

  const [{ data: actData }, { data: company }, { data: targetRow }] = await Promise.all([
    query,
    supabase.from("companies").select("name, industry").eq("id", companyId).maybeSingle(),
    supabase.from("climate_targets").select("*").eq("company_id", companyId).limit(1).maybeSingle(),
  ]);

  const activities = (actData ?? []).map((row) => mapActivity(row as Record<string, unknown>)) as EmissionActivity[];
  const total = sumEmissionsTCO2e(activities);
  const scopes = sumByScope(activities);
  const target = targetRow ? mapTarget(targetRow as Record<string, unknown>) : null;

  const summary = {
    companyId,
    companyName: company?.name ?? "",
    industry: company?.industry ?? "",
    period: period ?? "all",
    generatedAt: new Date().toISOString(),
    activityCount: activities.length,
    totalTCO2e: total,
    scope1: scopes.scope1,
    scope2: scopes.scope2,
    scope3: scopes.scope3,
    target: target
      ? {
          name: target.name,
          baselineYear: target.baselineYear,
          targetYear: target.targetYear,
          baselineEmissionsTCO2e: target.baselineEmissionsTCO2e,
          targetReductionPct: target.targetReductionPct,
        }
      : null,
  };

  if (format === "json") {
    return attachmentResponse(JSON.stringify(summary, null, 2), "ghg-summary.json", "json");
  }

  const rows = [
    ["metric", "value"],
    ["company", summary.companyName],
    ["period", summary.period],
    ["generated_at", summary.generatedAt],
    ["activity_count", summary.activityCount],
    ["total_tco2e", Number(total.toFixed(6))],
    ["scope1_tco2e", Number(scopes.scope1.toFixed(6))],
    ["scope2_tco2e", Number(scopes.scope2.toFixed(6))],
    ["scope3_tco2e", Number(scopes.scope3.toFixed(6))],
    ["target_name", target?.name ?? ""],
    ["target_reduction_pct", target?.targetReductionPct ?? ""],
  ];

  return attachmentResponse(toCsv(rows), "ghg-summary.csv", "csv");
}

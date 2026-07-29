import { NextRequest } from "next/server";
import {
  attachmentResponse,
  requireCompanyAuth,
  toCsv,
} from "@/lib/export/auth";
import { activityToCalculation, sumByScope, sumEmissionsTCO2e } from "@/lib/calculations/engine";
import { mapActivity, mapFacility, mapInitiative, mapTarget, mapVehicle } from "@/services/carbon/mappers";
import type { EmissionActivity } from "@/types/carbon";

const REPORT_TYPES = [
  "ghg",
  "scope",
  "facility",
  "fleet",
  "target",
  "reduction",
] as const;

type ReportType = (typeof REPORT_TYPES)[number];

export async function GET(request: NextRequest) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;

  const { supabase, companyId } = auth.ctx;
  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  const typeParam = (request.nextUrl.searchParams.get("type") ?? "ghg") as ReportType;
  const type: ReportType = REPORT_TYPES.includes(typeParam) ? typeParam : "ghg";
  const period = request.nextUrl.searchParams.get("period");

  let actQuery = supabase.from("emission_activities").select("*").eq("company_id", companyId);
  if (period && period !== "all") actQuery = actQuery.eq("period", period);

  const [
    { data: actData },
    { data: facData },
    { data: vehData },
    { data: initData },
    { data: targetRow },
    { data: company },
  ] = await Promise.all([
    actQuery,
    supabase.from("facilities").select("*").eq("company_id", companyId),
    supabase.from("vehicles").select("*").eq("company_id", companyId),
    supabase.from("reduction_initiatives").select("*").eq("company_id", companyId),
    supabase.from("climate_targets").select("*").eq("company_id", companyId).limit(1).maybeSingle(),
    supabase.from("companies").select("name").eq("id", companyId).maybeSingle(),
  ]);

  const activities = (actData ?? []).map((r) => mapActivity(r as Record<string, unknown>)) as EmissionActivity[];
  const facilities = (facData ?? []).map((r) => mapFacility(r as Record<string, unknown>));
  const vehicles = (vehData ?? []).map((r) => mapVehicle(r as Record<string, unknown>));
  const initiatives = (initData ?? []).map((r) => mapInitiative(r as Record<string, unknown>));
  const target = targetRow ? mapTarget(targetRow as Record<string, unknown>) : null;
  const total = sumEmissionsTCO2e(activities);
  const scopes = sumByScope(activities);

  let rows: (string | number)[][] = [];
  let jsonPayload: unknown = {};

  switch (type) {
    case "scope":
      rows = [
        ["scope", "tco2e"],
        ["scope1", Number(scopes.scope1.toFixed(6))],
        ["scope2", Number(scopes.scope2.toFixed(6))],
        ["scope3", Number(scopes.scope3.toFixed(6))],
        ["total", Number(total.toFixed(6))],
      ];
      jsonPayload = { scopes, total };
      break;
    case "facility":
      rows = [
        ["facility_id", "name", "country", "type", "floor_area_m2", "activity_tco2e"],
        ...facilities.map((f) => {
          const t = activities
            .filter((a) => a.facilityId === f.id)
            .reduce((s, a) => s + activityToCalculation(a).emissionsTCO2e, 0);
          return [f.id, f.name, f.country, f.type, f.floorAreaM2, Number(t.toFixed(6))];
        }),
      ];
      jsonPayload = { facilities, activitiesByFacility: rows.slice(1) };
      break;
    case "fleet":
      rows = [
        ["id", "name", "registration", "fuel_type", "distance_km", "fuel_litres", "electricity_kwh", "emission_factor"],
        ...vehicles.map((v) => [
          v.id,
          v.name,
          v.registration,
          v.fuelType,
          v.distanceKm,
          v.fuelLitres,
          v.electricityKwh,
          v.emissionFactor,
        ]),
      ];
      jsonPayload = { vehicles };
      break;
    case "target":
      rows = [
        ["field", "value"],
        ["company", company?.name ?? ""],
        ["name", target?.name ?? ""],
        ["baseline_year", target?.baselineYear ?? ""],
        ["target_year", target?.targetYear ?? ""],
        ["baseline_tco2e", target?.baselineEmissionsTCO2e ?? ""],
        ["reduction_pct", target?.targetReductionPct ?? ""],
        ["type", target?.type ?? ""],
        ["current_filtered_tco2e", Number(total.toFixed(6))],
      ];
      jsonPayload = { target, currentTCO2e: total };
      break;
    case "reduction":
      rows = [
        ["id", "name", "status", "category", "annual_reduction_tco2e", "implementation_cost", "difficulty"],
        ...initiatives.map((i) => [
          i.id,
          i.name,
          i.status,
          i.category,
          i.annualEmissionReductionTCO2e,
          i.implementationCost,
          i.difficulty,
        ]),
      ];
      jsonPayload = { initiatives };
      break;
    case "ghg":
    default:
      rows = [
        ["metric", "value"],
        ["company", company?.name ?? ""],
        ["report", "Corporate GHG Inventory"],
        ["period", period ?? "all"],
        ["generated_at", new Date().toISOString()],
        ["total_tco2e", Number(total.toFixed(6))],
        ["scope1", Number(scopes.scope1.toFixed(6))],
        ["scope2", Number(scopes.scope2.toFixed(6))],
        ["scope3", Number(scopes.scope3.toFixed(6))],
        ["activities", activities.length],
        ["facilities", facilities.length],
        ["vehicles", vehicles.length],
      ];
      jsonPayload = {
        company: company?.name,
        total,
        scopes,
        counts: {
          activities: activities.length,
          facilities: facilities.length,
          vehicles: vehicles.length,
        },
      };
      break;
  }

  if (format === "json") {
    return attachmentResponse(
      JSON.stringify(jsonPayload, null, 2),
      `report-${type}.json`,
      "json"
    );
  }

  return attachmentResponse(toCsv(rows), `report-${type}.csv`, "csv");
}

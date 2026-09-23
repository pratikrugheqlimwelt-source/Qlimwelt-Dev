import { createServiceClient } from "@/lib/supabase/admin";
import {
  allActivities,
  facilities as demoFacilities,
  vehicles as demoVehicles,
  suppliers as demoSuppliers,
  reductionInitiatives as demoInitiatives,
  climateTarget as demoTarget,
  company as demoCompany,
  emissionFactors as demoFactors,
} from "@/data/carbon";
import {
  activityToRow,
  facilityToRow,
  vehicleToRow,
  supplierToRow,
  initiativeToRow,
  targetToRow,
} from "@/services/carbon/mappers";

function scopeDemoId(companyId: string, id: string) {
  const prefix = companyId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "co";
  return `${prefix}-${id}`;
}

function buildScopedDemoInventory(companyId: string) {
  const idMap = new Map<string, string>();
  const sid = (id: string) => {
    const scoped = scopeDemoId(companyId, id);
    idMap.set(id, scoped);
    return scoped;
  };

  const facilities = demoFacilities.map((f) => ({ ...f, id: sid(f.id) }));
  const vehicles = demoVehicles.map((v) => ({
    ...v,
    id: sid(v.id),
    facilityId: idMap.get(v.facilityId) ?? sid(v.facilityId),
  }));
  const suppliers = demoSuppliers.map((s) => ({ ...s, id: sid(s.id) }));
  const initiatives = demoInitiatives.map((i) => ({ ...i, id: sid(i.id) }));
  const climateTarget = { ...demoTarget, id: sid(demoTarget.id) };
  const activities = allActivities.map((a) => ({
    ...a,
    id: sid(a.id),
    facilityId: idMap.get(a.facilityId) ?? sid(a.facilityId),
    resourceId: a.resourceId ? idMap.get(a.resourceId) ?? sid(a.resourceId) : undefined,
  }));

  return { facilities, vehicles, suppliers, initiatives, climateTarget, activities };
}

/** Seed realistic FY inventory using the service-role client (bypasses RLS). */
export async function seedCompanyDemoAdmin(companyId: string) {
  const admin = createServiceClient();
  const inventory = buildScopedDemoInventory(companyId);

  const { error: companyErr } = await admin
    .from("companies")
    .update({
      name: demoCompany.name,
      industry: demoCompany.industry,
      employee_count: demoCompany.employeeCount,
      annual_revenue: demoCompany.revenueEUR,
      currency: demoCompany.currency,
      facility_count: inventory.facilities.length,
      headquarters_country: "Germany",
      countries_of_operation: ["Germany", "Netherlands"],
      company_size: "501-1000",
    })
    .eq("id", companyId);
  if (companyErr) {
    console.warn("[seed-admin] company profile:", companyErr.message);
  }

  const { error: settingsErr } = await admin.from("company_settings").upsert({
    company_id: companyId,
    carbon_price_per_tonne: demoCompany.carbonPricePerTonne,
    discount_rate: demoCompany.discountRate,
    units_produced: demoCompany.unitsProduced,
    baseline_year: demoCompany.baselineYear,
    reporting_year: demoCompany.reportingYear,
    custom_factors: demoFactors,
    seeded_at: new Date().toISOString(),
  });
  if (settingsErr) throw new Error(settingsErr.message);

  const upsert = async (table: string, rows: Record<string, unknown>[]) => {
    const { error } = await admin.from(table).upsert(rows);
    if (error) throw new Error(`${table}: ${error.message}`);
  };

  await upsert(
    "facilities",
    inventory.facilities.map((f) => facilityToRow(f, companyId))
  );
  await upsert(
    "vehicles",
    inventory.vehicles.map((v) => vehicleToRow(v, companyId))
  );
  await upsert(
    "suppliers",
    inventory.suppliers.map((s) => supplierToRow(s, companyId))
  );
  await upsert(
    "reduction_initiatives",
    inventory.initiatives.map((i) => initiativeToRow(i, companyId))
  );
  await upsert("climate_targets", [targetToRow(inventory.climateTarget, companyId)]);

  const rows = inventory.activities.map((a) => activityToRow(a, companyId));
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await admin.from("emission_activities").upsert(rows.slice(i, i + 100));
    if (error) throw new Error(`emission_activities: ${error.message}`);
  }

  await admin.from("notifications").insert({
    company_id: companyId,
    title: "Inventory loaded",
    message: "FY 2024 inventory is ready — facilities, fleet, suppliers, and monthly activity data.",
    href: "/dashboard/overview",
    read: false,
  });

  return {
    companyId,
    activities: inventory.activities.length,
    facilities: inventory.facilities.length,
    vehicles: inventory.vehicles.length,
    suppliers: inventory.suppliers.length,
  };
}

export async function findCompanyIdByEmail(email: string): Promise<string | null> {
  const admin = createServiceClient();
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, email")
    .ilike("email", email.trim())
    .maybeSingle();

  if (profileErr) throw new Error(profileErr.message);
  if (!profile) return null;

  const { data: membership, error: memberErr } = await admin
    .from("company_members")
    .select("company_id")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (memberErr) throw new Error(memberErr.message);
  return membership?.company_id ?? null;
}

/**
 * Generates SQL to bootstrap pratikrughe.qlimwelt@gmail.com with a full demo company + inventory.
 * Run: npx tsx scripts/generate-demo-seed-sql.ts
 * Then paste output into Supabase SQL Editor.
 */
import { writeFileSync } from "fs";
import { resolve } from "path";
import {
  allActivities,
  facilities as demoFacilities,
  vehicles as demoVehicles,
  suppliers as demoSuppliers,
  reductionInitiatives as demoInitiatives,
  climateTarget as demoTarget,
  company as demoCompany,
  emissionFactors as demoFactors,
} from "../src/data/carbon";
import {
  activityToRow,
  facilityToRow,
  vehicleToRow,
  supplierToRow,
  initiativeToRow,
  targetToRow,
} from "../src/services/carbon/mappers";

const EMAIL = "pratikrughe.qlimwelt@gmail.com";

function sqlStr(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

function scopeDemoId(companyIdExpr: string, id: string) {
  // Placeholder — real scoping done in SQL with prefix from company uuid
  return id;
}

function main() {
  // Use a fixed demo company id so re-runs are idempotent for this email
  const companyId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const prefix = companyId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  const sid = (id: string) => `${prefix}-${id}`;

  const idMap = new Map<string, string>();
  const facilities = demoFacilities.map((f) => {
    const id = sid(f.id);
    idMap.set(f.id, id);
    return { ...f, id };
  });
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

  void scopeDemoId;

  const lines: string[] = [];
  lines.push(`-- Demo seed for ${EMAIL}`);
  lines.push(`-- Nordic Manufacturing Group + FY2024 inventory for dashboard graphs`);
  lines.push(`-- Paste into Supabase SQL Editor and Run`);
  lines.push(`begin;`);
  lines.push(``);
  lines.push(`do $$`);
  lines.push(`declare`);
  lines.push(`  v_user_id uuid;`);
  lines.push(`  v_company_id uuid := '${companyId}'::uuid;`);
  lines.push(`begin`);
  lines.push(`  select id into v_user_id`);
  lines.push(`  from auth.users`);
  lines.push(`  where lower(email) = lower('${EMAIL}')`);
  lines.push(`  limit 1;`);
  lines.push(``);
  lines.push(`  if v_user_id is null then`);
  lines.push(`    raise exception 'User % not found in auth.users — sign in with Google once first', '${EMAIL}';`);
  lines.push(`  end if;`);
  lines.push(``);
  lines.push(`  -- Profile: complete onboarding so login goes straight to dashboard`);
  lines.push(`  insert into public.profiles (id, email, full_name, job_title, onboarding_completed, created_at, updated_at)`);
  lines.push(`  values (`);
  lines.push(`    v_user_id,`);
  lines.push(`    '${EMAIL}',`);
  lines.push(`    'Pratik Rughe',`);
  lines.push(`    'Founder & CEO',`);
  lines.push(`    true,`);
  lines.push(`    now(),`);
  lines.push(`    now()`);
  lines.push(`  )`);
  lines.push(`  on conflict (id) do update set`);
  lines.push(`    email = excluded.email,`);
  lines.push(`    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),`);
  lines.push(`    job_title = excluded.job_title,`);
  lines.push(`    onboarding_completed = true,`);
  lines.push(`    updated_at = now();`);
  lines.push(``);
  lines.push(`  insert into public.companies (`);
  lines.push(`    id, name, website, industry, company_size, headquarters_country,`);
  lines.push(`    countries_of_operation, employee_count, annual_revenue, currency, facility_count`);
  lines.push(`  ) values (`);
  lines.push(`    v_company_id,`);
  lines.push(`    ${sqlStr(demoCompany.name)},`);
  lines.push(`    'https://www.qlimwelt.de',`);
  lines.push(`    ${sqlStr(demoCompany.industry)},`);
  lines.push(`    '501-1000',`);
  lines.push(`    'Germany',`);
  lines.push(`    array['Germany','Netherlands'],`);
  lines.push(`    ${demoCompany.employeeCount},`);
  lines.push(`    ${demoCompany.revenueEUR},`);
  lines.push(`    'EUR',`);
  lines.push(`    ${facilities.length}`);
  lines.push(`  )`);
  lines.push(`  on conflict (id) do update set`);
  lines.push(`    name = excluded.name,`);
  lines.push(`    industry = excluded.industry,`);
  lines.push(`    company_size = excluded.company_size,`);
  lines.push(`    headquarters_country = excluded.headquarters_country,`);
  lines.push(`    countries_of_operation = excluded.countries_of_operation,`);
  lines.push(`    employee_count = excluded.employee_count,`);
  lines.push(`    annual_revenue = excluded.annual_revenue,`);
  lines.push(`    currency = excluded.currency,`);
  lines.push(`    facility_count = excluded.facility_count,`);
  lines.push(`    updated_at = now();`);
  lines.push(``);
  lines.push(`  insert into public.company_members (company_id, user_id, role)`);
  lines.push(`  values (v_company_id, v_user_id, 'admin')`);
  lines.push(`  on conflict (company_id, user_id) do update set role = 'admin';`);
  lines.push(``);
  lines.push(`  -- Remove any other memberships so this is the home company`);
  lines.push(`  delete from public.company_members`);
  lines.push(`  where user_id = v_user_id and company_id <> v_company_id;`);
  lines.push(`end $$;`);
  lines.push(``);

  // settings
  lines.push(`insert into public.company_settings (`);
  lines.push(`  company_id, carbon_price_per_tonne, discount_rate, units_produced,`);
  lines.push(`  baseline_year, reporting_year, custom_factors, seeded_at`);
  lines.push(`) values (`);
  lines.push(`  '${companyId}'::uuid,`);
  lines.push(`  ${demoCompany.carbonPricePerTonne},`);
  lines.push(`  ${demoCompany.discountRate},`);
  lines.push(`  ${demoCompany.unitsProduced},`);
  lines.push(`  ${demoCompany.baselineYear},`);
  lines.push(`  ${demoCompany.reportingYear},`);
  lines.push(`  ${sqlStr(demoFactors)},`);
  lines.push(`  now()`);
  lines.push(`)`);
  lines.push(`on conflict (company_id) do update set`);
  lines.push(`  carbon_price_per_tonne = excluded.carbon_price_per_tonne,`);
  lines.push(`  discount_rate = excluded.discount_rate,`);
  lines.push(`  units_produced = excluded.units_produced,`);
  lines.push(`  baseline_year = excluded.baseline_year,`);
  lines.push(`  reporting_year = excluded.reporting_year,`);
  lines.push(`  custom_factors = excluded.custom_factors,`);
  lines.push(`  seeded_at = now();`);
  lines.push(``);

  // facilities
  for (const f of facilities) {
    const row = facilityToRow(f, companyId);
    lines.push(
      `insert into public.facilities (id, company_id, name, country, business_unit_id, type, floor_area_m2) values (${sqlStr(row.id)}, '${companyId}'::uuid, ${sqlStr(row.name)}, ${sqlStr(row.country)}, ${sqlStr(row.business_unit_id)}, ${sqlStr(row.type)}, ${row.floor_area_m2}) on conflict (id) do update set name = excluded.name, country = excluded.country, business_unit_id = excluded.business_unit_id, type = excluded.type, floor_area_m2 = excluded.floor_area_m2;`
    );
  }
  lines.push(``);

  for (const v of vehicles) {
    const row = vehicleToRow(v, companyId);
    lines.push(
      `insert into public.vehicles (id, company_id, name, manufacturer, model, category, fuel_type, registration, ownership, facility_id, country, year, distance_km, fuel_litres, electricity_kwh, emission_factor, status) values (${sqlStr(row.id)}, '${companyId}'::uuid, ${sqlStr(row.name)}, ${sqlStr(row.manufacturer)}, ${sqlStr(row.model)}, ${sqlStr(row.category)}, ${sqlStr(row.fuel_type)}, ${sqlStr(row.registration)}, ${sqlStr(row.ownership)}, ${sqlStr(row.facility_id)}, ${sqlStr(row.country)}, ${row.year}, ${row.distance_km}, ${row.fuel_litres}, ${row.electricity_kwh}, ${row.emission_factor}, ${sqlStr(row.status)}) on conflict (id) do update set name = excluded.name, distance_km = excluded.distance_km, fuel_litres = excluded.fuel_litres, electricity_kwh = excluded.electricity_kwh, status = excluded.status;`
    );
  }
  lines.push(``);

  for (const s of suppliers) {
    const row = supplierToRow(s, companyId);
    lines.push(
      `insert into public.suppliers (id, company_id, name, country, category, scope3_tco2e, data_quality_score, influence_score, reduction_opportunity) values (${sqlStr(row.id)}, '${companyId}'::uuid, ${sqlStr(row.name)}, ${sqlStr(row.country)}, ${sqlStr(row.category)}, ${row.scope3_tco2e}, ${row.data_quality_score}, ${row.influence_score}, ${row.reduction_opportunity}) on conflict (id) do update set name = excluded.name, scope3_tco2e = excluded.scope3_tco2e, data_quality_score = excluded.data_quality_score;`
    );
  }
  lines.push(``);

  for (const i of initiatives) {
    const row = initiativeToRow(i, companyId);
    lines.push(
      `insert into public.reduction_initiatives (id, company_id, name, category, source, implementation_cost, annual_operating_cost, annual_financial_saving, annual_emission_reduction_tco2e, implementation_date, confidence, status, expected_lifetime_years, difficulty) values (${sqlStr(row.id)}, '${companyId}'::uuid, ${sqlStr(row.name)}, ${sqlStr(row.category)}, ${sqlStr(row.source)}, ${row.implementation_cost}, ${row.annual_operating_cost}, ${row.annual_financial_saving}, ${row.annual_emission_reduction_tco2e}, ${sqlStr(row.implementation_date)}, ${row.confidence}, ${sqlStr(row.status)}, ${row.expected_lifetime_years}, ${sqlStr(row.difficulty)}) on conflict (id) do update set name = excluded.name, status = excluded.status, annual_emission_reduction_tco2e = excluded.annual_emission_reduction_tco2e;`
    );
  }
  lines.push(``);

  {
    const row = targetToRow(climateTarget, companyId);
    lines.push(
      `insert into public.climate_targets (id, company_id, name, baseline_year, target_year, baseline_emissions_tco2e, target_reduction_pct, type) values (${sqlStr(row.id)}, '${companyId}'::uuid, ${sqlStr(row.name)}, ${row.baseline_year}, ${row.target_year}, ${row.baseline_emissions_tco2e}, ${row.target_reduction_pct}, ${sqlStr(row.type)}) on conflict (id) do update set name = excluded.name, baseline_emissions_tco2e = excluded.baseline_emissions_tco2e, target_reduction_pct = excluded.target_reduction_pct;`
    );
  }
  lines.push(``);

  // Clear prior demo activities for this company then insert
  lines.push(`delete from public.emission_activities where company_id = '${companyId}'::uuid;`);
  lines.push(``);

  const chunkSize = 40;
  for (let i = 0; i < activities.length; i += chunkSize) {
    const chunk = activities.slice(i, i + chunkSize);
    const values = chunk
      .map((a) => {
        const row = activityToRow(a, companyId);
        return `(${sqlStr(row.id)}, '${companyId}'::uuid, ${sqlStr(row.period)}, ${sqlStr(row.facility_id)}, ${sqlStr(row.country)}, ${sqlStr(row.business_unit_id)}, ${sqlStr(row.scope)}, ${sqlStr(row.category)}, ${sqlStr(row.subcategory)}, ${sqlStr(row.source)}, ${row.activity_value}, ${sqlStr(row.activity_unit)}, ${sqlStr(row.emission_factor_id)}, ${row.emission_factor_value}, ${sqlStr(row.emission_factor_unit)}, ${sqlStr(row.emission_factor_source)}, ${row.emission_factor_year}, ${row.conversion_factor}, ${sqlStr(row.ghg)}, ${row.gwp}, ${sqlStr(row.method)}, ${row.data_quality_score}, ${row.uncertainty_pct}, ${sqlStr(row.evidence_status)}, ${sqlStr(row.resource_id)}, ${row.is_estimated}, ${sqlStr(row.assessment_id)}, ${sqlStr(row.metadata)})`;
      })
      .join(",\n");
    lines.push(`insert into public.emission_activities (
  id, company_id, period, facility_id, country, business_unit_id, scope, category, subcategory, source,
  activity_value, activity_unit, emission_factor_id, emission_factor_value, emission_factor_unit,
  emission_factor_source, emission_factor_year, conversion_factor, ghg, gwp, method, data_quality_score,
  uncertainty_pct, evidence_status, resource_id, is_estimated, assessment_id, metadata
) values
${values};`);
    lines.push(``);
  }

  lines.push(`insert into public.notifications (company_id, title, message, href, read)`);
  lines.push(`values (`);
  lines.push(`  '${companyId}'::uuid,`);
  lines.push(`  'Demo inventory ready',`);
  lines.push(`  'FY 2024 Nordic Manufacturing Group data is loaded — open Overview for charts.',`);
  lines.push(`  '/dashboard/overview',`);
  lines.push(`  false`);
  lines.push(`);`);
  lines.push(``);
  lines.push(`commit;`);

  const out = resolve(process.cwd(), "supabase/seed_demo_pratik.sql");
  writeFileSync(out, lines.join("\n") + "\n", "utf8");
  console.log(`Wrote ${out} (${activities.length} activities, ${facilities.length} facilities)`);
}

main();

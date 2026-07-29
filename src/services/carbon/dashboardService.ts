import { createClient, isSupabaseConfigured } from "@/lib/supabase";
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
import type {
  EmissionActivity,
  Facility,
  Vehicle,
  Supplier,
  ReductionInitiative,
  ClimateTarget,
  EmissionFactor,
  Company,
} from "@/types/carbon";
import {
  activityToRow,
  facilityToRow,
  vehicleToRow,
  supplierToRow,
  initiativeToRow,
  targetToRow,
  mapActivity,
  mapFacility,
  mapVehicle,
  mapSupplier,
  mapInitiative,
  mapTarget,
  mapNotification,
  mapSettings,
  type DashboardBundle,
  type DashboardNotification,
  type CompanySettingsRow,
} from "@/services/carbon/mappers";

export type { DashboardNotification, CompanySettingsRow, DashboardBundle };

const LS_PREFIX = "qlimwelt-dashboard-v1:";

export type TeamInviteRow = {
  id: string;
  companyId: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "revoked";
  createdAt: string;
  invitedBy: string | null;
};

function lsKey(companyId: string) {
  return `${LS_PREFIX}${companyId}`;
}

type LocalStore = {
  settings: CompanySettingsRow;
  facilities: Facility[];
  vehicles: Vehicle[];
  suppliers: Supplier[];
  activities: EmissionActivity[];
  initiatives: ReductionInitiative[];
  climateTarget: ClimateTarget;
  notifications: DashboardNotification[];
  customFactors: EmissionFactor[];
  invites: TeamInviteRow[];
};

function emptyLocalStore(companyId: string): LocalStore {
  return {
    settings: {
      companyId,
      carbonPricePerTonne: demoCompany.carbonPricePerTonne,
      discountRate: demoCompany.discountRate,
      unitsProduced: 0,
      baselineYear: demoCompany.baselineYear,
      reportingYear: demoCompany.reportingYear,
      customFactors: [],
      seededAt: null,
      gwpValues: { CO2: 1, CH4: 27.9, N2O: 273, HFCs: 1430, PFCs: 6630, SF6: 25200, NF3: 17400 },
    },
    facilities: [],
    vehicles: [],
    suppliers: [],
    activities: [],
    initiatives: [],
    climateTarget: {
      id: `tgt-${companyId.slice(0, 8)}`,
      name: "Science-Based Target 2030",
      baselineYear: 2023,
      targetYear: 2030,
      baselineEmissionsTCO2e: 0,
      targetReductionPct: 42,
      type: "absolute",
    },
    notifications: [
      {
        id: crypto.randomUUID(),
        companyId,
        userId: null,
        title: "Workspace ready",
        message: "Add activities under Data Collection to build your inventory.",
        href: "/dashboard/data-collection",
        read: false,
        createdAt: new Date().toISOString(),
      },
    ],
    customFactors: [],
    invites: [],
  };
}

/** @deprecated Use emptyLocalStore + seedSampleData for opt-in demo */
function defaultLocalStore(companyId: string): LocalStore {
  return emptyLocalStore(companyId);
}

function readLocal(companyId: string): LocalStore {
  if (typeof window === "undefined") return emptyLocalStore(companyId);
  try {
    const raw = localStorage.getItem(lsKey(companyId));
    if (!raw) {
      const store = emptyLocalStore(companyId);
      localStorage.setItem(lsKey(companyId), JSON.stringify(store));
      return store;
    }
    const parsed = JSON.parse(raw) as LocalStore;
    if (!parsed.invites) parsed.invites = [];
    if (!parsed.settings) parsed.settings = emptyLocalStore(companyId).settings;
    if (!parsed.settings.gwpValues) {
      parsed.settings.gwpValues = emptyLocalStore(companyId).settings.gwpValues;
    }
    return parsed;
  } catch {
    return emptyLocalStore(companyId);
  }
}

function writeLocal(companyId: string, store: LocalStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(lsKey(companyId), JSON.stringify(store));
}

async function tablesAvailable(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = createClient();
    const { error } = await supabase.from("company_settings").select("company_id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function loadDashboardBundle(companyId: string): Promise<DashboardBundle & { mode: "supabase" | "local" }> {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const local = readLocal(companyId);
    return {
      mode: "local",
      settings: local.settings,
      facilities: local.facilities,
      vehicles: local.vehicles,
      suppliers: local.suppliers,
      activities: local.activities,
      initiatives: local.initiatives,
      climateTarget: local.climateTarget,
      notifications: local.notifications,
    };
  }

  const supabase = createClient();

  const [settingsRes, facRes, vehRes, supRes, actRes, initRes, tgtRes, notifRes] = await Promise.all([
    supabase.from("company_settings").select("*").eq("company_id", companyId).maybeSingle(),
    supabase.from("facilities").select("*").eq("company_id", companyId),
    supabase.from("vehicles").select("*").eq("company_id", companyId),
    supabase.from("suppliers").select("*").eq("company_id", companyId),
    supabase.from("emission_activities").select("*").eq("company_id", companyId),
    supabase.from("reduction_initiatives").select("*").eq("company_id", companyId),
    supabase.from("climate_targets").select("*").eq("company_id", companyId).limit(1).maybeSingle(),
    supabase.from("notifications").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(50),
  ]);

  // Never auto-seed demo inventory. Create empty settings so the workspace is writable.
  if (!settingsRes.data && !(facRes.data?.length) && !(actRes.data?.length)) {
    await ensureEmptyCompanySettings(companyId);
    return loadDashboardBundle(companyId);
  }

  return {
    mode: "supabase",
    settings: settingsRes.data ? mapSettings(settingsRes.data) : null,
    facilities: (facRes.data ?? []).map(mapFacility),
    vehicles: (vehRes.data ?? []).map(mapVehicle),
    suppliers: (supRes.data ?? []).map(mapSupplier),
    activities: (actRes.data ?? []).map(mapActivity),
    initiatives: (initRes.data ?? []).map(mapInitiative),
    climateTarget: tgtRes.data
      ? mapTarget(tgtRes.data)
      : {
          id: `tgt-${companyId.slice(0, 8)}`,
          name: "Science-Based Target 2030",
          baselineYear: 2023,
          targetYear: 2030,
          baselineEmissionsTCO2e: 0,
          targetReductionPct: 42,
          type: "absolute" as const,
        },
    notifications: (notifRes.data ?? []).map(mapNotification),
  };
}

export async function ensureEmptyCompanySettings(companyId: string) {
  const supabase = createClient();
  await supabase.from("company_settings").upsert({
    company_id: companyId,
    carbon_price_per_tonne: demoCompany.carbonPricePerTonne,
    discount_rate: demoCompany.discountRate,
    units_produced: 0,
    baseline_year: demoCompany.baselineYear,
    reporting_year: demoCompany.reportingYear,
    custom_factors: [],
    seeded_at: null,
  });
}

/** Opt-in sample dataset for product exploration. */
export async function seedSampleData(companyId: string) {
  await seedCompanyDemo(companyId);
}

export async function seedCompanyDemo(companyId: string) {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const base = emptyLocalStore(companyId);
    writeLocal(companyId, {
      ...base,
      settings: {
        ...base.settings,
        unitsProduced: demoCompany.unitsProduced,
        seededAt: new Date().toISOString(),
      },
      facilities: demoFacilities,
      vehicles: demoVehicles,
      suppliers: demoSuppliers,
      activities: allActivities,
      initiatives: demoInitiatives,
      climateTarget: demoTarget,
      customFactors: [...demoFactors],
      notifications: [
        {
          id: crypto.randomUUID(),
          companyId,
          userId: null,
          title: "Inventory loaded",
          message: "Your workspace inventory is ready. Continue adding activities anytime.",
          href: "/dashboard/emissions",
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    return;
  }

  const supabase = createClient();

  await supabase.from("company_settings").upsert({
    company_id: companyId,
    carbon_price_per_tonne: demoCompany.carbonPricePerTonne,
    discount_rate: demoCompany.discountRate,
    units_produced: demoCompany.unitsProduced,
    baseline_year: demoCompany.baselineYear,
    reporting_year: demoCompany.reportingYear,
    custom_factors: demoFactors,
    seeded_at: new Date().toISOString(),
  });

  await supabase.from("facilities").upsert(demoFacilities.map((f) => facilityToRow(f, companyId)));
  await supabase.from("vehicles").upsert(demoVehicles.map((v) => vehicleToRow(v, companyId)));
  await supabase.from("suppliers").upsert(demoSuppliers.map((s) => supplierToRow(s, companyId)));
  await supabase.from("reduction_initiatives").upsert(demoInitiatives.map((i) => initiativeToRow(i, companyId)));
  await supabase.from("climate_targets").upsert(targetToRow(demoTarget, companyId));

  const rows = allActivities.map((a) => activityToRow(a, companyId));
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    await supabase.from("emission_activities").upsert(chunk);
  }

  await supabase.from("notifications").insert({
    company_id: companyId,
    title: "Inventory loaded",
    message: "Your workspace inventory is ready. Continue adding activities anytime.",
    href: "/dashboard/overview",
    read: false,
  });
}

export async function insertActivity(companyId: string, activity: EmissionActivity) {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const store = readLocal(companyId);
    store.activities = [activity, ...store.activities.filter((a) => a.id !== activity.id)];
    writeLocal(companyId, store);
    return activity;
  }
  const supabase = createClient();
  const { error } = await supabase.from("emission_activities").upsert(activityToRow(activity, companyId));
  if (error) throw new Error(error.message);
  return activity;
}

export async function deleteActivity(companyId: string, activityId: string) {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const store = readLocal(companyId);
    store.activities = store.activities.filter((a) => a.id !== activityId);
    writeLocal(companyId, store);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("emission_activities")
    .delete()
    .eq("id", activityId)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
}

export async function upsertInitiative(companyId: string, initiative: ReductionInitiative) {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const store = readLocal(companyId);
    const idx = store.initiatives.findIndex((i) => i.id === initiative.id);
    if (idx >= 0) store.initiatives[idx] = initiative;
    else store.initiatives = [initiative, ...store.initiatives];
    writeLocal(companyId, store);
    return initiative;
  }
  const supabase = createClient();
  const { error } = await supabase.from("reduction_initiatives").upsert(initiativeToRow(initiative, companyId));
  if (error) throw new Error(error.message);
  return initiative;
}

export async function insertVehicle(companyId: string, vehicle: Vehicle) {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const store = readLocal(companyId);
    store.vehicles = [vehicle, ...store.vehicles];
    writeLocal(companyId, store);
    return vehicle;
  }
  const supabase = createClient();
  const { error } = await supabase.from("vehicles").upsert(vehicleToRow(vehicle, companyId));
  if (error) throw new Error(error.message);
  return vehicle;
}

export async function insertVehicles(companyId: string, list: Vehicle[]) {
  for (const v of list) await insertVehicle(companyId, v);
  return list;
}

export async function insertFacility(companyId: string, facility: Facility) {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const store = readLocal(companyId);
    store.facilities = [facility, ...store.facilities];
    writeLocal(companyId, store);
    return facility;
  }
  const supabase = createClient();
  const { error } = await supabase.from("facilities").upsert(facilityToRow(facility, companyId));
  if (error) throw new Error(error.message);
  return facility;
}

export async function insertSupplier(companyId: string, supplier: Supplier) {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const store = readLocal(companyId);
    store.suppliers = [supplier, ...store.suppliers];
    writeLocal(companyId, store);
    return supplier;
  }
  const supabase = createClient();
  const { error } = await supabase.from("suppliers").upsert(supplierToRow(supplier, companyId));
  if (error) throw new Error(error.message);
  return supplier;
}

export async function upsertClimateTarget(companyId: string, target: ClimateTarget) {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const store = readLocal(companyId);
    store.climateTarget = target;
    writeLocal(companyId, store);
    return target;
  }
  const supabase = createClient();
  const { error } = await supabase.from("climate_targets").upsert(targetToRow(target, companyId));
  if (error) throw new Error(error.message);
  return target;
}

export async function listTeamInvites(companyId: string): Promise<TeamInviteRow[]> {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const store = readLocal(companyId);
    return store.invites ?? [];
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("team_invites")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    companyId: String(row.company_id),
    email: String(row.email),
    role: String(row.role),
    status: row.status as TeamInviteRow["status"],
    createdAt: String(row.created_at),
    invitedBy: row.invited_by ? String(row.invited_by) : null,
  }));
}

export async function revokeTeamInvite(companyId: string, inviteId: string) {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const store = readLocal(companyId);
    store.invites = store.invites.map((i) =>
      i.id === inviteId ? { ...i, status: "revoked" as const } : i
    );
    writeLocal(companyId, store);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("team_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
}

export async function updateInitiativeStatus(
  companyId: string,
  id: string,
  status: ReductionInitiative["status"]
) {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const store = readLocal(companyId);
    store.initiatives = store.initiatives.map((i) => (i.id === id ? { ...i, status } : i));
    writeLocal(companyId, store);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("reduction_initiatives")
    .update({ status })
    .eq("id", id)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
}

export async function updateCompanySettings(
  companyId: string,
  patch: Partial<CompanySettingsRow> & { companyName?: string; industry?: string; employeeCount?: number; revenueEUR?: number }
) {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const store = readLocal(companyId);
    store.settings = { ...store.settings, ...patch, companyId };
    if (patch.customFactors) store.customFactors = patch.customFactors;
    writeLocal(companyId, store);
    return store.settings;
  }

  const supabase = createClient();
  const payload: Record<string, unknown> = {
    company_id: companyId,
  };
  if (patch.carbonPricePerTonne != null) payload.carbon_price_per_tonne = patch.carbonPricePerTonne;
  if (patch.discountRate != null) payload.discount_rate = patch.discountRate;
  if (patch.unitsProduced != null) payload.units_produced = patch.unitsProduced;
  if (patch.baselineYear != null) payload.baseline_year = patch.baselineYear;
  if (patch.reportingYear != null) payload.reporting_year = patch.reportingYear;
  if (patch.customFactors) payload.custom_factors = patch.customFactors;
  if (patch.gwpValues) payload.gwp_values = patch.gwpValues;
  if (patch.seededAt !== undefined) payload.seeded_at = patch.seededAt;

  const { error } = await supabase.from("company_settings").upsert(payload);
  if (error) {
    // Retry without gwp_values if migration 004 not applied
    if (payload.gwp_values) {
      delete payload.gwp_values;
      const retry = await supabase.from("company_settings").upsert(payload);
      if (retry.error) throw new Error(retry.error.message);
    } else {
      throw new Error(error.message);
    }
  }

  if (patch.companyName || patch.industry || patch.employeeCount != null || patch.revenueEUR != null) {
    await supabase
      .from("companies")
      .update({
        ...(patch.companyName ? { name: patch.companyName } : {}),
        ...(patch.industry ? { industry: patch.industry } : {}),
        ...(patch.employeeCount != null ? { employee_count: patch.employeeCount } : {}),
        ...(patch.revenueEUR != null ? { annual_revenue: patch.revenueEUR } : {}),
      })
      .eq("id", companyId);
  }

  return patch;
}

export async function addCustomFactor(companyId: string, factor: EmissionFactor) {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const store = readLocal(companyId);
    store.customFactors = [factor, ...store.customFactors];
    store.settings.customFactors = store.customFactors;
    writeLocal(companyId, store);
    return store.customFactors;
  }
  const supabase = createClient();
  const { data } = await supabase.from("company_settings").select("custom_factors").eq("company_id", companyId).maybeSingle();
  const existing = Array.isArray(data?.custom_factors) ? data!.custom_factors : [];
  const next = [factor, ...existing];
  const { error } = await supabase.from("company_settings").upsert({
    company_id: companyId,
    custom_factors: next,
  });
  if (error) throw new Error(error.message);
  return next as EmissionFactor[];
}

export async function createNotification(
  companyId: string,
  input: { title: string; message: string; href?: string; userId?: string }
) {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const store = readLocal(companyId);
    const n: DashboardNotification = {
      id: crypto.randomUUID(),
      companyId,
      userId: input.userId ?? null,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
      read: false,
      createdAt: new Date().toISOString(),
    };
    store.notifications = [n, ...store.notifications];
    writeLocal(companyId, store);
    return n;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      company_id: companyId,
      user_id: input.userId ?? null,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
      read: false,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapNotification(data);
}

export async function markNotificationsRead(companyId: string, ids?: string[]) {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const store = readLocal(companyId);
    store.notifications = store.notifications.map((n) =>
      !ids || ids.includes(n.id) ? { ...n, read: true } : n
    );
    writeLocal(companyId, store);
    return;
  }
  const supabase = createClient();
  let q = supabase.from("notifications").update({ read: true }).eq("company_id", companyId);
  if (ids?.length) q = q.in("id", ids);
  const { error } = await q;
  if (error) throw new Error(error.message);
}

export async function createTeamInvite(companyId: string, email: string, role = "member") {
  const useSb = await tablesAvailable();
  if (!useSb) {
    const store = readLocal(companyId);
    const invite: TeamInviteRow = {
      id: crypto.randomUUID(),
      companyId,
      email,
      role,
      status: "pending",
      createdAt: new Date().toISOString(),
      invitedBy: null,
    };
    store.invites = [invite, ...store.invites];
    writeLocal(companyId, store);
    await createNotification(companyId, {
      title: "Team invite created",
      message: `Invitation prepared for ${email} (${role}). Share a login link to join this workspace.`,
      href: "/dashboard/team",
    });
    return { email, role, status: "pending" as const };
  }
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("team_invites").insert({
    company_id: companyId,
    email,
    role,
    invited_by: user?.id ?? null,
    status: "pending",
  });
  if (error) throw new Error(error.message);
  await createNotification(companyId, {
    title: "Team invite sent",
    message: `Invite recorded for ${email}. Share the app login link so they can join.`,
    href: "/dashboard/team",
  });
  return { email, role, status: "pending" as const };
}

export function buildCompanyFromBundle(
  authCompany: { id: string; name: string; industry?: string | null; currency: string; employee_count?: number | null; annual_revenue?: number | null } | null,
  settings: CompanySettingsRow | null
): Company {
  return {
    id: authCompany?.id ?? demoCompany.id,
    name: authCompany?.name ?? demoCompany.name,
    industry: authCompany?.industry ?? demoCompany.industry,
    currency: authCompany?.currency ?? "EUR",
    baselineYear: settings?.baselineYear ?? demoCompany.baselineYear,
    reportingYear: settings?.reportingYear ?? demoCompany.reportingYear,
    employeeCount: authCompany?.employee_count ?? demoCompany.employeeCount,
    revenueEUR: Number(authCompany?.annual_revenue ?? demoCompany.revenueEUR),
    unitsProduced: settings?.unitsProduced ?? demoCompany.unitsProduced,
    carbonPricePerTonne: settings?.carbonPricePerTonne ?? demoCompany.carbonPricePerTonne,
    discountRate: settings?.discountRate ?? demoCompany.discountRate,
    isDemo: false,
  };
}

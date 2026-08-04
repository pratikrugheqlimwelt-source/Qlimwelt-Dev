"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import type {
  DashboardFilters,
  EmissionActivity,
  Company as DashboardCompany,
  Facility,
  Vehicle,
  Supplier,
  ReductionInitiative,
  ClimateTarget,
  ClimateInsight,
  EmissionFactor,
} from "@/types/carbon";
import { DEFAULT_FILTERS } from "@/types/carbon";
import { useAuth } from "@/hooks/useAuth";
import {
  businessUnits,
  emissionFactors as demoFactors,
  PERIODS,
  company as demoCompany,
} from "@/data/carbon";
import {
  activityToCalculation,
  sumEmissionsTCO2e,
  sumByScope,
  emissionsPerEmployee,
  emissionsPerRevenue,
  emissionsPerProduct,
  percentageChange,
  targetProgressPct,
  absoluteTargetEmissions,
  carbonCost,
} from "@/lib/calculations/engine";
import { deriveClimateInsights } from "@/lib/climate-insights";
import {
  loadDashboardBundle,
  insertActivity,
  deleteActivity,
  seedSampleData,
  upsertInitiative,
  insertVehicle,
  insertVehicles,
  insertFacility,
  insertSupplier,
  upsertClimateTarget,
  updateInitiativeStatus,
  updateCompanySettings,
  addCustomFactor,
  createNotification,
  markNotificationsRead,
  createTeamInvite,
  buildCompanyFromBundle,
  upsertAssessment,
  deleteAssessment,
  type DashboardNotification,
  type CompanySettingsRow,
} from "@/services/carbon/dashboardService";
import { toast } from "@/hooks/use-toast";
import type { Assessment } from "@/types/assessment";
import { createBlankAssessment } from "@/types/assessment";

interface CalculationDetail {
  activity: EmissionActivity;
  formula: string;
  resultTCO2e: number;
}

interface DashboardContextValue {
  company: DashboardCompany;
  facilities: Facility[];
  businessUnits: typeof businessUnits;
  vehicles: Vehicle[];
  suppliers: Supplier[];
  reductionInitiatives: ReductionInitiative[];
  climateTarget: ClimateTarget;
  climateInsights: ClimateInsight[];
  emissionFactors: EmissionFactor[];
  activities: EmissionActivity[];
  notifications: DashboardNotification[];
  unreadCount: number;
  loading: boolean;
  saving: boolean;
  dataMode: "supabase" | "local" | "demo";
  filters: DashboardFilters;
  setFilters: (patch: Partial<DashboardFilters>) => void;
  filteredActivities: EmissionActivity[];
  previousPeriodActivities: EmissionActivity[];
  metrics: ReturnType<typeof computeMetrics>;
  monthlyTrend: {
    month: string;
    monthLabel: string;
    scope1: number;
    scope2: number;
    scope3: number;
    total: number;
    target: number;
    previousYear: number;
    baseline: number;
    momChange: number;
    yoyChange: number;
    rollingAvg: number;
    intensity: number;
  }[];
  openCalculation: (activity: EmissionActivity) => void;
  calculationDetail: CalculationDetail | null;
  closeCalculation: () => void;
  refresh: () => Promise<void>;
  addActivity: (activity: EmissionActivity) => Promise<void>;
  addFacility: (facility: Facility) => Promise<void>;
  addSupplier: (supplier: Supplier) => Promise<void>;
  addVehicle: (vehicle: Vehicle) => Promise<void>;
  addVehiclesBulk: (vehicles: Vehicle[]) => Promise<void>;
  logVehicleEmissions: (vehicle: Vehicle, period?: string) => Promise<void>;
  logSupplierEmissions: (supplier: Supplier, period?: string) => Promise<void>;
  saveClimateTarget: (target: ClimateTarget) => Promise<void>;
  setInitiativeStatus: (id: string, status: ReductionInitiative["status"]) => Promise<void>;
  saveSettings: (patch: Partial<CompanySettingsRow> & {
    companyName?: string;
    industry?: string;
    employeeCount?: number;
    revenueEUR?: number;
  }) => Promise<void>;
  addFactor: (factor: EmissionFactor) => Promise<void>;
  notify: (input: { title: string; message: string; href?: string }) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  inviteTeamMember: (email: string, role?: string) => Promise<void>;
  actOnInsight: (insight: ClimateInsight) => Promise<string>;
  loadSampleData: () => Promise<void>;
  deleteActivityRecord: (id: string) => Promise<void>;
  saveActivity: (activity: EmissionActivity) => Promise<void>;
  saveInitiative: (initiative: ReductionInitiative) => Promise<void>;
  isSampleData: boolean;
  isEmpty: boolean;
  gwpValues: Record<string, number>;
  assessments: Assessment[];
  createAssessment: (input: { name: string; type: Assessment["type"] }) => Promise<Assessment>;
  saveAssessment: (assessment: Assessment) => Promise<Assessment>;
  removeAssessment: (id: string) => Promise<void>;
  getAssessment: (id: string) => Assessment | undefined;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

function filterActivities(activities: EmissionActivity[], filters: DashboardFilters) {
  return activities.filter((a) => {
    if (filters.period !== "all" && a.period !== filters.period) return false;
    if (filters.facilityId !== "all" && a.facilityId !== filters.facilityId) return false;
    if (filters.country !== "all" && a.country !== filters.country) return false;
    if (filters.businessUnitId !== "all" && a.businessUnitId !== filters.businessUnitId) return false;
    if (filters.scope !== "all" && a.scope !== filters.scope) return false;
    if (filters.category !== "all" && a.category !== filters.category) return false;
    if (filters.dataQuality !== "all") {
      const label =
        a.dataQualityScore >= 85
          ? "high"
          : a.dataQualityScore >= 70
            ? "good"
            : a.dataQualityScore >= 40
              ? "moderate"
              : "low";
      if (label !== filters.dataQuality) return false;
    }
    if (filters.method !== "all" && a.method !== filters.method) return false;
    return true;
  });
}

function computeMetrics(
  activities: EmissionActivity[],
  prevActivities: EmissionActivity[],
  activeCompany: DashboardCompany,
  target: ClimateTarget,
  initiatives: ReductionInitiative[]
) {
  const total = sumEmissionsTCO2e(activities);
  const prevTotal = sumEmissionsTCO2e(prevActivities);
  const scopes = sumByScope(activities);
  const verified = activities.filter((a) => a.evidenceStatus === "verified").length;
  const estimated = activities.filter((a) => a.isEstimated).length;
  const totalRecords = activities.length || 1;

  const targetEmissions = absoluteTargetEmissions(target.baselineEmissionsTCO2e, target.targetReductionPct);
  const progress = targetProgressPct(
    target.baselineEmissionsTCO2e,
    total * (12 / Math.max(activities.length / 10, 1)),
    targetEmissions
  );

  const reductionOpp = initiatives.reduce((s, i) => s + i.annualEmissionReductionTCO2e, 0);
  const financialSaving = initiatives.reduce((s, i) => s + i.annualFinancialSaving, 0);

  return {
    totalTCO2e: total,
    scope1: scopes.scope1,
    scope2: scopes.scope2,
    scope3: scopes.scope3,
    changePct: percentageChange(total, prevTotal),
    perEmployee: emissionsPerEmployee(total, activeCompany.employeeCount),
    perRevenue: emissionsPerRevenue(total, activeCompany.revenueEUR) * 1_000_000,
    perProduction: emissionsPerProduct(total, activeCompany.unitsProduced),
    verifiedPct: (verified / totalRecords) * 100,
    estimatedPct: (estimated / totalRecords) * 100,
    targetProgress: Math.min(100, Math.max(0, progress)),
    reductionOpportunity: reductionOpp,
    financialSavings: financialSaving,
    carbonCostExposure: carbonCost(total, activeCompany.carbonPricePerTonne),
  };
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function priorYearPeriod(period: string): string | null {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return null;
  return `${Number(m[1]) - 1}-${m[2]}`;
}

function buildMonthlyTrend(
  allActs: EmissionActivity[],
  filters: DashboardFilters,
  activeCompany: DashboardCompany,
  target: ClimateTarget
) {
  const months = PERIODS.filter((p) => p !== "all");
  const availablePeriods = new Set(allActs.map((a) => a.period));
  const points = months.map((month, i) => {
    const monthActs = filterActivities(allActs, { ...filters, period: month });
    const scopes = sumByScope(monthActs);
    const total = scopes.scope1 + scopes.scope2 + scopes.scope3;
    const baseline = target.baselineEmissionsTCO2e / 12;
    const targetMonthly =
      absoluteTargetEmissions(target.baselineEmissionsTCO2e, target.targetReductionPct) / 12;
    const yearProgress = i / 11;
    const pathway = baseline - (baseline - targetMonthly) * yearProgress;

    const priorPeriod = priorYearPeriod(month);
    let previousYear = 0;
    if (priorPeriod && availablePeriods.has(priorPeriod)) {
      const priorActs = filterActivities(allActs, { ...filters, period: priorPeriod });
      previousYear = sumEmissionsTCO2e(priorActs);
    } else if (total > 0) {
      previousYear = total * 1.05;
    }

    const revenueM = activeCompany.revenueEUR / 1_000_000;
    const intensity = revenueM > 0 ? total / revenueM : 0;
    return {
      month: month.slice(5),
      monthLabel: MONTH_LABELS[i],
      scope1: scopes.scope1,
      scope2: scopes.scope2,
      scope3: scopes.scope3,
      total,
      target: pathway,
      previousYear,
      baseline,
      intensity,
      momChange: 0,
      yoyChange: previousYear > 0 ? ((total - previousYear) / previousYear) * 100 : 0,
      rollingAvg: 0,
    };
  });

  return points.map((p, i) => {
    const prev = i > 0 ? points[i - 1].total : p.total;
    const momChange = prev > 0 ? ((p.total - prev) / prev) * 100 : 0;
    const window = points.slice(Math.max(0, i - 2), i + 1);
    const rollingAvg = window.reduce((s, w) => s + w.total, 0) / window.length;
    return { ...p, momChange, rollingAvg };
  });
}

const DEFAULT_GWP: Record<string, number> = {
  CO2: 1, CH4: 27.9, N2O: 273, HFCs: 1430, PFCs: 6630, SF6: 25200, NF3: 17400,
};

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { company: authCompany } = useAuth();
  const companyId = authCompany?.id ?? demoCompany.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataMode, setDataMode] = useState<"supabase" | "local" | "demo">("demo");
  const [settings, setSettings] = useState<CompanySettingsRow | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activities, setActivities] = useState<EmissionActivity[]>([]);
  const [initiatives, setInitiatives] = useState<ReductionInitiative[]>([]);
  const [climateTarget, setClimateTarget] = useState<ClimateTarget>({
    id: "tgt-1",
    name: "Science-Based Target 2030",
    baselineYear: 2023,
    targetYear: 2030,
    baselineEmissionsTCO2e: 14200,
    targetReductionPct: 42,
    type: "absolute",
  });
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactor[]>(demoFactors);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filters, setFiltersState] = useState<DashboardFilters>(() => {
    if (typeof window === "undefined") return DEFAULT_FILTERS;
    try {
      const raw = sessionStorage.getItem("qlimwelt-dashboard-filters");
      if (!raw) return DEFAULT_FILTERS;
      return { ...DEFAULT_FILTERS, ...(JSON.parse(raw) as Partial<DashboardFilters>) };
    } catch {
      return DEFAULT_FILTERS;
    }
  });
  const [calculationDetail, setCalculationDetail] = useState<CalculationDetail | null>(null);

  const activeCompany = useMemo(
    () => buildCompanyFromBundle(authCompany, settings),
    [authCompany, settings]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await loadDashboardBundle(companyId);
      setDataMode(bundle.mode);
      setSettings(bundle.settings);
      setFacilities(bundle.facilities);
      setVehicles(bundle.vehicles);
      setSuppliers(bundle.suppliers);
      setActivities(bundle.activities);
      setInitiatives(bundle.initiatives);
      if (bundle.climateTarget) setClimateTarget(bundle.climateTarget);
      setNotifications(bundle.notifications);
      setAssessments(bundle.assessments ?? []);
      const factors = bundle.settings?.customFactors?.length
        ? [...bundle.settings.customFactors, ...demoFactors]
        : demoFactors;
      setEmissionFactors(factors);
    } catch (err) {
      console.error(err);
      toast({
        title: "Could not load dashboard data",
        description: err instanceof Error ? err.message : "Using local workspace storage.",
        variant: "destructive",
      });
      setDataMode("local");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setFilters = useCallback((patch: Partial<DashboardFilters>) => {
    setFiltersState((f) => {
      const next = { ...f, ...patch };
      try {
        sessionStorage.setItem("qlimwelt-dashboard-filters", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const filteredActivities = useMemo(
    () => filterActivities(activities, filters),
    [activities, filters]
  );

  const previousPeriodActivities = useMemo(() => {
    if (filters.period === "all") return filterActivities(activities, { ...filters, period: "2023-12" });
    const idx = PERIODS.indexOf(filters.period);
    const prev = idx > 1 ? PERIODS[idx - 1] : "2024-01";
    return filterActivities(activities, { ...filters, period: prev });
  }, [activities, filters]);

  const metrics = useMemo(
    () =>
      computeMetrics(
        filteredActivities,
        previousPeriodActivities,
        activeCompany,
        climateTarget,
        initiatives
      ),
    [filteredActivities, previousPeriodActivities, activeCompany, climateTarget, initiatives]
  );

  const monthlyTrend = useMemo(
    () => buildMonthlyTrend(activities, filters, activeCompany, climateTarget),
    [activities, filters, activeCompany, climateTarget]
  );

  const openCalculation = useCallback((activity: EmissionActivity) => {
    const calc = activityToCalculation(activity);
    setCalculationDetail({
      activity,
      formula: `${activity.activityValue} ${activity.activityUnit} × ${activity.emissionFactorValue} × ${activity.conversionFactor} = ${calc.emissionsKgCO2e.toFixed(2)} kgCO₂e ÷ 1000`,
      resultTCO2e: calc.emissionsTCO2e,
    });
  }, []);

  const closeCalculation = useCallback(() => setCalculationDetail(null), []);

  const withSaving = useCallback(async (fn: () => Promise<void>, success?: string) => {
    setSaving(true);
    try {
      await fn();
      if (success) toast({ title: success, variant: "success" });
    } catch (err) {
      toast({
        title: "Action failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const addActivity = useCallback(
    async (activity: EmissionActivity) => {
      await withSaving(async () => {
        await insertActivity(companyId, activity);
        setActivities((prev) => [activity, ...prev]);
        await createNotification(companyId, {
          title: "Activity saved",
          message: `${activity.source} · ${activity.period} added to inventory.`,
          href: "/dashboard/emissions",
        });
        await refresh();
      }, "Activity record saved");
    },
    [companyId, refresh, withSaving]
  );

  const addFacility = useCallback(
    async (facility: Facility) => {
      await withSaving(async () => {
        await insertFacility(companyId, facility);
        setFacilities((prev) => [facility, ...prev]);
        await refresh();
      }, "Facility added");
    },
    [companyId, refresh, withSaving]
  );

  const addSupplier = useCallback(
    async (supplier: Supplier) => {
      await withSaving(async () => {
        await insertSupplier(companyId, supplier);
        setSuppliers((prev) => [supplier, ...prev]);
        await refresh();
      }, "Supplier added");
    },
    [companyId, refresh, withSaving]
  );

  const addVehicle = useCallback(
    async (vehicle: Vehicle) => {
      await withSaving(async () => {
        await insertVehicle(companyId, vehicle);
        setVehicles((prev) => [vehicle, ...prev]);
        await refresh();
      }, "Vehicle added");
    },
    [companyId, refresh, withSaving]
  );

  const addVehiclesBulk = useCallback(
    async (list: Vehicle[]) => {
      await withSaving(async () => {
        await insertVehicles(companyId, list);
        await refresh();
      }, `${list.length} vehicles imported`);
    },
    [companyId, refresh, withSaving]
  );

  const logVehicleEmissions = useCallback(
    async (vehicle: Vehicle, period = "2024-12") => {
      const isEv = vehicle.fuelType.toLowerCase().includes("electric") && vehicle.fuelLitres <= 0;
      const activity: EmissionActivity = {
        id: `a-veh-${vehicle.id}-${Date.now()}`,
        period,
        facilityId: vehicle.facilityId,
        country: vehicle.country || "Germany",
        businessUnitId: "bu-ops",
        scope: isEv ? "scope2" : "scope1",
        category: isEv ? "Purchased electricity" : "Mobile combustion",
        subcategory: `${vehicle.manufacturer} ${vehicle.model}`,
        source: `Fleet · ${vehicle.registration}`,
        activityValue: isEv ? vehicle.electricityKwh : vehicle.fuelLitres,
        activityUnit: isEv ? "kWh" : "litre",
        emissionFactorId: `ef-veh-${vehicle.id}`,
        emissionFactorValue: isEv ? 0.000385 : vehicle.emissionFactor || 2.68,
        emissionFactorUnit: isEv ? "kgCO2e/kWh" : "kgCO2e/litre",
        emissionFactorSource: "Vehicle master data",
        emissionFactorYear: activeCompany.reportingYear,
        conversionFactor: 1,
        ghg: "CO2",
        gwp: 1,
        method: isEv ? "location_based" : "fuel_based",
        dataQualityScore: 75,
        uncertaintyPct: 12,
        evidenceStatus: "uploaded",
        resourceId: vehicle.id,
        isEstimated: false,
      };
      await addActivity(activity);
    },
    [activeCompany, addActivity]
  );

  const logSupplierEmissions = useCallback(
    async (supplier: Supplier, period = "2024-12") => {
      const facility = facilities[0];
      const activity: EmissionActivity = {
        id: `a-sup-${supplier.id}-${Date.now()}`,
        period,
        facilityId: facility?.id ?? "fac-mun",
        country: supplier.country || facility?.country || "Germany",
        businessUnitId: facility?.businessUnitId ?? "bu-ops",
        scope: "scope3",
        category: "Category 1",
        subcategory: supplier.category,
        source: `Supplier · ${supplier.name}`,
        activityValue: supplier.scope3TCO2e,
        activityUnit: "tCO2e",
        emissionFactorId: `ef-sup-${supplier.id}`,
        emissionFactorValue: 1000,
        emissionFactorUnit: "kgCO2e/tCO2e",
        emissionFactorSource: "Supplier-reported",
        emissionFactorYear: activeCompany.reportingYear,
        conversionFactor: 1,
        ghg: "CO2",
        gwp: 1,
        method: "supplier_specific",
        dataQualityScore: supplier.dataQualityScore,
        uncertaintyPct: Math.max(5, 100 - supplier.dataQualityScore),
        evidenceStatus: "uploaded",
        resourceId: supplier.id,
        isEstimated: supplier.dataQualityScore < 70,
      };
      await addActivity(activity);
    },
    [activeCompany, addActivity, facilities]
  );

  const saveClimateTarget = useCallback(
    async (target: ClimateTarget) => {
      await withSaving(async () => {
        await upsertClimateTarget(companyId, target);
        setClimateTarget(target);
      }, "Climate target saved");
    },
    [companyId, withSaving]
  );

  const setInitiativeStatus = useCallback(
    async (id: string, status: ReductionInitiative["status"]) => {
      await withSaving(async () => {
        await updateInitiativeStatus(companyId, id, status);
        setInitiatives((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
      }, `Initiative marked ${status.replace(/_/g, " ")}`);
    },
    [companyId, withSaving]
  );

  const saveSettings = useCallback(
    async (patch: Partial<CompanySettingsRow> & {
      companyName?: string;
      industry?: string;
      employeeCount?: number;
      revenueEUR?: number;
    }) => {
      await withSaving(async () => {
        await updateCompanySettings(companyId, patch);
        await refresh();
      }, "Settings saved");
    },
    [companyId, refresh, withSaving]
  );

  const addFactor = useCallback(
    async (factor: EmissionFactor) => {
      await withSaving(async () => {
        const next = await addCustomFactor(companyId, factor);
        setEmissionFactors([...next, ...demoFactors]);
      }, "Emission factor added");
    },
    [companyId, withSaving]
  );

  const notify = useCallback(
    async (input: { title: string; message: string; href?: string }) => {
      const n = await createNotification(companyId, input);
      setNotifications((prev) => [n, ...prev]);
    },
    [companyId]
  );

  const markAllNotificationsRead = useCallback(async () => {
    await markNotificationsRead(companyId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [companyId]);

  const inviteTeamMember = useCallback(
    async (email: string, role = "member") => {
      await withSaving(async () => {
        await createTeamInvite(companyId, email, role);
        await refresh();
      }, `Invite recorded for ${email}`);
    },
    [companyId, refresh, withSaving]
  );

  const loadSampleData = useCallback(async () => {
    await withSaving(async () => {
      await seedSampleData(companyId);
      await refresh();
    }, "Inventory loaded");
  }, [companyId, refresh, withSaving]);

  const deleteActivityRecord = useCallback(
    async (id: string) => {
      await withSaving(async () => {
        await deleteActivity(companyId, id);
        setActivities((prev) => prev.filter((a) => a.id !== id));
        await refresh();
      }, "Activity deleted");
    },
    [companyId, refresh, withSaving]
  );

  const saveActivity = useCallback(
    async (activity: EmissionActivity) => {
      await addActivity(activity);
    },
    [addActivity]
  );

  const saveInitiative = useCallback(
    async (initiative: ReductionInitiative) => {
      await withSaving(async () => {
        await upsertInitiative(companyId, initiative);
        setInitiatives((prev) => {
          const idx = prev.findIndex((i) => i.id === initiative.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = initiative;
            return next;
          }
          return [initiative, ...prev];
        });
        await refresh();
      }, "Initiative saved");
    },
    [companyId, refresh, withSaving]
  );

  const createAssessment = useCallback(
    async (input: { name: string; type: Assessment["type"] }) => {
      const assessment = createBlankAssessment(companyId, input, activeCompany.reportingYear);
      assessment.profile.legalName = activeCompany.name;
      assessment.profile.tradingName = activeCompany.name;
      assessment.profile.industry = activeCompany.industry;
      assessment.profile.employees = activeCompany.employeeCount;
      assessment.profile.currency = activeCompany.currency;
      await withSaving(async () => {
        const saved = await upsertAssessment(companyId, assessment);
        setAssessments((prev) => [saved, ...prev.filter((a) => a.id !== saved.id)]);
        Object.assign(assessment, saved);
      }, "Assessment created");
      return assessment;
    },
    [activeCompany, companyId, withSaving]
  );

  const saveAssessment = useCallback(
    async (assessment: Assessment) => {
      let saved = assessment;
      await withSaving(async () => {
        saved = await upsertAssessment(companyId, assessment);
        setAssessments((prev) => {
          const idx = prev.findIndex((a) => a.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });
      });
      return saved;
    },
    [companyId, withSaving]
  );

  const removeAssessment = useCallback(
    async (id: string) => {
      await withSaving(async () => {
        await deleteAssessment(companyId, id);
        setAssessments((prev) => prev.filter((a) => a.id !== id));
      }, "Assessment removed");
    },
    [companyId, withSaving]
  );

  const getAssessment = useCallback(
    (id: string) => assessments.find((a) => a.id === id),
    [assessments]
  );

  const actOnInsight = useCallback(
    async (insight: ClimateInsight) => {
      const match = initiatives.find((i) => {
        const action = insight.action.toLowerCase();
        const name = i.name.toLowerCase();
        if (action.includes("ppa") && name.includes("ppa")) return true;
        if (action.includes("fleet") && name.includes("fleet")) return true;
        if (action.includes("supplier") && name.includes("supplier")) return true;
        return false;
      });
      if (match && match.status === "planned") {
        await setInitiativeStatus(match.id, "in_progress");
      }
      await notify({
        title: `Acting on: ${insight.title}`,
        message: insight.action,
        href: "/dashboard/reduction-planner",
      });
      return "/dashboard/reduction-planner";
    },
    [initiatives, notify, setInitiativeStatus]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const climateInsights = useMemo(
    () =>
      deriveClimateInsights(
        filteredActivities,
        initiatives,
        activeCompany.carbonPricePerTonne
      ),
    [filteredActivities, initiatives, activeCompany.carbonPricePerTonne]
  );

  const isSampleData = Boolean(settings?.seededAt);
  const isEmpty = activities.length === 0 && !settings?.seededAt;
  const gwpValues = settings?.gwpValues ?? DEFAULT_GWP;

  const value = useMemo(
    () => ({
      company: activeCompany,
      facilities,
      businessUnits,
      vehicles,
      suppliers,
      reductionInitiatives: initiatives,
      climateTarget,
      climateInsights,
      emissionFactors,
      activities,
      notifications,
      unreadCount,
      loading,
      saving,
      dataMode,
      filters,
      setFilters,
      filteredActivities,
      previousPeriodActivities,
      metrics,
      monthlyTrend,
      openCalculation,
      calculationDetail,
      closeCalculation,
      refresh,
      addActivity,
      addFacility,
      addSupplier,
      addVehicle,
      addVehiclesBulk,
      logVehicleEmissions,
      logSupplierEmissions,
      saveClimateTarget,
      setInitiativeStatus,
      saveSettings,
      addFactor,
      notify,
      markAllNotificationsRead,
      inviteTeamMember,
      actOnInsight,
      loadSampleData,
      deleteActivityRecord,
      saveActivity,
      saveInitiative,
      isSampleData,
      isEmpty,
      gwpValues,
      assessments,
      createAssessment,
      saveAssessment,
      removeAssessment,
      getAssessment,
    }),
    [
      activeCompany,
      facilities,
      vehicles,
      suppliers,
      initiatives,
      climateTarget,
      climateInsights,
      emissionFactors,
      activities,
      notifications,
      unreadCount,
      loading,
      saving,
      dataMode,
      filters,
      setFilters,
      filteredActivities,
      previousPeriodActivities,
      metrics,
      monthlyTrend,
      openCalculation,
      calculationDetail,
      closeCalculation,
      refresh,
      addActivity,
      addFacility,
      addSupplier,
      addVehicle,
      addVehiclesBulk,
      logVehicleEmissions,
      logSupplierEmissions,
      saveClimateTarget,
      setInitiativeStatus,
      saveSettings,
      addFactor,
      notify,
      markAllNotificationsRead,
      inviteTeamMember,
      actOnInsight,
      loadSampleData,
      deleteActivityRecord,
      saveActivity,
      saveInitiative,
      isSampleData,
      isEmpty,
      gwpValues,
      assessments,
      createAssessment,
      saveAssessment,
      removeAssessment,
      getAssessment,
    ]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}

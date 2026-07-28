"use client";

import { createContext, useContext, useMemo, useState, useCallback } from "react";
import type { DashboardFilters, EmissionActivity, Company as DashboardCompany } from "@/types/carbon";
import { DEFAULT_FILTERS } from "@/types/carbon";
import { useAuth } from "@/hooks/useAuth";
import type { Company as AuthCompany } from "@/types/company";
import {
  allActivities,
  company as demoCompany,
  facilities,
  businessUnits,
  vehicles,
  suppliers,
  reductionInitiatives,
  climateTarget,
  climateInsights,
  emissionFactors,
  PERIODS,
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

interface CalculationDetail {
  activity: EmissionActivity;
  formula: string;
  resultTCO2e: number;
}

interface DashboardContextValue {
  company: DashboardCompany;
  facilities: typeof facilities;
  businessUnits: typeof businessUnits;
  vehicles: typeof vehicles;
  suppliers: typeof suppliers;
  reductionInitiatives: typeof reductionInitiatives;
  climateTarget: typeof climateTarget;
  climateInsights: typeof climateInsights;
  emissionFactors: typeof emissionFactors;
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
      const label = a.dataQualityScore >= 85 ? "high" : a.dataQualityScore >= 70 ? "good" : a.dataQualityScore >= 40 ? "moderate" : "low";
      if (label !== filters.dataQuality) return false;
    }
    if (filters.method !== "all" && a.method !== filters.method) return false;
    return true;
  });
}

function mapAuthCompany(authCompany: AuthCompany): DashboardCompany {
  return {
    id: authCompany.id,
    name: authCompany.name,
    industry: authCompany.industry ?? "Industrial Manufacturing",
    currency: authCompany.currency,
    baselineYear: 2023,
    reportingYear: 2024,
    employeeCount: authCompany.employee_count ?? demoCompany.employeeCount,
    revenueEUR: Number(authCompany.annual_revenue ?? demoCompany.revenueEUR),
    unitsProduced: demoCompany.unitsProduced,
    carbonPricePerTonne: demoCompany.carbonPricePerTonne,
    discountRate: demoCompany.discountRate,
    isDemo: false,
  };
}

function computeMetrics(
  activities: EmissionActivity[],
  prevActivities: EmissionActivity[],
  activeCompany: DashboardCompany
) {
  const total = sumEmissionsTCO2e(activities);
  const prevTotal = sumEmissionsTCO2e(prevActivities);
  const scopes = sumByScope(activities);
  const verified = activities.filter((a) => a.evidenceStatus === "verified").length;
  const estimated = activities.filter((a) => a.isEstimated).length;
  const totalRecords = activities.length || 1;

  const targetEmissions = absoluteTargetEmissions(climateTarget.baselineEmissionsTCO2e, climateTarget.targetReductionPct);
  const progress = targetProgressPct(climateTarget.baselineEmissionsTCO2e, total * (12 / Math.max(activities.length / 10, 1)), targetEmissions);

  const reductionOpp = reductionInitiatives.reduce((s, i) => s + i.annualEmissionReductionTCO2e, 0);
  const financialSaving = reductionInitiatives.reduce((s, i) => s + i.annualFinancialSaving, 0);

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

function buildMonthlyTrend(filters: DashboardFilters, activeCompany: DashboardCompany) {
  const months = PERIODS.filter((p) => p !== "all");
  const points = months.map((month, i) => {
    const monthActs = filterActivities(allActivities, { ...filters, period: month });
    const scopes = sumByScope(monthActs);
    const total = scopes.scope1 + scopes.scope2 + scopes.scope3;
    const baseline = climateTarget.baselineEmissionsTCO2e / 12;
    const target = absoluteTargetEmissions(climateTarget.baselineEmissionsTCO2e, climateTarget.targetReductionPct) / 12;
    const yearProgress = i / 11;
    const pathway = baseline - (baseline - target) * yearProgress;
    // Prior year was ~8–12% higher with less efficiency; add month-specific noise
    const yoyFactor = 1.1 + Math.sin(i * 0.9) * 0.03;
    const previousYear = total * yoyFactor;
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

  // Compute MoM and 3-month rolling average
  return points.map((p, i) => {
    const prev = i > 0 ? points[i - 1].total : p.total;
    const momChange = prev > 0 ? ((p.total - prev) / prev) * 100 : 0;
    const window = points.slice(Math.max(0, i - 2), i + 1);
    const rollingAvg = window.reduce((s, w) => s + w.total, 0) / window.length;
    return { ...p, momChange, rollingAvg };
  });
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { company: authCompany } = useAuth();
  const activeCompany = useMemo(
    () => (authCompany ? mapAuthCompany(authCompany) : demoCompany),
    [authCompany]
  );

  const [filters, setFiltersState] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [calculationDetail, setCalculationDetail] = useState<CalculationDetail | null>(null);

  const setFilters = useCallback((patch: Partial<DashboardFilters>) => {
    setFiltersState((f) => ({ ...f, ...patch }));
  }, []);

  const filteredActivities = useMemo(() => filterActivities(allActivities, filters), [filters]);

  const previousPeriodActivities = useMemo(() => {
    if (filters.period === "all") return filterActivities(allActivities, { ...filters, period: "2023-12" });
    const idx = PERIODS.indexOf(filters.period);
    const prev = idx > 1 ? PERIODS[idx - 1] : "2024-01";
    return filterActivities(allActivities, { ...filters, period: prev });
  }, [filters]);

  const metrics = useMemo(
    () => computeMetrics(filteredActivities, previousPeriodActivities, activeCompany),
    [filteredActivities, previousPeriodActivities, activeCompany]
  );

  const monthlyTrend = useMemo(() => buildMonthlyTrend(filters, activeCompany), [filters, activeCompany]);

  const openCalculation = useCallback((activity: EmissionActivity) => {
    const calc = activityToCalculation(activity);
    setCalculationDetail({
      activity,
      formula: `${activity.activityValue} ${activity.activityUnit} × ${activity.emissionFactorValue} × ${activity.conversionFactor} = ${calc.emissionsKgCO2e.toFixed(2)} kgCO₂e ÷ 1000`,
      resultTCO2e: calc.emissionsTCO2e,
    });
  }, []);

  const closeCalculation = useCallback(() => setCalculationDetail(null), []);

  const value = useMemo(
    () => ({
      company: activeCompany,
      facilities,
      businessUnits,
      vehicles,
      suppliers,
      reductionInitiatives,
      climateTarget,
      climateInsights,
      emissionFactors,
      filters,
      setFilters,
      filteredActivities,
      previousPeriodActivities,
      metrics,
      monthlyTrend,
      openCalculation,
      calculationDetail,
      closeCalculation,
    }),
    [filters, filteredActivities, previousPeriodActivities, metrics, monthlyTrend, activeCompany, openCalculation, calculationDetail, closeCalculation, setFilters]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}

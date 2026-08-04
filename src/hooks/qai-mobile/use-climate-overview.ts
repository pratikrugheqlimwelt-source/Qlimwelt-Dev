"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { deriveClimateScore } from "@/lib/qai-mobile/climate-score";
/** Shared climate overview — same source as the web dashboard. */
export function useClimateOverview() {
  const { user, profile, company: authCompany, membership, loading: authLoading } = useAuth();
  const dash = useDashboard();

  const firstName = useMemo(() => {
    const full = profile?.full_name?.trim();
    if (full) return full.split(/\s+/)[0]!;
    const email = user?.email;
    if (email) return email.split("@")[0]!;
    return "there";
  }, [profile?.full_name, user?.email]);

  const hasInventory = !dash.isEmpty && dash.activities.length > 0;

  const climateScore = useMemo(
    () =>
      deriveClimateScore({
        targetProgress: dash.metrics.targetProgress,
        verifiedPct: dash.metrics.verifiedPct,
        changePct: dash.metrics.changePct,
        hasInventory,
        openHighPriorityInsights: dash.climateInsights.filter((i) => i.priority === "high").length,
        openInitiatives: dash.reductionInitiatives.filter((i) => i.status !== "completed").length,
      }),
    [
      dash.metrics.targetProgress,
      dash.metrics.verifiedPct,
      dash.metrics.changePct,
      hasInventory,
      dash.climateInsights,
      dash.reductionInitiatives,
    ]
  );

  const periodLabel = useMemo(() => {
    const p = dash.filters.period;
    if (p === "all") return `FY ${dash.company.reportingYear}`;
    return p;
  }, [dash.filters.period, dash.company.reportingYear]);

  const topInsight = useMemo(() => {
    const real = dash.climateInsights.filter((i) => i.id !== "ins-empty");
    if (!real.length) return null;
    return [...real].sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 } as const;
      return rank[a.priority] - rank[b.priority];
    })[0]!;
  }, [dash.climateInsights]);

  const priorityActions = useMemo(() => {
    const open = dash.reductionInitiatives.filter((i) => i.status !== "completed");
    return [...open]
      .sort((a, b) => b.annualEmissionReductionTCO2e - a.annualEmissionReductionTCO2e)
      .slice(0, 8);
  }, [dash.reductionInitiatives]);

  const sparkline = useMemo(
    () => dash.monthlyTrend.slice(-8).map((m) => m.total),
    [dash.monthlyTrend]
  );

  const role = membership?.role ?? "viewer";
  const canEdit = role === "admin" || role === "manager" || role === "member";

  return {
    authLoading,
    loading: authLoading || dash.loading,
    saving: dash.saving,
    dataMode: dash.dataMode,
    isEmpty: dash.isEmpty,
    firstName,
    displayName: profile?.full_name ?? user?.email ?? "User",
    email: user?.email ?? "",
    companyName: authCompany?.name ?? dash.company.name,
    company: dash.company,
    role,
    canEdit,
    period: dash.filters.period,
    periodLabel,
    setPeriod: (period: string) => dash.setFilters({ period }),
    metrics: dash.metrics,
    monthlyTrend: dash.monthlyTrend,
    sparkline,
    climateScore,
    topInsight,
    climateInsights: dash.climateInsights.filter((i) => i.id !== "ins-empty"),
    priorityActions,
    initiatives: dash.reductionInitiatives,
    setInitiativeStatus: dash.setInitiativeStatus,
    actOnInsight: dash.actOnInsight,
    notifications: dash.notifications,
    unreadCount: dash.unreadCount,
    markAllNotificationsRead: dash.markAllNotificationsRead,
    suppliers: dash.suppliers,
    addActivity: dash.addActivity,
    refresh: dash.refresh,
    hasInventory,
  };
}

export function useCarbonPulse() {
  const o = useClimateOverview();
  return {
    loading: o.loading,
    isEmpty: o.isEmpty,
    period: o.period,
    periodLabel: o.periodLabel,
    setPeriod: o.setPeriod,
    total: o.metrics.totalTCO2e,
    changePct: o.metrics.changePct,
    scope1: o.metrics.scope1,
    scope2: o.metrics.scope2,
    scope3: o.metrics.scope3,
    monthlyTrend: o.monthlyTrend,
    targetProgress: o.metrics.targetProgress,
    sparkline: o.sparkline,
  };
}

export function useClimateScore() {
  const o = useClimateOverview();
  return {
    loading: o.loading,
    isEmpty: o.isEmpty,
    ...o.climateScore,
    hasInventory: o.hasInventory,
  };
}

export function useQAIInsights() {
  const o = useClimateOverview();
  return {
    loading: o.loading,
    insights: o.climateInsights,
    topInsight: o.topInsight,
    actOnInsight: o.actOnInsight,
    metrics: o.metrics,
    companyName: o.companyName,
  };
}

export function usePriorityActions() {
  const o = useClimateOverview();
  return {
    loading: o.loading,
    actions: o.priorityActions,
    initiatives: o.initiatives,
    setInitiativeStatus: o.setInitiativeStatus,
    canEdit: o.canEdit,
  };
}

export function useMobileNotifications() {
  const o = useClimateOverview();
  return {
    loading: o.loading,
    notifications: o.notifications,
    unreadCount: o.unreadCount,
    markAllRead: o.markAllNotificationsRead,
  };
}

export function useCompanyProfile() {
  const o = useClimateOverview();
  return {
    loading: o.loading,
    companyName: o.companyName,
    company: o.company,
    displayName: o.displayName,
    email: o.email,
    role: o.role,
  };
}

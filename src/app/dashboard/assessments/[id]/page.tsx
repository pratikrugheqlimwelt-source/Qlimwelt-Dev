"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Button } from "@/components/ui/button";
import { QuestionRenderer } from "@/components/dashboard/assessment/question-renderer";
import { ModuleCollectForm } from "@/components/dashboard/assessment/module-collect-form";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import {
  PROFILE_BASIC_QUESTIONS,
  ORG_STRUCTURE_QUESTION,
  STRUCTURE_FOLLOWUPS,
} from "@/lib/assessment/questions/org-structure";
import { BOUNDARY_QUESTIONS } from "@/lib/assessment/questions/boundary";
import { SCREENING_QUESTIONS } from "@/lib/assessment/questions/screening";
import {
  resolveVisibleQuestions,
  resolveEnabledModules,
  buildModuleProgress,
  assessmentCompleteness,
} from "@/lib/assessment/engine";
import { getModule, PHASE1_MODULES } from "@/lib/assessment/modules";
import type {
  Assessment,
  AssessmentStep,
  OrgStructure,
  ReportingStandard,
  ConsolidationApproach,
  ModuleId,
} from "@/types/assessment";
import { cn, formatCO2 } from "@/lib/utils";
import { calculateEmissionsTCO2e } from "@/lib/calculations/engine";
import { MetricFigure } from "@/components/ui/metric-figure";
import type { Facility } from "@/types/carbon";
import { useT } from "@/components/i18n/locale-provider";

const STEP_KEYS: { id: AssessmentStep; labelKey: string }[] = [
  { id: "profile", labelKey: "pages.assessmentWizard.stepProfile" },
  { id: "boundary", labelKey: "pages.assessmentWizard.stepBoundary" },
  { id: "screening", labelKey: "pages.assessmentWizard.stepScreening" },
  { id: "modules", labelKey: "pages.assessmentWizard.stepModules" },
  { id: "review", labelKey: "pages.assessmentWizard.stepReview" },
];

export default function AssessmentWizardPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const router = useRouter();
  const {
    getAssessment,
    saveAssessment,
    saveSettings,
    addFacility,
    facilities,
    activities,
    company,
    saving,
  } = useDashboard();
  const t = useT();

  const stored = getAssessment(id);
  const [draft, setDraft] = useState<Assessment | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleId | null>(null);

  useEffect(() => {
    if (stored) setDraft(structuredClone(stored));
  }, [stored]);

  const locked = draft?.status === "calculated" || draft?.status === "locked";

  const profileAnswers = useMemo(() => {
    if (!draft) return {} as Record<string, unknown>;
    const p = draft.profile;
    return {
      legal_name: p.legalName,
      trading_name: p.tradingName,
      industry: p.industry,
      country_of_registration: p.countryOfRegistration,
      headquarters: p.headquarters,
      website: p.website,
      employees: p.employees,
      revenue_range: p.revenueRange,
      currency: p.currency,
      primary_contact: p.primaryContact,
      sustainability_contact: p.sustainabilityContact,
      org_structure: p.orgStructure,
      ...p.structureAnswers,
    };
  }, [draft]);

  const boundaryAnswers = useMemo(() => {
    if (!draft) return {} as Record<string, unknown>;
    const b = draft.boundary;
    return {
      period_start: b.periodStart,
      period_end: b.periodEnd,
      base_year: b.baseYear,
      reporting_standard: b.reportingStandard,
      consolidation: b.consolidation,
      included_entities: b.includedEntities,
      included_locations: b.includedLocations,
      excluded_locations: b.excludedLocations,
      currency: b.currency,
      emission_unit: b.emissionUnit,
    };
  }, [draft]);

  const visibleStructureQs = useMemo(
    () => resolveVisibleQuestions(STRUCTURE_FOLLOWUPS, profileAnswers),
    [profileAnswers]
  );

  const assessmentActivities = useMemo(
    () => activities.filter((a) => a.assessmentId === id),
    [activities, id]
  );

  const recordCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of assessmentActivities) {
      const mid = String(a.metadata?.moduleId ?? "");
      if (mid) counts[mid] = (counts[mid] ?? 0) + 1;
    }
    return counts;
  }, [assessmentActivities]);

  const completeness = useMemo(
    () => assessmentCompleteness(draft?.moduleProgress ?? []),
    [draft?.moduleProgress]
  );

  const calculatedTotal = useMemo(
    () =>
      assessmentActivities.reduce(
        (s, a) => s + calculateEmissionsTCO2e(a.activityValue, a.emissionFactorValue),
        0
      ),
    [assessmentActivities]
  );

  const persist = useCallback(
    async (next: Assessment) => {
      setDraft(next);
      await saveAssessment(next);
    },
    [saveAssessment]
  );

  const setProfileField = (questionId: string, value: unknown) => {
    if (!draft || locked) return;
    const next = structuredClone(draft);
    const map: Record<string, keyof typeof next.profile> = {
      legal_name: "legalName",
      trading_name: "tradingName",
      industry: "industry",
      country_of_registration: "countryOfRegistration",
      headquarters: "headquarters",
      website: "website",
      employees: "employees",
      revenue_range: "revenueRange",
      currency: "currency",
      primary_contact: "primaryContact",
      sustainability_contact: "sustainabilityContact",
    };
    if (questionId === "org_structure") {
      next.profile.orgStructure = (value as OrgStructure) || "";
    } else if (map[questionId]) {
      const key = map[questionId];
      if (key === "employees") next.profile.employees = Number(value) || 0;
      else (next.profile as unknown as Record<string, unknown>)[key] = value;
    } else {
      next.profile.structureAnswers[questionId] = value;
    }
    next.status = next.status === "draft" ? "in_progress" : next.status;
    setDraft(next);
  };

  const setBoundaryField = (questionId: string, value: unknown) => {
    if (!draft || locked) return;
    const next = structuredClone(draft);
    const b = next.boundary;
    switch (questionId) {
      case "period_start":
        b.periodStart = String(value);
        break;
      case "period_end":
        b.periodEnd = String(value);
        break;
      case "base_year":
        b.baseYear = Number(value) || b.baseYear;
        break;
      case "reporting_standard":
        b.reportingStandard = value as ReportingStandard;
        break;
      case "consolidation":
        b.consolidation = value as ConsolidationApproach;
        if (value === "not_sure") {
          b.consolidation = "operational_control";
          b.consolidationAssumed = true;
          if (!next.assumptions.includes("Consolidation assumed: operational control")) {
            next.assumptions = [
              ...next.assumptions,
              "Consolidation assumed: operational control",
            ];
          }
        } else {
          b.consolidationAssumed = false;
        }
        break;
      case "included_entities":
        b.includedEntities = String(value);
        break;
      case "included_locations":
        b.includedLocations = String(value);
        break;
      case "excluded_locations":
        b.excludedLocations = String(value);
        break;
      case "currency":
        b.currency = String(value);
        break;
      case "emission_unit":
        b.emissionUnit = value === "kgCO2e" ? "kgCO2e" : "tCO2e";
        break;
    }
    setDraft(next);
  };

  const setScreening = (questionId: string, value: unknown) => {
    if (!draft || locked) return;
    const next = structuredClone(draft);
    next.screening[questionId] = value;
    next.enabledModules = resolveEnabledModules(next.screening);
    next.moduleProgress = buildModuleProgress(next.enabledModules, recordCounts);
    setDraft(next);
  };

  const syncProfileAndFacilities = async (assessment: Assessment) => {
    await saveSettings({
      companyName: assessment.profile.legalName || company.name,
      industry: assessment.profile.industry || company.industry,
      employeeCount: assessment.profile.employees || company.employeeCount,
      baselineYear: assessment.boundary.baseYear,
      reportingYear: Number(assessment.boundary.periodEnd.slice(0, 4)) || company.reportingYear,
    });

    const structure = assessment.profile.orgStructure;
    const answers = assessment.profile.structureAnswers;
    if (structure === "one_office" && facilities.length === 0) {
      const fac: Facility = {
        id: `fac-assess-${Date.now()}`,
        name: assessment.profile.headquarters || assessment.profile.legalName || "Primary office",
        country: assessment.profile.countryOfRegistration || "Germany",
        businessUnitId: "bu-ops",
        type: "Office",
        floorAreaM2: Number(answers.office_floor_area) || 0,
      };
      await addFacility(fac);
    }
  };

  useEffect(() => {
    if (!draft || draft.currentStep !== "modules" && draft.currentStep !== "review") return;
    const progress = buildModuleProgress(draft.enabledModules, recordCounts);
    const same =
      progress.length === draft.moduleProgress.length &&
      progress.every(
        (p, i) =>
          p.moduleId === draft.moduleProgress[i]?.moduleId &&
          p.recordCount === draft.moduleProgress[i]?.recordCount
      );
    if (same) return;
    const next = { ...draft, moduleProgress: progress };
    setDraft(next);
    void saveAssessment(next);
  }, [recordCounts, draft?.enabledModules, draft?.currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const goStep = async (step: AssessmentStep) => {
    if (!draft) return;
    const next = structuredClone(draft);
    next.currentStep = step;
    if (step === "modules") {
      next.enabledModules = resolveEnabledModules(next.screening);
      next.moduleProgress = buildModuleProgress(next.enabledModules, recordCounts);
      if (!activeModule && next.enabledModules[0]) setActiveModule(next.enabledModules[0]);
    }
    if (step === "review") {
      next.status = "ready_for_review";
      next.moduleProgress = buildModuleProgress(next.enabledModules, recordCounts);
    }
    await persist(next);
    if (step === "boundary" || step === "screening") {
      await syncProfileAndFacilities(next);
    }
  };

  const finalize = async () => {
    if (!draft || locked) return;
    const next = structuredClone(draft);
    next.status = "calculated";
    next.currentStep = "review";
    next.moduleProgress = buildModuleProgress(next.enabledModules, recordCounts);
    await persist(next);
    router.push("/dashboard/emissions");
  };

  if (!draft) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("pages.assessmentWizard.notFound")}</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/assessments")}>
          {t("pages.assessmentWizard.backList")}
        </Button>
      </div>
    );
  }

  if (draft.type === "product" && draft.currentStep === "profile") {
    // Allow product scaffold to proceed with a notice on profile
  }

  const stepIndex = STEP_KEYS.findIndex((s) => s.id === draft.currentStep);

  return (
    <div className="space-y-6">
      <PageHeader
        title={draft.name}
        description={
          draft.type === "product"
            ? t("pages.assessmentWizard.productDesc")
            : t("pages.assessmentWizard.corporateDesc")
        }
        tip={t("pages.assessmentWizard.tip")}
      />

      {/* Step nav */}
      <nav className="flex flex-wrap gap-1.5">
        {STEP_KEYS.map((s, i) => {
          const done = i < stepIndex;
          const active = s.id === draft.currentStep;
          return (
            <button
              key={s.id}
              type="button"
              disabled={locked && s.id !== "review"}
              onClick={() => goStep(s.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active && "border-brand/40 bg-brand-light text-brand-dark",
                done && !active && "border-border bg-muted/40 text-foreground",
                !done && !active && "border-border text-muted-foreground"
              )}
            >
              {done ? <Check className="h-3 w-3" /> : <span className="tabular-nums">{i + 1}</span>}
              {t(s.labelKey)}
            </button>
          );
        })}
      </nav>

      {draft.assumptions.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <p className="font-semibold">{t("pages.assessmentWizard.assumptions")}</p>
          <ul className="mt-1 list-inside list-disc">
            {draft.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* PROFILE */}
      {draft.currentStep === "profile" && (
        <section className="dash-card space-y-5 p-5">
          <div>
            <p className="dash-label">Step 1</p>
            <h3 className="text-base font-semibold">{t("pages.assessmentWizard.profileTitle")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("pages.assessmentWizard.profileHint")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {PROFILE_BASIC_QUESTIONS.map((q) => (
              <QuestionRenderer
                key={q.id}
                question={q}
                value={profileAnswers[q.id]}
                answers={profileAnswers}
                onChange={(v) => setProfileField(q.id, v)}
                disabled={locked}
              />
            ))}
          </div>
          <div className="border-t border-border pt-4">
            <QuestionRenderer
              question={ORG_STRUCTURE_QUESTION}
              value={profileAnswers.org_structure}
              answers={profileAnswers}
              onChange={(v) => setProfileField("org_structure", v)}
              disabled={locked}
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {visibleStructureQs.map((q) => (
                <QuestionRenderer
                  key={q.id}
                  question={q}
                  value={profileAnswers[q.id]}
                  answers={profileAnswers}
                  onChange={(v) => setProfileField(q.id, v)}
                  disabled={locked}
                />
              ))}
            </div>
          </div>
          <Button
            onClick={() => goStep("boundary")}
            disabled={locked || !draft.profile.legalName || !draft.profile.orgStructure}
          >
            {t("pages.assessmentWizard.continueBoundary")}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </section>
      )}

      {/* BOUNDARY */}
      {draft.currentStep === "boundary" && (
        <section className="dash-card space-y-5 p-5">
          <div>
            <p className="dash-label">Step 2</p>
            <h3 className="text-base font-semibold">{t("pages.assessmentWizard.boundaryTitle")}</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {BOUNDARY_QUESTIONS.map((q) => (
              <QuestionRenderer
                key={q.id}
                question={q}
                value={
                  q.id === "consolidation" && draft.boundary.consolidationAssumed
                    ? "not_sure"
                    : boundaryAnswers[q.id]
                }
                answers={boundaryAnswers}
                onChange={(v) => setBoundaryField(q.id, v)}
                disabled={locked}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => goStep("profile")}>
              {t("common.back")}
            </Button>
            <Button onClick={() => goStep("screening")} disabled={locked}>
              {t("pages.assessmentWizard.continueScreening")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {/* SCREENING */}
      {draft.currentStep === "screening" && (
        <section className="dash-card space-y-5 p-5">
          <div>
            <p className="dash-label">Step 3</p>
            <h3 className="text-base font-semibold">{t("pages.assessmentWizard.screeningTitle")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("pages.assessmentWizard.screeningHint")}
            </p>
          </div>
          <div className="space-y-4">
            {SCREENING_QUESTIONS.map((q) => (
              <div key={q.id} className="rounded-xl border border-border/80 px-4 py-3">
                <QuestionRenderer
                  question={q}
                  value={draft.screening[q.id] ?? false}
                  answers={draft.screening}
                  onChange={(v) => setScreening(q.id, v)}
                  disabled={locked}
                />
              </div>
            ))}
          </div>
          {draft.enabledModules.length > 0 && (
            <div className="rounded-xl bg-brand-light/50 px-4 py-3 text-sm">
              <p className="font-semibold text-brand-dark">
                {t("pages.assessmentWizard.modulesWillOpen", { count: draft.enabledModules.length })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {draft.enabledModules.map((m) => getModule(m)?.label ?? m).join(" · ")}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => goStep("boundary")}>
              {t("common.back")}
            </Button>
            <Button
              onClick={() => goStep("modules")}
              disabled={locked || draft.enabledModules.length === 0}
            >
              {t("pages.assessmentWizard.collectData")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {/* MODULES */}
      {draft.currentStep === "modules" && (
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="dash-card space-y-1 p-3">
            <p className="dash-label px-2 pb-2">{t("pages.assessmentWizard.modules")}</p>
            {draft.enabledModules.map((mid) => {
              const m = getModule(mid);
              const prog = draft.moduleProgress.find((p) => p.moduleId === mid);
              const count = recordCounts[mid] ?? prog?.recordCount ?? 0;
              return (
                <button
                  key={mid}
                  type="button"
                  onClick={() => setActiveModule(mid)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
                    activeModule === mid
                      ? "bg-brand-light text-brand-dark"
                      : "hover:bg-muted/40"
                  )}
                >
                  <span className="font-medium">{m?.label ?? mid}</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                      count > 0 ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {count > 0 ? t("pages.assessmentWizard.complete") : t("pages.assessmentWizard.missing")}
                  </span>
                </button>
              );
            })}
            <Button
              className="mt-3 w-full"
              variant="outline"
              size="sm"
              onClick={() => goStep("review")}
            >
              {t("pages.assessmentWizard.reviewCalc")}
            </Button>
          </aside>
          <section className="dash-card p-5">
            {activeModule ? (
              <>
                <h3 className="text-base font-semibold">
                  {getModule(activeModule)?.label}
                </h3>
                <div className="mt-4">
                  <ModuleCollectForm
                    assessmentId={id}
                    moduleId={activeModule}
                    periodDefault={draft.boundary.periodEnd.slice(0, 7)}
                    locked={locked}
                    onSaved={() => {
                      /* progress syncs via activities + useEffect */
                    }}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("pages.assessmentWizard.selectModule")}</p>
            )}
          </section>
        </div>
      )}

      {/* REVIEW */}
      {draft.currentStep === "review" && (
        <section className="dash-card space-y-5 p-5">
          <div>
            <p className="dash-label">Step 5</p>
            <h3 className="text-base font-semibold">{t("pages.assessmentWizard.reviewTitle")}</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border p-4">
              <p className="text-[10px] font-mono uppercase text-muted-foreground">{t("pages.assessmentWizard.completeness")}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{completeness.pct}%</p>
              <p className="text-xs text-muted-foreground">
                {t("pages.assessmentWizard.modulesWithData", {
                  complete: completeness.complete,
                  total: completeness.total,
                })}
              </p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-[10px] font-mono uppercase text-muted-foreground">{t("pages.assessmentWizard.calculatedSoFar")}</p>
              <MetricFigure size="sm" className="mt-1">
                {formatCO2(calculatedTotal)}
              </MetricFigure>
              <p className="text-xs text-muted-foreground">
                {t("pages.assessmentWizard.activityRecords", { count: assessmentActivities.length })}
              </p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-[10px] font-mono uppercase text-muted-foreground">{t("pages.assessmentWizard.status")}</p>
              <p className="mt-1 text-sm font-semibold">{t(`status.${draft.status}`)}</p>
            </div>
          </div>

          {completeness.missing.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              <p className="font-semibold">{t("pages.assessmentWizard.missingModules")}</p>
              <p className="mt-1">
                {completeness.missing.map((m) => getModule(m)?.label ?? m).join(" · ")}
              </p>
              <p className="mt-2 text-amber-800/80">
                {t("pages.assessmentWizard.missingHint")}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium">{t("pages.assessmentWizard.allModules")}</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {PHASE1_MODULES.map((m) => {
                const enabled = draft.enabledModules.includes(m.id);
                const count = recordCounts[m.id] ?? 0;
                return (
                  <li key={m.id}>
                    {m.label}:{" "}
                    {!enabled
                      ? t("pages.assessmentWizard.notApplicable")
                      : count > 0
                        ? `${count}`
                        : t("pages.assessmentWizard.notStarted")}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => goStep("modules")} disabled={locked}>
              {t("pages.assessmentWizard.backModules")}
            </Button>
            {!locked && (
              <Button onClick={finalize} disabled={saving || assessmentActivities.length === 0}>
                {saving ? t("common.saving") : t("pages.assessmentWizard.markCalculated")}
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/dashboard/overview">{t("pages.assessmentWizard.overview")}</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

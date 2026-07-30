import type { ModuleId, QuestionDefinition, ModuleProgress } from "@/types/assessment";
import { SCREENING_QUESTIONS } from "@/lib/assessment/questions/screening";
import { PHASE1_MODULES } from "@/lib/assessment/modules";

function matchesVisible(
  rule: QuestionDefinition["visibleWhen"],
  answers: Record<string, unknown>
): boolean {
  if (!rule) return true;
  const v = answers[rule.questionId];
  if (rule.equals !== undefined) return v === rule.equals;
  if (rule.includes !== undefined) {
    return Array.isArray(v) && v.includes(rule.includes);
  }
  return true;
}

export function resolveVisibleQuestions(
  questions: QuestionDefinition[],
  answers: Record<string, unknown>
): QuestionDefinition[] {
  return questions.filter((q) => matchesVisible(q.visibleWhen, answers));
}

export function resolveEnabledModules(screening: Record<string, unknown>): ModuleId[] {
  const set = new Set<ModuleId>();
  for (const q of SCREENING_QUESTIONS) {
    const answer = screening[q.id];
    if (!q.activates) continue;
    for (const rule of q.activates) {
      const ok =
        rule.when.equals !== undefined
          ? answer === rule.when.equals
          : rule.when.includes !== undefined &&
            Array.isArray(answer) &&
            answer.includes(rule.when.includes);
      if (ok && rule.modules) {
        rule.modules.forEach((m) => set.add(m));
      }
    }
  }
  return PHASE1_MODULES.map((m) => m.id).filter((id) => set.has(id));
}

export function unitOptionsFor(
  question: QuestionDefinition,
  answers: Record<string, unknown>
): string[] {
  if (!question.optionsFrom) return question.options?.map((o) => o.value) ?? [];
  const key = String(answers[question.optionsFrom.questionId] ?? "");
  return question.optionsFrom.mapping[key] ?? [];
}

export function buildModuleProgress(
  enabled: ModuleId[],
  recordCounts: Record<string, number>
): ModuleProgress[] {
  return enabled.map((moduleId) => {
    const count = recordCounts[moduleId] ?? 0;
    return {
      moduleId,
      status: count > 0 ? "complete" : "not_started",
      recordCount: count,
    };
  });
}

export function assessmentCompleteness(progress: ModuleProgress[]): {
  pct: number;
  complete: number;
  total: number;
  missing: ModuleId[];
} {
  const total = progress.length || 1;
  const complete = progress.filter((p) => p.status === "complete").length;
  const missing = progress.filter((p) => p.status !== "complete").map((p) => p.moduleId);
  return {
    pct: Math.round((complete / total) * 100),
    complete,
    total: progress.length,
    missing,
  };
}

export const FUEL_UNIT_MAP: Record<string, string[]> = {
  natural_gas: ["kWh", "MWh", "m3"],
  heating_oil: ["litres", "kg"],
  diesel: ["litres", "kg", "gallons"],
  lpg: ["litres", "kg"],
  coal: ["kg", "tonnes"],
  biomass: ["kg", "tonnes"],
  other: ["kWh", "litres", "kg"],
};

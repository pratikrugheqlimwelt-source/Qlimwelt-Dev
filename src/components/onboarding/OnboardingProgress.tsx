"use client";

import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  step: number;
  total?: number;
}

const STEP_LABELS = ["Personal", "Company", "Climate", "Goals", "Review"];

export function OnboardingProgress({ step, total = 5 }: OnboardingProgressProps) {
  const pct = (step / total) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          Step {step} of {total}
        </span>
        <span className="text-muted-foreground">{STEP_LABELS[step - 1]}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r from-[#82D153] to-emerald-500 transition-all duration-500")}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={total}
        />
      </div>
    </div>
  );
}

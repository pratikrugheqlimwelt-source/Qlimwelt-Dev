"use client";

import { Label } from "@/components/ui/label";
import {
  INTEREST_OPTIONS,
  TIMELINE_OPTIONS,
  type InterestsData,
} from "@/validation/onboardingSchema";
import { cn } from "@/lib/utils";

interface InterestsStepProps {
  data: InterestsData;
  errors: Partial<Record<keyof InterestsData, string>>;
  onChange: (data: InterestsData) => void;
}

export function InterestsStep({ data, errors, onChange }: InterestsStepProps) {
  const toggleInterest = (interest: string) => {
    const set = new Set(data.interests);
    if (set.has(interest)) set.delete(interest);
    else set.add(interest);
    onChange({ ...data, interests: Array.from(set) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Your goals with Qlimwelt</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tell us what you want to achieve on the platform.</p>
      </div>

      <div className="space-y-5">
        <div>
          <Label className="mb-2 block">What would you like to achieve with Qlimwelt?</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {INTEREST_OPTIONS.map((interest) => {
              const active = data.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors",
                    active
                      ? "border-[#82D153] bg-[#82D153]/10 text-[#3d8b2e]"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  )}
                >
                  {interest}
                </button>
              );
            })}
          </div>
          {errors.interests && <p className="mt-1 text-sm text-red-600">{errors.interests}</p>}
        </div>

        <div>
          <Label htmlFor="sustainabilityChallenge">
            What is your biggest sustainability challenge today?{" "}
            <span className="text-muted-foreground">(optional, max 500 characters)</span>
          </Label>
          <textarea
            id="sustainabilityChallenge"
            rows={4}
            maxLength={500}
            value={data.sustainabilityChallenge ?? ""}
            onChange={(e) => onChange({ ...data, sustainabilityChallenge: e.target.value })}
            className="mt-1.5 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {(data.sustainabilityChallenge ?? "").length}/500
          </p>
          {errors.sustainabilityChallenge && (
            <p className="mt-1 text-sm text-red-600">{errors.sustainabilityChallenge}</p>
          )}
        </div>

        <div>
          <Label>When would you like to begin measuring emissions?</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {TIMELINE_OPTIONS.map((timeline) => (
              <button
                key={timeline}
                type="button"
                onClick={() => onChange({ ...data, implementationTimeline: timeline })}
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-medium",
                  data.implementationTimeline === timeline
                    ? "border-[#82D153] bg-[#82D153]/10 text-[#3d8b2e]"
                    : "border-border text-muted-foreground"
                )}
              >
                {timeline}
              </button>
            ))}
          </div>
          {errors.implementationTimeline && (
            <p className="mt-1 text-sm text-red-600">{errors.implementationTimeline}</p>
          )}
        </div>
      </div>
    </div>
  );
}

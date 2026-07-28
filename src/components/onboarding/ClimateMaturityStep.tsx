"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMISSION_STATUS_OPTIONS,
  MEASURED_SCOPES,
  REPORTING_STANDARDS,
  type ClimateMaturityData,
} from "@/validation/onboardingSchema";
import { cn } from "@/lib/utils";

interface ClimateMaturityStepProps {
  data: ClimateMaturityData;
  errors: Partial<Record<keyof ClimateMaturityData, string>>;
  onChange: (data: ClimateMaturityData) => void;
}

function MultiToggle({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
              active
                ? "border-[#82D153] bg-[#82D153]/10 text-[#3d8b2e]"
                : "border-border text-muted-foreground hover:border-foreground/30"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function ClimateMaturityStep({ data, errors, onChange }: ClimateMaturityStepProps) {
  const toggleScope = (scope: string) => {
    const set = new Set(data.measuredScopes);
    if (set.has(scope)) set.delete(scope);
    else set.add(scope);
    onChange({ ...data, measuredScopes: Array.from(set) });
  };

  const toggleStandard = (std: string) => {
    const set = new Set(data.reportingStandards);
    if (set.has(std)) set.delete(std);
    else set.add(std);
    onChange({ ...data, reportingStandards: Array.from(set) });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Climate maturity</h2>
        <p className="mt-1 text-sm text-muted-foreground">Help us understand your current sustainability programme.</p>
      </div>

      <div className="space-y-5">
        <div>
          <Label>Does your company currently calculate greenhouse gas emissions?</Label>
          <Select
            value={data.emissionMeasurementStatus}
            onValueChange={(v) => onChange({ ...data, emissionMeasurementStatus: v })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {EMISSION_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.emissionMeasurementStatus && (
            <p className="mt-1 text-sm text-red-600">{errors.emissionMeasurementStatus}</p>
          )}
        </div>

        <div>
          <Label className="mb-2 block">Which scopes are currently measured?</Label>
          <MultiToggle options={MEASURED_SCOPES} selected={data.measuredScopes} onToggle={toggleScope} />
          {errors.measuredScopes && <p className="mt-1 text-sm text-red-600">{errors.measuredScopes}</p>}
        </div>

        <div>
          <Label>Does your company have a climate reduction target?</Label>
          <div className="mt-2 flex gap-3">
            {[
              { label: "Yes", value: true },
              { label: "No", value: false },
            ].map(({ label, value }) => (
              <button
                key={label}
                type="button"
                onClick={() => onChange({ ...data, hasClimateTarget: value })}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium",
                  data.hasClimateTarget === value
                    ? "border-[#82D153] bg-[#82D153]/10 text-[#3d8b2e]"
                    : "border-border text-muted-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {errors.hasClimateTarget && <p className="mt-1 text-sm text-red-600">{errors.hasClimateTarget}</p>}
        </div>

        <div>
          <Label className="mb-2 block">Reporting standards or frameworks used</Label>
          <MultiToggle options={REPORTING_STANDARDS} selected={data.reportingStandards} onToggle={toggleStandard} />
          {errors.reportingStandards && <p className="mt-1 text-sm text-red-600">{errors.reportingStandards}</p>}
        </div>
      </div>
    </div>
  );
}

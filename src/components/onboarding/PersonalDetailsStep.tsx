"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PersonalDetailsData } from "@/validation/onboardingSchema";

interface PersonalDetailsStepProps {
  data: PersonalDetailsData;
  errors: Partial<Record<keyof PersonalDetailsData, string>>;
  onChange: (data: PersonalDetailsData) => void;
}

export function PersonalDetailsStep({ data, errors, onChange }: PersonalDetailsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Personal details</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tell us about yourself to set up your account.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={data.fullName}
            onChange={(e) => onChange({ ...data, fullName: e.target.value })}
            className="mt-1.5"
            autoComplete="name"
          />
          {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
        </div>

        <div>
          <Label htmlFor="workEmail">Work email</Label>
          <Input
            id="workEmail"
            type="email"
            value={data.workEmail}
            readOnly
            className="mt-1.5 bg-muted/50"
            aria-readonly="true"
          />
          {errors.workEmail && <p className="mt-1 text-sm text-red-600">{errors.workEmail}</p>}
        </div>

        <div>
          <Label htmlFor="jobTitle">Job title</Label>
          <Input
            id="jobTitle"
            value={data.jobTitle}
            onChange={(e) => onChange({ ...data, jobTitle: e.target.value })}
            className="mt-1.5"
            autoComplete="organization-title"
          />
          {errors.jobTitle && <p className="mt-1 text-sm text-red-600">{errors.jobTitle}</p>}
        </div>

        <div>
          <Label htmlFor="phoneNumber">
            Phone number <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={data.phoneNumber ?? ""}
            onChange={(e) => onChange({ ...data, phoneNumber: e.target.value })}
            className="mt-1.5"
            autoComplete="tel"
          />
        </div>
      </div>
    </div>
  );
}

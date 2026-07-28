"use client";

import { Button } from "@/components/ui/button";
import type { OnboardingFormData } from "@/validation/onboardingSchema";

interface ReviewStepProps {
  form: OnboardingFormData;
  consentAccepted: boolean;
  onConsentChange: (accepted: boolean) => void;
  onEditStep: (step: number) => void;
  error?: string;
}

function ReviewSection({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onEdit(step)}>
          Edit
        </Button>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">{children}</dl>
    </div>
  );
}

function Item({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

export function ReviewStep({
  form,
  consentAccepted,
  onConsentChange,
  onEditStep,
  error,
}: ReviewStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Review and confirm</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Check your details before creating your workspace.
        </p>
      </div>

      <div className="space-y-3">
        <ReviewSection title="Personal details" step={1} onEdit={onEditStep}>
          <Item label="Full name" value={form.personal.fullName} />
          <Item label="Work email" value={form.personal.workEmail} />
          <Item label="Job title" value={form.personal.jobTitle} />
          <Item label="Phone" value={form.personal.phoneNumber} />
        </ReviewSection>

        <ReviewSection title="Company details" step={2} onEdit={onEditStep}>
          <Item label="Company" value={form.company.companyName} />
          <Item label="Website" value={form.company.companyWebsite} />
          <Item label="Industry" value={form.company.industry} />
          <Item label="Size" value={form.company.companySize} />
          <Item label="HQ country" value={form.company.headquartersCountry} />
          <Item label="Countries" value={form.company.countriesOfOperation.join(", ")} />
          <Item label="Employees" value={String(form.company.numberOfEmployees)} />
          <Item label="Facilities" value={String(form.company.numberOfFacilities)} />
          {form.company.approximateAnnualRevenue != null && (
            <Item
              label="Revenue"
              value={`${form.company.approximateAnnualRevenue.toLocaleString()} ${form.company.currency}`}
            />
          )}
        </ReviewSection>

        <ReviewSection title="Climate maturity" step={3} onEdit={onEditStep}>
          <Item label="Emissions calc." value={form.climate.emissionMeasurementStatus} />
          <Item label="Scopes" value={form.climate.measuredScopes.join(", ")} />
          <Item
            label="Climate target"
            value={form.climate.hasClimateTarget ? "Yes" : "No"}
          />
          <Item label="Standards" value={form.climate.reportingStandards.join(", ")} />
        </ReviewSection>

        <ReviewSection title="Platform goals" step={4} onEdit={onEditStep}>
          <Item label="Interests" value={form.interests.interests.join(", ")} />
          <Item label="Timeline" value={form.interests.implementationTimeline} />
          <Item label="Challenge" value={form.interests.sustainabilityChallenge} />
        </ReviewSection>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-4">
        <input
          type="checkbox"
          checked={consentAccepted}
          onChange={(e) => onConsentChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border text-[#82D153] focus:ring-[#82D153]"
          aria-required="true"
        />
        <span className="text-sm leading-relaxed text-muted-foreground">
          I agree that Qlimwelt may store my account and company information to provide access to the
          platform. See our{" "}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy policy
          </a>{" "}
          and{" "}
          <a href="/terms" className="underline hover:text-foreground">
            Terms of service
          </a>
          .
        </span>
      </label>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

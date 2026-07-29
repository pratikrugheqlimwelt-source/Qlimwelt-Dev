"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { PersonalDetailsStep } from "@/components/onboarding/PersonalDetailsStep";
import { CompanyDetailsStep } from "@/components/onboarding/CompanyDetailsStep";
import { ClimateMaturityStep } from "@/components/onboarding/ClimateMaturityStep";
import { InterestsStep } from "@/components/onboarding/InterestsStep";
import { ReviewStep } from "@/components/onboarding/ReviewStep";
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import {
  personalStepSchema,
  companyStepSchema,
  climateStepSchema,
  interestsStepSchema,
  reviewStepSchema,
} from "@/validation/onboardingSchema";
import { completeOnboarding, getOnboardingErrorMessage } from "@/services/onboardingService";

function mapZodErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  const flat = error.flatten().fieldErrors;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(flat)) {
    if (v?.[0]) out[k] = v[0];
  }
  return out;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile, refreshCompany } = useAuth();
  const { step, setStep, form, updateSection, clearDraft } = useOnboarding(
    user?.email,
    profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    if (!loading && profile?.onboarding_completed) {
      router.replace("/dashboard/overview");
    }
  }, [loading, user, profile, router]);

  // If a pending team invite exists for this email, accept it instead of creating a new company
  useEffect(() => {
    if (!user || profile?.onboarding_completed) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/team/invites/accept", { method: "POST", credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { accepted?: boolean; reason?: string };
        if (cancelled) return;
        if (data.accepted) {
          await refreshProfile();
          await refreshCompany();
          clearDraft();
          router.replace("/dashboard/overview");
          return;
        }
        if (data.reason === "already_member_elsewhere") {
          setSubmitError(
            "This email already belongs to another workspace. Sign out and use a different account, or ask an admin to remove the old membership."
          );
        }
      } catch {
        // RPC may be unavailable until migration 003
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, profile?.onboarding_completed, refreshProfile, refreshCompany, clearDraft, router]);

  useEffect(() => {
    if (user?.email && !form.personal.workEmail) {
      updateSection("personal", {
        ...form.personal,
        workEmail: user.email,
        fullName:
          form.personal.fullName ||
          profile?.full_name ||
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          "",
      });
    }
  }, [user, profile, form.personal, updateSection]);

  if (loading || !user) {
    return <AuthLoadingScreen message="Preparing onboarding…" />;
  }

  const validateStep = (): boolean => {
    setErrors({});
    setSubmitError(null);

    if (step === 1) {
      const result = personalStepSchema.safeParse(form.personal);
      if (!result.success) {
        setErrors(mapZodErrors(result.error));
        return false;
      }
    }
    if (step === 2) {
      const result = companyStepSchema.safeParse(form.company);
      if (!result.success) {
        setErrors(mapZodErrors(result.error));
        return false;
      }
    }
    if (step === 3) {
      const result = climateStepSchema.safeParse(form.climate);
      if (!result.success) {
        setErrors(mapZodErrors(result.error));
        return false;
      }
    }
    if (step === 4) {
      const result = interestsStepSchema.safeParse(form.interests);
      if (!result.success) {
        setErrors(mapZodErrors(result.error));
        return false;
      }
    }
    if (step === 5) {
      const result = reviewStepSchema.safeParse({ consentAccepted: consentAccepted as true });
      if (!result.success) {
        setSubmitError("You must accept the terms to create your workspace.");
        return false;
      }
    }
    return true;
  };

  const handleContinue = () => {
    if (!validateStep()) return;
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        ...form,
        review: { consentAccepted: true as const },
      };

      await completeOnboarding(payload);
      clearDraft();
      await refreshProfile();
      await refreshCompany();

      const firstName = form.personal.fullName.split(" ")[0];
      sessionStorage.setItem(
        "qlimwelt_welcome",
        JSON.stringify({ firstName, companyName: form.company.companyName })
      );

      router.replace("/dashboard/overview");
    } catch (err) {
      setSubmitError(getOnboardingErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingLayout>
      <OnboardingProgress step={step} />

      <div className="mt-8">
        {step === 1 && (
          <PersonalDetailsStep
            data={form.personal}
            errors={errors}
            onChange={(data) => updateSection("personal", data)}
          />
        )}
        {step === 2 && (
          <CompanyDetailsStep
            data={form.company}
            errors={errors}
            onChange={(data) => updateSection("company", data)}
          />
        )}
        {step === 3 && (
          <ClimateMaturityStep
            data={form.climate}
            errors={errors}
            onChange={(data) => updateSection("climate", data)}
          />
        )}
        {step === 4 && (
          <InterestsStep
            data={form.interests}
            errors={errors}
            onChange={(data) => updateSection("interests", data)}
          />
        )}
        {step === 5 && (
          <ReviewStep
            form={form}
            consentAccepted={consentAccepted}
            onConsentChange={setConsentAccepted}
            onEditStep={setStep}
            error={submitError ?? undefined}
          />
        )}
      </div>

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-border/60 pt-6">
        <Button
          type="button"
          variant="outline"
          disabled={step === 1 || submitting}
          onClick={() => setStep(step - 1)}
        >
          Back
        </Button>

        {step < 5 ? (
          <Button type="button" onClick={handleContinue}>
            Continue
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={submitting} aria-busy={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Creating workspace…
              </>
            ) : (
              "Create my workspace"
            )}
          </Button>
        )}
      </div>
    </OnboardingLayout>
  );
}

import { createClient } from "@/lib/supabase";
import type { OnboardingFormData } from "@/validation/onboardingSchema";

export async function completeOnboarding(data: OnboardingFormData): Promise<string> {
  const supabase = createClient();

  const payload = {
    personal: {
      full_name: data.personal.fullName,
      email: data.personal.workEmail,
      job_title: data.personal.jobTitle,
      phone: data.personal.phoneNumber ?? "",
    },
    company: {
      name: data.company.companyName,
      website: data.company.companyWebsite ?? "",
      industry: data.company.industry,
      company_size: data.company.companySize,
      headquarters_country: data.company.headquartersCountry,
      countries_of_operation: data.company.countriesOfOperation,
      employee_count: String(data.company.numberOfEmployees),
      annual_revenue: data.company.approximateAnnualRevenue != null ? String(data.company.approximateAnnualRevenue) : "",
      currency: data.company.currency,
      facility_count: String(data.company.numberOfFacilities),
    },
    climate: {
      emission_measurement_status: data.climate.emissionMeasurementStatus,
      measured_scopes: data.climate.measuredScopes,
      has_climate_target: data.climate.hasClimateTarget,
      reporting_standards: data.climate.reportingStandards,
    },
    interests: {
      interests: data.interests.interests,
      sustainability_challenge: data.interests.sustainabilityChallenge ?? "",
      implementation_timeline: data.interests.implementationTimeline,
    },
  };

  const { data: companyId, error } = await supabase.rpc("complete_onboarding", {
    payload,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("[onboarding]", error);
    if (error.code === "23505") {
      throw new Error("Your workspace already exists. Redirecting you to the dashboard.");
    }
    throw new Error("We couldn't create your workspace. Please try again.");
  }

  return companyId as string;
}

export function getOnboardingErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong while creating your workspace. Please try again.";
}

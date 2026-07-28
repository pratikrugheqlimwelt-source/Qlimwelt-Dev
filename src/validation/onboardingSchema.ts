import { z } from "zod";

export const INDUSTRIES = [
  "Manufacturing",
  "Automotive",
  "Construction",
  "Energy",
  "Logistics and transportation",
  "Retail",
  "Food and beverage",
  "Agriculture",
  "Technology",
  "Software",
  "Financial services",
  "Real estate",
  "Healthcare",
  "Pharmaceuticals",
  "Hospitality",
  "Professional services",
  "Public sector",
  "Education",
  "Telecommunications",
  "Chemicals",
  "Textiles and apparel",
  "Other",
] as const;

export const COMPANY_SIZES = [
  "1 to 10 employees",
  "11 to 50 employees",
  "51 to 250 employees",
  "251 to 1000 employees",
  "1001 to 5000 employees",
  "More than 5000 employees",
] as const;

export const CURRENCIES = ["EUR", "USD", "GBP", "INR", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK"] as const;

export const EMISSION_STATUS_OPTIONS = [
  "Yes, regularly",
  "Yes, partially",
  "We are starting now",
  "No",
] as const;

export const MEASURED_SCOPES = [
  "Scope 1",
  "Scope 2",
  "Scope 3",
  "We do not measure emissions yet",
] as const;

export const REPORTING_STANDARDS = [
  "GHG Protocol",
  "ISO 14064",
  "CSRD",
  "ESRS",
  "SBTi",
  "CDP",
  "GRI",
  "None yet",
  "Other",
] as const;

export const INTEREST_OPTIONS = [
  "Calculate our carbon footprint",
  "Prepare for CSRD reporting",
  "Understand Scope 3 emissions",
  "Reduce energy and fuel costs",
  "Manage facility emissions",
  "Manage vehicle emissions",
  "Engage suppliers",
  "Track climate targets",
  "Create sustainability reports",
  "Improve data quality",
  "Prepare for an audit",
  "Explore the platform",
  "Other",
] as const;

export const TIMELINE_OPTIONS = [
  "Immediately",
  "Within one month",
  "Within three months",
  "Later this year",
  "Just exploring",
] as const;

const personalSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  workEmail: z.string().email("Enter a valid work email"),
  jobTitle: z.string().min(2, "Job title is required"),
  phoneNumber: z.string().optional(),
});

const companySchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  companyWebsite: z
    .string()
    .url("Enter a valid website URL")
    .optional()
    .or(z.literal("")),
  industry: z.string().min(1, "Select an industry"),
  companySize: z.string().min(1, "Select company size"),
  headquartersCountry: z.string().min(1, "Select headquarters country"),
  countriesOfOperation: z.array(z.string()).min(1, "Select at least one country"),
  numberOfEmployees: z.coerce.number().int().min(0, "Employee count cannot be negative"),
  approximateAnnualRevenue: z.coerce.number().min(0, "Revenue cannot be negative").optional().nullable(),
  currency: z.string().min(1, "Select a currency"),
  numberOfFacilities: z.coerce.number().int().min(0, "Facility count cannot be negative"),
});

const climateSchema = z.object({
  emissionMeasurementStatus: z.string().min(1, "Select an option"),
  measuredScopes: z.array(z.string()).min(1, "Select at least one option"),
  hasClimateTarget: z.boolean({ required_error: "Please indicate if you have a climate target" }),
  reportingStandards: z.array(z.string()).min(1, "Select at least one standard"),
});

const interestsSchema = z.object({
  interests: z.array(z.string()).min(1, "Select at least one goal"),
  sustainabilityChallenge: z.string().max(500, "Maximum 500 characters").optional(),
  implementationTimeline: z.string().min(1, "Select a timeline"),
});

const reviewSchema = z.object({
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms to continue" }),
  }),
});

export const onboardingFormSchema = z.object({
  personal: personalSchema,
  company: companySchema,
  climate: climateSchema,
  interests: interestsSchema,
  review: reviewSchema,
});

export type OnboardingFormData = z.infer<typeof onboardingFormSchema>;
export type PersonalDetailsData = z.infer<typeof personalSchema>;
export type CompanyDetailsData = z.infer<typeof companySchema>;
export type ClimateMaturityData = z.infer<typeof climateSchema>;
export type InterestsData = z.infer<typeof interestsSchema>;
export type ReviewData = z.infer<typeof reviewSchema>;

export const personalStepSchema = personalSchema;
export const companyStepSchema = companySchema;
export const climateStepSchema = climateSchema;
export const interestsStepSchema = interestsSchema;
export const reviewStepSchema = reviewSchema;

export const COUNTRIES = [
  "Germany", "Netherlands", "France", "United Kingdom", "Spain", "Italy", "Poland",
  "Sweden", "Norway", "Denmark", "Switzerland", "Austria", "Belgium", "Ireland",
  "Portugal", "Czech Republic", "Finland", "India", "United States", "Canada", "Other",
] as const;

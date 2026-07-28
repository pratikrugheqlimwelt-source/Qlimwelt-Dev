"use client";

import { useState, useCallback } from "react";
import type { OnboardingFormData } from "@/validation/onboardingSchema";

const STORAGE_KEY = "qlimwelt_onboarding_draft";

const defaultForm: OnboardingFormData = {
  personal: { fullName: "", workEmail: "", jobTitle: "", phoneNumber: "" },
  company: {
    companyName: "",
    companyWebsite: "",
    industry: "",
    companySize: "",
    headquartersCountry: "",
    countriesOfOperation: [],
    numberOfEmployees: 0,
    approximateAnnualRevenue: null,
    currency: "EUR",
    numberOfFacilities: 0,
  },
  climate: {
    emissionMeasurementStatus: "",
    measuredScopes: [],
    hasClimateTarget: false,
    reportingStandards: [],
  },
  interests: {
    interests: [],
    sustainabilityChallenge: "",
    implementationTimeline: "",
  },
  review: { consentAccepted: false as unknown as true },
};

export function useOnboarding(initialEmail?: string, initialName?: string) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OnboardingFormData>(() => {
    if (typeof window === "undefined") {
      return {
        ...defaultForm,
        personal: {
          ...defaultForm.personal,
          fullName: initialName ?? "",
          workEmail: initialEmail ?? "",
        },
      };
    }
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as OnboardingFormData;
    } catch {
      /* ignore */
    }
    return {
      ...defaultForm,
      personal: {
        ...defaultForm.personal,
        fullName: initialName ?? "",
        workEmail: initialEmail ?? "",
      },
    };
  });

  const persist = useCallback((data: OnboardingFormData) => {
    setForm(data);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, []);

  const updateSection = useCallback(
    <K extends keyof OnboardingFormData>(section: K, value: OnboardingFormData[K]) => {
      persist({ ...form, [section]: value });
    },
    [form, persist]
  );

  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return { step, setStep, form, updateSection, persist, clearDraft };
}

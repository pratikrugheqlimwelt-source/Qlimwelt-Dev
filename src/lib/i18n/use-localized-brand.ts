"use client";

import { useMemo } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { brand } from "@/data/brand-content";
import { brandDe } from "@/data/brand-content.de";

export function useLocalizedBrand() {
  const { locale } = useLocale();
  return useMemo(() => (locale === "de" ? brandDe : brand), [locale]);
}

"use client";

import { useMemo } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  heroStats,
  howItWorksSteps,
  platformFeatures,
  pricingPlans,
  storyCards,
  carbonFootprintTopics,
  footprintFacts,
  insightArticles,
  industryNews,
} from "@/data/marketing-data";
import {
  heroStatsDe,
  howItWorksStepsDe,
  platformFeaturesDe,
  pricingPlansDe,
  storyCardsDe,
  carbonFootprintTopicsDe,
  footprintFactsDe,
  insightArticlesDe,
  industryNewsDe,
} from "@/data/marketing-data.de";

/** Locale-aware marketing datasets for landing page + insights. */
export function useLocalizedMarketing() {
  const { locale } = useLocale();
  return useMemo(() => {
    if (locale === "de") {
      return {
        heroStats: heroStatsDe,
        howItWorksSteps: howItWorksStepsDe,
        platformFeatures: platformFeaturesDe,
        pricingPlans: pricingPlansDe,
        storyCards: storyCardsDe,
        carbonFootprintTopics: carbonFootprintTopicsDe,
        footprintFacts: footprintFactsDe,
        insightArticles: insightArticlesDe,
        industryNews: industryNewsDe,
      };
    }
    return {
      heroStats,
      howItWorksSteps,
      platformFeatures,
      pricingPlans,
      storyCards,
      carbonFootprintTopics,
      footprintFacts,
      insightArticles,
      industryNews,
    };
  }, [locale]);
}

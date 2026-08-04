"use client";

import {
  Building2,
  Cloud,
  Database,
  FileSpreadsheet,
  Link2,
  Package,
  Plug,
  RefreshCw,
  PenLine,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  FadeUp,
  MetaLabel,
  SectionIntro,
  EditorialCta,
  StepRow,
} from "@/components/marketing/editorial";
import { AnimatedRule } from "@/components/marketing/motion-ui";
import { useT } from "@/components/i18n/locale-provider";
import { EASE_OUT } from "@/lib/motion";

const DATA_SOURCES: { key: string; icon: LucideIcon }[] = [
  { key: "Erp", icon: Building2 },
  { key: "Procurement", icon: Package },
  { key: "Cloud", icon: Cloud },
  { key: "Travel", icon: Truck },
  { key: "Energy", icon: Database },
  { key: "Files", icon: FileSpreadsheet },
];

const FIT_STEPS = ["Sources", "Layer", "Outcomes"] as const;

const OPTIONS: { key: string; icon: LucideIcon }[] = [
  { key: "Api", icon: Plug },
  { key: "Upload", icon: ShieldCheck },
  { key: "Sync", icon: RefreshCw },
  { key: "Custom", icon: Link2 },
  { key: "Manual", icon: PenLine },
];

export function TechStackIntegrations() {
  const t = useT();

  return (
    <div>
      <FadeUp>
        <SectionIntro
          label={t("marketing.integrationsLabel")}
          lines={[
            { text: t("marketing.integrationsTitle1"), italic: true },
            { text: t("marketing.integrationsTitle2") },
          ]}
        />
        <p className="mt-5 max-w-xl font-serif text-xl italic leading-snug text-[#2f6f24] sm:text-2xl">
          {t("marketing.integrationsSubhead")}
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
          {t("marketing.integrationsBody")}
        </p>
      </FadeUp>

      <AnimatedRule className="section-content-gap max-w-xs" />

      {/* Data sources — same card language as Capabilities */}
      <div className="section-content-gap">
        <FadeUp>
          <MetaLabel>{t("marketing.integrationsSourcesLabel")}</MetaLabel>
        </FadeUp>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DATA_SOURCES.map(({ key, icon: Icon }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.04, ease: EASE_OUT }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-[#82D153]/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#82D153]/12 text-[#2f6f24] ring-1 ring-[#82D153]/25 transition-transform group-hover:scale-105">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="font-mono text-[10px] font-semibold tracking-wider text-slate-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="type-title mt-5 text-xl text-slate-900 sm:text-[1.35rem]">
                {t(`marketing.integrationsSrc${key}Title`)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {t(`marketing.integrationsSrc${key}Body`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Where it fits — shared editorial StepRow */}
      <div className="section-content-gap">
        <FadeUp>
          <MetaLabel>{t("marketing.integrationsFitLabel")}</MetaLabel>
          <h3 className="type-section mt-3 max-w-xl text-slate-900">
            {t("marketing.integrationsFitTitle")}
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
            {t("marketing.integrationsFitBody")}
          </p>
        </FadeUp>

        <div className="mt-10 border-t border-border">
          {FIT_STEPS.map((step, i) => (
            <FadeUp key={step} delay={i * 0.05}>
              <StepRow
                num={String(i + 1).padStart(2, "0")}
                label={t(`marketing.integrationsFit${step}Eyebrow`)}
                title={t(`marketing.integrationsFit${step}Title`)}
                description={t(`marketing.integrationsFit${step}Body`)}
                active={i === 1}
              />
            </FadeUp>
          ))}
        </div>

        <FadeUp>
          <p className="mx-auto mt-10 max-w-2xl text-center font-serif text-lg italic leading-snug text-slate-800 sm:text-xl">
            {t("marketing.integrationsFitClosing")}
          </p>
        </FadeUp>
      </div>

      <AnimatedRule className="section-content-gap" />

      {/* Flexible options — hairline editorial list */}
      <div className="section-content-gap">
        <FadeUp>
          <MetaLabel>{t("marketing.integrationsOptionsLabel")}</MetaLabel>
          <h3 className="type-section mt-3 text-slate-900">
            {t("marketing.integrationsOptionsTitle")}
          </h3>
        </FadeUp>

        <div className="mt-8 divide-y divide-border border-y border-border">
          {OPTIONS.map(({ key, icon: Icon }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.03, ease: EASE_OUT }}
              className="grid gap-3 py-6 sm:grid-cols-[2.5rem_minmax(0,14rem)_minmax(0,1fr)] sm:items-start sm:gap-8"
            >
              <span className="flex h-10 w-10 items-center justify-center text-[#2f6f24]">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="type-title text-base text-slate-900 sm:text-lg">
                {t(`marketing.integrationsOpt${key}Title`)}
              </p>
              <p className="text-sm leading-relaxed text-slate-600 sm:pt-1">
                {t(`marketing.integrationsOpt${key}Body`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <FadeUp className="section-content-gap max-w-2xl">
        <p className="text-sm leading-relaxed text-slate-600">
          {t("marketing.integrationsClose")}
        </p>
        <div className="mt-8">
          <EditorialCta href="#contact">{t("marketing.integrationsCta")}</EditorialCta>
        </div>
      </FadeUp>
    </div>
  );
}

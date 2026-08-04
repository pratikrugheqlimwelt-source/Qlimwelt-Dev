"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Network,
  Activity,
  SearchCode,
  Lightbulb,
  Scale,
  Waypoints,
  ArrowDown,
} from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { QlimAiChat } from "@/components/qlim-ai/qlim-ai-chat";
import { QlimAiOverlay } from "@/components/qlim-ai/qlim-ai-overlay";
import {
  Section,
  SectionContainer,
  SectionNumberWrap,
  MetaLabel,
  StatusBar,
  EditorialHeadline,
  FadeUp,
  EditorialCta,
  SectionIntro,
} from "@/components/marketing/editorial";
import { AnimatedRule, PricingSelector } from "@/components/marketing/motion-ui";
import { QaiIntelligenceLayerViz } from "@/components/marketing/qai-intelligence-layer-viz";
import { QaiHowItWorksPipeline } from "@/components/marketing/qai-how-it-works";
import { TryQaiMobileButton } from "@/components/qai-mobile/try-qai-mobile-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { qlimAiDemo } from "@/data/marketing-data";
import { useT } from "@/components/i18n/locale-provider";
import { useLocalizedMarketing } from "@/lib/i18n/use-localized-marketing";
import { useLocalizedBrand } from "@/lib/i18n/use-localized-brand";
import { EASE_OUT } from "@/lib/motion";

const CAPABILITIES = [
  { key: "capConnect", icon: Network },
  { key: "capContinuous", icon: Activity },
  { key: "capRootCause", icon: SearchCode },
  { key: "capDecision", icon: Lightbulb },
  { key: "capCompliance", icon: Scale },
  { key: "capGraph", icon: Waypoints },
] as const;

const VALUE_KEYS = [
  "valueUnderstand",
  "valuePredict",
  "valueSupplier",
  "valueCostCarbon",
  "valueCompliance",
  "valueAdvantage",
] as const;

const TRADITIONAL = [
  "compareTrad1",
  "compareTrad2",
  "compareTrad3",
  "compareTrad4",
  "compareTrad5",
] as const;

const QAI_FLOW = [
  "compareQai1",
  "compareQai2",
  "compareQai3",
  "compareQai4",
  "compareQai5",
  "compareQai6",
] as const;

export default function HomePage() {
  const t = useT();
  const brand = useLocalizedBrand();
  const { pricingPlans } = useLocalizedMarketing();
  const [qlimAiOpen, setQlimAiOpen] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);

  const handleDemoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setDemoSubmitting(true);

    const payload = {
      firstName: (form.elements.namedItem("firstName") as HTMLInputElement).value,
      lastName: (form.elements.namedItem("lastName") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? t("marketing.demoFailedDesc"));
      toast({
        title: t("marketing.demoRequestedTitle"),
        description: t("marketing.demoRequestedDesc"),
        variant: "success",
      });
      form.reset();
    } catch (err) {
      toast({
        title: t("marketing.demoFailedTitle"),
        description: err instanceof Error ? err.message : t("marketing.demoFailedDesc"),
        variant: "destructive",
      });
    } finally {
      setDemoSubmitting(false);
    }
  };

  return (
    <MarketingLayout navVariant="home">
      {/* ── HERO ── */}
      <Section className="py-12 lg:py-16">
        <SectionNumberWrap n="01" className="text-foreground/[0.025]" />
        <SectionContainer>
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-10 xl:gap-12">
            <FadeUp delay={0.06}>
              <StatusBar />
              <p className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-[#82D153]" aria-hidden />
                {t("marketing.heroEyebrow")}
              </p>
              <EditorialHeadline
                as="h1"
                className="mt-3 text-[2rem] sm:text-4xl lg:text-5xl xl:text-[3.25rem]"
                lines={[
                  { text: t("marketing.heroLine1"), italic: true },
                  { text: t("marketing.heroLine2"), accent: true },
                ]}
              />
              <AnimatedRule className="mt-5 max-w-xs" />
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-600">
                {t("marketing.heroBody")}
              </p>
              <p className="mt-3 max-w-md font-serif text-base italic leading-snug text-slate-800">
                {t("marketing.heroCaption")}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <EditorialCta href="#contact">{t("marketing.bookDemo")}</EditorialCta>
                <TryQaiMobileButton variant="hero" label={t("qaiMobile.tryCta")} />
                <button
                  type="button"
                  onClick={() => setQlimAiOpen(true)}
                  className="type-nav inline-flex items-center gap-2 px-2 py-3 text-slate-700"
                >
                  {t("marketing.seeQai")}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">{t("qaiMobile.tagline")}</p>
            </FadeUp>
            <FadeUp delay={0.14} className="w-full min-w-0">
              <QaiIntelligenceLayerViz compact />
            </FadeUp>
          </div>
        </SectionContainer>
      </Section>

      {/* ── POSITIONING STATEMENT ── */}
      <Section>
        <div className="watermark-text absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
          QAI
        </div>
        <SectionContainer narrow className="relative text-center">
          <FadeUp>
            <MetaLabel className="text-center">{t("marketing.osLabel")}</MetaLabel>
            <h2 className="mt-5 font-serif text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {t("marketing.osHeadline")}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600">
              {t("marketing.osBody")}
            </p>
            <p className="mx-auto mt-5 max-w-xl font-serif text-xl italic text-[#2f6f24]">
              {t("marketing.osCaption")}
            </p>
          </FadeUp>
          <AnimatedRule className="section-content-gap" />
        </SectionContainer>
      </Section>

      {/* ── INTELLIGENCE CAPABILITIES ── */}
      <Section id="capabilities">
        <SectionNumberWrap n="02" />
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              label={t("marketing.capabilitiesLabel")}
              lines={[
                { text: t("marketing.capabilitiesTitle1"), italic: true },
                { text: t("marketing.capabilitiesTitle2") },
              ]}
            />
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
              {t("marketing.capabilitiesCaption")}
            </p>
          </FadeUp>
          <div className="section-content-gap grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map(({ key, icon: Icon }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.05, ease: EASE_OUT }}
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
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3d8b2e]">
                  {t(`marketing.${key}Caption`)}
                </p>
                <h3 className="mt-2 font-serif text-2xl font-bold tracking-tight text-slate-900">
                  {t(`marketing.${key}Title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {t(`marketing.${key}Body`)}
                </p>
              </motion.div>
            ))}
          </div>
        </SectionContainer>
      </Section>

      {/* ── HOW QAI WORKS ── */}
      <Section id="how-it-works" className="bg-slate-50/70">
        <SectionNumberWrap n="03" />
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              label={t("marketing.howLabel")}
              lines={[
                { text: t("marketing.howTitle1"), italic: true },
                { text: t("marketing.howTitle2") },
              ]}
            />
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
              {t("marketing.howBody")}
            </p>
          </FadeUp>
          <div className="section-content-gap">
            <QaiHowItWorksPipeline />
          </div>
        </SectionContainer>
      </Section>

      {/* ── COMPARISON ── */}
      <Section id="intelligence">
        <SectionNumberWrap n="04" />
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              label={t("marketing.compareLabel")}
              lines={[
                { text: t("marketing.compareTitle1"), italic: true },
                { text: t("marketing.compareTitle2") },
              ]}
            />
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
              {t("marketing.compareCaption")}
            </p>
          </FadeUp>
          <div className="section-content-gap grid gap-6 lg:grid-cols-2">
            <FadeUp>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <MetaLabel>{t("marketing.compareTradLabel")}</MetaLabel>
                <h3 className="mt-3 font-serif text-2xl font-bold text-slate-900">
                  {t("marketing.compareTradTitle")}
                </h3>
                <ul className="mt-8 space-y-0">
                  {TRADITIONAL.map((key, i) => (
                    <li key={key} className="flex flex-col items-start">
                      <div className="flex w-full items-center gap-3 rounded-lg bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
                        <span className="font-mono text-[10px] text-slate-400">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {t(`marketing.${key}`)}
                      </div>
                      {i < TRADITIONAL.length - 1 && (
                        <ArrowDown className="my-1.5 ml-5 h-3.5 w-3.5 text-slate-300" aria-hidden />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="h-full rounded-2xl border border-[#82D153]/35 bg-gradient-to-b from-[#f4fbf0] to-white p-6 sm:p-8">
                <MetaLabel className="text-[#3d8b2e]">{t("marketing.compareQaiLabel")}</MetaLabel>
                <h3 className="mt-3 font-serif text-2xl font-bold text-slate-900">
                  {t("marketing.compareQaiTitle")}
                </h3>
                <ul className="mt-8 space-y-0">
                  {QAI_FLOW.map((key, i) => (
                    <li key={key} className="flex flex-col items-start">
                      <div className="flex w-full items-center gap-3 rounded-lg border border-[#82D153]/20 bg-white/80 px-3 py-3 text-sm font-medium text-slate-800">
                        <span className="font-mono text-[10px] text-[#3d8b2e]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {t(`marketing.${key}`)}
                      </div>
                      {i < QAI_FLOW.length - 1 && (
                        <ArrowDown className="my-1.5 ml-5 h-3.5 w-3.5 text-[#82D153]" aria-hidden />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          </div>
        </SectionContainer>
      </Section>

      {/* ── WHY QAI EXISTS ── */}
      <Section className="bg-slate-950 text-white">
        <SectionContainer narrow className="py-4 text-center">
          <FadeUp>
            <MetaLabel className="text-center text-white/40">{t("marketing.whyLabel")}</MetaLabel>
            <blockquote className="mt-8 font-serif text-3xl font-bold leading-snug tracking-tight sm:text-4xl lg:text-5xl">
              {t("marketing.whyQuote1")}
              <br />
              <span className="italic text-[#82D153]">{t("marketing.whyQuote2")}</span>
            </blockquote>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-white/65">
              {t("marketing.whyBody")}
            </p>
            <p className="mx-auto mt-6 max-w-xl font-serif text-lg italic text-[#82D153]/90">
              {t("marketing.whyCaption")}
            </p>
          </FadeUp>
        </SectionContainer>
      </Section>

      {/* ── CUSTOMER VALUE ── */}
      <Section id="value">
        <SectionNumberWrap n="05" />
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              label={t("marketing.valueLabel")}
              lines={[
                { text: t("marketing.valueTitle1"), italic: true },
                { text: t("marketing.valueTitle2") },
              ]}
            />
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
              {t("marketing.valueCaption")}
            </p>
          </FadeUp>
          <div className="section-content-gap grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {VALUE_KEYS.map((key, i) => (
              <FadeUp key={key} delay={i * 0.04}>
                <div className="flex h-full items-start gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 transition-colors hover:border-[#82D153]/35">
                  <span className="mt-0.5 font-mono text-[11px] font-semibold text-[#82D153]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="font-serif text-lg font-semibold leading-snug tracking-tight text-slate-900">
                    {t(`marketing.${key}`)}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </SectionContainer>
      </Section>

      {/* ── QAI IN ACTION ── */}
      <Section id="qai" className="bg-slate-50/70">
        <SectionNumberWrap n="06" />
        <SectionContainer>
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            <FadeUp>
              <SectionIntro
                label={t("marketing.qlimAiLabel")}
                lines={[
                  { text: t("marketing.qlimAiHeadline"), italic: true },
                  { text: t("marketing.qlimAiHeadlineAccent"), accent: true },
                ]}
              />
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-slate-600">
                {t("marketing.qlimAiBody")}
              </p>
              <ul className="mt-6 space-y-3">
                {(["qlimAiBullet1", "qlimAiBullet2", "qlimAiBullet3"] as const).map((k) => (
                  <li key={k} className="flex gap-3 text-sm text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#82D153]" />
                    {t(`marketing.${k}`)}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setQlimAiOpen(true)}
                className="type-cta mt-8 inline-block border border-foreground px-5 py-3 transition-colors hover:bg-foreground hover:text-background"
              >
                {t("marketing.openQlimAi")}
              </button>
            </FadeUp>
            <FadeUp delay={0.1}>
              <QlimAiChat
                messages={qlimAiDemo.slice(0, 2)}
                className="shadow-lg"
              />
            </FadeUp>
          </div>
        </SectionContainer>
      </Section>

      {/* ── PRICING ── */}
      <Section id="pricing">
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              label={t("marketing.pricingLabel")}
              lines={[
                { text: t("marketing.noSurprises"), italic: true },
                { text: t("marketing.justProgress") },
              ]}
            />
          </FadeUp>
          <div className="section-content-gap">
            <PricingSelector plans={pricingPlans} />
          </div>
        </SectionContainer>
      </Section>

      {/* ── ABOUT ── */}
      <Section id="about">
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              label={t("marketing.companyOrigin")}
              lines={[
                { text: t("marketing.builtToFix"), italic: true },
                { text: t("marketing.aRealProblem") },
              ]}
            />
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="section-content-gap border border-border p-6 lg:p-8">
              <div className="grid items-start gap-8 lg:grid-cols-[8rem_minmax(0,1fr)] lg:items-center lg:gap-10">
                <div className="flex h-32 w-32 shrink-0 items-center justify-center border border-border font-serif text-4xl font-bold text-brand-dark">
                  PR
                </div>
                <div className="min-w-0">
                  <p className="font-serif text-3xl font-bold">Pratik Rughe</p>
                  <MetaLabel className="mt-2">{t("marketing.founderRole")}</MetaLabel>
                  <blockquote className="mt-8 max-w-2xl border-l border-brand-dark pl-6 font-serif text-xl italic leading-relaxed text-muted-foreground">
                    {t("marketing.founderQuote")}
                  </blockquote>
                </div>
              </div>
            </div>
          </FadeUp>
        </SectionContainer>
      </Section>

      {/* ── CONTACT ── */}
      <Section id="contact" noBorder className="pb-16">
        <SectionContainer>
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
            <FadeUp>
              <SectionIntro
                label={t("marketing.getStarted")}
                lines={[
                  { text: t("marketing.startMeasuring"), italic: true },
                  { text: t("marketing.whatMatters") },
                ]}
              />
              <ul className="section-content-gap space-y-4">
                {brand.cta.options.map((opt, oi) => (
                  <li key={`cta-${oi}`} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-px shrink-0 font-mono text-brand-dark">→</span>
                    <span>{opt}</span>
                  </li>
                ))}
              </ul>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="border border-border p-8 lg:p-10">
                <MetaLabel>{t("marketing.requestDemoLabel")}</MetaLabel>
                <form onSubmit={handleDemoSubmit} className="section-content-gap space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName" className="type-label">
                        {t("marketing.firstName")}
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        required
                        className="mt-2 rounded-none border-x-0 border-b border-t-0 px-0 shadow-none focus-visible:ring-0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="type-label">
                        {t("marketing.lastName")}
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        required
                        className="mt-2 rounded-none border-x-0 border-b border-t-0 px-0 shadow-none focus-visible:ring-0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="type-label">
                      {t("marketing.email")}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="mt-2 rounded-none border-x-0 border-b border-t-0 px-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company" className="type-label">
                      {t("marketing.company")}
                    </Label>
                    <Input
                      id="company"
                      name="company"
                      required
                      className="mt-2 rounded-none border-x-0 border-b border-t-0 px-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="type-label">
                      {t("marketing.message")}
                    </Label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      className="mt-2 flex w-full resize-none border-x-0 border-b border-t-0 border-input bg-transparent px-0 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={demoSubmitting}
                    className="type-cta w-full border border-foreground py-4 transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {demoSubmitting ? t("marketing.sending") : t("marketing.bookDemo")}
                  </button>
                  <p className="text-center type-label">{t("marketing.noSpam")}</p>
                </form>
              </div>
            </FadeUp>
          </div>
        </SectionContainer>
      </Section>

      <QlimAiOverlay open={qlimAiOpen} onClose={() => setQlimAiOpen(false)} chatExpanded />
    </MarketingLayout>
  );
}

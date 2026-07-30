"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
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
  ThinRule,
  MetricDark,
  StatColumn,
  EmissionsNetworkViz,
  FadeUp,
  FadeUpStagger,
  FadeUpItem,
  EditorialCta,
  SectionIntro,
} from "@/components/marketing/editorial";
import { AnimatedRule, PricingSelector, InteractiveSteps } from "@/components/marketing/motion-ui";
import { CarbonFootprintSection, InsightsNewsSection } from "@/components/marketing/carbon-insights";
import { MetricFigure } from "@/components/ui/metric-figure";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { qlimAiDemo } from "@/data/marketing-data";
import { useT } from "@/components/i18n/locale-provider";
import { useLocalizedMarketing } from "@/lib/i18n/use-localized-marketing";
import { useLocalizedBrand } from "@/lib/i18n/use-localized-brand";

function QuoteCarousel() {
  const t = useT();
  const brand = useLocalizedBrand();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % brand.quotes.length), 5000);
    return () => clearInterval(id);
  }, [brand.quotes.length]);

  return (
    <div className="border border-border px-5 py-10 text-center sm:px-8">
      <MetaLabel>
        {`${t("marketing.insightLabel")} // ${String(index + 1).padStart(2, "0")}`}
      </MetaLabel>
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4 }}
          className="mx-auto mt-6 max-w-2xl font-serif text-2xl italic leading-relaxed sm:text-3xl"
        >
          &ldquo;{brand.quotes[index]}&rdquo;
        </motion.p>
      </AnimatePresence>
      <div className="mt-8 flex justify-center gap-2">
        {brand.quotes.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-px transition-all ${i === index ? "w-8 bg-foreground" : "w-4 bg-border"}`}
            aria-label={t("marketing.quoteAria", { n: i + 1 })}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const t = useT();
  const brand = useLocalizedBrand();
  const {
    heroStats,
    howItWorksSteps,
    platformFeatures,
    pricingPlans,
    storyCards,
  } = useLocalizedMarketing();
  const [qlimAiOpen, setQlimAiOpen] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const now = new Date();
  const timestamp = `${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}.${now.getFullYear()} // ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} UTC`;

  const useCases = [
    {
      tag: t("marketing.uc1Tag"),
      title: t("marketing.uc1Title"),
      description: t("marketing.uc1Desc"),
      stat: t("marketing.uc1Stat"),
    },
    {
      tag: t("marketing.uc2Tag"),
      title: t("marketing.uc2Title"),
      description: t("marketing.uc2Desc"),
      stat: t("marketing.uc2Stat"),
    },
    {
      tag: t("marketing.uc3Tag"),
      title: t("marketing.uc3Title"),
      description: t("marketing.uc3Desc"),
      stat: t("marketing.uc3Stat"),
    },
  ];

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

      if (!res.ok) {
        throw new Error(data.error ?? t("marketing.demoFailedDesc"));
      }

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
      {/* ── 01 HERO ── */}
      <Section className="py-14 lg:py-16">
        <SectionNumberWrap n="01" className="text-foreground/[0.025] lg:text-foreground/[0.03]" />
        <SectionContainer>
          <FadeUp>
            <StatusBar />
          </FadeUp>
          <div className="section-content-gap grid items-center gap-8 lg:grid-cols-2 lg:items-start lg:gap-10">
            <FadeUp delay={0.1}>
              <EditorialHeadline
                as="h1"
                lines={[
                  { text: t("marketing.heroLine1"), italic: true },
                  { text: t("marketing.heroLine2"), accent: true },
                ]}
              />
              <AnimatedRule className="mt-6 max-w-xs" />
              <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
                {t("marketing.heroBody")}{" "}
                <em className="text-foreground">{t("marketing.heroBodyAccent")}</em>{" "}
                {t("marketing.heroBodyEnd")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <EditorialCta href="#contact">{t("marketing.requestDemo")}</EditorialCta>
                <Link
                  href="/login"
                  className="type-nav inline-flex items-center gap-2 px-2 py-4"
                >
                  {t("marketing.loginForFree")}
                </Link>
              </div>
            </FadeUp>
            <FadeUp delay={0.2} className="w-full min-w-0 lg:pt-2">
              <EmissionsNetworkViz />
            </FadeUp>
          </div>
        </SectionContainer>
      </Section>

      {/* ── CENTER STATEMENT ── */}
      <Section>
        <div className="watermark-text absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">QLIMWELT</div>
        <SectionContainer narrow className="relative text-center">
          <FadeUp>
            <MetaLabel className="text-center">{t("marketing.futureOf")}</MetaLabel>
            <h2 className="mt-4 font-serif text-5xl font-bold sm:text-6xl lg:text-7xl">{t("marketing.carbon")}</h2>
            <p className="mt-1 font-serif text-5xl italic sm:text-6xl lg:text-7xl">{t("marketing.intelligence")}</p>
            <MetaLabel className="mt-8 text-center tracking-[0.3em]">{t("marketing.startsBefore")}</MetaLabel>
            <p className="mt-3 font-serif text-4xl font-bold text-brand-dark sm:text-5xl">{t("marketing.theFirstAudit")}</p>
          </FadeUp>
          <AnimatedRule className="section-content-gap" />
        </SectionContainer>
      </Section>

      {/* ── 02 STEPS ── */}
      <Section id="how-it-works">
        <SectionNumberWrap n="02" />
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              lines={[
                { text: t("marketing.threeSteps"), italic: true },
                { text: t("marketing.toCsrdReady") },
              ]}
            />
            <MetaLabel className="mt-4">{t("marketing.workflowAutomated")}</MetaLabel>
          </FadeUp>
          <div className="section-content-gap">
            <InteractiveSteps
              steps={howItWorksSteps.map((s) => ({
                step: s.step,
                title: s.title,
                description: s.description,
              }))}
            />
          </div>
        </SectionContainer>
      </Section>

      {/* ── 03 CARBON FOOTPRINTING ── */}
      <CarbonFootprintSection />

      {/* ── 04 DARK METRICS ── */}
      <Section dark>
        <SectionNumberWrap n="04" align="left" className="text-white/[0.04]" />
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              dark
              lines={[
                { text: t("marketing.numbersThat"), italic: true },
                { text: t("marketing.driveDecisions") },
              ]}
            />
          </FadeUp>
          <div className="section-content-gap grid gap-8 sm:grid-cols-2 sm:gap-10 lg:gap-12">
            <FadeUp delay={0.1}>
              <MetricDark
                index="METRIC_01"
                value={heroStats[1].value.replace(",", "")}
                label={t("marketing.metricProcessed")}
                meta={[t("marketing.sensorsActive"), "CONFIDENCE: 99.9%", timestamp]}
              />
            </FadeUp>
            <FadeUp delay={0.2}>
              <MetricDark
                index="METRIC_02"
                value="97%"
                label={t("marketing.metricReporting")}
                meta={[t("marketing.csrdCompliance"), "CONFIDENCE: 98.4%", timestamp]}
              />
            </FadeUp>
          </div>
        </SectionContainer>
      </Section>

      {/* ── 05 INSIGHTS & NEWS ── */}
      <InsightsNewsSection />

      {/* ── 07 SPEED ── */}
      <Section>
        <SectionNumberWrap n="07" />
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              lines={[
                { text: t("marketing.whySpeed"), italic: true },
                { text: t("marketing.isEverything") },
              ]}
            />
          </FadeUp>
          <FadeUpStagger className="section-content-gap grid gap-8 sm:grid-cols-3 sm:gap-6 lg:gap-8">
            <FadeUpItem>
              <StatColumn
                value="3 hrs"
                label={t("marketing.earlyDetection")}
                description={t("marketing.earlyDetectionDesc")}
              />
            </FadeUpItem>
            <FadeUpItem>
              <StatColumn
                value="97%"
                label={t("marketing.fasterReporting")}
                description={t("marketing.fasterReportingDesc")}
              />
            </FadeUpItem>
            <FadeUpItem>
              <StatColumn
                value="24/7"
                label={t("marketing.continuousMonitoring")}
                description={t("marketing.continuousMonitoringDesc")}
              />
            </FadeUpItem>
          </FadeUpStagger>
        </SectionContainer>
      </Section>

      {/* ── PURPOSE ── */}
      <Section id="purpose">
        <SectionContainer tight className="text-center">
          <FadeUp>
            <MetaLabel>{brand.purpose.title.toUpperCase()}</MetaLabel>
            <p className="section-content-gap font-serif text-2xl leading-relaxed sm:text-3xl">{brand.purpose.description}</p>
          </FadeUp>
        </SectionContainer>
      </Section>

      {/* ── MISSION / VISION / VALUES ── */}
      <Section>
        <SectionContainer>
          <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
            {[
              { title: brand.mission.title, items: brand.mission.statements },
              { title: brand.vision.title, items: brand.vision.statements },
              { title: brand.values.title, items: brand.values.statements },
            ].map((block, bi) => (
              <FadeUp key={block.title} delay={bi * 0.1} className="flex flex-col">
                <MetaLabel>{block.title.toUpperCase()}</MetaLabel>
                <h3 className="mt-3 font-serif text-3xl font-bold">{block.title}</h3>
                <ThinRule className="mt-6" />
                <ul className="mt-6 flex-1 space-y-4">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeUp>
            ))}
          </div>
        </SectionContainer>
      </Section>

      {/* ── PLATFORM ── */}
      <Section id="platform">
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              label={t("marketing.platformModules")}
              lines={[
                { text: t("marketing.everythingYou"), italic: true },
                { text: t("marketing.need") },
              ]}
            />
          </FadeUp>
          <div className="section-content-gap divide-y divide-border">
            {platformFeatures.map((f, i) => (
              <FadeUp key={f.num} delay={i * 0.05}>
                <div className="grid gap-4 py-7 sm:grid-cols-[4rem_minmax(0,1fr)] sm:items-start sm:gap-8 sm:py-8">
                  <p className="font-serif text-4xl font-bold tabular-nums text-foreground/20">{f.num}</p>
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl font-bold">{f.title}</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </SectionContainer>
      </Section>

      {/* ── AI SECTION ── */}
      <Section>
        <SectionContainer>
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
            <FadeUp>
              <MetaLabel className="text-brand-dark">{t("marketing.qlimAiLabel")}</MetaLabel>
              <h2 className="section-headline-gap font-serif text-4xl font-bold text-foreground sm:text-5xl">
                {t("marketing.qlimAiHeadline")}{" "}
                <span className="font-normal italic">{t("marketing.qlimAiHeadlineAccent")}</span>
              </h2>
              <ThinRule className="mt-8" />
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                {t("marketing.qlimAiBody")}
              </p>
              <ul className="mt-6 space-y-4">
                {[t("marketing.qlimAiBullet1"), t("marketing.qlimAiBullet2"), t("marketing.qlimAiBullet3")].map(
                  (item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" />
                    <span>{item}</span>
                  </li>
                )
                )}
              </ul>
              <button
                type="button"
                onClick={() => setQlimAiOpen(true)}
                className="motion-safe:transition-all type-cta mt-10 border border-foreground px-6 py-3 text-foreground hover:bg-foreground hover:text-background active:scale-[0.98]"
              >
                {t("marketing.openQlimAi")}
              </button>
            </FadeUp>
            <FadeUp delay={0.15} className="lg:pt-2">
              <button
                type="button"
                onClick={() => setQlimAiOpen(true)}
                className="block w-full text-left shadow-sm"
                aria-label={t("marketing.openQlimAi")}
              >
                <QlimAiChat messages={qlimAiDemo.slice(0, 2)} animateLast={false} />
              </button>
            </FadeUp>
          </div>
        </SectionContainer>
      </Section>

      {/* ── USE CASES ── */}
      <Section id="use-cases">
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              label={t("marketing.solutionsLabel")}
              lines={[
                { text: t("marketing.builtFor"), italic: true },
                { text: t("marketing.europeanBusiness") },
              ]}
            />
          </FadeUp>
          <div className="section-content-gap divide-y divide-border">
            {useCases.map((uc, i) => (
              <FadeUp key={uc.tag} delay={i * 0.08}>
                <div className="grid gap-4 py-7 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start sm:gap-8 sm:py-8">
                  <MetaLabel className="pt-1">{uc.tag}</MetaLabel>
                  <div className="min-w-0">
                    <h3 className="font-serif text-2xl font-bold">{uc.title}</h3>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{uc.description}</p>
                    <p className="mt-4 font-mono text-xs uppercase tracking-wider text-brand-dark">{uc.stat}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </SectionContainer>
      </Section>

      {/* ── QUOTES ── */}
      <Section>
        <SectionContainer narrow>
          <QuoteCarousel />
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
          <div className="section-content-gap grid gap-8 sm:grid-cols-3">
            {storyCards.map((card, i) => (
              <FadeUp key={card.label} delay={i * 0.1}>
                <MetricFigure size="hero">{card.stat}</MetricFigure>
                <MetaLabel className="mt-3">{card.label}</MetaLabel>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{card.text}</p>
              </FadeUp>
            ))}
          </div>
          <FadeUp delay={0.2}>
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
                {brand.cta.options.map((opt) => (
                  <li key={opt} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-px shrink-0 font-mono text-brand-dark">→</span>
                    <span>{opt}</span>
                  </li>
                ))}
              </ul>
            </FadeUp>
            <FadeUp delay={0.15}>
              <div className="border border-border p-8 lg:p-10">
                <MetaLabel>{t("marketing.requestDemoLabel")}</MetaLabel>
                <form onSubmit={handleDemoSubmit} className="section-content-gap space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName" className="type-label">
                        {t("marketing.firstName")}
                      </Label>
                      <Input id="firstName" name="firstName" required className="mt-2 rounded-none border-x-0 border-b border-t-0 px-0 shadow-none focus-visible:ring-0" />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="type-label">
                        {t("marketing.lastName")}
                      </Label>
                      <Input id="lastName" name="lastName" required className="mt-2 rounded-none border-x-0 border-b border-t-0 px-0 shadow-none focus-visible:ring-0" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="type-label">
                      {t("marketing.email")}
                    </Label>
                    <Input id="email" name="email" type="email" required className="mt-2 rounded-none border-x-0 border-b border-t-0 px-0 shadow-none focus-visible:ring-0" />
                  </div>
                  <div>
                    <Label htmlFor="company" className="type-label">
                      {t("marketing.company")}
                    </Label>
                    <Input id="company" name="company" required className="mt-2 rounded-none border-x-0 border-b border-t-0 px-0 shadow-none focus-visible:ring-0" />
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
                    {demoSubmitting ? t("marketing.sending") : t("marketing.requestDemo")}
                  </button>
                  <p className="text-center type-label">
                    {t("marketing.noSpam")}
                  </p>
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

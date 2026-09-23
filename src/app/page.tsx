"use client";

import { useEffect, useState } from "react";
import {
  Network,
  Activity,
  SearchCode,
  Lightbulb,
  Scale,
  Waypoints,
  ChevronRight,
} from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { QlimAiChat } from "@/components/qlim-ai/qlim-ai-chat";
import { QlimAiOverlay } from "@/components/qlim-ai/qlim-ai-overlay";
import {
  Section,
  SectionContainer,
  MetaLabel,
  FadeUp,
} from "@/components/marketing/editorial";
import { PricingSelector } from "@/components/marketing/motion-ui";
import {
  SiemensPrimaryCta,
  SiemensSecondaryCta,
  SiemensFeatureCard,
  SiemensProofRow,
  HeroVisualPanel,
  PipelineActionCard,
  ValueMediaCard,
  PricingBanner,
  MediaPanel,
  MARKETING_IMAGES,
} from "@/components/marketing/siemens-ui";
import { ConnectedSystemsShowcase } from "@/components/marketing/connected-systems-showcase";
import { TeamSection } from "@/components/marketing/team-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { qlimAiDemo } from "@/data/marketing-data";
import { useT } from "@/components/i18n/locale-provider";
import { useLocalizedMarketing } from "@/lib/i18n/use-localized-marketing";
import { useLocalizedBrand } from "@/lib/i18n/use-localized-brand";

const CAPABILITIES = [
  { key: "capConnect", icon: Network, image: MARKETING_IMAGES.factory },
  { key: "capContinuous", icon: Activity, image: MARKETING_IMAGES.grid },
  { key: "capRootCause", icon: SearchCode, image: MARKETING_IMAGES.data },
  { key: "capDecision", icon: Lightbulb, image: MARKETING_IMAGES.boardroom },
  { key: "capCompliance", icon: Scale, image: MARKETING_IMAGES.city },
  { key: "capGraph", icon: Waypoints, image: MARKETING_IMAGES.control },
] as const;

const PIPELINE_STEPS = [
  { n: "01", key: "pipelineStepConnect" },
  { n: "02", key: "pipelineStepReason" },
  { n: "03", key: "pipelineStepAct" },
] as const;

const VALUE_ITEMS = [
  { key: "valueUnderstand", image: MARKETING_IMAGES.boardroom },
  { key: "valuePredict", image: MARKETING_IMAGES.grid },
  { key: "valueSupplier", image: MARKETING_IMAGES.logistics },
  { key: "valueCostCarbon", image: MARKETING_IMAGES.turbines },
  { key: "valueCompliance", image: MARKETING_IMAGES.city },
  { key: "valueAdvantage", image: MARKETING_IMAGES.forest },
] as const;

export default function HomePage() {
  const t = useT();
  const brand = useLocalizedBrand();
  const { pricingPlans } = useLocalizedMarketing();
  const [qlimAiOpen, setQlimAiOpen] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);

  // Keep first paint on the hero — pricing cards / late layout used to yank the viewport down.
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // Deep-links (e.g. /#pricing) should still work; only lock the bare homepage.
    if (window.location.hash) return;

    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";

    const lockTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      html.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    lockTop();
    const raf1 = requestAnimationFrame(() => {
      lockTop();
      requestAnimationFrame(lockTop);
    });
    const timers = [0, 50, 150, 400, 800, 1200].map((ms) => window.setTimeout(lockTop, ms));

    return () => {
      cancelAnimationFrame(raf1);
      timers.forEach(clearTimeout);
      html.style.scrollBehavior = prevBehavior;
    };
  }, []);

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
      <section className="viewport-section-fill relative w-full overflow-hidden border-b border-border bg-white !py-0">
        <div className="mx-auto grid h-full min-h-[inherit] w-full max-w-[90rem] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="flex min-w-0 flex-col justify-center px-4 py-10 sm:px-6 lg:px-10 lg:py-12 xl:pr-6">
            <FadeUp delay={0.04}>
              <p className="font-sans text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                Qlimwelt
              </p>
              <p className="siemens-eyebrow mt-5">{t("marketing.heroEyebrow")}</p>
              <h1 className="siemens-display mt-3">
                <span className="block">{t("marketing.heroLine1")}</span>
                <span className="block">{t("marketing.heroLine2")}</span>
              </h1>
              <p className="siemens-body mt-5 max-w-xl">{t("marketing.heroBody")}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <SiemensPrimaryCta href="#contact">{t("marketing.bookDemo")}</SiemensPrimaryCta>
                <SiemensSecondaryCta href="/dashboard">
                  {t("marketing.exploreDashboard")}
                </SiemensSecondaryCta>
              </div>
              <SiemensProofRow className="mt-8" />
            </FadeUp>
          </div>
          <FadeUp delay={0.12} className="min-h-[260px] min-w-0 lg:min-h-0">
            <HeroVisualPanel className="h-full min-h-[260px] lg:min-h-full" />
          </FadeUp>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <Section id="capabilities" viewport viewportAlign="start" className="bg-white !py-0">
        <div className="mx-auto grid w-full max-w-[90rem] border-b border-border lg:min-h-[min(52vh,28rem)] lg:grid-cols-2">
          <div className="flex min-w-0 flex-col justify-center px-4 py-10 sm:px-6 lg:px-10 lg:py-12">
            <FadeUp>
              <MetaLabel className="text-brand">{t("marketing.capabilitiesLabel")}</MetaLabel>
              <h2 className="siemens-display mt-3 max-w-xl">{t("marketing.capabilitiesHeadline")}</h2>
              <p className="siemens-body mt-4 max-w-lg">{t("marketing.capabilitiesCaption")}</p>
              <div className="mt-8">
                <SiemensSecondaryCta href="#how-it-works">{t("marketing.explorePlatform")}</SiemensSecondaryCta>
              </div>
            </FadeUp>
          </div>
          <FadeUp delay={0.08} className="min-h-[240px] min-w-0 lg:min-h-0">
            <MediaPanel
              src={MARKETING_IMAGES.engineering}
              diagonal
              className="h-full"
              minH="min-h-[240px] lg:min-h-full"
            />
          </FadeUp>
        </div>
        <SectionContainer className="py-10 lg:py-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map(({ key, icon, image }, i) => (
              <SiemensFeatureCard
                key={key}
                index={String(i + 1).padStart(2, "0")}
                icon={icon}
                image={image}
                caption={t(`marketing.${key}Caption`)}
                title={t(`marketing.${key}Title`)}
                body={t(`marketing.${key}Body`)}
                delay={i * 0.04}
              />
            ))}
          </div>
        </SectionContainer>
      </Section>

      {/* ── PIPELINE ── */}
      <Section id="how-it-works" viewport className="bg-[hsl(var(--siemens-surface))]">
        <SectionContainer>
          <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
            <FadeUp>
              <MetaLabel className="text-brand">{t("marketing.howLabel")}</MetaLabel>
              <h2 className="siemens-display mt-3">
                <span className="block">{t("marketing.howTitle1")}</span>
                <span className="block">{t("marketing.howTitle2")}</span>
              </h2>
              <p className="siemens-body mt-4 max-w-lg">{t("marketing.howBody")}</p>
              <ol className="mt-8 space-y-3">
                {PIPELINE_STEPS.map((step, i) => (
                  <li key={step.key} className="flex items-center gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-4 rounded-md border border-border bg-white px-4 py-3.5">
                      <span className="font-sans text-sm font-bold tabular-nums text-brand">{step.n}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {t(`marketing.${step.key}`)}
                      </span>
                    </div>
                    {i < PIPELINE_STEPS.length - 1 ? (
                      <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground/40 sm:block" />
                    ) : null}
                  </li>
                ))}
              </ol>
            </FadeUp>
            <FadeUp delay={0.1}>
              <PipelineActionCard />
            </FadeUp>
          </div>
        </SectionContainer>
      </Section>

      {/* ── CONNECTED SYSTEMS ── */}
      <Section id="integrations" viewportAlign="start" className="border-b border-border bg-white !py-14 lg:!py-20">
        <SectionContainer>
          <ConnectedSystemsShowcase />
        </SectionContainer>
      </Section>

      {/* ── INTELLIGENCE / VALUE ── */}
      <Section id="intelligence" viewport viewportAlign="start" className="bg-[hsl(var(--siemens-surface))]">
        <SectionContainer>
          <div className="mx-auto grid w-full max-w-[90rem] items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-10">
            <FadeUp delay={0.06} className="order-2 lg:order-1">
              <div className="relative min-h-[min(42vh,22rem)] overflow-hidden rounded-lg">
                <MediaPanel src={MARKETING_IMAGES.hydro} overlay="teal" minH="min-h-full" />
              </div>
            </FadeUp>
            <FadeUp className="order-1 lg:order-2">
              <MetaLabel className="text-brand">{t("marketing.valueLabel")}</MetaLabel>
              <h2 className="siemens-display mt-3">
                <span className="block">{t("marketing.valueTitle1")}</span>
                <span className="block">{t("marketing.valueTitle2")}</span>
              </h2>
              <p className="siemens-body mt-4 max-w-lg">{t("marketing.valueCaption")}</p>
            </FadeUp>
          </div>
          <div className="section-content-gap grid gap-4 lg:grid-cols-2">
            {VALUE_ITEMS.map(({ key, image }, i) => (
              <ValueMediaCard
                key={key}
                index={String(i + 1).padStart(2, "0")}
                title={t(`marketing.${key}`)}
                hint={t(`marketing.${key}Hint`)}
                image={image}
                delay={i * 0.04}
              />
            ))}
          </div>
        </SectionContainer>
      </Section>

      {/* ── QAI IN ACTION ── */}
      <Section id="qai" viewport className="bg-white !py-0">
        <div className="mx-auto grid h-full min-h-[inherit] w-full max-w-[90rem] lg:grid-cols-2">
          <div className="flex min-w-0 flex-col justify-center px-4 py-10 sm:px-6 lg:px-10 lg:py-12">
            <FadeUp>
              <MetaLabel className="text-brand">{t("marketing.qlimAiLabel")}</MetaLabel>
              <h2 className="siemens-display mt-3">
                <span className="block">{t("marketing.qlimAiHeadline")}</span>
                <span className="block text-brand-dark">{t("marketing.qlimAiHeadlineAccent")}</span>
              </h2>
              <p className="siemens-body mt-5 max-w-lg">{t("marketing.qlimAiBody")}</p>
              <ul className="mt-6 space-y-3">
                {(["qlimAiBullet1", "qlimAiBullet2", "qlimAiBullet3"] as const).map((k) => (
                  <li key={k} className="flex gap-3 text-sm text-foreground/80">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {t(`marketing.${k}`)}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setQlimAiOpen(true)}
                className="siemens-btn-primary mt-8 w-fit"
              >
                {t("marketing.openQlimAi")}
              </button>
            </FadeUp>
          </div>
          <FadeUp delay={0.1} className="relative min-h-[min(48vh,26rem)] lg:min-h-0">
            <div className="absolute inset-0">
              <MediaPanel src={MARKETING_IMAGES.control} overlay="dark" minH="min-h-full h-full">
                <div className="w-full max-w-md overflow-hidden rounded-lg border border-white/30 bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)]">
                  <QlimAiChat messages={qlimAiDemo.slice(0, 2)} className="border-0 shadow-none" />
                </div>
              </MediaPanel>
            </div>
          </FadeUp>
        </div>
      </Section>

      {/* ── PRICING ── */}
      <Section id="pricing" viewport viewportAlign="start" className="bg-[hsl(var(--siemens-surface))] [overflow-anchor:none]">
        <SectionContainer>
          <FadeUp>
            <MetaLabel className="text-brand">{t("marketing.pricingLabel")}</MetaLabel>
            <h2 className="siemens-display mt-3 max-w-2xl">
              <span className="block">{t("marketing.noSurprises")}</span>
              <span className="block">{t("marketing.justProgress")}</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.06}>
            <PricingBanner className="section-content-gap" caption={t("marketing.pricingBanner")} />
          </FadeUp>
          <div className="mt-2">
            <PricingSelector plans={pricingPlans} />
          </div>
        </SectionContainer>
      </Section>

      {/* ── TEAM ── */}
      <TeamSection />

      {/* ── FINAL CTA + CONTACT ── */}
      <section
        id="contact"
        className="viewport-section-fill overflow-hidden border-t border-border bg-white !py-0"
      >
        <div className="mx-auto grid h-full min-h-[inherit] w-full max-w-[90rem] lg:grid-cols-2">
          <FadeUp className="relative min-h-[min(48vh,22rem)] min-w-0 lg:min-h-0">
            <MediaPanel src={MARKETING_IMAGES.turbines} overlay="dark" minH="absolute inset-0 min-h-full">
              <div className="max-w-md text-white">
                <p className="siemens-eyebrow text-white/70">{t("marketing.finalCtaLabel")}</p>
                <h2 className="siemens-display mt-3 text-white">
                  {t("marketing.finalCtaHeadline")}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-white/80">
                  {t("marketing.finalCtaBody")}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {brand.cta.options.map((opt, oi) => (
                    <li key={`cta-${oi}`} className="flex items-start gap-2.5 text-sm text-white/85">
                      <span className="mt-px shrink-0 text-brand">→</span>
                      <span>{opt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </MediaPanel>
          </FadeUp>

          <div className="flex min-w-0 flex-col justify-center px-4 py-10 sm:px-6 lg:px-10 lg:py-12">
            <FadeUp delay={0.08}>
              <div
                id="demo-form"
                className="rounded-sm border border-border bg-[hsl(var(--siemens-surface))] p-6 sm:p-8"
              >
                <MetaLabel className="text-brand">{t("marketing.requestDemoLabel")}</MetaLabel>
                <p className="mt-2 font-sans text-xl font-semibold tracking-tight text-foreground">
                  {t("marketing.bookDemo")}
                </p>
                <form onSubmit={handleDemoSubmit} className="mt-6 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName" className="siemens-eyebrow text-muted-foreground">
                        {t("marketing.firstName")}
                      </Label>
                      <Input id="firstName" name="firstName" required className="mt-2 rounded-md bg-white" />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="siemens-eyebrow text-muted-foreground">
                        {t("marketing.lastName")}
                      </Label>
                      <Input id="lastName" name="lastName" required className="mt-2 rounded-md bg-white" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="siemens-eyebrow text-muted-foreground">
                      {t("marketing.email")}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="mt-2 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company" className="siemens-eyebrow text-muted-foreground">
                      {t("marketing.company")}
                    </Label>
                    <Input id="company" name="company" required className="mt-2 rounded-md bg-white" />
                  </div>
                  <div>
                    <Label htmlFor="message" className="siemens-eyebrow text-muted-foreground">
                      {t("marketing.message")}
                    </Label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      className="mt-2 flex w-full resize-none rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={demoSubmitting}
                    className="siemens-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {demoSubmitting ? t("marketing.sending") : t("marketing.bookDemo")}
                  </button>
                  <p className="text-center text-xs text-muted-foreground">{t("marketing.noSpam")}</p>
                </form>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      <QlimAiOverlay open={qlimAiOpen} onClose={() => setQlimAiOpen(false)} chatExpanded />
    </MarketingLayout>
  );
}

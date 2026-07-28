"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import {
  Section,
  SectionContainer,
  SectionIntro,
  FadeUp,
  EditorialCta,
  MetaLabel,
} from "@/components/marketing/editorial";
import { Badge } from "@/components/ui/badge";
import {
  comparisonTable, aiArchitectureSteps, safetyCards, changelog,
} from "@/data/marketing-data";

const differentiators = [
  { title: "Adaptive AI", description: "Models that learn your data patterns and improve factor matching over time." },
  { title: "Full Data Lineage", description: "Every tCO₂e traced to its source document with one click." },
  { title: "Continuous Compliance", description: "Real-time monitoring of CSRD, CBAM, and EU Taxonomy changes." },
  { title: "Investor-Grade Scenario Modeling", description: "Monte Carlo simulations with financial risk quantification." },
];

export default function WhatsNewPage() {
  return (
    <MarketingLayout>
      <Section dark className="border-white/10 py-20 lg:py-24">
        <SectionContainer narrow className="text-center">
          <FadeUp>
            <MetaLabel className="text-brand">DIFFERENTIATION // 2026</MetaLabel>
            <h1 className="section-headline-gap font-serif text-4xl font-bold text-white sm:text-5xl">
              Why Qlimwelt AI is <span className="italic font-normal">Different</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed text-white/60">
              Not another ESG checkbox tool. A genuine AI-native platform built for the complexity of European carbon regulation.
            </p>
          </FadeUp>
        </SectionContainer>
      </Section>

      <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="section-container flex gap-8 overflow-x-auto py-4">
          {[
            ["#why-different", "Why Different"],
            ["#architecture", "AI Architecture"],
            ["#safety", "Safety & Privacy"],
            ["#changelog", "What's New"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      <Section id="why-different">
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              label="COMPARISON // LEGACY VS AI"
              lines={[
                { text: "Not a Checkbox", italic: true },
                { text: "Tool." },
              ]}
            />
          </FadeUp>
          <div className="section-content-gap overflow-hidden border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-4 text-left font-mono text-[10px] uppercase tracking-wider">Feature</th>
                  <th className="p-4 text-left font-mono text-[10px] uppercase tracking-wider">Legacy Tools</th>
                  <th className="p-4 text-left font-mono text-[10px] uppercase tracking-wider text-brand-dark">Qlimwelt AI</th>
                </tr>
              </thead>
              <tbody>
                {comparisonTable.map((row) => (
                  <tr key={row.feature} className="border-b last:border-b-0">
                    <td className="p-4 align-top font-medium">{row.feature}</td>
                    <td className="p-4 align-top text-muted-foreground">
                      <span className="flex items-start gap-2">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <span>{row.legacy}</span>
                      </span>
                    </td>
                    <td className="p-4 align-top">
                      <span className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" />
                        <span>{row.qlimwelt}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="section-content-gap grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {differentiators.map((d, i) => (
              <FadeUp key={d.title} delay={i * 0.06}>
                <div className="h-full bg-background p-6 sm:p-8">
                  <h3 className="font-serif text-lg font-bold">{d.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </SectionContainer>
      </Section>

      <Section id="architecture" dark className="border-white/10">
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              dark
              label="ARCHITECTURE // 5 LAYERS"
              lines={[
                { text: "AI Architecture.", italic: true },
                { text: "End to End." },
              ]}
            />
            <p className="section-headline-gap text-sm text-white/50">
              Five layers from raw data to audit-ready CSRD report
            </p>
          </FadeUp>
          <div className="section-content-gap space-y-px bg-white/10">
            {aiArchitectureSteps.map((step, i) => (
              <FadeUp key={step.step} delay={i * 0.06}>
                <div className="grid gap-6 bg-[#0a0a0a] p-6 sm:grid-cols-[4rem_minmax(0,1fr)] sm:items-start sm:gap-10 sm:p-8">
                  <p className="font-serif text-4xl font-bold tabular-nums text-white/20">{step.step}</p>
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl font-bold text-white">{step.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/60">{step.description}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </SectionContainer>
      </Section>

      <Section id="safety">
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              label="TRUST // SECURITY"
              lines={[
                { text: "Safety &", italic: true },
                { text: "Privacy." },
              ]}
            />
          </FadeUp>
          <div className="section-content-gap grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {safetyCards.map((card, i) => (
              <FadeUp key={card.title} delay={i * 0.06}>
                <div className="h-full bg-background p-6 sm:p-8">
                  <h3 className="font-serif text-lg font-bold">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {["99.9% uptime", "EU Only", "AES-256", "Full AI Transparency"].map((item) => (
              <Badge key={item} variant="secondary" className="rounded-none px-4 py-2 font-mono text-[10px] uppercase tracking-wider">
                {item}
              </Badge>
            ))}
          </div>
        </SectionContainer>
      </Section>

      <Section id="changelog">
        <SectionContainer tight>
          <FadeUp>
            <SectionIntro
              label="CHANGELOG // LATEST"
              lines={[
                { text: "Latest", italic: true },
                { text: "Updates." },
              ]}
            />
          </FadeUp>
          <div className="section-content-gap space-y-10">
            {changelog.map((entry, i) => (
              <FadeUp key={entry.date} delay={i * 0.06}>
                <div className="border-l border-brand-dark pl-6">
                  <MetaLabel className="text-brand-dark">{entry.date}</MetaLabel>
                  <h3 className="mt-2 font-serif text-xl font-bold">{entry.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{entry.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </SectionContainer>
      </Section>

      <Section dark noBorder className="border-white/10 py-20">
        <SectionContainer narrow>
          <FadeUp>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <EditorialCta href="/#contact">Request a Demo</EditorialCta>
              <Link href="/login" className="font-mono text-xs uppercase tracking-[0.15em] text-white/50 hover:text-white">
                Open Dashboard →
              </Link>
            </div>
          </FadeUp>
        </SectionContainer>
      </Section>
    </MarketingLayout>
  );
}

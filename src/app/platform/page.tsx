"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, LayoutGroup } from "framer-motion";
import { ArrowRight, Bot, Check, ChevronRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { ScrollingTicker, DarkChatUI } from "@/components/marketing/marketing-ui";
import {
  Section,
  SectionContainer,
  SectionIntro,
  FadeUp,
  EditorialCta,
  MetaLabel,
} from "@/components/marketing/editorial";
import { SegmentedControl } from "@/components/marketing/motion-ui";
import { springSnappy } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  platformQueries, capabilityTicker, capabilityMap, copilotExamples,
  autonomousAgents, documentStages, extractedDocuments,
} from "@/data/marketing-data";

export default function PlatformPage() {
  const [queryIndex, setQueryIndex] = useState(0);
  const [activeExample, setActiveExample] = useState(0);
  const [docStage, setDocStage] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setQueryIndex((i) => (i + 1) % platformQueries.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setDocStage((s) => (s + 1) % documentStages.length), 2000);
    return () => clearInterval(t);
  }, []);

  const agentColors: Record<string, string> = {
    blue: "bg-blue-500", purple: "bg-purple-500", orange: "bg-orange-500", green: "bg-green-500",
  };
  const statusColors: Record<string, "success" | "destructive" | "secondary"> = {
    RUNNING: "success", ALERT: "destructive", IDLE: "secondary",
  };

  return (
    <MarketingLayout>
      <Section dark className="border-white/10 py-14 lg:py-16">
        <SectionContainer narrow className="text-center">
          <FadeUp>
            <MetaLabel className="text-brand">PLATFORM INTELLIGENCE // AI-NATIVE</MetaLabel>
            <h1 className="section-headline-gap font-serif text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              The AI Operating System
              <span className="mt-1 block font-normal italic text-brand">for Sustainability.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed text-white/60">
              Qlimwelt AI is not a dashboard. It is an autonomous climate intelligence layer that thinks,
              reports, forecasts, and acts — so your sustainability team can focus on what matters.
            </p>
            <div className="mx-auto mt-10 flex max-w-xl items-center gap-3 border border-white/15 bg-white/[0.04] p-4">
              <Bot className="h-5 w-5 shrink-0 text-brand" />
              <motion.p key={queryIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 flex-1 text-left text-sm text-white/80">
                {platformQueries[queryIndex]}
              </motion.p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/20 text-white">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a href="#capabilities">
                <span className="inline-flex items-center gap-2 border border-white px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] text-white transition-colors hover:bg-white hover:text-black">
                  Explore Features <ChevronRight className="h-4 w-4" />
                </span>
              </a>
              <Link href="/login" className="font-mono text-xs uppercase tracking-[0.15em] text-white/50 transition-colors hover:text-white">
                Open Dashboard →
              </Link>
            </div>
          </FadeUp>
        </SectionContainer>
      </Section>

      <ScrollingTicker items={capabilityTicker} />

      <Section id="capabilities">
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              label="CAPABILITIES // FULL MAP"
              lines={[
                { text: "Full Capability", italic: true },
                { text: "Map." },
              ]}
            />
          </FadeUp>
          <div className="section-content-gap grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {capabilityMap.map((cap, i) => (
              <FadeUp key={cap.title} delay={i * 0.04}>
                <div className="h-full bg-background p-6 sm:p-8">
                  <h3 className="font-serif text-lg font-bold">{cap.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{cap.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </SectionContainer>
      </Section>

      <Section dark className="border-white/10">
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              dark
              label="AI COPILOT // EXAMPLES"
              lines={[
                { text: "Real Conversations.", italic: true },
                { text: "Real Answers." },
              ]}
            />
          </FadeUp>
          <div className="section-content-gap">
            <SegmentedControl
              dark
              items={copilotExamples.map((_, i) => `Example ${String(i + 1).padStart(2, "0")}`)}
              active={activeExample}
              onChange={setActiveExample}
            />
          </div>
          <div className="mt-8 max-w-3xl">
            <motion.div
              key={activeExample}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <DarkChatUI
                messages={[
                  { role: "user", content: copilotExamples[activeExample].question },
                  { role: "assistant", content: copilotExamples[activeExample].answer },
                ]}
              />
            </motion.div>
          </div>
        </SectionContainer>
      </Section>

      <Section>
        <SectionContainer>
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
            <FadeUp>
              <SectionIntro
                label="AUTONOMOUS AGENTS"
                lines={[
                  { text: "Four Agents", italic: true },
                  { text: "Working 24/7." },
                ]}
              />
              <p className="section-content-gap text-sm leading-relaxed text-muted-foreground">
                Qlimwelt deploys four specialist AI agents that run continuously against your data.
                They file drafts, surface anomalies, monitor regulations, and model reduction scenarios — autonomously.
              </p>
              <div className="mt-8 space-y-0 divide-y divide-border">
                {[
                  { label: "Reports drafted autonomously", value: "340+" },
                  { label: "Anomalies surfaced before audit", value: "99%" },
                  { label: "Average response time", value: "< 3s" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-4 text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-serif text-lg font-bold tabular-nums">{row.value}</span>
                  </div>
                ))}
              </div>
            </FadeUp>
            <div className="space-y-4">
              {autonomousAgents.map((agent, i) => (
                <FadeUp key={agent.name} delay={i * 0.08}>
                  <div className="border border-border p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${agentColors[agent.color]}`} />
                        <div className="min-w-0">
                          <p className="font-serif font-bold">{agent.name}</p>
                          <MetaLabel className="mt-1">{agent.role}</MetaLabel>
                        </div>
                      </div>
                      <Badge variant={statusColors[agent.status]}>{agent.status}</Badge>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{agent.message}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <Progress value={agent.progress} className="h-1 flex-1" />
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{agent.time}</span>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </SectionContainer>
      </Section>

      <Section>
        <SectionContainer>
          <FadeUp>
            <SectionIntro
              label="DOCUMENT INTELLIGENCE"
              lines={[
                { text: "Zero Manual", italic: true },
                { text: "Entry." },
              ]}
            />
            <p className="section-headline-gap text-sm text-muted-foreground">
              From upload to audit trail in seconds
            </p>
          </FadeUp>
          <LayoutGroup id="doc-stages">
            <div className="section-content-gap grid gap-px bg-border sm:grid-cols-4">
              {documentStages.map((stage, i) => (
                <div key={stage} className="relative bg-background p-5 text-center sm:p-6">
                  {i === docStage && (
                    <motion.div
                      layoutId="doc-stage-active"
                      className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-brand-dark"
                      transition={springSnappy}
                    />
                  )}
                  <MetaLabel>{String(i + 1).padStart(2, "0")}</MetaLabel>
                  <p className="relative mt-2 text-sm font-medium">{stage}</p>
                </div>
              ))}
            </div>
          </LayoutGroup>
          <div className="mt-8 overflow-hidden border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="p-4 font-mono text-[10px] uppercase tracking-wider">Document</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-wider">Scope</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-wider">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {extractedDocuments.map((doc) => (
                  <tr key={doc.item} className="border-b last:border-b-0">
                    <td className="p-4">{doc.item}</td>
                    <td className="p-4"><Badge variant="secondary">{doc.scope}</Badge></td>
                    <td className="p-4"><Badge variant="success">{doc.confidence}%</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionContainer>
      </Section>

      <Section dark noBorder className="border-white/10 py-14">
        <SectionContainer narrow className="text-center">
          <FadeUp>
            <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
              Ready to see Qlimwelt AI in action?
            </h2>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <EditorialCta href="/#contact">Request a Demo</EditorialCta>
              <Link href="/dashboard" className="font-mono text-xs uppercase tracking-[0.15em] text-white/50 hover:text-white">
                Open Dashboard →
              </Link>
            </div>
          </FadeUp>
        </SectionContainer>
      </Section>
    </MarketingLayout>
  );
}

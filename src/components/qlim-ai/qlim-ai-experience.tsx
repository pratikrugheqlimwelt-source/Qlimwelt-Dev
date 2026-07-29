"use client";

import {
  Brain,
  X,
  Shield,
  MapPin,
  LineChart,
  MessageSquareText,
  Radar,
  FileCheck,
  FileSearch,
  GitBranch,
  Network,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { QlimAiChat } from "@/components/qlim-ai/qlim-ai-chat";
import { QlimAiPipelineViz } from "@/components/qlim-ai/qlim-ai-pipeline-viz";
import {
  qlimAiResearchNotice,
  qlimAiCapabilities,
  qlimAiDemo,
} from "@/data/qlim-ai-data";
import { cn } from "@/lib/utils";

const CAPABILITY_ICONS: Record<(typeof qlimAiCapabilities)[number]["id"], LucideIcon> = {
  nlq: MessageSquareText,
  anomaly: Radar,
  csrd: FileCheck,
  docs: FileSearch,
  scenario: GitBranch,
  supplier: Network,
};

type QlimAiExperienceProps = {
  variant?: "embedded" | "overlay";
  showChat?: boolean;
  chatExpanded?: boolean;
  onClose?: () => void;
  className?: string;
};

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export function QlimAiExperience({
  variant = "embedded",
  showChat = true,
  chatExpanded = false,
  onClose,
  className,
}: QlimAiExperienceProps) {
  const isOverlay = variant === "overlay";

  return (
    <div
      className={cn(
        "relative text-foreground",
        isOverlay ? "max-h-[85vh] overflow-y-auto pr-1" : "",
        className
      )}
    >
      {isOverlay && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-0 top-0 z-20 flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border transition-all hover:bg-muted/80 hover:text-foreground"
          aria-label="Close Qlim AI"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand-light via-background to-background px-5 py-6 sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(92,184,50,0.06),transparent_50%)]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light ring-1 ring-brand/25">
                <Brain className="h-5 w-5 text-brand-dark" strokeWidth={1.75} />
              </div>
              <span className="rounded-full bg-brand-light px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-dark ring-1 ring-brand/20">
                Climate Intelligence
              </span>
            </div>
            <h2 id="qlim-ai-title" className="mt-5 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Qlim AI
            </h2>
            <p className="mt-3 text-base font-medium text-foreground/85">{qlimAiResearchNotice.title}</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {qlimAiResearchNotice.body}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3 lg:max-w-xs lg:flex-col lg:items-stretch">
            {[
              { icon: Shield, label: "Audit-ready lineage", value: "100%" },
              { icon: MapPin, label: "EU data residency", value: "Frankfurt" },
              { icon: LineChart, label: "Avg. response time", value: "< 3s" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex min-w-[140px] flex-1 items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
              >
                <stat.icon className="h-4 w-4 shrink-0 text-brand-dark" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-muted-foreground">{stat.label}</p>
                  <p className="text-sm font-semibold tabular-nums text-foreground">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline + Capabilities */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5 lg:gap-5">
        <div className="lg:col-span-3">
          <SectionLabel className="mb-3 block px-1">How it works</SectionLabel>
          <QlimAiPipelineViz compact={!isOverlay} />
        </div>

        <div className="lg:col-span-2">
          <SectionLabel className="mb-3 block px-1">Capabilities</SectionLabel>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {qlimAiCapabilities.map((cap, i) => {
              const Icon = CAPABILITY_ICONS[cap.id];
              return (
                <motion.div
                  key={cap.id}
                  initial={{ y: 4 }}
                  animate={{ y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.35 }}
                  className="group flex gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark ring-1 ring-brand/15 transition-colors group-hover:bg-brand/10">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-tight text-foreground">{cap.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{cap.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat */}
      {showChat && (
        <div className="mt-5">
          <SectionLabel className="mb-3 block px-1">Conversation preview (not live AI)</SectionLabel>
          <QlimAiChat
            messages={
              chatExpanded
                ? [
                    {
                      role: "assistant",
                      content:
                        "Hi — I'm Qlim AI, tuned for corporate carbon footprinting. Ask about your Scope 1 / 2 / 3 mix, hotspots, calculation method, or CSRD next steps. I use your live company inventory when you're signed in.",
                    },
                  ]
                : qlimAiDemo.slice(0, 2)
            }
            animateLast={false}
            interactive={chatExpanded}
          />
        </div>
      )}
    </div>
  );
}

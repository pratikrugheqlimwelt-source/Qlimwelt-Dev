"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Bot, AlertTriangle, CheckCircle2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function HeroDashboardCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: 1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="animate-float relative"
    >
      <div className="absolute -inset-4 rounded-3xl bg-brand/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-6 shadow-soft backdrop-blur-xl">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-brand/10 blur-2xl" />
        <div className="relative mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Overview</p>
            <p className="mt-1 font-display text-lg font-semibold">Emissions Dashboard</p>
          </div>
          <Badge className="gap-1 border-brand/20 bg-brand/10 text-brand-dark hover:bg-brand/10">
            <CheckCircle2 className="h-3 w-3" />
            CSRD-Ready
          </Badge>
        </div>
        <div className="relative space-y-4">
          {[
            { label: "Scope 1", value: 23, color: "bg-slate-800" },
            { label: "Scope 2", value: 33, color: "bg-brand" },
            { label: "Scope 3", value: 44, color: "bg-brand-dark" },
          ].map((scope, i) => (
            <div key={scope.label}>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">{scope.label}</span>
                <span className="font-semibold">{scope.value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={`h-full rounded-full ${scope.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${scope.value}%` }}
                  transition={{ delay: 0.6 + i * 0.15, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="relative mt-5 flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/80 p-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-900">AI Anomaly Detected</p>
            <p className="mt-0.5 text-xs text-amber-700/80">ChemBase AG +18% Scope 3 increase</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TypewriterText({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = React.useState("");
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="animate-shimmer text-brand">|</span>}
    </span>
  );
}

export function ScrollingTicker({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-border bg-muted/30 py-4">
      <div className="flex animate-marquee gap-10 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-3 type-label">
            <span className="h-1 w-1 bg-brand-dark" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DarkChatUI({
  messages,
  animateLast = false,
  className,
}: {
  messages: { role: "user" | "assistant"; content: string }[];
  animateLast?: boolean;
  className?: string;
}) {
  const lastAssistantIdx = messages.map((m, i) => (m.role === "assistant" ? i : -1)).filter((i) => i >= 0).pop();

  return (
    <div className={cn("flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background", className)}>
      <div className="mb-0 flex items-center gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light ring-1 ring-brand/20">
          <Bot className="h-[18px] w-[18px] text-brand-dark" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-foreground">Qlim AI</p>
          <p className="text-xs text-muted-foreground">Climate Intelligence</p>
        </div>
      </div>
      <div className="max-h-80 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div key={i} className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  isUser ? "bg-muted text-muted-foreground" : "bg-brand-light text-brand-dark"
                )}
              >
                {isUser ? <User className="h-3.5 w-3.5" strokeWidth={1.75} /> : <Bot className="h-3.5 w-3.5" strokeWidth={1.75} />}
              </div>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed",
                  isUser
                    ? "rounded-tr-md bg-muted text-foreground"
                    : "rounded-tl-md border border-brand/20 bg-brand-light text-foreground"
                )}
              >
                {animateLast && i === lastAssistantIdx ? (
                  <TypewriterText text={msg.content} speed={12} />
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

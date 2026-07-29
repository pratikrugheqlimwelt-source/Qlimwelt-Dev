"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { qlimAiPipeline } from "@/data/qlim-ai-data";
import { Activity } from "lucide-react";

export function QlimAiPipelineViz({ compact = false }: { compact?: boolean }) {
  const reduceMotion = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const t = setInterval(() => setActiveIdx((i) => (i + 1) % qlimAiPipeline.length), 4000);
    return () => clearInterval(t);
  }, [reduceMotion]);

  const active = qlimAiPipeline[activeIdx];
  const progress = ((activeIdx + 1) / qlimAiPipeline.length) * 100;

  return (
    <div className={cn("rounded-2xl border border-border bg-background", compact ? "p-4 sm:p-5" : "p-5 sm:p-6")}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-dark">
            Intelligence pipeline
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            How every data point flows from source to decision
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-brand-light px-3 py-1.5 ring-1 ring-brand/20">
          <Activity className="h-3.5 w-3.5 text-brand-dark" strokeWidth={1.75} />
          <span className="text-[11px] font-medium text-brand-dark">Live</span>
        </div>
      </div>

      {/* Progress track */}
      <div className="relative mb-6">
        <div className="absolute left-0 right-0 top-5 h-px bg-border" />
        <motion.div
          className="absolute left-0 top-5 h-px origin-left bg-gradient-to-r from-brand/40 to-brand-dark"
          animate={{ width: `${Math.max(0, progress - 8)}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="relative flex justify-between gap-1">
          {qlimAiPipeline.map((stage, i) => {
            const isActive = i === activeIdx;
            const isComplete = i < activeIdx;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveIdx(i)}
                className="group flex flex-1 flex-col items-center gap-2.5 text-center"
              >
                <motion.div
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-all duration-300",
                    isActive
                      ? "bg-brand-dark text-white shadow-[0_0_0_4px_rgba(92,184,50,0.12)]"
                      : isComplete
                        ? "bg-brand-light text-brand-dark ring-1 ring-brand/30"
                        : "bg-muted text-muted-foreground ring-1 ring-border group-hover:bg-muted/80 group-hover:text-foreground"
                  )}
                  animate={isActive && !reduceMotion ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                  transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                >
                  {stage.phase}
                </motion.div>
                <span
                  className={cn(
                    "hidden max-w-[4.5rem] text-[10px] font-medium leading-tight sm:block",
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {stage.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <motion.div
        key={active.id}
        initial={{ y: 6 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-xl border border-border bg-muted/30 p-4 sm:p-5"
      >
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-dark to-brand/30" />
        <div className="pl-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-brand-dark">{active.subtitle}</p>
              <h4 className="mt-1 font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {active.title}
              </h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {active.metrics.map((m) => (
                <span
                  key={m}
                  className="rounded-md bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground ring-1 ring-border"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{active.description}</p>
        </div>
      </motion.div>
    </div>
  );
}

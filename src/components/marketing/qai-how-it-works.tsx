"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useT } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";

const STEPS = [
  { key: "howStepSystems", n: "01" },
  { key: "howStepCollect", n: "02" },
  { key: "howStepNormalize", n: "03" },
  { key: "howStepGraph", n: "04" },
  { key: "howStepReason", n: "05" },
  { key: "howStepInsights", n: "06" },
  { key: "howStepDecisions", n: "07" },
] as const;

/** Animated How QAI Works pipeline cards. */
export function QaiHowItWorksPipeline({ className }: { className?: string }) {
  const t = useT();
  const reduced = useReducedMotion();

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7", className)}>
      {STEPS.map((step, i) => (
        <motion.div
          key={step.key}
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, delay: i * 0.06, ease: EASE_OUT }}
          className="relative flex flex-col rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-[#82D153]/40"
        >
          <span className="font-mono text-[10px] font-semibold tracking-wider text-[#82D153]">
            {step.n}
          </span>
          <p className="mt-2 font-serif text-base font-bold tracking-tight text-slate-900">
            {t(`marketing.${step.key}`)}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            {t(`marketing.${step.key}Desc`)}
          </p>
          {i < STEPS.length - 1 && (
            <ArrowDown
              className="absolute -bottom-3 left-1/2 hidden h-3.5 w-3.5 -translate-x-1/2 text-slate-300 sm:block xl:left-auto xl:right-[-10px] xl:top-1/2 xl:translate-x-0 xl:-translate-y-1/2 xl:rotate-[-90deg]"
              aria-hidden
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

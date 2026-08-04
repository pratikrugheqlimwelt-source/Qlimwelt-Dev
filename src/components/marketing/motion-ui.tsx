"use client";

import { useState } from "react";
import {
  motion,
  LayoutGroup,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { Check } from "lucide-react";
import { MetaLabel, ThinRule, EditorialCta } from "@/components/marketing/editorial";
import { MetricFigure } from "@/components/ui/metric-figure";
import { cn } from "@/lib/utils";
import { EASE_OUT, springSnappy } from "@/lib/motion";

export { EASE_OUT, springSnappy };

export function ScrollProgress() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  if (reduced) return null;

  return (
    <motion.div
      className="absolute bottom-0 left-0 h-px w-full origin-left bg-brand-dark"
      style={{ scaleX }}
    />
  );
}

export function NavAnchor({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "group relative type-nav",
        className
      )}
    >
      {children}
      <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-brand-dark transition-transform duration-300 ease-out group-hover:scale-x-100" />
    </a>
  );
}

export function AnimatedRule({
  className,
  dark,
}: {
  className?: string;
  dark?: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.hr
      initial={reduced ? false : { scaleX: 0 }}
      animate={reduced ? undefined : { scaleX: 1 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
      className={cn(
        "origin-left border-0 border-t",
        dark ? "border-white/10" : "border-border",
        className
      )}
    />
  );
}

type PricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
};

export function PricingSelector({ plans }: { plans: PricingPlan[] }) {
  const defaultIndex = Math.max(
    0,
    plans.findIndex((p) => p.highlighted)
  );
  const [selected, setSelected] = useState(defaultIndex);
  const reduced = useReducedMotion();

  return (
    <LayoutGroup id="pricing">
      <div className="grid gap-px bg-border lg:grid-cols-3">
        {plans.map((plan, i) => {
          const isSelected = selected === i;
          return (
            <motion.button
              key={`plan-${i}`}
              type="button"
              onClick={() => setSelected(i)}
              className="relative flex h-full flex-col bg-background p-8 text-left outline-none transition-colors sm:p-10 focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
              whileHover={reduced ? undefined : { backgroundColor: "hsl(0 0% 96% / 0.6)" }}
              whileTap={reduced ? undefined : { scale: 0.995 }}
              transition={{ duration: 0.2 }}
            >
              {isSelected && (
                <motion.div
                  layoutId="pricing-active-border"
                  className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-brand-dark"
                  transition={springSnappy}
                />
              )}
              <motion.div
                animate={reduced ? undefined : { opacity: isSelected ? 1 : 0.72 }}
                transition={{ duration: 0.25 }}
                className="relative flex h-full flex-col"
              >
                {plan.badge && (
                  <MetaLabel className="mb-4 text-brand-dark">{plan.badge.toUpperCase()}</MetaLabel>
                )}
                <MetaLabel>{plan.name}</MetaLabel>
                <p className="mt-4">
                  <MetricFigure size="hero">{plan.price}</MetricFigure>
                  {plan.period ? (
                    <span className="ml-1 align-baseline font-sans text-lg font-medium text-muted-foreground">
                      {plan.period}
                    </span>
                  ) : null}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
                <ThinRule className="my-8" />
                <ul className="flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <EditorialCta href="#contact" fullWidth>
                    {plan.cta}
                  </EditorialCta>
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

type Step = {
  step: string;
  title: string;
  description: string;
};

export function InteractiveSteps({ steps }: { steps: Step[] }) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  return (
    <LayoutGroup id="steps">
      <div>
        {steps.map((step, i) => {
          const isActive = active === i;
          return (
            <motion.button
              key={step.step}
              type="button"
              onClick={() => setActive(i)}
              className="group relative w-full border-b border-border py-7 text-left last:border-b-0 sm:py-8"
              whileTap={reduced ? undefined : { scale: 0.998 }}
            >
              {isActive && (
                <motion.div
                  layoutId="step-active-bar"
                  className="absolute left-0 top-0 h-full w-px bg-brand-dark"
                  transition={springSnappy}
                />
              )}
              <div className="grid gap-6 pl-5 sm:grid-cols-[4rem_minmax(0,1fr)_2rem] sm:items-start sm:gap-10 sm:pl-6">
                <div>
                  <MetaLabel>{`STEP_${step.step}`}</MetaLabel>
                  <motion.p
                    animate={reduced ? undefined : { opacity: isActive ? 1 : 0.35 }}
                    transition={{ duration: 0.25 }}
                    className="mt-2 font-serif text-4xl font-bold sm:text-5xl"
                  >
                    {step.step}
                  </motion.p>
                </div>
                <div className="min-w-0 max-w-xl">
                  <motion.p
                    animate={reduced ? undefined : { opacity: isActive ? 1 : 0.55 }}
                    transition={{ duration: 0.25 }}
                    className="type-title text-lg sm:text-xl"
                  >
                    {step.title}
                  </motion.p>
                  <motion.p
                    animate={reduced ? undefined : { opacity: isActive ? 1 : 0.45 }}
                    transition={{ duration: 0.25 }}
                    className="mt-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    {step.description}
                  </motion.p>
                </div>
                <div className="hidden items-start justify-end pt-1 sm:flex">
                  <motion.div
                    animate={
                      reduced
                        ? undefined
                        : {
                            scale: isActive ? 1 : 0.85,
                            borderColor: isActive ? "hsl(var(--brand-dark))" : "hsl(var(--border))",
                            backgroundColor: isActive ? "hsl(var(--brand) / 0.2)" : "transparent",
                          }
                    }
                    transition={{ duration: 0.25 }}
                    className="h-4 w-4 shrink-0 rounded-full border"
                  />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

export function SegmentedControl({
  items,
  active,
  onChange,
  dark,
}: {
  items: string[];
  active: number;
  onChange: (index: number) => void;
  dark?: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <LayoutGroup id="segmented">
      <div className="relative flex flex-wrap gap-2">
        {items.map((item, i) => {
          const isActive = active === i;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onChange(i)}
              className={cn(
                "relative border px-4 py-2 type-label transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-dark",
                dark
                  ? isActive
                    ? "border-brand text-white"
                    : "border-white/20 text-white/60 hover:border-white/40 hover:text-white"
                  : isActive
                  ? "border-brand-dark text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={dark ? "segment-dark" : "segment-light"}
                  className={cn(
                    "absolute inset-0 -z-10",
                    dark ? "bg-brand/15" : "bg-brand/10"
                  )}
                  transition={springSnappy}
                />
              )}
              <motion.span animate={reduced ? undefined : { opacity: isActive ? 1 : 0.7 }}>
                {item}
              </motion.span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

export function HoverLift({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      whileHover={reduced ? undefined : { y: -3 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

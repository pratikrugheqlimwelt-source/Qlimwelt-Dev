"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";
import { MetricFigure } from "@/components/ui/metric-figure";
import { useT } from "@/components/i18n/locale-provider";

/* ── Layout primitives ── */

export function Section({
  id,
  className,
  children,
  dark,
  noBorder,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  dark?: boolean;
  noBorder?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "section-shell",
        noBorder && "border-b-0",
        dark && "grid-dark border-white/10",
        className
      )}
    >
      {children}
    </section>
  );
}

export function SectionContainer({
  className,
  children,
  narrow,
  tight,
}: {
  className?: string;
  children: React.ReactNode;
  narrow?: boolean;
  tight?: boolean;
}) {
  return (
    <div
      className={cn(
        narrow ? "section-container-narrow" : tight ? "section-container-tight" : "section-container",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionNumberWrap({
  n,
  className,
  align = "right",
}: {
  n: string;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "left" ? "section-number-left" : "section-number"}>
      <SectionNumber n={n} className={className} />
    </div>
  );
}

/* ── Typography & UI ── */

export function SectionNumber({ n, className }: { n: string; className?: string }) {
  return (
    <span
      className={cn(
        "font-serif text-[8rem] font-bold leading-none text-foreground/[0.04] sm:text-[10rem] lg:text-[12rem]",
        className
      )}
      aria-hidden
    >
      {n}
    </span>
  );
}

export function MetaLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("type-label", className)}>
      {children}
    </p>
  );
}

export function StatusBar() {
  const t = useT();
  return (
    <MetaLabel className="text-brand-dark">
      {t("marketing.systemStatus", { year: new Date().getFullYear() })}
    </MetaLabel>
  );
}

export function EditorialHeadline({
  lines,
  as: Tag = "h2",
  className,
}: {
  lines: { text: string; italic?: boolean; accent?: boolean }[];
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <Tag className={cn("font-serif text-4xl leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl", className)}>
      {lines.map((line, i) => (
        <span
          key={i}
          className={cn(
            "block",
            line.italic && "font-normal italic",
            !line.italic && !line.accent && "font-bold",
            line.accent && "font-bold text-brand-dark"
          )}
        >
          {line.text}
        </span>
      ))}
    </Tag>
  );
}

export function ThinRule({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-border", className)} />;
}

export function StepRow({
  num,
  label,
  title,
  description,
  active,
}: {
  num: string;
  label: string;
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div className="group relative border-b border-border py-7 last:border-b-0 sm:py-8">
      {active && <div className="absolute left-0 top-0 h-full w-px bg-brand-dark" />}
      <div className="grid gap-6 pl-5 sm:grid-cols-[4rem_minmax(0,1fr)_2rem] sm:items-start sm:gap-10 sm:pl-6">
        <div>
          <MetaLabel>{label}</MetaLabel>
          <p className="mt-2 font-serif text-4xl font-bold sm:text-5xl">{num}</p>
        </div>
        <div className="min-w-0 max-w-xl">
          <p className="font-serif text-xl font-bold sm:text-2xl">{title}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <div className="hidden items-start justify-end pt-1 sm:flex">
          <div
            className={cn(
              "h-4 w-4 shrink-0 rounded-full border",
              active ? "border-brand-dark bg-brand/20" : "border-border"
            )}
          />
        </div>
      </div>
    </div>
  );
}

export function MetricDark({
  index,
  value,
  label,
  meta,
}: {
  index: string;
  value: string;
  label: string;
  meta: string[];
}) {
  return (
    <div className="flex h-full flex-col">
      <MetaLabel className="text-white/40">{index}</MetaLabel>
      <MetricFigure size="hero" className="mt-4 text-white" unitClassName="opacity-50">
        {value}
      </MetricFigure>
      <ThinRule className="mt-6 border-white/10" />
      <p className="mt-4 font-serif text-lg italic text-white/80">{label}</p>
      <div className="mt-auto space-y-1 pt-6">
        {meta.map((m) => (
          <MetaLabel key={m} className="text-white/30">
            {m}
          </MetaLabel>
        ))}
      </div>
    </div>
  );
}

export function StatColumn({
  value,
  label,
  description,
}: {
  value: string;
  label: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <MetricFigure size="hero">{value}</MetricFigure>
      <ThinRule className="mt-4 w-full" />
      <MetaLabel className="mt-4">{label}</MetaLabel>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export { EmissionsNetworkViz } from "@/components/marketing/carbon-footprint-viz";

export function FadeUp({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { y: 20 }}
      animate={reduced ? undefined : { y: 0 }}
      transition={{ duration: 0.55, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeUpStagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={false}
      animate={reduced ? undefined : "visible"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeUpItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      variants={
        reduced
          ? undefined
          : {
              hidden: { y: 16 },
              visible: { y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function EditorialCta({
  href,
  children,
  className,
  fullWidth,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      whileHover={reduced ? undefined : { scale: 1.015 }}
      whileTap={reduced ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className={fullWidth ? "w-full" : "inline-block"}
    >
      <Link
        href={href}
        className={cn(
          "group inline-flex items-center justify-center gap-3 border border-foreground px-8 py-4 type-cta transition-colors duration-300 hover:bg-foreground hover:text-background",
          fullWidth && "w-full",
          className
        )}
      >
        {children}
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </Link>
    </motion.div>
  );
}

export function SectionIntro({
  label,
  lines,
  as = "h2",
  className,
  dark,
}: {
  label?: string;
  lines: { text: string; italic?: boolean; accent?: boolean }[];
  as?: "h1" | "h2";
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={className}>
      {label && <MetaLabel className={dark ? "text-white/40" : undefined}>{label}</MetaLabel>}
      <EditorialHeadline as={as} lines={lines} className={cn("section-headline-gap", dark && "text-white")} />
    </div>
  );
}

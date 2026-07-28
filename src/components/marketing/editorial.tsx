"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";

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
    <p className={cn("font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export function StatusBar() {
  return (
    <MetaLabel className="text-brand-dark">
      SYSTEM STATUS: OPERATIONAL // {new Date().getFullYear()}
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
    <div className="group relative border-b border-border py-10 last:border-b-0 sm:py-12">
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
      <p className="mt-4 font-serif text-5xl font-bold tabular-nums text-white sm:text-6xl lg:text-7xl">{value}</p>
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
      <p className="font-serif text-4xl font-bold tabular-nums sm:text-5xl">{value}</p>
      <ThinRule className="mt-4 w-full" />
      <MetaLabel className="mt-4">{label}</MetaLabel>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

/** Emissions network visualization — reference-style technical graphic */
export function EmissionsNetworkViz() {
  const reduced = useReducedMotion();
  const nodes = [
    { id: "SCOPE_1", x: 18, y: 22, alert: false },
    { id: "SCOPE_2", x: 48, y: 15, alert: true, sub: "ANOMALY" },
    { id: "SCOPE_3", x: 78, y: 28, alert: false },
    { id: "SUPPLIER_A", x: 32, y: 55, alert: false },
    { id: "SUPPLIER_B", x: 62, y: 62, alert: false },
    { id: "CSRD", x: 50, y: 82, alert: false, highlight: true },
  ];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md lg:max-w-lg lg:ml-auto">
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute left-0 top-0 h-8 w-8 border-l border-t border-border" />
      <div className="absolute right-0 top-0 h-8 w-8 border-r border-t border-border" />
      <div className="absolute bottom-0 left-0 h-8 w-8 border-b border-l border-border" />
      <div className="absolute bottom-0 right-0 h-8 w-8 border-b border-r border-border" />
      <svg viewBox="0 0 100 100" className="absolute inset-8 h-[calc(100%-4rem)] w-[calc(100%-4rem)]">
        <line x1="18" y1="22" x2="48" y2="15" stroke="currentColor" strokeWidth="0.3" className="text-border" />
        <line x1="48" y1="15" x2="78" y2="28" stroke="currentColor" strokeWidth="0.3" className="text-border" />
        <line x1="18" y1="22" x2="32" y2="55" stroke="currentColor" strokeWidth="0.3" className="text-border" />
        <line x1="48" y1="15" x2="62" y2="62" stroke="currentColor" strokeWidth="0.3" className="text-border" />
        <line x1="32" y1="55" x2="50" y2="82" stroke="currentColor" strokeWidth="0.3" className="text-border" />
        <line x1="62" y1="62" x2="50" y2="82" stroke="currentColor" strokeWidth="0.3" className="text-border" />
        {nodes.map((n) => (
          <g key={n.id}>
            {n.alert && !reduced ? (
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={2.2}
                fill="#ef4444"
                stroke="#ef4444"
                strokeWidth="0.5"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : (
              <circle
                cx={n.x}
                cy={n.y}
                r={n.alert || n.highlight ? 2.2 : 1.5}
                fill={n.alert ? "#ef4444" : n.highlight ? "hsl(98 70% 45%)" : "none"}
                stroke={n.alert ? "#ef4444" : n.highlight ? "hsl(98 70% 45%)" : "currentColor"}
                strokeWidth="0.5"
                className={!n.alert && !n.highlight ? "text-foreground/30" : ""}
              />
            )}
          </g>
        ))}
      </svg>
      <div className="absolute inset-x-8 bottom-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {nodes.filter((n) => n.alert).map((n) => (
            <MetaLabel key={n.id} className="text-red-500">
              {n.id}{" // "}{n.sub}
            </MetaLabel>
          ))}
        </div>
        <MetaLabel className="shrink-0 text-muted-foreground/60">FIG. 01 — EMISSIONS MESH</MetaLabel>
      </div>
    </div>
  );
}

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
      initial={reduced ? false : { opacity: 0, y: 32 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, delay, ease: EASE_OUT }}
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
      initial={reduced ? false : "hidden"}
      whileInView={reduced ? undefined : "visible"}
      viewport={{ once: true, margin: "-60px" }}
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
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
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
          "group inline-flex items-center justify-center gap-3 border border-foreground px-8 py-4 font-mono text-xs uppercase tracking-[0.15em] transition-colors duration-300 hover:bg-foreground hover:text-background",
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

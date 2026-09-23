"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";

/** Soft brand spotlight that follows the cursor across the landing page. */
export function CursorGlow({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 120, damping: 28 });
  const sy = useSpring(y, { stiffness: 120, damping: 28 });

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, x, y]);

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden
      className={cn(
        "pointer-events-none fixed left-0 top-0 z-[1] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full",
        "bg-[radial-gradient(circle,rgba(130,209,83,0.16)_0%,rgba(130,209,83,0.05)_35%,transparent_70%)]",
        "mix-blend-multiply",
        className
      )}
      style={{ x: sx, y: sy }}
    />
  );
}

/** Atmospheric mesh behind marketing content — not a flat white page. */
export function LandingAtmosphere() {
  const reduced = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_-10%,rgba(130,209,83,0.14),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_90%_10%,rgba(47,111,36,0.07),transparent_50%)]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.03) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)",
        }}
      />
      {!reduced && (
        <>
          <motion.div
            className="absolute -left-24 top-40 h-64 w-64 rounded-full bg-[#82D153]/10 blur-3xl"
            animate={{ y: [0, 24, 0], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-0 top-[28%] h-80 w-80 rounded-full bg-[#2f6f24]/8 blur-3xl"
            animate={{ y: [0, -30, 0], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
    </div>
  );
}

/** Card with mouse-tracked spotlight and subtle lift. */
export function SpotlightCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const background = useMotionTemplate`radial-gradient(420px circle at ${mx}px ${my}px, rgba(130,209,83,0.14), transparent 55%)`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: EASE_OUT }}
      whileHover={reduced ? undefined : { y: -4 }}
      onPointerMove={(e) => {
        if (reduced || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-colors hover:border-[#82D153]/45",
        className
      )}
    >
      {!reduced && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background }}
        />
      )}
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  );
}

/** Soft magnetic pull on hover for CTAs. */
export function Magnetic({
  children,
  className,
  strength = 12,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 220, damping: 18 });
  const y = useSpring(0, { stiffness: 220, damping: 18 });

  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      style={reduced ? undefined : { x, y }}
      onPointerMove={(e) => {
        if (reduced || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        x.set((dx / r.width) * strength);
        y.set((dy / r.height) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export function ScrollHint({ label }: { label: string }) {
  const reduced = useReducedMotion();
  return (
    <a
      href="#capabilities"
      className="mt-10 inline-flex flex-col items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 transition-colors hover:text-[#2f6f24]"
    >
      <span>{label}</span>
      <motion.span
        aria-hidden
        className="block h-8 w-px origin-top bg-gradient-to-b from-[#82D153] to-transparent"
        animate={reduced ? undefined : { scaleY: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </a>
  );
}

/** Interactive value tile that expands a detail line on hover/focus. */
export function ValueTile({
  index,
  title,
  hint,
  delay = 0,
}: {
  index: string;
  title: string;
  hint?: string;
  delay?: number;
}) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45, delay, ease: EASE_OUT }}
      whileHover={reduced ? undefined : { scale: 1.01 }}
      onClick={() => setOpen((v) => !v)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-expanded={open}
      className="flex h-full w-full flex-col items-start rounded-xl border border-slate-200 bg-white px-5 py-5 text-left transition-colors hover:border-[#82D153]/50 hover:bg-[#f7fcf4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82D153]/40"
    >
      <div className="flex w-full items-center justify-between gap-3">
        <span className="font-mono text-[11px] font-semibold text-[#82D153]">{index}</span>
        <motion.span
          aria-hidden
          animate={{ rotate: open ? 45 : 0 }}
          className="text-lg leading-none text-slate-300"
        >
          +
        </motion.span>
      </div>
      <p className="type-title mt-3 text-base leading-snug text-slate-900 sm:text-lg">{title}</p>
      {hint ? (
        <motion.p
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          className="overflow-hidden text-sm leading-relaxed text-slate-600"
        >
          <span className="mt-3 block border-t border-[#82D153]/20 pt-3">{hint}</span>
        </motion.p>
      ) : null}
    </motion.button>
  );
}

/** Click-to-advance comparison steps for a more interactive intelligence section. */
export function InteractiveFlow({
  label,
  title,
  steps,
  accent = false,
}: {
  label: string;
  title: string;
  steps: string[];
  accent?: boolean;
}) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setActive((n) => (n + 1) % steps.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [reduced, steps.length]);

  return (
    <div
      className={cn(
        "h-full rounded-2xl border p-6 sm:p-8",
        accent
          ? "border-[#82D153]/35 bg-gradient-to-b from-[#f4fbf0] to-white"
          : "border-slate-200 bg-white"
      )}
    >
      <p className={cn("type-label", accent && "text-[#5cb832]")}>{label}</p>
      <h3 className="type-title mt-3 text-xl text-slate-900 sm:text-[1.35rem]">{title}</h3>
      <ul className="mt-8 space-y-2">
        {steps.map((step, i) => {
          const isActive = i === active;
          return (
            <li key={step}>
              <button
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-all",
                  isActive
                    ? accent
                      ? "border border-[#82D153]/35 bg-white text-slate-900 shadow-sm"
                      : "bg-slate-900 text-white"
                    : accent
                      ? "border border-transparent bg-white/50 text-slate-600 hover:border-[#82D153]/20"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    isActive ? (accent ? "text-[#5cb832]" : "text-[#82D153]") : "text-slate-400"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {step}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 flex gap-1.5">
        {steps.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Step ${i + 1}`}
            onClick={() => setActive(i)}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i === active ? "bg-[#82D153]" : "bg-slate-200"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function AnimatedHeadline({
  lines,
  className,
}: {
  lines: { text: string; italic?: boolean; accent?: boolean }[];
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <h1
      className={cn(
        "font-sans text-[2rem] font-bold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl xl:text-[3.25rem]",
        className
      )}
    >
      {lines.map((line, i) => (
        <motion.span
          key={i}
          className={cn(
            "block overflow-hidden",
            line.italic && "font-normal italic",
            !line.italic && !line.accent && "font-bold",
            line.accent && "font-bold text-brand-dark"
          )}
          initial={reduced ? false : { y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.12 + i * 0.12, ease: EASE_OUT }}
        >
          {line.text}
        </motion.span>
      ))}
    </h1>
  );
}

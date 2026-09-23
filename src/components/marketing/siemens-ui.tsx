"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";
import { useT } from "@/components/i18n/locale-provider";

/* ── Shared marketing imagery (Unsplash, industrial / climate) ── */
export const MARKETING_IMAGES = {
  hero: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1800&q=80",
  turbines: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&w=1600&q=80",
  solar: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1600&q=80",
  factory: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80",
  grid: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1600&q=80",
  logistics: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80",
  data: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80",
  boardroom: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
  city: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
  control: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80",
  office: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80",
  engineering: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1600&q=80",
  hydro: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1600&q=80",
  forest: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80",
} as const;

export function SiemensPrimaryCta({
  href,
  children,
  className,
  onClick,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const reduced = useReducedMotion();
  const classNames = cn("siemens-btn-primary group", className);

  const inner = (
    <>
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
    </>
  );

  const motionProps = {
    whileHover: reduced ? undefined : { y: -1 },
    whileTap: reduced ? undefined : { scale: 0.985 },
    transition: { duration: 0.2, ease: EASE_OUT },
    className: "inline-block",
  };

  if (onClick && !href) {
    return (
      <motion.div {...motionProps}>
        <button type="button" onClick={onClick} className={classNames}>
          {inner}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div {...motionProps}>
      <Link href={href ?? "#"} className={classNames} onClick={onClick}>
        {inner}
      </Link>
    </motion.div>
  );
}

export function SiemensSecondaryCta({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      whileHover={reduced ? undefined : { y: -1 }}
      whileTap={reduced ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className="inline-block"
    >
      <Link href={href} className={cn("siemens-btn-secondary group", className)}>
        {children}
        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}

const CHECK_KEYS = [
  "heroSourceErp",
  "heroSourceAccounting",
  "heroSourceProcurement",
  "heroSourceLogistics",
  "heroSourceEnergy",
  "heroSourceSuppliers",
] as const;

export function SiemensProofRow({ className }: { className?: string }) {
  const t = useT();
  return (
    <ul className={cn("flex flex-wrap gap-x-5 gap-y-2", className)}>
      {CHECK_KEYS.map((key) => (
        <li key={key} className="siemens-chip">
          <Check className="h-3.5 w-3.5 text-brand" strokeWidth={2.5} />
          {t(`marketing.${key}`)}
        </li>
      ))}
    </ul>
  );
}

/** Full-bleed photo panel with optional overlay card — hero quality */
export function MediaPanel({
  src,
  alt = "",
  className,
  children,
  diagonal,
  overlay = "teal",
  minH = "lg:min-h-[480px]",
  priority,
}: {
  src: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
  diagonal?: boolean;
  overlay?: "teal" | "dark" | "soft" | "none";
  minH?: string;
  priority?: boolean;
}) {
  const overlayClass =
    overlay === "teal"
      ? "bg-gradient-to-br from-primary/30 via-transparent to-primary/50"
      : overlay === "dark"
        ? "bg-gradient-to-t from-primary/90 via-primary/45 to-primary/20"
        : overlay === "soft"
          ? "bg-gradient-to-tr from-black/25 via-transparent to-primary/20"
          : "";

  return (
    <div className={cn("relative min-h-[280px] overflow-hidden", minH, className)}>
      <div className={cn("absolute inset-0", diagonal && "hero-diagonal")}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 55vw"
        />
        {overlay !== "none" ? <div className={cn("absolute inset-0", overlayClass)} /> : null}
      </div>
      {children ? (
        <div className="relative z-[1] flex h-full min-h-[inherit] items-end p-4 sm:p-6 lg:items-center lg:justify-end lg:p-8">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function HeroIntelCard({ className }: { className?: string }) {
  const t = useT();
  const sources = [
    t("marketing.heroSourceErp"),
    t("marketing.heroSourceAccounting"),
    t("marketing.heroSourceProcurement"),
  ];
  const outputs = [
    t("marketing.heroOutInsights"),
    t("marketing.heroOutCompliance"),
    t("marketing.heroOutAutomation"),
  ];

  return (
    <div
      className={cn(
        "rounded-sm border border-white/70 bg-white/95 p-5 shadow-[0_12px_40px_-20px_rgba(0,40,30,0.4)] backdrop-blur-sm sm:p-6",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="siemens-eyebrow">{t("marketing.heroVizCoreTitle")}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {t("marketing.heroVizCoreLabel")} · {t("marketing.heroVizCoreSub")}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          QAI
        </span>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <ul className="space-y-2">
          {sources.map((label) => (
            <li
              key={label}
              className="rounded border border-border bg-secondary/60 px-2.5 py-1.5 text-[11px] font-medium text-foreground"
            >
              {label}
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-center gap-1 px-1">
          <span className="h-8 w-px bg-brand/40" />
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
            QAI
          </span>
          <span className="h-8 w-px bg-brand/40" />
        </div>
        <ul className="space-y-2">
          {outputs.map((label) => (
            <li
              key={label}
              className="rounded border border-border bg-white px-2.5 py-1.5 text-[11px] font-medium text-foreground"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("marketing.heroMetricCarbon")}
          </p>
          <p className="mt-1 font-sans text-lg font-semibold tabular-nums text-foreground">−32%</p>
          <div className="mt-2 h-8 w-full rounded-sm bg-gradient-to-t from-brand/25 to-transparent" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("marketing.heroMetricSavings")}
          </p>
          <p className="mt-1 font-sans text-lg font-semibold tabular-nums text-foreground">€4.8M</p>
          <div className="mt-2 h-8 w-full rounded-sm bg-gradient-to-t from-primary/20 to-transparent" />
        </div>
      </div>
    </div>
  );
}

export function HeroVisualPanel({ className }: { className?: string }) {
  return (
    <MediaPanel
      src={MARKETING_IMAGES.hero}
      diagonal
      priority
      className={cn("h-full", className)}
      minH="min-h-[280px] lg:min-h-full"
    >
      <HeroIntelCard className="w-full max-w-md lg:translate-x-[-6%]" />
    </MediaPanel>
  );
}

/** Feature card with photographic header */
export function SiemensFeatureCard({
  index,
  icon: Icon,
  caption,
  title,
  body,
  image,
  delay = 0,
}: {
  index: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  caption: string;
  title: string;
  body: string;
  image: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay, ease: EASE_OUT }}
      className="group overflow-hidden rounded-sm border border-border bg-white transition-colors duration-200 hover:border-primary/25"
    >
      <div className="relative h-36 overflow-hidden sm:h-40">
        <Image
          src={image}
          alt=""
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-brand shadow-sm">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span className="absolute right-3 top-3 rounded bg-white/90 px-2 py-0.5 font-sans text-[10px] font-semibold tabular-nums text-foreground/70">
          {index}
        </span>
      </div>
      <div className="p-5">
        <p className="siemens-eyebrow">{caption}</p>
        <h3 className="mt-2 font-sans text-lg font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </motion.article>
  );
}

export function PipelineActionCard({ className }: { className?: string }) {
  const t = useT();
  return (
    <div className={cn("relative min-h-[320px] overflow-hidden lg:min-h-[420px]", className)}>
      <Image
        src={MARKETING_IMAGES.turbines}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 45vw"
      />
      <div className="absolute inset-0 bg-primary/78" />
      <div className="relative z-[1] flex h-full min-h-[320px] flex-col justify-end p-6 sm:p-8 lg:min-h-[420px]">
        <p className="siemens-eyebrow text-brand/90 text-white/70">QAI</p>
        <p className="mt-3 max-w-sm font-sans text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
          {t("marketing.pipelineCardTitle")}
        </p>
        <Link
          href="#qai"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/95 transition-opacity hover:opacity-80"
        >
          {t("marketing.pipelineCardCta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/** Integration / data-source tile with photo */
export function IntegrationMediaCard({
  title,
  body,
  image,
  index,
  delay = 0,
}: {
  title: string;
  body: string;
  image: string;
  index: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay, ease: EASE_OUT }}
      className="group relative min-h-[220px] overflow-hidden"
    >
      <Image
        src={image}
        alt=""
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/92 via-primary/55 to-primary/15" />
      <div className="relative z-[1] flex h-full min-h-[220px] flex-col justify-end p-5">
        <span className="font-sans text-[10px] font-semibold tabular-nums text-white/55">{index}</span>
        <h3 className="mt-1 font-sans text-lg font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-white/75">{body}</p>
      </div>
    </motion.article>
  );
}

/** Value outcome card with side image */
export function ValueMediaCard({
  index,
  title,
  hint,
  image,
  delay = 0,
}: {
  index: string;
  title: string;
  hint: string;
  image: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay, ease: EASE_OUT }}
      className="group grid overflow-hidden rounded-sm border border-border bg-white sm:grid-cols-[140px_minmax(0,1fr)]"
    >
      <div className="relative min-h-[120px] sm:min-h-full">
        <Image
          src={image}
          alt=""
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="140px"
        />
        <div className="absolute inset-0 bg-primary/25" />
      </div>
      <div className="p-5">
        <span className="font-sans text-xs font-medium tabular-nums text-muted-foreground/50">{index}</span>
        <h3 className="mt-2 font-sans text-base font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hint}</p>
      </div>
    </motion.article>
  );
}

export function SiemensStackDiagram({ className }: { className?: string }) {
  const t = useT();
  const layers = [
    t("marketing.heroSourceErp"),
    t("marketing.heroSourceSuppliers"),
    t("marketing.heroOutCompliance"),
    t("marketing.heroSourceAccounting"),
    t("marketing.heroSourceProcurement"),
    t("marketing.heroSourceLogistics"),
  ];

  return (
    <div className={cn("relative min-h-[360px] overflow-hidden", className)}>
      <Image
        src={MARKETING_IMAGES.control}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 45vw"
      />
      <div className="absolute inset-0 bg-primary/75" />
      <div className="relative z-[1] flex h-full min-h-[360px] flex-col justify-center p-6 sm:p-8">
        <div className="mx-auto grid w-full max-w-sm gap-2.5">
          {layers.map((label, i) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-md border border-white/20 bg-white/95 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm"
              style={{ marginLeft: `${(i % 3) * 10}px`, marginRight: `${((i + 1) % 3) * 8}px` }}
            >
              <span>{label}</span>
              <span className="h-2 w-2 rounded-full bg-brand" />
            </div>
          ))}
          <div className="mx-auto mt-3 flex h-14 w-14 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white shadow-lg">
            QAI
          </div>
        </div>
      </div>
    </div>
  );
}

export function AboutMediaPanel({ className }: { className?: string }) {
  return (
    <div className={cn("relative min-h-[320px] overflow-hidden lg:min-h-full", className)}>
      <Image
        src={MARKETING_IMAGES.office}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 45vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/20 to-transparent" />
      <div className="absolute bottom-5 left-5 right-5 rounded-md border border-white/30 bg-white/95 p-4 backdrop-blur-sm">
        <p className="font-sans text-lg font-semibold tracking-tight text-foreground">Pratik Rughe</p>
        <p className="siemens-eyebrow mt-1">Founder & CEO · Berlin</p>
      </div>
    </div>
  );
}

export function PricingBanner({
  className,
  caption,
}: {
  className?: string;
  caption?: string;
}) {
  return (
    <div className={cn("relative mb-8 h-40 overflow-hidden sm:h-48", className)}>
      <Image
        src={MARKETING_IMAGES.solar}
        alt=""
        fill
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/55 to-transparent" />
      <div className="relative z-[1] flex h-full items-end p-6">
        <p className="max-w-md font-sans text-lg font-semibold text-white sm:text-xl">
          {caption}
        </p>
      </div>
    </div>
  );
}

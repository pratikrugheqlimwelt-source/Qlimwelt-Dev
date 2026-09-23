"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Building2,
  Cloud,
  Factory,
  FileCode2,
  Network,
  Package,
  Truck,
  UsersRound,
  Zap,
  type LucideIcon,
} from "lucide-react";
import * as simpleIcons from "simple-icons";
import { MetaLabel } from "@/components/marketing/editorial";
import { useT } from "@/components/i18n/locale-provider";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SimpleIcon = {
  title: string;
  hex: string;
  path: string;
};

export type ConnectorLogo = {
  id: string;
  name: string;
  domain?: string;
  simpleIcon?: string;
};

export type ConnectorCategoryId =
  | "erp"
  | "procurement"
  | "cloud"
  | "energy"
  | "logistics"
  | "hr"
  | "manufacturing"
  | "data"
  | "ecosystem";

export type ConnectorCategory = {
  id: ConnectorCategoryId;
  icon: LucideIcon;
  labelKey: string;
  hintKey: string;
  systems: ConnectorLogo[];
};

export const CONNECTOR_CATEGORIES: ConnectorCategory[] = [
  {
    id: "erp",
    icon: Building2,
    labelKey: "marketing.connCatErp",
    hintKey: "marketing.connCatErpHint",
    systems: [
      { id: "sap", name: "SAP", domain: "sap.com", simpleIcon: "siSap" },
      { id: "oracle", name: "Oracle", domain: "oracle.com" },
      { id: "dynamics", name: "Dynamics 365", domain: "microsoft.com" },
      { id: "netsuite", name: "NetSuite", domain: "netsuite.com" },
      { id: "odoo", name: "Odoo", domain: "odoo.com", simpleIcon: "siOdoo" },
      { id: "datev", name: "DATEV", domain: "datev.de", simpleIcon: "siDatev" },
      { id: "quickbooks", name: "QuickBooks", domain: "quickbooks.intuit.com", simpleIcon: "siQuickbooks" },
      { id: "xero", name: "Xero", domain: "xero.com", simpleIcon: "siXero" },
      { id: "sage", name: "Sage", domain: "sage.com", simpleIcon: "siSage" },
      { id: "freshbooks", name: "FreshBooks", domain: "freshbooks.com" },
    ],
  },
  {
    id: "procurement",
    icon: Package,
    labelKey: "marketing.connCatProcurement",
    hintKey: "marketing.connCatProcurementHint",
    systems: [
      { id: "coupa", name: "Coupa", domain: "coupa.com" },
      { id: "ariba", name: "Ariba", domain: "ariba.com", simpleIcon: "siSap" },
      { id: "jaggaer", name: "JAGGAER", domain: "jaggaer.com" },
      { id: "zip", name: "Zip", domain: "ziphq.com" },
      { id: "sap-procurement", name: "SAP Procurement", domain: "sap.com", simpleIcon: "siSap" },
    ],
  },
  {
    id: "cloud",
    icon: Cloud,
    labelKey: "marketing.connCatCloud",
    hintKey: "marketing.connCatCloudHint",
    systems: [
      { id: "aws", name: "AWS", domain: "aws.amazon.com" },
      { id: "azure", name: "Azure", domain: "azure.microsoft.com" },
      { id: "gcp", name: "Google Cloud", domain: "cloud.google.com", simpleIcon: "siGooglecloud" },
    ],
  },
  {
    id: "energy",
    icon: Zap,
    labelKey: "marketing.connCatEnergy",
    hintKey: "marketing.connCatEnergyHint",
    systems: [
      { id: "smart-meter", name: "Smart Meter", domain: "landisgyr.com" },
      { id: "utilities", name: "Utilities" },
      { id: "iot", name: "IoT Devices" },
      { id: "energy-apis", name: "Energy APIs", domain: "octopus.energy" },
    ],
  },
  {
    id: "logistics",
    icon: Truck,
    labelKey: "marketing.connCatLogistics",
    hintKey: "marketing.connCatLogisticsHint",
    systems: [
      { id: "dhl", name: "DHL", domain: "dhl.com", simpleIcon: "siDhl" },
      { id: "ups", name: "UPS", domain: "ups.com", simpleIcon: "siUps" },
      { id: "fedex", name: "FedEx", domain: "fedex.com", simpleIcon: "siFedex" },
      { id: "fleet", name: "Fleet Systems" },
      { id: "samsara", name: "Samsara", domain: "samsara.com" },
    ],
  },
  {
    id: "hr",
    icon: UsersRound,
    labelKey: "marketing.connCatHr",
    hintKey: "marketing.connCatHrHint",
    systems: [
      { id: "workday", name: "Workday", domain: "workday.com" },
      { id: "personio", name: "Personio", domain: "personio.com", simpleIcon: "siPersonio" },
      { id: "successfactors", name: "SuccessFactors", domain: "sap.com", simpleIcon: "siSap" },
      { id: "navan", name: "Navan", domain: "navan.com" },
      { id: "concur", name: "Concur", domain: "concur.com" },
      { id: "travelperk", name: "TravelPerk", domain: "travelperk.com" },
    ],
  },
  {
    id: "manufacturing",
    icon: Factory,
    labelKey: "marketing.connCatManufacturing",
    hintKey: "marketing.connCatManufacturingHint",
    systems: [
      { id: "mes", name: "MES" },
      { id: "scada", name: "SCADA" },
      { id: "plc", name: "PLC" },
      { id: "factory-apis", name: "Factory APIs" },
      { id: "rockwell", name: "Rockwell", domain: "rockwellautomation.com", simpleIcon: "siRockwellautomation" },
      { id: "abb", name: "ABB", domain: "abb.com", simpleIcon: "siAbb" },
      { id: "ptc", name: "PTC", domain: "ptc.com" },
    ],
  },
  {
    id: "data",
    icon: FileCode2,
    labelKey: "marketing.connCatData",
    hintKey: "marketing.connCatDataHint",
    systems: [
      { id: "csv", name: "CSV", domain: "sheets.google.com", simpleIcon: "siGooglesheets" },
      { id: "excel", name: "Excel", domain: "microsoft.com" },
      { id: "pdf", name: "PDF", domain: "adobe.com" },
      { id: "json", name: "JSON", simpleIcon: "siJson" },
      { id: "xml", name: "XML", simpleIcon: "siXml" },
      { id: "rest", name: "REST API" },
      { id: "webhooks", name: "Webhooks" },
    ],
  },
  {
    id: "ecosystem",
    icon: Network,
    labelKey: "marketing.connCatEcosystem",
    hintKey: "marketing.connCatEcosystemHint",
    systems: [
      { id: "banks", name: "Banks", domain: "db.com", simpleIcon: "siDeutschebank" },
      { id: "salesforce", name: "Salesforce", domain: "salesforce.com" },
      { id: "hubspot", name: "HubSpot", domain: "hubspot.com", simpleIcon: "siHubspot" },
      { id: "stripe", name: "Stripe", domain: "stripe.com", simpleIcon: "siStripe" },
      { id: "carbon-reg", name: "Carbon Registries", domain: "verra.org" },
      { id: "esg", name: "ESG Platforms", domain: "sustainalytics.com" },
      { id: "satellite", name: "Satellite APIs", domain: "planet.com" },
      { id: "gov", name: "Government Registries", domain: "europa.eu" },
    ],
  },
];

function getSimpleIcon(key?: string): SimpleIcon | null {
  if (!key) return null;
  const icon = (simpleIcons as Record<string, SimpleIcon | undefined>)[key];
  return icon?.path ? icon : null;
}

function companyIconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

function SystemMark({
  system,
  size = "md",
  showLabel = true,
}: {
  system: ConnectorLogo;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const brand = getSimpleIcon(system.simpleIcon);
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(brand || (system.domain && !imgFailed));
  const dim = size === "lg" ? 36 : size === "sm" ? 22 : 28;
  const box =
    size === "lg"
      ? "h-11 w-11"
      : size === "sm"
        ? "h-8 w-8"
        : "h-9 w-9";

  return (
    <div className="flex flex-col items-center gap-2" title={system.name}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-white/70 bg-white/90 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.35)] backdrop-blur-sm",
          box
        )}
      >
        {brand ? (
          <svg
            role="img"
            viewBox="0 0 24 24"
            width={dim * 0.72}
            height={dim * 0.72}
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <title>{system.name}</title>
            <path d={brand.path} fill={`#${brand.hex}`} />
          </svg>
        ) : showImage && system.domain ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={companyIconUrl(system.domain)}
            alt=""
            width={dim}
            height={dim}
            className="h-[70%] w-[70%] object-contain"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="text-[9px] font-bold uppercase tracking-wide text-primary">
            {system.name.slice(0, 2)}
          </span>
        )}
      </div>
      {showLabel ? (
        <span className="max-w-[5.5rem] truncate text-center text-[10px] font-semibold text-foreground/70">
          {system.name}
        </span>
      ) : (
        <span className="sr-only">{system.name}</span>
      )}
    </div>
  );
}

function LogoRiver({
  systems,
  direction = "left",
  duration = 42,
  className,
}: {
  systems: ConnectorLogo[];
  direction?: "left" | "right";
  duration?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const loop = useMemo(() => [...systems, ...systems], [systems]);

  return (
    <div className={cn("conn-river relative overflow-hidden py-2", className)}>
      <ul
        className={cn(
          "conn-river-track flex w-max items-center gap-3 sm:gap-4",
          direction === "right" && "conn-river-track-reverse",
          reduced && "conn-river-track-static"
        )}
        style={reduced ? undefined : ({ "--conn-river-duration": `${duration}s` } as CSSProperties)}
      >
        {loop.map((system, i) => (
          <li
            key={`${system.id}-${i}`}
            className="flex shrink-0 items-center gap-2.5 rounded-full border border-border/80 bg-white/80 px-3.5 py-2 shadow-[0_4px_16px_-10px_rgba(15,23,42,0.25)] backdrop-blur-sm"
            aria-hidden={i >= systems.length || undefined}
          >
            <SystemMark system={system} size="sm" showLabel={false} />
            <span className="whitespace-nowrap text-xs font-semibold tracking-tight text-foreground/80">
              {system.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeaturedTile({
  system,
  index,
  reduced,
}: {
  system: ConnectorLogo;
  index: number;
  reduced: boolean | null;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.36), ease: EASE_OUT }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/70 bg-white p-4",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-18px_rgba(15,23,42,0.28)]",
        "transition-[transform,box-shadow,border-color] duration-300",
        "hover:-translate-y-1 hover:border-brand/35 hover:shadow-[0_16px_40px_-20px_rgba(15,23,42,0.35)]"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-brand/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="relative flex items-center gap-3">
        <SystemMark system={system} size="lg" showLabel={false} />
        <div className="min-w-0">
          <p className="truncate font-sans text-sm font-semibold tracking-tight text-foreground">
            {system.name}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function ConnectedSystemsShowcase({ className }: { className?: string }) {
  const t = useT();
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { amount: 0.25, margin: "-10% 0px" });
  const [activeId, setActiveId] = useState<ConnectorCategoryId>("erp");
  const [paused, setPaused] = useState(false);
  const userTouched = useRef(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [36, -36]);
  const watermarkX = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [-24, 24]);
  const riverOpacity = useSpring(useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.35, 1, 1, 0.45]), {
    stiffness: 90,
    damping: 24,
  });

  const activeIndex = CONNECTOR_CATEGORIES.findIndex((c) => c.id === activeId);
  const active = CONNECTOR_CATEGORIES[activeIndex] ?? CONNECTOR_CATEGORIES[0];
  const ActiveIcon = active.icon;

  const allSystems = useMemo(
    () => CONNECTOR_CATEGORIES.flatMap((c) => c.systems),
    []
  );
  const riverA = useMemo(() => allSystems.filter((_, i) => i % 2 === 0), [allSystems]);
  const riverB = useMemo(() => allSystems.filter((_, i) => i % 2 === 1), [allSystems]);
  const totalSystems = allSystems.length;

  useEffect(() => {
    if (reduced || paused || !inView || userTouched.current) return;
    const id = window.setInterval(() => {
      setActiveId((prev) => {
        const idx = CONNECTOR_CATEGORIES.findIndex((c) => c.id === prev);
        const next = CONNECTOR_CATEGORIES[(idx + 1) % CONNECTOR_CATEGORIES.length];
        return next.id;
      });
    }, 4200);
    return () => window.clearInterval(id);
  }, [reduced, paused, inView]);

  const selectCategory = (id: ConnectorCategoryId) => {
    userTouched.current = true;
    setPaused(true);
    setActiveId(id);
  };

  return (
    <div ref={sectionRef} className={cn("relative w-full", className)}>
      {/* Atmospheric field */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          style={{ y: parallaxY }}
          className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-brand/15 blur-3xl"
        />
        <motion.div
          style={{ y: parallaxY }}
          className="absolute -right-16 top-40 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
      </div>

      {/* Editorial intro */}
      <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          <MetaLabel className="text-brand">{t("marketing.connLabel")}</MetaLabel>
          <h2 className="siemens-display mt-4 max-w-xl">{t("marketing.connHeadline")}</h2>
          <p className="siemens-body mt-5 max-w-lg">{t("marketing.connBody")}</p>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.08, ease: EASE_OUT }}
          className="relative overflow-hidden rounded-2xl border border-border bg-primary px-5 py-5 text-primary-foreground sm:px-6"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_90%_0%,rgba(130,209,83,0.35),transparent_55%)]"
          />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                {t("marketing.connStats", {
                  categories: CONNECTOR_CATEGORIES.length,
                  systems: totalSystems,
                })}
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium text-white/85">
                <span className="rounded-full bg-white/10 px-2.5 py-1">{t("marketing.connFlowSources")}</span>
                <span className="text-brand">→</span>
                <span className="rounded-full bg-brand px-2.5 py-1 font-semibold text-[#163812]">QAI</span>
                <span className="text-brand">→</span>
                <span className="rounded-full bg-white/10 px-2.5 py-1">{t("marketing.connFlowDecisions")}</span>
              </p>
            </div>
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-[#163812] sm:flex">
              QAI
            </div>
          </div>
        </motion.div>
      </div>

      {/* Ambient scrolling rivers */}
      <motion.div style={{ opacity: riverOpacity }} className="mt-10 space-y-3 lg:mt-12">
        <LogoRiver systems={riverA} direction="left" duration={52} />
        <LogoRiver systems={riverB} direction="right" duration={58} />
      </motion.div>

      {/* Interactive category stage */}
      <div
        className="relative mt-10 overflow-hidden rounded-2xl border border-border bg-[hsl(var(--siemens-surface))] lg:mt-12"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          if (!userTouched.current) setPaused(false);
        }}
      >
        <motion.span
          aria-hidden
          style={{ x: watermarkX }}
          className="pointer-events-none absolute -right-4 top-6 select-none font-sans text-[7rem] font-bold leading-none tracking-tighter text-foreground/[0.04] sm:text-[9rem] lg:top-4 lg:text-[11rem]"
        >
          {String(activeIndex + 1).padStart(2, "0")}
        </motion.span>

        {/* Category tabs */}
        <div className="relative border-b border-border/80 bg-white/50 px-3 py-3 backdrop-blur-sm sm:px-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CONNECTOR_CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              const selected = cat.id === activeId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.id)}
                  className={cn(
                    "relative flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-left transition-colors duration-200",
                    selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={selected}
                >
                  {selected ? (
                    <motion.span
                      layoutId="conn-cat-pill"
                      className="absolute inset-0 rounded-full bg-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.35)] ring-1 ring-border"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                  <span className="relative z-[1] flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full",
                        selected ? "bg-brand/20 text-brand-dark" : "bg-secondary text-muted-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <span className="whitespace-nowrap text-[12px] font-semibold tracking-tight sm:text-sm">
                      <span className="mr-1.5 tabular-nums text-muted-foreground/60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {t(cat.labelKey)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {/* Progress dots for autoplay */}
          <div className="mt-3 flex justify-center gap-1.5 sm:justify-start sm:px-1">
            {CONNECTOR_CATEGORIES.map((cat) => (
              <button
                key={`dot-${cat.id}`}
                type="button"
                aria-label={t(cat.labelKey)}
                onClick={() => selectCategory(cat.id)}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  cat.id === activeId ? "w-6 bg-brand" : "w-1.5 bg-border hover:bg-muted-foreground/40"
                )}
              />
            ))}
          </div>
        </div>

        <div className="relative grid gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${active.id}-copy`}
              initial={reduced ? false : { opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: 12 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="relative border-b border-border p-6 sm:p-8 lg:border-b-0 lg:border-r"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-[#163812] shadow-[0_12px_28px_-12px_rgba(130,209,83,0.8)]">
                  <ActiveIcon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="siemens-eyebrow text-brand">{t("marketing.connCategoryEyebrow")}</p>
                  <h3 className="mt-2 font-sans text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {t(active.labelKey)}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    {t(active.hintKey)}
                  </p>
                  <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    {t("marketing.connSystemCount", { count: active.systems.length })}
                  </p>
                </div>
              </div>

              {/* Mini river for active category */}
              <div className="mt-8">
                <LogoRiver systems={active.systems} direction="left" duration={28} />
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${active.id}-grid`}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="relative bg-white/70 p-5 sm:p-6 lg:p-8"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_0%,rgba(130,209,83,0.12),transparent_55%)]"
              />
              <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {active.systems.map((system, i) => (
                  <FeaturedTile key={system.id} system={system} index={i} reduced={reduced} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

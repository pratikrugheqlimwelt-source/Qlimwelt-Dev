"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { NavAnchor, ScrollProgress } from "@/components/marketing/motion-ui";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { useT } from "@/components/i18n/locale-provider";
import { EASE_OUT } from "@/lib/motion";

interface MarketingNavProps {
  variant?: "home" | "default";
}

const navLinkClass = "type-nav";

export function MarketingNav({ variant = "default" }: MarketingNavProps) {
  const pathname = usePathname();
  const isHome = variant === "home" || pathname === "/";
  const reduced = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useT();

  const homeAnchors: [string, string][] = [
    ["#capabilities", t("marketingNav.learn")],
    ["#intelligence", t("marketingNav.platform")],
    ["#how-it-works", t("marketingNav.process")],
    ["#value", t("marketingNav.insights")],
    ["#pricing", t("marketingNav.pricing")],
  ];

  return (
    <motion.header
      initial={reduced ? false : { y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm"
    >
      <ScrollProgress />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 lg:px-8">
        <Logo size="sm" className="shrink-0" />

        <nav className="hidden items-center gap-7 lg:flex">
          {isHome ? (
            <>
              {homeAnchors.map(([href, label]) => (
                <NavAnchor key={href} href={href}>
                  {label}
                </NavAnchor>
              ))}
            </>
          ) : (
            <Link href="/" className={navLinkClass}>
              {t("common.home")}
            </Link>
          )}
          <Link href="/platform" className={navLinkClass}>
            {t("marketingNav.aiFeatures")}
          </Link>
          <Link href="/whats-new" className={navLinkClass}>
            {t("marketingNav.whatsNew")}
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />
          <motion.div whileHover={reduced ? undefined : { scale: 1.03 }} whileTap={reduced ? undefined : { scale: 0.97 }}>
            <Link
              href="/login"
              className="type-cta inline-block border border-foreground px-4 py-2.5 text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background"
            >
              {t("common.getStarted")}
            </Link>
          </motion.div>
          <button
            type="button"
            className="rounded-md p-2 text-foreground lg:hidden"
            aria-label={mobileOpen ? t("common.closeMenu") : t("common.openMenu")}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {isHome ? (
              homeAnchors.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </a>
              ))
            ) : (
              <Link href="/" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                {t("common.home")}
              </Link>
            )}
            <Link href="/platform" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              {t("marketingNav.aiFeatures")}
            </Link>
            <Link href="/whats-new" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              {t("marketingNav.whatsNew")}
            </Link>
            <div className="pt-1">
              <LanguageToggle />
            </div>
            <Link
              href="/login"
              className="type-cta mt-2 inline-block border border-foreground px-4 py-2.5 text-center text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {t("common.getStarted")}
            </Link>
          </nav>
        </div>
      )}
    </motion.header>
  );
}

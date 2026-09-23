"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { useT } from "@/components/i18n/locale-provider";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MarketingNavProps {
  variant?: "home" | "default";
}

export function MarketingNav({ variant = "default" }: MarketingNavProps) {
  const pathname = usePathname();
  const isHome = variant === "home" || pathname === "/";
  const reduced = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useT();

  const homeLinks: { href: string; label: string }[] = [
    { href: "#capabilities", label: t("marketingNav.solutions") },
    { href: "/platform", label: t("marketingNav.platform") },
    { href: "#integrations", label: t("marketingNav.integrations") },
    { href: "#intelligence", label: t("marketingNav.intelligence") },
    { href: "#about", label: t("marketingNav.company") },
  ];

  const defaultLinks = [
    { href: "/", label: t("common.home") },
    { href: "/platform", label: t("marketingNav.platform") },
    { href: "/whats-new", label: t("marketingNav.whatsNew") },
  ];

  const links = isHome ? homeLinks : defaultLinks;

  return (
    <motion.header
      initial={reduced ? false : { y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className="sticky top-0 z-50 border-b border-border bg-white/98 backdrop-blur-[8px]"
    >
      <div className="marketing-rail flex h-16 items-center justify-between gap-3 sm:gap-4 lg:gap-6">
        <Logo size="sm" className="shrink-0" />

        <nav className="hidden min-w-0 items-center gap-0.5 xl:flex" aria-label="Primary">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap px-2.5 py-2 text-[13px] font-medium tracking-tight text-foreground/70 transition-colors duration-150 xl:px-3.5",
                "hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageToggle />
          <Link
            href="/login"
            className="siemens-btn-secondary hidden h-9 px-4 py-0 lg:inline-flex"
          >
            {t("common.getStarted")}
          </Link>
          <Link
            href={isHome ? "#contact" : "/#contact"}
            className="siemens-btn-primary hidden h-9 px-4 py-0 sm:inline-flex"
          >
            {t("marketingNav.bookDemo")}
            <span aria-hidden>→</span>
          </Link>
          <button
            type="button"
            className="rounded-sm p-2 text-foreground xl:hidden"
            aria-label={mobileOpen ? t("common.closeMenu") : t("common.openMenu")}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-white px-4 py-4 xl:hidden">
          <nav className="flex flex-col gap-0.5" aria-label="Mobile">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="siemens-btn-secondary mt-3"
              onClick={() => setMobileOpen(false)}
            >
              {t("common.getStarted")}
            </Link>
            <Link
              href={isHome ? "#contact" : "/#contact"}
              className="siemens-btn-primary mt-2"
              onClick={() => setMobileOpen(false)}
            >
              {t("marketingNav.bookDemo")}
            </Link>
          </nav>
        </div>
      )}
    </motion.header>
  );
}

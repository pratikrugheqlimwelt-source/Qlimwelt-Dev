"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { NavAnchor, ScrollProgress } from "@/components/marketing/motion-ui";
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

  const homeAnchors: [string, string][] = [
    ["#carbon-footprint", "Learn"],
    ["#platform", "Platform"],
    ["#how-it-works", "Process"],
    ["#insights", "Insights"],
    ["#pricing", "Pricing"],
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
              Home
            </Link>
          )}
          <Link href="/platform" className={navLinkClass}>
            AI Features
          </Link>
          <Link href="/whats-new" className={navLinkClass}>
            What&apos;s New
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <motion.div whileHover={reduced ? undefined : { scale: 1.03 }} whileTap={reduced ? undefined : { scale: 0.97 }}>
            <Link
              href="/login"
              className="type-cta inline-block border border-foreground px-4 py-2.5 text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background"
            >
              Get Started
            </Link>
          </motion.div>
          <button
            type="button"
            className="rounded-md p-2 text-foreground lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
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
                Home
              </Link>
            )}
            <Link href="/platform" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              AI Features
            </Link>
            <Link href="/whats-new" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              What&apos;s New
            </Link>
            <Link
              href="/login"
              className="type-cta mt-2 inline-block border border-foreground px-4 py-2.5 text-center text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </motion.header>
  );
}

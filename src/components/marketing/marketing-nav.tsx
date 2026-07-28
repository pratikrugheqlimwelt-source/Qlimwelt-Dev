"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/marketing/logo";
import { NavAnchor, ScrollProgress } from "@/components/marketing/motion-ui";
import { EASE_OUT } from "@/lib/motion";

interface MarketingNavProps {
  variant?: "home" | "default";
}

const navLinkClass =
  "font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground";

export function MarketingNav({ variant = "default" }: MarketingNavProps) {
  const pathname = usePathname();
  const isHome = variant === "home" || pathname === "/";
  const reduced = useReducedMotion();

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

        <nav className="hidden items-center gap-8 lg:flex">
          {isHome ? (
            <>
              {[
                ["#carbon-footprint", "Learn"],
                ["#platform", "Platform"],
                ["#how-it-works", "Process"],
                ["#insights", "Insights"],
                ["#pricing", "Pricing"],
              ].map(([href, label]) => (
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
          {isHome && (
            <NavAnchor href="#contact" className="hidden sm:inline-block">
              Demo
            </NavAnchor>
          )}
          <motion.div whileHover={reduced ? undefined : { scale: 1.03 }} whileTap={reduced ? undefined : { scale: 0.97 }}>
            <Link
              href="/login"
              className="inline-block border border-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors duration-300 hover:bg-foreground hover:text-background"
            >
              Dashboard
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}

"use client";

import Link from "next/link";
import { Logo } from "@/components/marketing/logo";
import { MetaLabel } from "@/components/marketing/editorial";
import { useT } from "@/components/i18n/locale-provider";

export function MarketingFooter() {
  const t = useT();

  return (
    <footer className="border-t border-border bg-background">
      <div className="section-container py-10 lg:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size="sm" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("marketing.footerTagline")}
            </p>
          </div>
          <div>
            <MetaLabel>{t("marketing.footerPlatform")}</MetaLabel>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><Link href="/#capabilities" className="transition-colors hover:text-foreground">{t("marketing.footerFeatures")}</Link></li>
              <li><Link href="/#how-it-works" className="transition-colors hover:text-foreground">{t("marketing.footerFootprintGuide")}</Link></li>
              <li><Link href="/#intelligence" className="transition-colors hover:text-foreground">{t("marketing.footerInsights")}</Link></li>
              <li><Link href="/#pricing" className="transition-colors hover:text-foreground">{t("marketing.footerPricing")}</Link></li>
              <li><Link href="/login" className="transition-colors hover:text-foreground">{t("marketing.footerDashboard")}</Link></li>
            </ul>
          </div>
          <div>
            <MetaLabel>{t("marketing.footerCompany")}</MetaLabel>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><Link href="/#about" className="transition-colors hover:text-foreground">{t("marketing.footerAbout")}</Link></li>
              <li><Link href="/#value" className="transition-colors hover:text-foreground">{t("marketing.footerBlog")}</Link></li>
              <li><Link href="/#contact" className="transition-colors hover:text-foreground">{t("marketing.footerCareers")}</Link></li>
              <li><Link href="/#contact" className="transition-colors hover:text-foreground">{t("marketing.footerPress")}</Link></li>
            </ul>
          </div>
          <div>
            <MetaLabel>{t("marketing.footerLegal")}</MetaLabel>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><Link href="/#contact" className="transition-colors hover:text-foreground">{t("marketing.footerPrivacy")}</Link></li>
              <li><Link href="/#contact" className="transition-colors hover:text-foreground">{t("marketing.footerTerms")}</Link></li>
              <li><Link href="/#contact" className="transition-colors hover:text-foreground">{t("marketing.footerGdpr")}</Link></li>
              <li><Link href="/#contact" className="transition-colors hover:text-foreground">{t("marketing.footerCookies")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <MetaLabel>© 2026 QLIMWELT AI · BERLIN, GERMANY</MetaLabel>
          <div className="flex gap-6 type-label">
            <Link href="/#contact" className="transition-colors hover:text-foreground">LinkedIn</Link>
            <Link href="/#contact" className="transition-colors hover:text-foreground">Twitter</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { Logo } from "@/components/marketing/logo";
import { MetaLabel } from "@/components/marketing/editorial";
import { useT } from "@/components/i18n/locale-provider";

export function MarketingFooter() {
  const t = useT();

  return (
    <footer className="border-t border-border bg-white">
      <div className="section-container py-14 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-4">
            <Logo size="sm" />
            <p className="mt-5 max-w-[17rem] text-sm leading-relaxed text-muted-foreground">
              {t("marketing.footerTagline")}
            </p>
          </div>
          <div className="lg:col-span-2 lg:col-start-6">
            <MetaLabel>{t("marketing.footerPlatform")}</MetaLabel>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/#capabilities" className="siemens-link">{t("marketing.footerFeatures")}</Link></li>
              <li><Link href="/#how-it-works" className="siemens-link">{t("marketing.footerFootprintGuide")}</Link></li>
              <li><Link href="/#integrations" className="siemens-link">{t("marketing.footerIntegrations")}</Link></li>
              <li><Link href="/#intelligence" className="siemens-link">{t("marketing.footerInsights")}</Link></li>
              <li><Link href="/#pricing" className="siemens-link">{t("marketing.footerPricing")}</Link></li>
              <li><Link href="/dashboard" className="siemens-link">{t("marketing.footerDashboard")}</Link></li>
            </ul>
          </div>
          <div className="lg:col-span-2">
            <MetaLabel>{t("marketing.footerCompany")}</MetaLabel>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/#about" className="siemens-link">{t("marketing.footerAbout")}</Link></li>
              <li><Link href="/whats-new" className="siemens-link">{t("marketing.footerBlog")}</Link></li>
              <li><Link href="/#contact" className="siemens-link">{t("marketing.footerCareers")}</Link></li>
              <li><Link href="/#contact" className="siemens-link">{t("marketing.footerPress")}</Link></li>
            </ul>
          </div>
          <div className="lg:col-span-2">
            <MetaLabel>{t("marketing.footerLegal")}</MetaLabel>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/#contact" className="siemens-link">{t("marketing.footerPrivacy")}</Link></li>
              <li><Link href="/#contact" className="siemens-link">{t("marketing.footerTerms")}</Link></li>
              <li><Link href="/#contact" className="siemens-link">{t("marketing.footerGdpr")}</Link></li>
              <li><Link href="/#contact" className="siemens-link">{t("marketing.footerCookies")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">© 2026 Qlimwelt AI · Berlin, Germany</p>
          <div className="flex gap-6 text-xs font-medium text-muted-foreground">
            <Link href="/#contact" className="transition-colors hover:text-foreground">LinkedIn</Link>
            <Link href="https://www.ihubmids.de/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
              iHubMinds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

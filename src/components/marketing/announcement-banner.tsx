"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/locale-provider";

export function AnnouncementBanner() {
  const t = useT();

  return (
    <div className="border-b border-brand/20 bg-brand-light/50 px-4 py-2.5 text-center text-sm">
      <span className="text-muted-foreground">
        {t("marketing.bannerText")}{" "}
      </span>
      <Link href="/whats-new" className="font-semibold text-brand-dark underline-offset-2 hover:underline">
        {t("marketing.bannerCta")}
      </Link>
    </div>
  );
}

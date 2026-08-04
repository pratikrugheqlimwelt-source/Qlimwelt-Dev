"use client";

import { Lock, ShieldCheck, Globe2, ScrollText, Users, Server } from "lucide-react";
import { useT } from "@/components/i18n/locale-provider";

const ITEMS = [
  { icon: Lock, key: "secEncryption" },
  { icon: ShieldCheck, key: "secTls" },
  { icon: Users, key: "secRbac" },
  { icon: ShieldCheck, key: "secSoc2" },
  { icon: Globe2, key: "secGdpr" },
  { icon: ScrollText, key: "secAudit" },
  { icon: Users, key: "secPermissions" },
  { icon: Server, key: "secResidency" },
] as const;

export function SecurityPanel() {
  const t = useT();

  return (
    <div className="dash-card p-6">
      <p className="dash-label">{t("connectedSystemsPage.securityLabel")}</p>
      <h3 className="type-title mt-2 text-lg">{t("connectedSystemsPage.securityTitle")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("connectedSystemsPage.securityBody")}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, key }) => (
          <div
            key={key}
            className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
          >
            <Icon className="h-4 w-4 text-[#2f6f24]" />
            <p className="mt-2 text-sm font-semibold text-foreground">
              {t(`connectedSystemsPage.${key}`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

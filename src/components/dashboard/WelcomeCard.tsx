"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/locale-provider";

interface WelcomeCardProps {
  firstName?: string;
  companyName?: string;
}

export function WelcomeCard({ firstName, companyName }: WelcomeCardProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const t = useT();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("qlimwelt_welcome");
      if (raw) {
        setVisible(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.removeItem("qlimwelt_welcome");
    setDismissed(true);
  };

  if (!visible || dismissed) return null;

  let name = firstName;
  let company = companyName;

  if (!name || !company) {
    try {
      const raw = sessionStorage.getItem("qlimwelt_welcome");
      if (raw) {
        const parsed = JSON.parse(raw) as { firstName?: string; companyName?: string };
        name = name ?? parsed.firstName;
        company = company ?? parsed.companyName;
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/95 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#82D153]/15 text-[#3d8b2e] ring-1 ring-[#82D153]/25">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight">
            {t("overview.welcomeTitle", { name: name ? `, ${name}` : "" })}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("overview.welcomeBody", { company: company ?? t("overview.yourCompany") })}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleDismiss}
          aria-label={t("overview.dismissWelcome")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

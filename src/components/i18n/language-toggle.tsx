"use client";

import { cn } from "@/lib/utils";
import { LOCALES, type Locale } from "@/lib/i18n/types";
import { useLocale } from "@/components/i18n/locale-provider";

type LanguageToggleProps = {
  className?: string;
  compact?: boolean;
};

export function LanguageToggle({ className, compact }: LanguageToggleProps) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-background p-0.5 shadow-sm",
        className
      )}
      role="group"
      aria-label={t("common.language")}
    >
      {LOCALES.map((opt) => {
        const active = locale === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLocale(opt.code as Locale)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={active}
            title={opt.label}
          >
            {compact ? opt.short : opt.short}
          </button>
        );
      })}
    </div>
  );
}

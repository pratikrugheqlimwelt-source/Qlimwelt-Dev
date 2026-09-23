"use client";

import { ArrowDown, BrainCircuit, Building2, FileCheck2, Sparkles } from "lucide-react";
import { useT } from "@/components/i18n/locale-provider";

export function ArchitectureHero() {
  const t = useT();

  return (
    <div className="dash-card grid gap-6 p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] lg:gap-10 lg:p-8">
      <div>
        <p className="siemens-eyebrow">{t("connectedSystemsPage.heroEyebrow")}</p>
        <h3 className="type-title mt-2 text-2xl text-foreground sm:text-[1.75rem]">
          {t("connectedSystemsPage.heroTitle")}
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t("connectedSystemsPage.heroSubtitle")}
        </p>
        <p className="mt-4 max-w-xl text-sm font-medium text-foreground/80">
          {t("connectedSystemsPage.heroPositioning")}
        </p>
      </div>

      <div className="relative flex flex-col items-stretch justify-center gap-2 rounded-xl border border-border bg-secondary/40 p-5">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            {t("connectedSystemsPage.archEnterprise")}
          </span>
        </div>
        <div className="flex justify-center text-muted-foreground/40">
          <ArrowDown className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
          <BrainCircuit className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">
            {t("connectedSystemsPage.archLayer")}
          </span>
        </div>
        <div className="flex justify-center text-muted-foreground/40">
          <ArrowDown className="h-4 w-4" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: FileCheck2, key: "archReports" },
            { icon: Sparkles, key: "archAi" },
            { icon: FileCheck2, key: "archCompliance" },
            { icon: Building2, key: "archReduction" },
          ].map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2"
            >
              <Icon className="h-3.5 w-3.5 text-[hsl(var(--siemens-teal))]" />
              <span className="text-xs font-medium text-foreground/80">
                {t(`connectedSystemsPage.${key}`)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

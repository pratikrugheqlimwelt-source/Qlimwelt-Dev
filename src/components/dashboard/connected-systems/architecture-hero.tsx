"use client";

import { ArrowDown, BrainCircuit, Building2, FileCheck2, Sparkles } from "lucide-react";
import { useT } from "@/components/i18n/locale-provider";

export function ArchitectureHero() {
  const t = useT();

  return (
    <div className="dash-card grid gap-6 p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] lg:gap-10 lg:p-8">
      <div>
        <p className="dash-label text-[#3d8b2e]">{t("connectedSystemsPage.heroEyebrow")}</p>
        <h3 className="type-title mt-2 text-2xl text-foreground sm:text-[1.75rem]">
          {t("connectedSystemsPage.heroTitle")}
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t("connectedSystemsPage.heroSubtitle")}
        </p>
        <p className="mt-4 max-w-xl text-sm font-medium text-slate-700">
          {t("connectedSystemsPage.heroPositioning")}
        </p>
      </div>

      <div className="relative flex flex-col items-stretch justify-center gap-2 rounded-2xl border border-[#82D153]/25 bg-gradient-to-b from-[#f4fbf0] to-white p-5">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3">
          <Building2 className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-800">
            {t("connectedSystemsPage.archEnterprise")}
          </span>
        </div>
        <div className="flex justify-center text-slate-300">
          <ArrowDown className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#82D153]/35 bg-[#82D153]/10 px-4 py-3">
          <BrainCircuit className="h-4 w-4 text-[#2f6f24]" />
          <span className="text-sm font-semibold text-[#2f6f24]">
            {t("connectedSystemsPage.archLayer")}
          </span>
        </div>
        <div className="flex justify-center text-slate-300">
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
              className="flex items-center gap-2 rounded-lg border border-slate-200/70 bg-white px-3 py-2"
            >
              <Icon className="h-3.5 w-3.5 text-[#3d8b2e]" />
              <span className="text-xs font-medium text-slate-700">
                {t(`connectedSystemsPage.${key}`)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

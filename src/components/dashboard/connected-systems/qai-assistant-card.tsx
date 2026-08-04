"use client";

import { MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/locale-provider";
import { openQaiAssistant } from "@/lib/connected-systems/client-api";

const PROMPTS = ["promptSap", "promptData", "promptBest"] as const;

export function QaiAssistantCard() {
  const t = useT();

  return (
    <div className="dash-card relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#82D153]/15 blur-2xl" />
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#82D153]/15 text-[#2f6f24] ring-1 ring-[#82D153]/25">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="type-title text-lg">{t("connectedSystemsPage.qaiTitle")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("connectedSystemsPage.qaiPrompt")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PROMPTS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => openQaiAssistant(t(`connectedSystemsPage.${key}`))}
                className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-[#f4fbf0] hover:text-[#2f6f24] hover:ring-[#82D153]/35"
              >
                {t(`connectedSystemsPage.${key}`)}
              </button>
            ))}
          </div>
          <Button className="mt-4" onClick={() => openQaiAssistant(t("connectedSystemsPage.promptSap"))}>
            <MessageSquare className="mr-2 h-4 w-4" />
            {t("connectedSystemsPage.askQai")}
          </Button>
        </div>
      </div>
    </div>
  );
}

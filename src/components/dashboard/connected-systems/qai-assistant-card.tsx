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
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
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
                className="rounded-xl bg-secondary px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border transition hover:bg-primary/5 hover:text-primary hover:ring-primary/30"
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

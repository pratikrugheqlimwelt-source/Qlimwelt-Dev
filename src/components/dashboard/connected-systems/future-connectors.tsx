"use client";

import { Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/locale-provider";
import type { ConnectorDef } from "@/lib/connected-systems/types";

export function FutureConnectors({
  connectors,
  connectedIds,
  onConnect,
}: {
  connectors: ConnectorDef[];
  connectedIds: Set<string>;
  onConnect: (connector: ConnectorDef) => void;
}) {
  const t = useT();

  return (
    <div className="dash-card p-6">
      <p className="dash-label">{t("connectedSystemsPage.futureLabel")}</p>
      <h3 className="type-title mt-2 text-lg">{t("connectedSystemsPage.futureTitle")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("connectedSystemsPage.futureBody")}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {connectors.map((c) => {
          const connected = connectedIds.has(c.id);
          return (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.description}</p>
              </div>
              <Button
                size="sm"
                variant={connected ? "outline" : "brand"}
                onClick={() => onConnect(c)}
              >
                <Plug className="mr-1.5 h-3.5 w-3.5" />
                {connected
                  ? t("connectedSystemsPage.statusConnected")
                  : t("connectedSystemsPage.connect")}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

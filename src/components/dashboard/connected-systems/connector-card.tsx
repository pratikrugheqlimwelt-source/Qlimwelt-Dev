"use client";

import { CheckCircle2, Plug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/locale-provider";
import type { ConnectorDef } from "@/lib/connected-systems/types";

export function ConnectorCard({
  connector,
  connected,
  onConnect,
}: {
  connector: ConnectorDef;
  connected?: boolean;
  onConnect: (connector: ConnectorDef) => void;
}) {
  const t = useT();

  return (
    <div className="dash-card flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold tracking-wide text-slate-700 ring-1 ring-slate-200/80">
          {connector.mark}
        </div>
        {connected ? (
          <Badge variant="success" className="shrink-0">
            {t("connectedSystemsPage.statusConnected")}
          </Badge>
        ) : null}
      </div>
      <h4 className="type-title mt-4 text-base text-foreground">{connector.name}</h4>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
        {connector.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {connector.features.slice(0, 3).map((f) => (
          <span
            key={f}
            className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/70"
          >
            {f}
          </span>
        ))}
      </div>
      <Button
        className="mt-4 w-full"
        variant={connected ? "outline" : "brand"}
        onClick={() => onConnect(connector)}
      >
        {connected ? (
          <CheckCircle2 className="mr-2 h-4 w-4 text-[#2f6f24]" />
        ) : (
          <Plug className="mr-2 h-4 w-4" />
        )}
        {connected
          ? t("connectedSystemsPage.manageConnection")
          : t("connectedSystemsPage.connect")}
      </Button>
    </div>
  );
}

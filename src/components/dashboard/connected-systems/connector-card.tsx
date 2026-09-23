"use client";

import { CheckCircle2, Plug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConnectorIcon } from "@/components/dashboard/connected-systems/connector-icon";
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
    <div className="dash-card flex h-full flex-col p-5 transition-colors hover:border-primary/25">
      <div className="flex items-start justify-between gap-3">
        <ConnectorIcon
          connectorId={connector.id}
          mark={connector.mark}
          name={connector.name}
        />
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
            className="rounded-xl bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border"
          >
            {f}
          </span>
        ))}
      </div>
      <Button
        className="mt-4 w-full"
        variant={connected ? "outline" : "default"}
        onClick={() => onConnect(connector)}
      >
        {connected ? (
          <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
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

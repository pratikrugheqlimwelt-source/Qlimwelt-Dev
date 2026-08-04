"use client";

import { Loader2, RefreshCw, Unplug } from "lucide-react";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/dashboard/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useT } from "@/components/i18n/locale-provider";
import { scheduleLabel } from "@/lib/connected-systems/schedule";
import type { ConnectionHealth, SystemConnection } from "@/lib/connected-systems/types";
import { cn } from "@/lib/utils";

function healthBadge(health: ConnectionHealth): {
  className: string;
  labelKey: string;
} {
  switch (health) {
    case "healthy":
      return { className: "bg-emerald-50 text-emerald-700 ring-emerald-200", labelKey: "healthHealthy" };
    case "warning":
      return { className: "bg-amber-50 text-amber-700 ring-amber-200", labelKey: "healthWarning" };
    case "failed":
      return { className: "bg-red-50 text-red-700 ring-red-200", labelKey: "healthFailed" };
    default:
      return { className: "bg-slate-100 text-slate-600 ring-slate-200", labelKey: "healthDisconnected" };
  }
}

function relativeTime(iso: string | null, t: (k: string, p?: Record<string, string | number>) => string) {
  if (!iso) return t("connectedSystemsPage.never");
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return t("connectedSystemsPage.justNow");
  if (mins < 60) return t("connectedSystemsPage.minutesAgo", { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 48) return t("connectedSystemsPage.hoursAgo", { n: hours });
  return new Date(iso).toLocaleString();
}

export function ConnectionsTable({
  connections,
  syncingId,
  onSync,
  onDisconnect,
}: {
  connections: SystemConnection[];
  syncingId: string | null;
  onSync: (id: string) => void;
  onDisconnect: (id: string) => void;
}) {
  const t = useT();

  if (connections.length === 0) {
    return (
      <div className="dash-card px-6 py-10 text-center text-sm text-muted-foreground">
        {t("connectedSystemsPage.noConnections")}
      </div>
    );
  }

  return (
    <div className="dash-card overflow-hidden">
      <DataTable>
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>{t("connectedSystemsPage.colSystem")}</DataTableHead>
            <DataTableHead>{t("connectedSystemsPage.colType")}</DataTableHead>
            <DataTableHead>{t("connectedSystemsPage.colStatus")}</DataTableHead>
            <DataTableHead>{t("connectedSystemsPage.colLastSync")}</DataTableHead>
            <DataTableHead>{t("connectedSystemsPage.colNextSync")}</DataTableHead>
            <DataTableHead>{t("connectedSystemsPage.colOwner")}</DataTableHead>
            <DataTableHead>{t("connectedSystemsPage.colHealth")}</DataTableHead>
            <DataTableHead className="text-right">{t("connectedSystemsPage.colActions")}</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {connections.map((c) => {
            const hb = healthBadge(c.health);
            return (
              <DataTableRow key={c.id}>
                <DataTableCell>
                  <div>
                    <p className="font-semibold text-foreground">{c.connectionName}</p>
                    <p className="text-xs text-muted-foreground">{c.connectorName}</p>
                  </div>
                </DataTableCell>
                <DataTableCell className="capitalize">{c.connectorType}</DataTableCell>
                <DataTableCell>
                  <Badge variant={c.status === "connected" ? "success" : "secondary"}>
                    {c.status}
                  </Badge>
                </DataTableCell>
                <DataTableCell>{relativeTime(c.lastSync, t)}</DataTableCell>
                <DataTableCell>
                  {c.nextSync
                    ? new Date(c.nextSync).toLocaleString()
                    : scheduleLabel(c.syncSchedule)}
                </DataTableCell>
                <DataTableCell>{c.ownerLabel}</DataTableCell>
                <DataTableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          "inline-flex cursor-default rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
                          hb.className
                        )}
                      >
                        {t(`connectedSystemsPage.${hb.labelKey}`)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      {c.lastDiagnostic || t("connectedSystemsPage.noDiagnostics")}
                    </TooltipContent>
                  </Tooltip>
                </DataTableCell>
                <DataTableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={c.status !== "connected" || syncingId === c.id}
                      onClick={() => onSync(c.id)}
                    >
                      {syncingId === c.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={c.status === "disconnected"}
                      onClick={() => onDisconnect(c.id)}
                    >
                      <Unplug className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTable>
    </div>
  );
}

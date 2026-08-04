"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { ArchitectureHero } from "@/components/dashboard/connected-systems/architecture-hero";
import { ConnectorCard } from "@/components/dashboard/connected-systems/connector-card";
import { ConnectDialog } from "@/components/dashboard/connected-systems/connect-dialog";
import { ConnectionsTable } from "@/components/dashboard/connected-systems/connections-table";
import { DataFlowViz } from "@/components/dashboard/connected-systems/data-flow-viz";
import { QaiAssistantCard } from "@/components/dashboard/connected-systems/qai-assistant-card";
import { SyncManagement } from "@/components/dashboard/connected-systems/sync-management";
import { ImportCenter } from "@/components/dashboard/connected-systems/import-center";
import { ApiCenter } from "@/components/dashboard/connected-systems/api-center";
import { SecurityPanel } from "@/components/dashboard/connected-systems/security-panel";
import { FutureConnectors } from "@/components/dashboard/connected-systems/future-connectors";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/components/i18n/locale-provider";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  connectSystem,
  createApiKey,
  disconnectSystem,
  fetchApiKeys,
  fetchCatalog,
  fetchConnections,
  fetchSyncLogs,
  importFile,
  revokeApiKey,
  syncConnection,
  testConnection,
  updateSchedule,
} from "@/lib/connected-systems/client-api";
import { primaryCategories, ecosystemConnectors } from "@/lib/connected-systems/catalog";
import type {
  CompanyApiKey,
  ConnectorCategoryId,
  ConnectorDef,
  SyncLog,
  SyncSchedule,
  SystemConnection,
} from "@/lib/connected-systems/types";
import { cn } from "@/lib/utils";

export default function ConnectedSystemsPage() {
  const t = useT();
  const { company } = useDashboard();
  const companyId = company.id;
  const { user } = useAuth();
  const ownerLabel = user?.email?.split("@")[0] || "Admin";
  const ownerUserId = user?.id || "local";

  const [loading, setLoading] = useState(true);
  const [connectors, setConnectors] = useState<ConnectorDef[]>([]);
  const [connections, setConnections] = useState<SystemConnection[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [apiKeys, setApiKeys] = useState<CompanyApiKey[]>([]);
  const [category, setCategory] = useState<ConnectorCategoryId | "all">("all");
  const [activeConnector, setActiveConnector] = useState<ConnectorDef | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [catalog, conns, syncLogs, keys] = await Promise.all([
      fetchCatalog(companyId),
      fetchConnections(companyId),
      fetchSyncLogs(companyId),
      fetchApiKeys(companyId),
    ]);
    setConnectors(catalog.connectors.filter((c) => c.category !== "future"));
    setConnections(conns);
    setLogs(syncLogs);
    setApiKeys(keys);
  }, [companyId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const connectedIds = useMemo(
    () =>
      new Set(
        connections.filter((c) => c.status === "connected").map((c) => c.connectorId)
      ),
    [connections]
  );

  const filtered = useMemo(() => {
    if (category === "all") return connectors;
    return connectors.filter((c) => c.category === category);
  }, [connectors, category]);

  const categories = primaryCategories().filter((c) => c.id !== "future");

  const openConnect = (connector: ConnectorDef) => {
    setActiveConnector(connector);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={t("pages.connectedSystems.title")}
        description={t("pages.connectedSystems.description")}
        tip={t("pages.connectedSystems.tip")}
      />

      <ArchitectureHero />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="dash-label">{t("connectedSystemsPage.catalogLabel")}</p>
                <h3 className="type-title mt-1 text-lg">{t("connectedSystemsPage.catalogTitle")}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold ring-1 transition",
                    category === "all"
                      ? "bg-[#82D153]/15 text-[#2f6f24] ring-[#82D153]/35"
                      : "bg-white text-slate-600 ring-slate-200"
                  )}
                >
                  {t("connectedSystemsPage.allCategories")}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold ring-1 transition",
                      category === c.id
                        ? "bg-[#82D153]/15 text-[#2f6f24] ring-[#82D153]/35"
                        : "bg-white text-slate-600 ring-slate-200"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((connector) => (
                <ConnectorCard
                  key={connector.id}
                  connector={connector}
                  connected={connectedIds.has(connector.id)}
                  onConnect={openConnect}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="dash-label">{t("connectedSystemsPage.tableLabel")}</p>
            <h3 className="type-title mt-1 mb-4 text-lg">{t("connectedSystemsPage.tableTitle")}</h3>
            <ConnectionsTable
              connections={connections}
              syncingId={syncingId}
              onSync={async (id) => {
                setSyncingId(id);
                try {
                  const log = await syncConnection(companyId, id);
                  toast({
                    title: t("connectedSystemsPage.syncDoneTitle"),
                    description: log.log,
                  });
                  await refresh();
                } catch (e) {
                  toast({
                    title: t("connectedSystemsPage.syncFailTitle"),
                    description: e instanceof Error ? e.message : "Sync failed",
                    variant: "destructive",
                  });
                } finally {
                  setSyncingId(null);
                }
              }}
              onDisconnect={async (id) => {
                await disconnectSystem(companyId, id);
                toast({ title: t("connectedSystemsPage.disconnectedTitle") });
                await refresh();
              }}
            />
          </div>

          <DataFlowViz />

          <div className="grid gap-6 lg:grid-cols-2">
            <QaiAssistantCard />
            <SyncManagement
              connections={connections}
              logs={logs}
              onScheduleChange={async (connectionId, schedule: SyncSchedule) => {
                await updateSchedule(companyId, connectionId, schedule);
                setConnections((prev) =>
                  prev.map((c) =>
                    c.id === connectionId ? { ...c, syncSchedule: schedule } : c
                  )
                );
                toast({ title: t("connectedSystemsPage.scheduleUpdated") });
                await refresh();
              }}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ImportCenter
              onConfirmImport={async (fileName, connectorId) => {
                await importFile(companyId, ownerUserId, ownerLabel, fileName, connectorId);
                await refresh();
              }}
            />
            <ApiCenter
              keys={apiKeys}
              onCreate={async (name) => {
                const result = await createApiKey(companyId, name);
                setApiKeys((prev) => [result.key, ...prev]);
                return result;
              }}
              onRevoke={async (id) => {
                await revokeApiKey(companyId, id);
                setApiKeys((prev) => prev.filter((k) => k.id !== id));
                toast({ title: t("connectedSystemsPage.keyRevoked") });
              }}
            />
          </div>

          <SecurityPanel />

          <FutureConnectors
            connectors={ecosystemConnectors()}
            connectedIds={connectedIds}
            onConnect={openConnect}
          />
        </>
      )}

      <ConnectDialog
        connector={activeConnector}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onTest={testConnection}
        onSave={async (payload) => {
          const result = await connectSystem(companyId, ownerUserId, ownerLabel, payload);
          if (result.error) {
            toast({
              title: t("connectedSystemsPage.connectFailTitle"),
              description: result.error,
              variant: "destructive",
            });
            return { error: result.error };
          }
          toast({ title: t("connectedSystemsPage.connectOkTitle") });
          await refresh();
          return {};
        }}
      />
    </div>
  );
}

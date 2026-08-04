"use client";

import { useT } from "@/components/i18n/locale-provider";
import type { SyncLog, SyncSchedule, SystemConnection } from "@/lib/connected-systems/types";
import { cn } from "@/lib/utils";

const SCHEDULES: SyncSchedule[] = ["realtime", "hourly", "daily", "weekly", "manual"];

export function SyncManagement({
  connections,
  logs,
  onScheduleChange,
}: {
  connections: SystemConnection[];
  logs: SyncLog[];
  onScheduleChange: (connectionId: string, schedule: SyncSchedule) => void;
}) {
  const t = useT();
  const active = connections.find((c) => c.status === "connected") ?? connections[0];
  const last = logs[0];
  const successRate =
    logs.length === 0
      ? null
      : Math.round((logs.filter((l) => l.status === "success").length / logs.length) * 100);

  return (
    <div className="dash-card p-6">
      <p className="dash-label">{t("connectedSystemsPage.syncLabel")}</p>
      <h3 className="type-title mt-2 text-lg">{t("connectedSystemsPage.syncTitle")}</h3>

      {active ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("connectedSystemsPage.syncFor", { name: active.connectionName })}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {SCHEDULES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onScheduleChange(active.id, s)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition",
                  active.syncSchedule === s
                    ? "bg-[#82D153]/15 text-[#2f6f24] ring-[#82D153]/35"
                    : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                )}
              >
                {t(`connectedSystemsPage.schedule.${s}`)}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{t("connectedSystemsPage.syncEmpty")}</p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: t("connectedSystemsPage.metricLastSync"),
            value: last ? new Date(last.createdAt).toLocaleString() : "—",
          },
          {
            label: t("connectedSystemsPage.metricDuration"),
            value: last ? `${(last.durationMs / 1000).toFixed(1)}s` : "—",
          },
          {
            label: t("connectedSystemsPage.metricRecords"),
            value: last ? String(last.importedRecords) : "—",
          },
          {
            label: t("connectedSystemsPage.metricSuccess"),
            value: successRate == null ? "—" : `${successRate}%`,
          },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {m.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>
      {last && last.failedRecords > 0 && (
        <p className="mt-3 text-xs text-amber-700">
          {t("connectedSystemsPage.metricErrors", { n: last.failedRecords })}
        </p>
      )}
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/locale-provider";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ACCEPT = ".csv,.xlsx,.xls,.pdf,.json,.xml";

export function ImportCenter({
  onConfirmImport,
}: {
  onConfirmImport?: (fileName: string, connectorId: string) => Promise<void>;
}) {
  const t = useT();
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<{
    name: string;
    rows: string[][];
    errors: string[];
    connectorId: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const parseFile = useCallback(
    async (file: File) => {
      setBusy(true);
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        const connectorId =
          ext === "xlsx" || ext === "xls"
            ? "excel"
            : ext === "pdf"
              ? "pdf"
              : ext === "json"
                ? "json"
                : ext === "xml"
                  ? "xml"
                  : "csv";
        const errors: string[] = [];
        let rows: string[][] = [];

        if (ext === "csv" || ext === "json" || ext === "xml" || ext === "txt") {
          const text = await file.text();
          if (ext === "csv") {
            rows = text
              .split(/\r?\n/)
              .filter(Boolean)
              .slice(0, 6)
              .map((line) => line.split(",").map((c) => c.trim()));
            if (rows[0] && rows[0].length < 2) {
              errors.push(t("connectedSystemsPage.importColError"));
            }
          } else if (ext === "json") {
            try {
              const data = JSON.parse(text) as unknown;
              const arr = Array.isArray(data) ? data : [data];
              const keys = Object.keys((arr[0] as object) ?? {});
              rows = [keys, ...arr.slice(0, 5).map((r) => keys.map((k) => String((r as Record<string, unknown>)[k] ?? "")))];
            } catch {
              errors.push(t("connectedSystemsPage.importJsonError"));
            }
          } else {
            rows = [[t("connectedSystemsPage.importPreviewRaw")], [text.slice(0, 120) + "…"]];
          }
        } else {
          rows = [
            [t("connectedSystemsPage.importFile")],
            [file.name, `${Math.round(file.size / 1024)} KB`],
          ];
          if (ext === "pdf") errors.push(t("connectedSystemsPage.importPdfNote"));
        }

        // Auto field map stubs
        const header = rows[0] ?? [];
        const mapped = header.map((h) => {
          const lower = h.toLowerCase();
          if (lower.includes("date")) return "activity_date";
          if (lower.includes("amount") || lower.includes("value") || lower.includes("kwh")) return "quantity";
          if (lower.includes("unit")) return "unit";
          if (lower.includes("scope")) return "scope";
          return "unmapped";
        });
        if (header.length && mapped.every((m) => m === "unmapped")) {
          errors.push(t("connectedSystemsPage.importMapWarn"));
        }

        setPreview({ name: file.name, rows, errors, connectorId });
        toast({
          title: t("connectedSystemsPage.importReadyTitle"),
          description: t("connectedSystemsPage.importReadyBody", { name: file.name }),
        });
      } finally {
        setBusy(false);
      }
    },
    [t]
  );

  return (
    <div className="dash-card p-6">
      <p className="dash-label">{t("connectedSystemsPage.importLabel")}</p>
      <h3 className="type-title mt-2 text-lg">{t("connectedSystemsPage.importTitle")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("connectedSystemsPage.importBody")}</p>

      <label
        className={cn(
          "mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 transition",
          dragging
            ? "border-[#82D153] bg-[#f4fbf0]"
            : "border-slate-300 bg-slate-50/50 hover:border-[#82D153]/50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void parseFile(file);
        }}
      >
        <FileUp className="h-8 w-8 text-slate-400" />
        <p className="mt-3 text-sm font-medium text-slate-700">{t("connectedSystemsPage.importDrop")}</p>
        <p className="mt-1 text-xs text-muted-foreground">CSV · Excel · PDF · JSON · XML</p>
        <input
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void parseFile(file);
          }}
        />
      </label>

      {busy && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("connectedSystemsPage.importParsing")}
        </div>
      )}

      {preview && (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold">{preview.name}</p>
          {preview.errors.length > 0 && (
            <ul className="space-y-1">
              {preview.errors.map((err) => (
                <li key={err} className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {err}
                </li>
              ))}
            </ul>
          )}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-xs">
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className={i === 0 ? "bg-slate-50 font-semibold" : ""}>
                    {row.map((cell, j) => (
                      <td key={j} className="border-b border-slate-100 px-3 py-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            variant="brand"
            disabled={busy}
            onClick={async () => {
              if (!preview) return;
              setBusy(true);
              try {
                if (onConfirmImport) {
                  await onConfirmImport(preview.name, preview.connectorId);
                }
                toast({
                  title: t("connectedSystemsPage.importQueuedTitle"),
                  description: t("connectedSystemsPage.importQueuedBody"),
                });
              } catch (e) {
                toast({
                  title: t("connectedSystemsPage.syncFailTitle"),
                  description: e instanceof Error ? e.message : "Import failed",
                  variant: "destructive",
                });
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("connectedSystemsPage.importConfirm")}
          </Button>
        </div>
      )}
    </div>
  );
}

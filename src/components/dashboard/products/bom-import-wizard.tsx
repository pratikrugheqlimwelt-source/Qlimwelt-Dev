"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  autoMappingForFile,
  previewFromSpreadsheet,
} from "@/lib/bom/import/spreadsheet";
import type { BomImportColumnMapping, BomImportJob, BomImportPreview } from "@/lib/bom/types";

type Props = {
  busy?: boolean;
  onPreview: (
    fileName: string,
    csvText: string,
    mapping?: Partial<BomImportColumnMapping>
  ) => Promise<BomImportJob>;
  onCommit: (jobId: string) => Promise<void>;
};

type WizardStep = "upload" | "map" | "preview";

const FIELD_LABELS: { key: keyof BomImportColumnMapping; label: string; required?: boolean }[] = [
  { key: "partNumber", label: "Part number", required: true },
  { key: "parentPartNumber", label: "Parent part number" },
  { key: "description", label: "Description" },
  { key: "quantity", label: "Quantity" },
  { key: "unit", label: "Unit" },
  { key: "itemType", label: "Item type" },
  { key: "scrapRate", label: "Scrap rate" },
  { key: "yieldRate", label: "Yield rate" },
  { key: "sequenceNo", label: "Sequence" },
];

export function BomImportWizard({ busy, onPreview, onCommit }: Props) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<BomImportColumnMapping | null>(null);
  const [localPreview, setLocalPreview] = useState<BomImportPreview | null>(null);
  const [job, setJob] = useState<BomImportJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCommit = useMemo(
    () => !!job && job.errorCount === 0 && job.status === "preview",
    [job]
  );

  async function handleFile(file: File) {
    setError(null);
    setJob(null);
    setFileName(file.name);
    const lower = file.name.toLowerCase();
    try {
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".xlsm")) {
        const buffer = await file.arrayBuffer();
        const auto = autoMappingForFile(file.name, buffer);
        // Convert first sheet to CSV text for API/local commit path
        const csv = auto.matrix.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ).join("\n");
        setCsvText(csv);
        setHeaders(auto.headers);
        setMapping(auto.mapping);
        setLocalPreview(previewFromSpreadsheet(file.name, buffer, auto.mapping));
      } else {
        const text = await file.text();
        const auto = autoMappingForFile(file.name, text);
        setCsvText(text);
        setHeaders(auto.headers);
        setMapping(auto.mapping);
        setLocalPreview(previewFromSpreadsheet(file.name, text, auto.mapping));
      }
      setStep("map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    }
  }

  return (
    <div className="dash-card space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold">Import BOM (CSV / Excel)</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload → map columns → preview validation → commit. Supports .csv, .xlsx, .xls.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        <span className={step === "upload" ? "font-semibold text-foreground" : ""}>1. Upload</span>
        <span>→</span>
        <span className={step === "map" ? "font-semibold text-foreground" : ""}>2. Map</span>
        <span>→</span>
        <span className={step === "preview" ? "font-semibold text-foreground" : ""}>3. Preview</span>
      </div>

      {step === "upload" && (
        <div>
          <Label htmlFor="bom-file">BOM file</Label>
          <input
            id="bom-file"
            type="file"
            accept=".csv,.tsv,.xlsx,.xls,.xlsm,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="mt-1 block w-full text-sm"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </div>
      )}

      {step === "map" && mapping && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            File: <strong>{fileName}</strong> — adjust column mapping if auto-detect is wrong.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {FIELD_LABELS.map((field) => (
              <div key={field.key}>
                <Label className="text-xs">
                  {field.label}
                  {field.required ? " *" : ""}
                </Label>
                <select
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={mapping[field.key] ?? ""}
                  onChange={(e) => {
                    const value = e.target.value || undefined;
                    setMapping((prev) => {
                      if (!prev) return prev;
                      const next = { ...prev };
                      if (field.key === "partNumber") {
                        next.partNumber = value || prev.partNumber;
                      } else {
                        (next as Record<string, string | undefined>)[field.key] = value;
                      }
                      return next;
                    });
                  }}
                >
                  <option value="">— not mapped —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setStep("upload");
                setFileName(null);
                setCsvText(null);
                setMapping(null);
                setLocalPreview(null);
                setJob(null);
              }}
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={busy || !csvText || !mapping?.partNumber}
              onClick={async () => {
                if (!csvText || !fileName || !mapping) return;
                setError(null);
                try {
                  const next = await onPreview(fileName, csvText, mapping);
                  setJob(next);
                  setLocalPreview(next.preview);
                  setStep("preview");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Preview failed");
                }
              }}
            >
              {busy ? "Working…" : "Preview import"}
            </Button>
          </div>
          {localPreview && (
            <p className="text-xs text-muted-foreground">
              Local scan: {localPreview.validCount} valid · {localPreview.warningCount} warnings ·{" "}
              {localPreview.errorCount} errors
            </p>
          )}
        </div>
      )}

      {step === "preview" && job && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <p>
            Rows: <strong>{job.rowCount}</strong> · Valid: <strong>{job.validCount}</strong> ·
            Warnings: <strong>{job.warningCount}</strong> · Errors:{" "}
            <strong>{job.errorCount}</strong>
          </p>
          {job.preview.issues.slice(0, 8).map((issue, idx) => (
            <p key={`${issue.code}-${idx}`} className="text-xs text-amber-800">
              {issue.code}: {issue.message}
            </p>
          ))}
          {job.preview.issues.length > 8 && (
            <p className="text-xs text-muted-foreground">
              +{job.preview.issues.length - 8} more issues
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setStep("map")}>
              Back to mapping
            </Button>
            <Button
              disabled={!canCommit || busy}
              onClick={async () => {
                if (!job) return;
                setError(null);
                try {
                  await onCommit(job.id);
                  setJob({ ...job, status: "committed" });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Commit failed");
                }
              }}
            >
              {busy
                ? "Working…"
                : canCommit
                  ? "Commit import"
                  : job.status === "committed"
                    ? "Committed"
                    : "Fix errors to commit"}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

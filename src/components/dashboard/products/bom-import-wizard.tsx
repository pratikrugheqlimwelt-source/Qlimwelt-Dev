"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { BomImportJob } from "@/lib/bom/types";

type Props = {
  busy?: boolean;
  onPreview: (fileName: string, csvText: string) => Promise<BomImportJob>;
  onCommit: (jobId: string) => Promise<void>;
};

export function BomImportWizard({ busy, onPreview, onCommit }: Props) {
  const [job, setJob] = useState<BomImportJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCommit = useMemo(
    () => !!job && job.errorCount === 0 && job.status === "preview",
    [job]
  );

  return (
    <div className="dash-card space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold">Import BOM (CSV)</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload → preview validation → commit. Expected columns: part_number, parent_part_number,
          description, quantity, unit.
        </p>
      </div>
      <div>
        <Label htmlFor="bom-csv">CSV file</Label>
        <input
          id="bom-csv"
          type="file"
          accept=".csv,text/csv"
          className="mt-1 block w-full text-sm"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError(null);
            try {
              const text = await file.text();
              const next = await onPreview(file.name, text);
              setJob(next);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Preview failed");
            }
          }}
        />
      </div>

      {job && (
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
            {busy ? "Working…" : canCommit ? "Commit import" : job.status === "committed" ? "Committed" : "Fix errors to commit"}
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

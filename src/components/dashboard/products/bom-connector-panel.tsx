"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  commitBomImport,
  listBomConnectorProfiles,
  previewBomConnectorImport,
} from "@/lib/bom/client-api";
import type { BomConnectorKind } from "@/lib/bom/connectors";
import type { BomImportJob } from "@/lib/bom/types";

type Props = {
  companyId: string;
  bomId: string;
  busy?: boolean;
  onCommitted?: () => void;
};

export function BomConnectorPanel({ companyId, bomId, busy, onCommitted }: Props) {
  const profiles = useMemo(() => listBomConnectorProfiles(), []);
  const [kind, setKind] = useState<BomConnectorKind>("generic_json");
  const [payload, setPayload] = useState("");
  const [job, setJob] = useState<BomImportJob | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = profiles.find((p) => p.kind === kind) ?? profiles[0];

  async function onPreview() {
    setWorking(true);
    setError(null);
    try {
      const result = await previewBomConnectorImport(
        companyId,
        bomId,
        kind,
        payload,
        `${kind}-payload`
      );
      setJob(result.job);
      setWarnings(result.normalized.warnings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
      setJob(null);
    } finally {
      setWorking(false);
    }
  }

  async function onCommit() {
    if (!job) return;
    setWorking(true);
    setError(null);
    try {
      await commitBomImport(companyId, job.id);
      setJob(null);
      setPayload("");
      onCommitted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Commit failed");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="dash-card space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold">ERP / PLM / PDM connectors</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Normalize vendor exports into the canonical BOM import pipeline (preview → commit).
        </p>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Connector</label>
        <select
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as BomConnectorKind);
            setJob(null);
            setWarnings([]);
          }}
        >
          {profiles.map((p) => (
            <option key={p.kind} value={p.kind}>
              {p.label}
            </option>
          ))}
        </select>
        {profile ? (
          <p className="text-[11px] text-muted-foreground">{profile.description}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Payload (JSON or CSV)</label>
        <textarea
          className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder={profile?.sampleHint}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={busy || working || !payload.trim()}
          onClick={() => void onPreview()}
        >
          {working ? "Working…" : "Normalize & preview"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || working || !job || job.errorCount > 0}
          onClick={() => void onCommit()}
        >
          Commit to BOM
        </Button>
      </div>

      {warnings.length > 0 ? (
        <ul className="space-y-1 text-[11px] text-amber-800">
          {warnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      ) : null}

      {job ? (
        <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs">
          <p>
            Preview · {job.rowCount} rows · {job.validCount} valid · {job.errorCount} errors
            {job.connectorKind ? ` · ${job.connectorKind}` : ""}
          </p>
          {job.preview.rows.slice(0, 6).map((r) => (
            <p key={`${r.row}-${r.partNumber}`} className="font-mono text-[11px] text-muted-foreground">
              {r.parentPartNumber ? `${r.parentPartNumber} → ` : ""}
              {r.partNumber} · {r.quantity} {r.unit}
            </p>
          ))}
          {job.preview.rows.length > 6 ? (
            <p className="text-[11px] text-muted-foreground">
              …and {job.preview.rows.length - 6} more
            </p>
          ) : null}
          {job.preview.issues.slice(0, 4).map((issue, i) => (
            <p key={i} className="text-[11px] text-destructive">
              {issue.code}: {issue.message}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

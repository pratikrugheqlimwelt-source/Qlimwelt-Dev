"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  acceptSupplierPcfRecord,
  confirmProductIdentityMapping,
  createProductIdentityMapping,
  fetchPactExchanges,
  fetchProductIdentityMappings,
  fetchSupplierPcfRecords,
  importPactV3Footprint,
  rejectProductIdentityMapping,
  rejectSupplierPcfRecord,
} from "@/lib/bom/client-api";
import type { BomItem } from "@/lib/bom/types";
import type {
  PactExchange,
  ProductIdentityMapping,
  SupplierPcfRecord,
} from "@/lib/bom/carbon/pact/types";

type Props = {
  companyId: string;
  productId: string;
  bomId: string;
  items: BomItem[];
  selectedItemId?: string | null;
  refreshKey?: number | string;
  onChanged?: () => void;
};

export function BomPactPanel({
  companyId,
  productId,
  bomId,
  items,
  selectedItemId,
  refreshKey,
  onChanged,
}: Props) {
  const [exchanges, setExchanges] = useState<PactExchange[]>([]);
  const [mappings, setMappings] = useState<ProductIdentityMapping[]>([]);
  const [records, setRecords] = useState<SupplierPcfRecord[]>([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importJson, setImportJson] = useState("");
  const [mapValue, setMapValue] = useState("");
  const [mapScheme, setMapScheme] = useState<ProductIdentityMapping["scheme"]>("custom");
  const [mapItemId, setMapItemId] = useState("");
  const [acceptItemByRecord, setAcceptItemByRecord] = useState<Record<string, string>>({});

  const editableItems = useMemo(
    () => items.filter((i) => i.parentItemId != null || i.itemType !== "product"),
    [items]
  );

  const reload = useCallback(async () => {
    setWorking(true);
    setError(null);
    try {
      const [ex, maps, recs] = await Promise.all([
        fetchPactExchanges(companyId),
        fetchProductIdentityMappings(companyId, { productId }),
        fetchSupplierPcfRecords(companyId),
      ]);
      setExchanges(ex.slice(0, 20));
      setMappings(maps);
      setRecords(recs);
      setMapItemId((prev) => {
        if (selectedItemId && editableItems.some((i) => i.id === selectedItemId)) {
          return selectedItemId;
        }
        return prev || editableItems[0]?.id || "";
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load PACT data");
    } finally {
      setWorking(false);
    }
  }, [companyId, productId, editableItems, selectedItemId]);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  useEffect(() => {
    if (selectedItemId && editableItems.some((i) => i.id === selectedItemId)) {
      setMapItemId(selectedItemId);
    }
  }, [selectedItemId, editableItems]);

  async function onCreateMapping() {
    if (!mapValue.trim() || !mapItemId) return;
    setWorking(true);
    setError(null);
    try {
      const mapping = await createProductIdentityMapping(companyId, {
        productId,
        bomItemId: mapItemId,
        scheme: mapScheme,
        value: mapValue.trim(),
        status: "confirmed",
      });
      setMappings((prev) => [mapping, ...prev.filter((m) => m.id !== mapping.id)]);
      setMapValue("");
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create mapping failed");
    } finally {
      setWorking(false);
    }
  }

  async function onMappingAction(id: string, action: "confirm" | "reject") {
    setWorking(true);
    setError(null);
    try {
      const updated =
        action === "confirm"
          ? await confirmProductIdentityMapping(companyId, id)
          : await rejectProductIdentityMapping(companyId, id);
      setMappings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mapping action failed");
    } finally {
      setWorking(false);
    }
  }

  async function onImport() {
    setWorking(true);
    setError(null);
    try {
      const parsed = JSON.parse(importJson) as unknown;
      const bundle = await importPactV3Footprint(companyId, parsed);
      setRecords((prev) => [bundle.record, ...prev.filter((r) => r.id !== bundle.record.id)]);
      setExchanges((prev) => {
        const next = prev.filter((e) => e.id !== bundle.exchangeId);
        return [
          {
            id: bundle.exchangeId,
            companyId,
            direction: "inbound" as const,
            kind: "import" as const,
            idempotencyKey: `import:${bundle.record.id}`,
            status: "completed" as const,
            createdAt: new Date().toISOString(),
          },
          ...next,
        ].slice(0, 20);
      });
      setImportJson("");
      await reload();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setWorking(false);
    }
  }

  async function onAcceptRecord(recordId: string) {
    const bomItemId = acceptItemByRecord[recordId] || mapItemId;
    if (!bomItemId) {
      setError("Select a BOM item before accepting");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const updated = await acceptSupplierPcfRecord(companyId, recordId, { bomItemId });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Accept failed");
    } finally {
      setWorking(false);
    }
  }

  async function onRejectRecord(recordId: string) {
    setWorking(true);
    setError(null);
    try {
      const updated = await rejectSupplierPcfRecord(companyId, recordId);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setWorking(false);
    }
  }

  const pendingRecords = records.filter(
    (r) => r.status === "received" || r.status === "mapped"
  );

  return (
    <div className="dash-card space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold">PACT V3 exchange</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Identity mappings, inbound ProductFootprint review, and exchange history for BOM{" "}
          <span className="font-mono">{bomId.slice(0, 8)}</span>.
        </p>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-xs font-medium">Identity mapping</p>
        <select
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
          value={mapItemId}
          onChange={(e) => setMapItemId(e.target.value)}
        >
          {editableItems.map((i) => (
            <option key={i.id} value={i.id}>
              {i.partNumber} · {i.quantity} {i.unit}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-xs"
            value={mapScheme}
            onChange={(e) =>
              setMapScheme(e.target.value as ProductIdentityMapping["scheme"])
            }
          >
            <option value="custom">custom</option>
            <option value="gtin">gtin</option>
            <option value="supplier_part">supplier_part</option>
            <option value="urn">urn</option>
          </select>
          <Input
            className="min-w-[12rem] flex-1"
            placeholder={mapScheme === "gtin" ? "GTIN digits" : "Part / identity value"}
            value={mapValue}
            onChange={(e) => setMapValue(e.target.value)}
          />
          <Button
            size="sm"
            disabled={working || !mapItemId || !mapValue.trim()}
            onClick={() => void onCreateMapping()}
          >
            Confirm mapping
          </Button>
        </div>
        <div className="space-y-2">
          {mappings.length === 0 ? (
            <p className="text-xs text-muted-foreground">No identity mappings yet.</p>
          ) : (
            mappings.slice(0, 12).map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border/70 bg-background px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-medium">
                    {m.scheme} · <span className="font-mono">{m.value}</span> · {m.status}
                  </p>
                  <p className="break-all text-muted-foreground">{m.urn}</p>
                </div>
                {m.status === "candidate" ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      disabled={working}
                      onClick={() => void onMappingAction(m.id, "confirm")}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      disabled={working}
                      onClick={() => void onMappingAction(m.id, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-xs font-medium">Import ProductFootprint</p>
        <textarea
          className="min-h-[100px] w-full rounded-md border border-input bg-background px-2 py-1 font-mono text-[11px]"
          placeholder="Paste PACT V3 ProductFootprint JSON"
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
        />
        <Button
          size="sm"
          disabled={working || !importJson.trim()}
          onClick={() => void onImport()}
        >
          Import JSON
        </Button>

        <div className="space-y-2 pt-2">
          {pendingRecords.length === 0 ? (
            <p className="text-xs text-muted-foreground">No pending supplier PCF records.</p>
          ) : (
            pendingRecords.map((r) => (
              <div
                key={r.id}
                className="space-y-2 rounded-md border border-border/70 bg-background px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-medium">
                    {r.status}
                    {r.pcfExcludingBiogenic != null
                      ? ` · ${r.pcfExcludingBiogenic} kgCO₂e/${r.declaredUnit ?? "?"}`
                      : ""}
                  </p>
                  <p className="break-all text-muted-foreground">
                    {r.productIdentityUrns.join(", ") || "no productIds"}
                  </p>
                </div>
                <select
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                  value={acceptItemByRecord[r.id] || mapItemId}
                  onChange={(e) =>
                    setAcceptItemByRecord((prev) => ({
                      ...prev,
                      [r.id]: e.target.value,
                    }))
                  }
                >
                  {editableItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      Bind to {i.partNumber}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    disabled={working}
                    onClick={() => void onAcceptRecord(r.id)}
                  >
                    Accept → EF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    disabled={working}
                    onClick={() => void onRejectRecord(r.id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium">Exchange history</p>
        {exchanges.length === 0 ? (
          <p className="text-xs text-muted-foreground">No exchanges yet.</p>
        ) : (
          exchanges.map((e) => (
            <div
              key={e.id}
              className="rounded-md border border-border/70 bg-background px-3 py-2 text-xs"
            >
              <p className="font-medium">
                {e.direction}/{e.kind} · {e.status}
              </p>
              <p className="text-muted-foreground">
                {new Date(e.createdAt).toLocaleString()}
                {e.errorCode ? ` · ${e.errorCode}` : ""}
                {e.calculationId ? ` · calc ${e.calculationId.slice(0, 8)}` : ""}
                {e.supplierPcfRecordId
                  ? ` · record ${e.supplierPcfRecordId.slice(0, 8)}`
                  : ""}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

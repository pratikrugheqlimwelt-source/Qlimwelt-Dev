"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  approveSupplierPcfRequest,
  cancelSupplierPcfRequest,
  createSupplierPcfRequest,
  fetchSupplierPcfRequests,
  rejectSupplierPcfRequest,
  sendSupplierPcfRequest,
} from "@/lib/bom/client-api";
import type { BomItem } from "@/lib/bom/types";
import type { SupplierPcfRequest } from "@/lib/bom/carbon/supplier-pcf";

type Props = {
  companyId: string;
  bomId: string;
  items: BomItem[];
  selectedItemId?: string | null;
  refreshKey?: number | string;
};

export function BomSupplierPcfPanel({
  companyId,
  bomId,
  items,
  selectedItemId,
  refreshKey,
}: Props) {
  const [requests, setRequests] = useState<SupplierPcfRequest[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [message, setMessage] = useState("Please provide primary PCF for this part.");
  const [itemId, setItemId] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const editableItems = useMemo(
    () => items.filter((i) => i.parentItemId != null || i.itemType !== "product"),
    [items]
  );

  const reload = useCallback(async () => {
    setWorking(true);
    setError(null);
    try {
      const list = await fetchSupplierPcfRequests(companyId, bomId);
      setRequests(list);
      setItemId((prev) => {
        if (selectedItemId && editableItems.some((i) => i.id === selectedItemId)) {
          return selectedItemId;
        }
        return prev || editableItems[0]?.id || "";
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load supplier requests");
    } finally {
      setWorking(false);
    }
  }, [companyId, bomId, editableItems, selectedItemId]);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  useEffect(() => {
    if (selectedItemId && editableItems.some((i) => i.id === selectedItemId)) {
      setItemId(selectedItemId);
    }
  }, [selectedItemId, editableItems]);

  function portalUrl(token: string): string {
    if (typeof window === "undefined") return `/supplier-pcf/${token}`;
    return `${window.location.origin}/supplier-pcf/${token}`;
  }

  async function onCreate(send: boolean) {
    if (!itemId || !supplierName.trim()) return;
    setWorking(true);
    setError(null);
    try {
      const request = await createSupplierPcfRequest(companyId, {
        bomId,
        bomItemId: itemId,
        supplierName: supplierName.trim(),
        supplierEmail: supplierEmail.trim() || null,
        message: message.trim() || null,
        send,
      });
      setRequests((prev) => [request, ...prev.filter((r) => r.id !== request.id)]);
      setSupplierName("");
      setSupplierEmail("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setWorking(false);
    }
  }

  async function onAction(
    id: string,
    action: "send" | "cancel" | "approve" | "reject"
  ) {
    setWorking(true);
    setError(null);
    try {
      let updated: SupplierPcfRequest;
      if (action === "send") updated = await sendSupplierPcfRequest(companyId, id);
      else if (action === "cancel") updated = await cancelSupplierPcfRequest(companyId, id);
      else if (action === "approve") updated = await approveSupplierPcfRequest(companyId, id);
      else updated = await rejectSupplierPcfRequest(companyId, id);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setWorking(false);
    }
  }

  async function copyLink(req: SupplierPcfRequest) {
    try {
      await navigator.clipboard.writeText(portalUrl(req.accessToken));
      setCopiedId(req.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Could not copy portal link");
    }
  }

  return (
    <div className="dash-card space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold">Supplier PCF requests</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Request primary data via a token portal. Approving attaches a synthetic EF and
          supplier_pcf mapping (calc remains qty × EF).
        </p>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-xs font-medium">New request</p>
        <select
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
        >
          {editableItems.map((i) => (
            <option key={i.id} value={i.id}>
              {i.partNumber} · {i.quantity} {i.unit}
            </option>
          ))}
        </select>
        <Input
          placeholder="Supplier name"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
        />
        <Input
          placeholder="Supplier email (optional)"
          value={supplierEmail}
          onChange={(e) => setSupplierEmail(e.target.value)}
        />
        <Input
          placeholder="Message to supplier"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={working || !itemId || !supplierName.trim()}
            onClick={() => void onCreate(false)}
          >
            Save draft
          </Button>
          <Button
            size="sm"
            disabled={working || !itemId || !supplierName.trim()}
            onClick={() => void onCreate(true)}
          >
            Create &amp; send
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {requests.length === 0 ? (
          <p className="text-xs text-muted-foreground">No supplier PCF requests yet.</p>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              className="space-y-2 rounded-md border border-border/70 bg-background px-3 py-2 text-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    <span className="font-mono">{r.partNumber}</span> · {r.supplierName}
                  </p>
                  <p className="text-muted-foreground">
                    {r.status}
                    {r.declaredKgco2ePerUnit != null
                      ? ` · ${r.declaredKgco2ePerUnit} kgCO₂e/${r.declaredUnit}`
                      : ""}
                    {r.resultingFactorId ? " · factor attached" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(r.status === "draft" || r.status === "sent") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      disabled={working}
                      onClick={() => void copyLink(r)}
                    >
                      {copiedId === r.id ? "Copied" : "Copy portal link"}
                    </Button>
                  )}
                  {r.status === "draft" && (
                    <Button
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      disabled={working}
                      onClick={() => void onAction(r.id, "send")}
                    >
                      Send
                    </Button>
                  )}
                  {(r.status === "draft" || r.status === "sent") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px]"
                      disabled={working}
                      onClick={() => void onAction(r.id, "cancel")}
                    >
                      Cancel
                    </Button>
                  )}
                  {r.status === "submitted" && (
                    <>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        disabled={working}
                        onClick={() => void onAction(r.id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        disabled={working}
                        onClick={() => void onAction(r.id, "reject")}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

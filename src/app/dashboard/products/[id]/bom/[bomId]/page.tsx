"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { BomTree } from "@/components/dashboard/products/bom-tree";
import { BomItemDetail } from "@/components/dashboard/products/bom-item-detail";
import { BomImportWizard } from "@/components/dashboard/products/bom-import-wizard";
import { BomCarbonPanel } from "@/components/dashboard/products/bom-carbon-panel";
import { BomCarbonAnalytics } from "@/components/dashboard/products/bom-carbon-analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { useT } from "@/components/i18n/locale-provider";
import {
  commitBomImport,
  fetchBom,
  fetchBomItems,
  previewBomImport,
  removeBomItem,
  saveBomItem,
} from "@/lib/bom/client-api";
import type { Bom, BomItem } from "@/lib/bom/types";
import { toast } from "@/hooks/use-toast";

export default function BomEditorPage() {
  const params = useParams<{ id: string; bomId: string }>();
  const { company } = useDashboard();
  const t = useT();
  const [bom, setBom] = useState<Bom | null>(null);
  const [items, setItems] = useState<BomItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newPart, setNewPart] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newUnit, setNewUnit] = useState("kg");
  const [analyticsKey, setAnalyticsKey] = useState(0);

  const reload = useCallback(async () => {
    const [b, list] = await Promise.all([
      fetchBom(company.id, params.bomId),
      fetchBomItems(company.id, params.bomId),
    ]);
    setBom(b);
    setItems(list);
  }, [company.id, params.bomId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.products.bomTitle")}
        description={
          bom
            ? `${bom.bomType} · v${bom.versionLabel} · ${bom.status}`
            : t("pages.products.bomLoading")
        }
        actions={
          <Button variant="outline" asChild>
            <Link href={`/dashboard/products/${params.id}`}>{t("common.back")}</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">{t("pages.products.addPart")}</p>
          <Input
            value={newPart}
            onChange={(e) => setNewPart(e.target.value)}
            placeholder="PART-001"
            className="w-40"
          />
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Qty</p>
          <Input
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            className="w-24"
            type="number"
          />
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Unit</p>
          <Input
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="w-20"
            placeholder="kg"
          />
        </div>
        <Button
          disabled={busy || !newPart.trim()}
          onClick={async () => {
            setBusy(true);
            try {
              await saveBomItem(company.id, params.bomId, {
                partNumber: newPart.trim(),
                description: newPart.trim(),
                quantity: Number(newQty) || 1,
                unit: newUnit.trim() || "kg",
                parentItemId: selectedId,
                itemType: "material",
                sequenceNo: items.length,
              });
              setNewPart("");
              await reload();
              toast({ title: t("pages.products.itemSaved") });
            } catch (e) {
              toast({
                title: e instanceof Error ? e.message : "Save failed",
                variant: "destructive",
              });
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("pages.products.addItem")}
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <BomTree
          items={items}
          selectedId={selectedId}
          onSelect={(item) => setSelectedId(item.id)}
        />
        <div className="space-y-4">
          <BomItemDetail
            item={selected}
            saving={busy}
            onSave={async (patch) => {
              setBusy(true);
              try {
                await saveBomItem(company.id, params.bomId, patch);
                await reload();
                toast({ title: t("pages.products.itemSaved") });
              } catch (e) {
                toast({
                  title: e instanceof Error ? e.message : "Save failed",
                  variant: "destructive",
                });
              } finally {
                setBusy(false);
              }
            }}
            onDelete={async (id) => {
              setBusy(true);
              try {
                await removeBomItem(company.id, params.bomId, id);
                setSelectedId(null);
                await reload();
              } finally {
                setBusy(false);
              }
            }}
          />
          <BomCarbonPanel
            companyId={company.id}
            productId={params.id}
            bomId={params.bomId}
            item={selected}
            busy={busy}
            onCalculated={() => setAnalyticsKey((k) => k + 1)}
          />
          <BomCarbonAnalytics
            companyId={company.id}
            bomId={params.bomId}
            refreshKey={analyticsKey}
          />
          <BomImportWizard
            busy={busy}
            onPreview={async (fileName, csvText, mapping) => {
              setBusy(true);
              try {
                return await previewBomImport(
                  company.id,
                  params.bomId,
                  fileName,
                  csvText,
                  mapping
                );
              } finally {
                setBusy(false);
              }
            }}
            onCommit={async (jobId) => {
              setBusy(true);
              try {
                await commitBomImport(company.id, jobId);
                await reload();
                toast({ title: t("pages.products.importCommitted") });
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { useT } from "@/components/i18n/locale-provider";
import type { AssessmentType } from "@/types/assessment";
import { fetchProductBundle, fetchProducts } from "@/lib/bom/client-api";
import type { Bom, Product } from "@/lib/bom/types";
import { cn } from "@/lib/utils";

export default function NewAssessmentPage() {
  const { company, createAssessment, saving } = useDashboard();
  const router = useRouter();
  const t = useT();
  const [name, setName] = useState("2026 Corporate Carbon Footprint");
  const [type, setType] = useState<AssessmentType>("corporate");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [boms, setBoms] = useState<Bom[]>([]);
  const [selectedBomId, setSelectedBomId] = useState("");

  useEffect(() => {
    if (type !== "product") return;
    void fetchProducts(company.id).then(setProducts);
  }, [type, company.id]);

  useEffect(() => {
    if (!selectedProductId) {
      setBoms([]);
      setSelectedBomId("");
      return;
    }
    void fetchProductBundle(company.id, selectedProductId).then((bundle) => {
      setBoms(bundle?.boms ?? []);
      setSelectedBomId(bundle?.boms[0]?.id ?? "");
    });
  }, [company.id, selectedProductId]);

  const types: {
    type: AssessmentType;
    labelKey: string;
    hintKey: string;
    enabled: boolean;
  }[] = [
    { type: "corporate", labelKey: "pages.assessmentsNew.corporate", hintKey: "pages.assessmentsNew.corporateHint", enabled: true },
    { type: "product", labelKey: "pages.assessmentsNew.product", hintKey: "pages.assessmentsNew.productHint", enabled: true },
    { type: "event", labelKey: "pages.assessmentsNew.event", hintKey: "pages.assessmentsNew.eventHint", enabled: false },
    { type: "supplier", labelKey: "pages.assessmentsNew.supplier", hintKey: "pages.assessmentsNew.supplierHint", enabled: false },
  ];

  const handleCreate = async () => {
    if (!name.trim()) return;
    const a = await createAssessment({
      name: name.trim(),
      type,
      productId: type === "product" ? selectedProductId || null : null,
      bomId: type === "product" ? selectedBomId || null : null,
    });
    router.push(`/dashboard/assessments/${a.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={t("pages.assessmentsNew.title")}
        description={t("pages.assessmentsNew.description")}
      />

      <div className="dash-card space-y-5 p-5 sm:p-6">
        <div>
          <Label htmlFor="assess-name">{t("pages.assessmentsNew.nameLabel")}</Label>
          <Input
            id="assess-name"
            className="mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("pages.assessmentsNew.namePlaceholder")}
          />
        </div>

        <div>
          <p className="dash-label">{t("pages.assessmentsNew.whatCalculate")}</p>
          <div className="mt-3 grid gap-2">
            {types.map((item) => (
              <button
                key={item.type}
                type="button"
                disabled={!item.enabled}
                onClick={() => item.enabled && setType(item.type)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  type === item.type && item.enabled
                    ? "border-brand/40 bg-brand-light/70 ring-1 ring-brand/20"
                    : "border-border bg-background",
                  item.enabled ? "hover:border-brand/25" : "cursor-not-allowed opacity-50"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{t(item.labelKey)}</p>
                  {!item.enabled && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("pages.assessmentsNew.comingSoon")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t(item.hintKey)}</p>
              </button>
            ))}
          </div>
        </div>

        {type === "product" && (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
            <p>{t("pages.assessmentsNew.productNote")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                onClick={() => router.push("/dashboard/products")}
              >
                {t("pages.products.title")}
              </Button>
              <div className="grid w-full gap-2 sm:grid-cols-2">
                <label className="block text-[11px]">
                  Product
                  <select
                    className="mt-1 flex h-9 w-full rounded-md border border-amber-300 bg-white px-2 text-xs"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    <option value="">Select product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.productNumber})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-[11px]">
                  BOM version
                  <select
                    className="mt-1 flex h-9 w-full rounded-md border border-amber-300 bg-white px-2 text-xs"
                    value={selectedBomId}
                    onChange={(e) => setSelectedBomId(e.target.value)}
                    disabled={!selectedProductId}
                  >
                    <option value="">Select BOM…</option>
                    {boms.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bomType} · v{b.versionLabel}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/dashboard/assessments")}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleCreate} disabled={saving || !name.trim()}>
            {saving ? t("common.creating") : t("common.continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { useT } from "@/components/i18n/locale-provider";
import type { AssessmentType } from "@/types/assessment";
import { cn } from "@/lib/utils";

export default function NewAssessmentPage() {
  const { createAssessment, saving } = useDashboard();
  const router = useRouter();
  const t = useT();
  const [name, setName] = useState("2026 Corporate Carbon Footprint");
  const [type, setType] = useState<AssessmentType>("corporate");

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
    const a = await createAssessment({ name: name.trim(), type });
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
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {t("pages.assessmentsNew.productNote")}
          </p>
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

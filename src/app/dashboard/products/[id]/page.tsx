"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { useT } from "@/components/i18n/locale-provider";
import { fetchProductBundle } from "@/lib/bom/client-api";
import type { ProductBundle } from "@/lib/bom/types";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { company } = useDashboard();
  const t = useT();
  const [bundle, setBundle] = useState<ProductBundle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchProductBundle(company.id, params.id);
      if (!cancelled) {
        setBundle(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [company.id, params.id]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  }
  if (!bundle) {
    return <p className="text-sm text-muted-foreground">{t("pages.products.notFound")}</p>;
  }

  const { product, versions, boms } = bundle;

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={`${product.productNumber} · ${product.declaredUnit}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/products">{t("common.back")}</Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="dash-card space-y-2 p-4">
          <h3 className="text-sm font-semibold">{t("pages.products.versions")}</h3>
          <ul className="space-y-2">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between text-sm">
                <span>{v.versionLabel}</span>
                <Badge variant="secondary">{v.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
        <div className="dash-card space-y-2 p-4">
          <h3 className="text-sm font-semibold">{t("pages.products.boms")}</h3>
          <ul className="space-y-2">
            {boms.map((b) => {
              const version = versions.find((v) => v.id === b.productVersionId);
              return (
                <li key={b.id} className="flex items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium">
                      {b.bomType} · v{b.versionLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {version ? `Product version ${version.versionLabel}` : b.productVersionId}
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/products/${product.id}/bom/${b.id}`}>
                      {t("pages.products.openBom")}
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { ProductForm } from "@/components/dashboard/products/product-form";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { useT } from "@/components/i18n/locale-provider";
import { createProduct, fetchProducts } from "@/lib/bom/client-api";
import type { Product } from "@/lib/bom/types";
import { Package } from "lucide-react";

export default function ProductsPage() {
  const { company } = useDashboard();
  const companyId = company.id;
  const t = useT();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list = await fetchProducts(companyId);
      if (!cancelled) {
        setProducts(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.products.title")}
        description={t("pages.products.description")}
        tip={t("pages.products.tip")}
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? t("common.cancel") : t("pages.products.new")}
          </Button>
        }
      />

      {showForm && (
        <ProductForm
          busy={busy}
          onCreate={async (input) => {
            setBusy(true);
            try {
              const bundle = await createProduct(companyId, input);
              setProducts((prev) => [bundle.product, ...prev]);
              setShowForm(false);
              router.push(`/dashboard/products/${bundle.product.id}`);
            } finally {
              setBusy(false);
            }
          }}
        />
      )}

      <div className="dash-card overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <Package className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">{t("pages.products.emptyTitle")}</p>
            <p className="max-w-md text-xs text-muted-foreground">{t("pages.products.emptyBody")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {products.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/dashboard/products/${p.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{p.productNumber}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <p>{p.category}</p>
                    <p className="uppercase">{p.status}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

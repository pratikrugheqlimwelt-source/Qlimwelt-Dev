import type {
  Bom,
  BomImportColumnMapping,
  BomImportJob,
  BomItem,
  Product,
  ProductBundle,
} from "./types";
import {
  localCommitImport,
  localCreateProduct,
  localDeleteBomItem,
  localGetBom,
  localGetImportJob,
  localGetProductBundle,
  localListBomItems,
  localListProducts,
  localPreviewImport,
  localUpsertBomItem,
} from "./local-service";

async function tryJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchProducts(companyId: string): Promise<Product[]> {
  try {
    const res = await fetch("/api/bom/products");
    if (res.ok) {
      const data = await tryJson<{ products: Product[] }>(res);
      if (data?.products) return data.products;
    }
  } catch {
    /* local */
  }
  return localListProducts(companyId);
}

export async function fetchProductBundle(
  companyId: string,
  productId: string
): Promise<ProductBundle | null> {
  try {
    const res = await fetch(`/api/bom/products/${productId}`);
    if (res.ok) {
      const data = await tryJson<ProductBundle>(res);
      if (data?.product) return data;
    }
  } catch {
    /* local */
  }
  return localGetProductBundle(companyId, productId);
}

export async function createProduct(
  companyId: string,
  input: {
    productNumber: string;
    name: string;
    category?: string;
    declaredUnit?: string;
    description?: string;
  }
): Promise<ProductBundle> {
  try {
    const res = await fetch("/api/bom/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const data = await tryJson<ProductBundle>(res);
      if (data?.product) return data;
    }
  } catch {
    /* local */
  }
  return localCreateProduct(companyId, input);
}

export async function fetchBomItems(companyId: string, bomId: string): Promise<BomItem[]> {
  try {
    const res = await fetch(`/api/bom/boms/${bomId}/items`);
    if (res.ok) {
      const data = await tryJson<{ items: BomItem[] }>(res);
      if (data?.items) return data.items;
    }
  } catch {
    /* local */
  }
  return localListBomItems(companyId, bomId);
}

export async function fetchBom(companyId: string, bomId: string): Promise<Bom | null> {
  try {
    const res = await fetch(`/api/bom/boms/${bomId}`);
    if (res.ok) {
      const data = await tryJson<{ bom: Bom }>(res);
      if (data?.bom) return data.bom;
    }
  } catch {
    /* local */
  }
  return localGetBom(companyId, bomId) ?? null;
}

export async function saveBomItem(
  companyId: string,
  bomId: string,
  item: Partial<BomItem> & { partNumber: string; quantity: number; unit: string }
): Promise<BomItem> {
  try {
    const res = await fetch(`/api/bom/boms/${bomId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (res.ok) {
      const data = await tryJson<{ item: BomItem }>(res);
      if (data?.item) return data.item;
    }
    if (res.status >= 400 && res.status < 500) {
      const err = await tryJson<{ error?: string }>(res);
      throw new Error(err?.error || "Failed to save BOM item");
    }
  } catch (e) {
    if (e instanceof Error && e.message !== "Failed to fetch") throw e;
  }
  return localUpsertBomItem(companyId, {
    id: item.id,
    bomId,
    parentItemId: item.parentItemId ?? null,
    partNumber: item.partNumber,
    description: item.description ?? item.partNumber,
    itemType: item.itemType ?? "component",
    quantity: item.quantity,
    unit: item.unit,
    scrapRate: item.scrapRate ?? 0,
    yieldRate: item.yieldRate ?? 1,
    sequenceNo: item.sequenceNo ?? 0,
    supplierId: item.supplierId ?? null,
    materialId: item.materialId ?? null,
  });
}

export async function removeBomItem(companyId: string, bomId: string, itemId: string) {
  try {
    const res = await fetch(`/api/bom/boms/${bomId}/items?itemId=${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    });
    if (res.ok) return;
  } catch {
    /* local */
  }
  localDeleteBomItem(companyId, itemId);
}

export async function previewBomImport(
  companyId: string,
  bomId: string,
  fileName: string,
  csvText: string,
  mapping?: Partial<BomImportColumnMapping>
): Promise<BomImportJob> {
  try {
    const res = await fetch("/api/bom/imports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bomId, fileName, csvText, mapping }),
    });
    if (res.ok) {
      const data = await tryJson<{ job: BomImportJob }>(res);
      if (data?.job) return data.job;
    }
  } catch {
    /* local */
  }
  return localPreviewImport(companyId, bomId, fileName, csvText, mapping);
}

export async function commitBomImport(
  companyId: string,
  jobId: string
): Promise<{ job: BomImportJob; items: BomItem[] }> {
  try {
    const res = await fetch(`/api/bom/imports/${jobId}/commit`, { method: "POST" });
    if (res.ok) {
      const data = await tryJson<{ job: BomImportJob; items: BomItem[] }>(res);
      if (data?.job) return data;
    }
    if (res.status >= 400 && res.status < 500) {
      const err = await tryJson<{ error?: string }>(res);
      throw new Error(err?.error || "Commit failed");
    }
  } catch (e) {
    if (e instanceof Error && e.message !== "Failed to fetch") throw e;
  }
  return localCommitImport(companyId, jobId);
}

export async function fetchImportJob(
  companyId: string,
  jobId: string
): Promise<BomImportJob | null> {
  try {
    const res = await fetch(`/api/bom/imports/${jobId}`);
    if (res.ok) {
      const data = await tryJson<{ job: BomImportJob }>(res);
      if (data?.job) return data.job;
    }
  } catch {
    /* local */
  }
  return localGetImportJob(companyId, jobId) ?? null;
}

import type { ExportAuthContext } from "@/lib/export/auth";
import type {
  Bom,
  BomImportColumnMapping,
  BomImportJob,
  BomImportPreview,
  BomItem,
  BomItemType,
  BomType,
  Product,
  ProductBundle,
  ProductStatus,
  ProductVersion,
  VersionStatus,
} from "@/lib/bom/types";
import { previewFromCsvText } from "@/lib/bom/import/parse";
import { previewRowsToBomItems } from "@/lib/bom/import/commit";
import { hasBlockingErrors, validateBomStructure } from "@/lib/bom/validate";

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    productNumber: String(row.product_number),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    category: String(row.category ?? "general"),
    declaredUnit: String(row.declared_unit ?? "piece"),
    status: (row.status as ProductStatus) ?? "draft",
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapVersion(row: Record<string, unknown>): ProductVersion {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    productId: String(row.product_id),
    versionLabel: String(row.version_label),
    status: (row.status as VersionStatus) ?? "draft",
    effectiveFrom: (row.effective_from as string | null) ?? null,
    effectiveTo: (row.effective_to as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapBom(row: Record<string, unknown>): Bom {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    productVersionId: String(row.product_version_id),
    bomType: (row.bom_type as BomType) ?? "engineering",
    versionLabel: String(row.version_label ?? "1"),
    status: (row.status as VersionStatus) ?? "draft",
    effectiveFrom: (row.effective_from as string | null) ?? null,
    effectiveTo: (row.effective_to as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapItem(row: Record<string, unknown>): BomItem {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    bomId: String(row.bom_id),
    parentItemId: (row.parent_item_id as string | null) ?? null,
    partNumber: String(row.part_number),
    description: String(row.description ?? ""),
    itemType: (row.item_type as BomItemType) ?? "component",
    quantity: Number(row.quantity ?? 1),
    unit: String(row.unit ?? "piece"),
    scrapRate: Number(row.scrap_rate ?? 0),
    yieldRate: Number(row.yield_rate ?? 1),
    sequenceNo: Number(row.sequence_no ?? 0),
    supplierId: (row.supplier_id as string | null) ?? null,
    materialId: (row.material_id as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapImportJob(row: Record<string, unknown>): BomImportJob {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    bomId: (row.bom_id as string | null) ?? null,
    fileName: String(row.file_name),
    status: (row.status as BomImportJob["status"]) ?? "preview",
    rowCount: Number(row.row_count ?? 0),
    validCount: Number(row.valid_count ?? 0),
    warningCount: Number(row.warning_count ?? 0),
    errorCount: Number(row.error_count ?? 0),
    columnMapping: (row.column_mapping as BomImportColumnMapping) ?? { partNumber: "part_number" },
    preview: (row.preview as BomImportPreview) ?? {
      rows: [],
      issues: [],
      validCount: 0,
      warningCount: 0,
      errorCount: 0,
      detectedColumns: [],
    },
    errorMessage: (row.error_message as string | null) ?? null,
    createdAt: String(row.created_at),
    committedAt: (row.committed_at as string | null) ?? null,
  };
}

export async function dbListProducts(ctx: ExportAuthContext): Promise<Product[]> {
  const { data, error } = await ctx.supabase
    .from("products")
    .select("*")
    .eq("company_id", ctx.companyId)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => mapProduct(r as Record<string, unknown>));
}

export async function dbGetProductBundle(
  ctx: ExportAuthContext,
  productId: string
): Promise<ProductBundle | null> {
  const { data: product, error } = await ctx.supabase
    .from("products")
    .select("*")
    .eq("company_id", ctx.companyId)
    .eq("id", productId)
    .maybeSingle();
  if (error) throw error;
  if (!product) return null;

  const { data: versions, error: vErr } = await ctx.supabase
    .from("product_versions")
    .select("*")
    .eq("product_id", productId)
    .order("created_at");
  if (vErr) throw vErr;

  const versionIds = (versions ?? []).map((v) => v.id as string);
  let boms: Bom[] = [];
  if (versionIds.length) {
    const { data: bomRows, error: bErr } = await ctx.supabase
      .from("boms")
      .select("*")
      .in("product_version_id", versionIds);
    if (bErr) throw bErr;
    boms = (bomRows ?? []).map((r) => mapBom(r as Record<string, unknown>));
  }

  return {
    product: mapProduct(product as Record<string, unknown>),
    versions: (versions ?? []).map((r) => mapVersion(r as Record<string, unknown>)),
    boms,
  };
}

export async function dbCreateProduct(
  ctx: ExportAuthContext,
  input: {
    productNumber: string;
    name: string;
    category?: string;
    declaredUnit?: string;
    description?: string;
  }
): Promise<ProductBundle> {
  const { data: product, error } = await ctx.supabase
    .from("products")
    .insert({
      company_id: ctx.companyId,
      product_number: input.productNumber.trim(),
      name: input.name.trim(),
      description: input.description ?? null,
      category: input.category ?? "general",
      declared_unit: input.declaredUnit ?? "piece",
      status: "draft",
    })
    .select("*")
    .single();
  if (error) throw error;

  const { data: version, error: vErr } = await ctx.supabase
    .from("product_versions")
    .insert({
      company_id: ctx.companyId,
      product_id: product.id,
      version_label: "1.0",
      status: "draft",
    })
    .select("*")
    .single();
  if (vErr) throw vErr;

  const { data: bom, error: bErr } = await ctx.supabase
    .from("boms")
    .insert({
      company_id: ctx.companyId,
      product_version_id: version.id,
      bom_type: "engineering",
      version_label: "1",
      status: "draft",
    })
    .select("*")
    .single();
  if (bErr) throw bErr;

  return {
    product: mapProduct(product as Record<string, unknown>),
    versions: [mapVersion(version as Record<string, unknown>)],
    boms: [mapBom(bom as Record<string, unknown>)],
  };
}

export async function dbListProductVersions(
  ctx: ExportAuthContext,
  productId: string
): Promise<ProductVersion[]> {
  const { data, error } = await ctx.supabase
    .from("product_versions")
    .select("*")
    .eq("company_id", ctx.companyId)
    .eq("product_id", productId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((r) => mapVersion(r as Record<string, unknown>));
}

export async function dbCreateProductVersion(
  ctx: ExportAuthContext,
  productId: string,
  input: {
    versionLabel: string;
    notes?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
  }
): Promise<ProductVersion> {
  const { data: version, error } = await ctx.supabase
    .from("product_versions")
    .insert({
      company_id: ctx.companyId,
      product_id: productId,
      version_label: input.versionLabel,
      status: "draft",
      notes: input.notes ?? null,
      effective_from: input.effectiveFrom ?? null,
      effective_to: input.effectiveTo ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;

  // Each new product version gets an empty engineering BOM shell
  const { error: bomErr } = await ctx.supabase.from("boms").insert({
    company_id: ctx.companyId,
    product_version_id: version.id,
    bom_type: "engineering",
    version_label: "1",
    status: "draft",
  });
  if (bomErr) throw bomErr;

  return mapVersion(version as Record<string, unknown>);
}

export async function dbGetBom(ctx: ExportAuthContext, bomId: string): Promise<Bom | null> {
  const { data, error } = await ctx.supabase
    .from("boms")
    .select("*")
    .eq("company_id", ctx.companyId)
    .eq("id", bomId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBom(data as Record<string, unknown>) : null;
}

export async function dbListBomItems(ctx: ExportAuthContext, bomId: string): Promise<BomItem[]> {
  const { data, error } = await ctx.supabase
    .from("bom_items")
    .select("*")
    .eq("company_id", ctx.companyId)
    .eq("bom_id", bomId)
    .order("sequence_no");
  if (error) throw error;
  return (data ?? []).map((r) => mapItem(r as Record<string, unknown>));
}

export async function dbUpsertBomItem(
  ctx: ExportAuthContext,
  bomId: string,
  item: Partial<BomItem> & { partNumber: string; quantity: number; unit: string }
): Promise<BomItem> {
  const payload = {
    company_id: ctx.companyId,
    bom_id: bomId,
    parent_item_id: item.parentItemId ?? null,
    part_number: item.partNumber.trim(),
    description: (item.description ?? item.partNumber).trim(),
    item_type: item.itemType ?? "component",
    quantity: item.quantity,
    unit: item.unit,
    scrap_rate: item.scrapRate ?? 0,
    yield_rate: item.yieldRate ?? 1,
    sequence_no: item.sequenceNo ?? 0,
    supplier_id: item.supplierId ?? null,
    material_id: item.materialId ?? null,
    updated_at: new Date().toISOString(),
  };

  let row: Record<string, unknown>;
  if (item.id) {
    const { data, error } = await ctx.supabase
      .from("bom_items")
      .update(payload)
      .eq("id", item.id)
      .eq("company_id", ctx.companyId)
      .select("*")
      .single();
    if (error) throw error;
    row = data as Record<string, unknown>;
  } else {
    const { data, error } = await ctx.supabase
      .from("bom_items")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    row = data as Record<string, unknown>;
  }

  const all = await dbListBomItems(ctx, bomId);
  const issues = validateBomStructure(all);
  if (hasBlockingErrors(issues.filter((i) => i.code === "CIRCULAR_BOM"))) {
    if (!item.id) {
      await ctx.supabase.from("bom_items").delete().eq("id", row.id);
    }
    throw new Error(issues.find((i) => i.code === "CIRCULAR_BOM")?.message ?? "Circular BOM");
  }
  return mapItem(row);
}

export async function dbDeleteBomItem(ctx: ExportAuthContext, itemId: string) {
  const { error } = await ctx.supabase
    .from("bom_items")
    .delete()
    .eq("id", itemId)
    .eq("company_id", ctx.companyId);
  if (error) throw error;
}

export async function dbPreviewImport(
  ctx: ExportAuthContext,
  input: {
    bomId: string;
    fileName: string;
    csvText: string;
    mapping?: Partial<BomImportColumnMapping>;
  }
): Promise<BomImportJob> {
  const preview = previewFromCsvText(input.csvText, input.mapping);
  const { data, error } = await ctx.supabase
    .from("bom_import_jobs")
    .insert({
      company_id: ctx.companyId,
      bom_id: input.bomId,
      file_name: input.fileName,
      status: "preview",
      row_count: preview.rows.length,
      valid_count: preview.validCount,
      warning_count: preview.warningCount,
      error_count: preview.errorCount,
      column_mapping: {
        partNumber: input.mapping?.partNumber || preview.detectedColumns[0] || "part_number",
        ...input.mapping,
      },
      preview,
      created_by: ctx.userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapImportJob(data as Record<string, unknown>);
}

export async function dbGetImportJob(
  ctx: ExportAuthContext,
  jobId: string
): Promise<BomImportJob | null> {
  const { data, error } = await ctx.supabase
    .from("bom_import_jobs")
    .select("*")
    .eq("company_id", ctx.companyId)
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapImportJob(data as Record<string, unknown>) : null;
}

export async function dbCommitImport(
  ctx: ExportAuthContext,
  jobId: string
): Promise<{ job: BomImportJob; items: BomItem[] }> {
  const job = await dbGetImportJob(ctx, jobId);
  if (!job) throw new Error("Import job not found");
  if (!job.bomId) throw new Error("Import job has no BOM");
  if (job.errorCount > 0 || hasBlockingErrors(job.preview.issues)) {
    throw new Error("Cannot commit import with blocking errors");
  }

  const items = previewRowsToBomItems(ctx.companyId, job.bomId, job.preview);
  const structureIssues = validateBomStructure(items);
  if (hasBlockingErrors(structureIssues)) {
    throw new Error(structureIssues[0]?.message ?? "BOM structure invalid");
  }

  await ctx.supabase.from("bom_items").delete().eq("bom_id", job.bomId).eq("company_id", ctx.companyId);

  const rows = items.map((i) => ({
    id: i.id,
    company_id: ctx.companyId,
    bom_id: i.bomId,
    parent_item_id: i.parentItemId,
    part_number: i.partNumber,
    description: i.description,
    item_type: i.itemType,
    quantity: i.quantity,
    unit: i.unit,
    scrap_rate: i.scrapRate,
    yield_rate: i.yieldRate,
    sequence_no: i.sequenceNo,
    supplier_id: i.supplierId ?? null,
    material_id: i.materialId ?? null,
  }));

  if (rows.length) {
    const { error } = await ctx.supabase.from("bom_items").insert(rows);
    if (error) throw error;
  }

  const { data, error } = await ctx.supabase
    .from("bom_import_jobs")
    .update({ status: "committed", committed_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("company_id", ctx.companyId)
    .select("*")
    .single();
  if (error) throw error;

  return { job: mapImportJob(data as Record<string, unknown>), items };
}

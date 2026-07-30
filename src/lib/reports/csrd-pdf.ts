/**
 * @deprecated Prefer `buildBrandedReportPdf` from `@/lib/reports/branded-pdf`.
 * Kept for compatibility — builds the branded multi-page PDF.
 */
export type { BrandedReportInput as CsrdPdfInput } from "@/lib/reports/branded-pdf";
export { buildBrandedReportPdf as buildCsrdPdf } from "@/lib/reports/branded-pdf";

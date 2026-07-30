import { NextRequest, NextResponse } from "next/server";
import { complianceDashboardSeed } from "@/data/compliance-data";
import { handleComplianceEvidenceUpload } from "@/lib/compliance/evidence-upload";

/**
 * Compliance Evidence Library
 * GET  — seed library list (placeholder)
 * POST — library upload (placeholder)
 *
 * Activity / inventory evidence stays at GET|POST /api/evidence (unchanged).
 */
export async function GET() {
  return NextResponse.json({
    source: "compliance_library",
    evidence: complianceDashboardSeed.evidence,
  });
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    return handleComplianceEvidenceUpload(form);
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

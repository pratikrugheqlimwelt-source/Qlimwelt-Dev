import { NextRequest, NextResponse } from "next/server";
import { handleComplianceEvidenceUpload } from "@/lib/compliance/evidence-upload";

/**
 * @deprecated Prefer POST /api/compliance/evidence for Compliance Library uploads.
 * Kept for backwards compatibility — does not change the activity evidence API at /api/evidence.
 */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    return handleComplianceEvidenceUpload(form);
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

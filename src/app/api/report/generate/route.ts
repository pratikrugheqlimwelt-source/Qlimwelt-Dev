import { NextRequest, NextResponse } from "next/server";

/** Compliance / disclosure report generation (placeholder). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const templateId = String(body.templateId ?? body.reportType ?? "csrd");
    const name = String(body.name ?? "Compliance Report");

    return NextResponse.json({
      ok: true,
      jobId: `rpt-${Date.now()}`,
      templateId,
      name,
      status: "queued",
      estimatedReadyInSeconds: 12,
      message: "Report generation queued (placeholder).",
      downloadUrl: null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to queue report" }, { status: 500 });
  }
}

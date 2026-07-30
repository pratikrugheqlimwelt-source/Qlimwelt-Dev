import { NextResponse } from "next/server";

/**
 * Shared Compliance Evidence Library upload (placeholder).
 * Distinct from activity evidence at GET|POST /api/evidence (Supabase).
 */
export async function handleComplianceEvidenceUpload(form: FormData) {
  const file = form.get("file");
  const framework = String(form.get("framework") ?? "CSRD");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const allowed =
    /\.(pdf|xlsx?|csv)$/i.test(file.name) || /pdf|sheet|excel|csv|image/i.test(file.type);

  if (!allowed) {
    return NextResponse.json(
      {
        error:
          "Accepted: PDF, Excel, CSV, invoices, utility bills, supplier declarations, audit reports.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    source: "compliance_library" as const,
    evidence: {
      id: `ev-${Date.now()}`,
      name: file.name,
      framework,
      fileUrl: "#",
      verified: "pending" as const,
      uploadedBy: "You",
      uploadDate: new Date().toISOString().slice(0, 10),
    },
    message:
      "Compliance library upload accepted (placeholder — persistence not yet enabled). Activity evidence remains at /api/evidence.",
  });
}

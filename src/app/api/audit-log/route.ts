import { NextResponse } from "next/server";
import { complianceDashboardSeed } from "@/data/compliance-data";

/** Compliance audit trail (placeholder). */
export async function GET() {
  return NextResponse.json({ auditLog: complianceDashboardSeed.auditLog });
}

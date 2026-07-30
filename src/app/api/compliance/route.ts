import { NextResponse } from "next/server";
import { complianceDashboardSeed } from "@/data/compliance-data";

/** Full Compliance Center payload (placeholder). */
export async function GET() {
  return NextResponse.json(complianceDashboardSeed);
}

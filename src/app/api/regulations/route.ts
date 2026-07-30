import { NextResponse } from "next/server";
import { complianceDashboardSeed } from "@/data/compliance-data";

/** Regulatory updates feed (placeholder). */
export async function GET() {
  return NextResponse.json({ regulations: complianceDashboardSeed.regulations });
}

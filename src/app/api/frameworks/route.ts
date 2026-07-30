import { NextResponse } from "next/server";
import { complianceDashboardSeed } from "@/data/compliance-data";

/** List compliance frameworks (placeholder). */
export async function GET() {
  return NextResponse.json({ frameworks: complianceDashboardSeed.frameworks });
}

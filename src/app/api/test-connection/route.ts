import { NextRequest, NextResponse } from "next/server";
import { testConnectionService } from "@/lib/connected-systems/service";
import type { ConnectPayload } from "@/lib/connected-systems/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ConnectPayload;
  const result = testConnectionService(body);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

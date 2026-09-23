import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import { localCreateScenario, localListScenarios } from "@/lib/bom/carbon/local-service";
import type { ScenarioOverride } from "@/lib/bom/carbon/scenario";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id: bomId } = await context.params;
  try {
    return NextResponse.json({
      scenarios: localListScenarios(auth.ctx.companyId, bomId),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list scenarios" },
      { status: 503 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id: bomId } = await context.params;
  try {
    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      baselineCalculationId?: string | null;
      overrides?: ScenarioOverride[];
    };
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const scenario = localCreateScenario(auth.ctx.companyId, {
      bomId,
      name: body.name,
      description: body.description,
      baselineCalculationId: body.baselineCalculationId,
      overrides: body.overrides,
    });
    return NextResponse.json({ scenario });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create scenario" },
      { status: 503 }
    );
  }
}

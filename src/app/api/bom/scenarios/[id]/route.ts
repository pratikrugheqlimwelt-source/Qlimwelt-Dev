import { NextResponse } from "next/server";
import { requireCompanyAuth } from "@/lib/export/auth";
import {
  localDeleteScenario,
  localGetScenario,
  localUpdateScenario,
} from "@/lib/bom/carbon/local-service";
import type { ScenarioOverride } from "@/lib/bom/carbon/scenario";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const scenario = localGetScenario(auth.ctx.companyId, id);
  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }
  return NextResponse.json({ scenario });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      baselineCalculationId?: string | null;
      overrides?: ScenarioOverride[];
    };
    const scenario = localUpdateScenario(auth.ctx.companyId, id, body);
    return NextResponse.json({ scenario });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update scenario" },
      { status: 503 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    localDeleteScenario(auth.ctx.companyId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete scenario" },
      { status: 503 }
    );
  }
}

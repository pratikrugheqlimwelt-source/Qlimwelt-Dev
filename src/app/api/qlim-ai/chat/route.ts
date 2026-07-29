import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { chatCompletion, getLlmConfig, type LlmMessage } from "@/lib/llm/client";
import {
  buildCarbonSystemPrompt,
  CARBON_FEW_SHOTS,
  retrieveRelevantActivities,
  type CarbonChatContext,
} from "@/lib/llm/carbon-prompt";
import { activityToCalculation, sumByScope, sumEmissionsTCO2e } from "@/lib/calculations/engine";
import { mapActivity } from "@/services/carbon/mappers";
import { deriveClimateInsights } from "@/lib/climate-insights";
import type { EmissionActivity } from "@/types/carbon";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(24),
});

function emptyContext(): CarbonChatContext {
  return {
    companyName: "Your company",
    period: "all",
    totalTCO2e: 0,
    scope1: 0,
    scope2: 0,
    scope3: 0,
    activityCount: 0,
    topCategories: [],
    facilities: [],
    insights: [],
    relevantActivities: [],
  };
}

export async function GET() {
  const cfg = getLlmConfig();
  return NextResponse.json({
    configured: cfg.configured,
    provider: cfg.provider,
    model: cfg.model,
    tunedFor: "corporate GHG Scope 1–3 / carbon footprinting",
    hint:
      cfg.provider === "ollama"
        ? "Free local Ollama — create tuned model: ollama create qlimwelt-carbon -f ollama/Modelfile"
        : cfg.provider === "groq"
          ? "Free Groq tier (no credit card) with Qlimwelt carbon consultant prompt"
          : cfg.configured
            ? "OpenAI-compatible endpoint with carbon consultant prompt"
            : "Add free Groq key (console.groq.com) on Vercel, or run free Ollama locally",
  });
}

export async function POST(request: NextRequest) {
  const cfg = getLlmConfig();
  if (!cfg.configured) {
    return NextResponse.json(
      {
        error:
          "No free LLM configured. Locally: run Ollama. On Vercel: add GROQ_API_KEY from the free Groq tier (console.groq.com — no credit card).",
      },
      { status: 503 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid messages payload." }, { status: 400 });
  }

  const lastUser =
    [...parsed.data.messages].reverse().find((m) => m.role === "user")?.content ?? "";

  let context = emptyContext();
  let activities: EmissionActivity[] = [];

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: membership } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (membership?.company_id) {
        const companyId = membership.company_id as string;
        const [{ data: company }, { data: actData }, { data: settings }, { data: facData }] =
          await Promise.all([
            supabase.from("companies").select("name, industry").eq("id", companyId).maybeSingle(),
            supabase.from("emission_activities").select("*").eq("company_id", companyId).limit(800),
            supabase
              .from("company_settings")
              .select("carbon_price_per_tonne")
              .eq("company_id", companyId)
              .maybeSingle(),
            supabase.from("facilities").select("id, name").eq("company_id", companyId),
          ]);

        activities = (actData ?? []).map((r) => mapActivity(r as Record<string, unknown>)) as EmissionActivity[];
        const total = sumEmissionsTCO2e(activities);
        const scopes = sumByScope(activities);

        const byCat = new Map<string, number>();
        const byFac = new Map<string, number>();
        for (const a of activities) {
          const t = activityToCalculation(a).emissionsTCO2e;
          byCat.set(a.category, (byCat.get(a.category) ?? 0) + t);
          byFac.set(a.facilityId, (byFac.get(a.facilityId) ?? 0) + t);
        }

        const facName = new Map((facData ?? []).map((f) => [String(f.id), String(f.name)]));
        const topCategories = [...byCat.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([category, tCO2e]) => ({
            category,
            tCO2e,
            sharePct: total > 0 ? (tCO2e / total) * 100 : 0,
          }));

        const facilities = [...byFac.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([id, tCO2e]) => ({
            name: facName.get(id) ?? id,
            tCO2e,
          }));

        const insights = deriveClimateInsights(
          activities,
          [],
          Number(settings?.carbon_price_per_tonne ?? 85)
        ).map((i) => `${i.title}: ${i.what}`);

        context = {
          companyName: company?.name ?? "Your company",
          industry: company?.industry ?? undefined,
          period: "all",
          totalTCO2e: total,
          scope1: scopes.scope1,
          scope2: scopes.scope2,
          scope3: scopes.scope3,
          activityCount: activities.length,
          topCategories,
          facilities,
          insights,
          relevantActivities: retrieveRelevantActivities(activities, lastUser, 12),
        };
      }
    }
  } catch {
    // Continue without inventory (marketing / missing tables)
  }

  // If not authenticated / no DB, still attach empty relevant list
  if (!context.relevantActivities.length && activities.length) {
    context.relevantActivities = retrieveRelevantActivities(activities, lastUser, 12);
  }

  const llmMessages: LlmMessage[] = [
    { role: "system", content: buildCarbonSystemPrompt(context) },
    ...CARBON_FEW_SHOTS,
    ...parsed.data.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  try {
    // Lower temperature for factual carbon / scope answers
    const result = await chatCompletion(llmMessages, { temperature: 0.35, maxTokens: 1100 });
    return NextResponse.json({
      message: { role: "assistant", content: result.content },
      provider: result.provider,
      model: result.model,
      contextUsed: {
        companyName: context.companyName,
        activityCount: context.activityCount,
        totalTCO2e: context.totalTCO2e,
        relevantRows: context.relevantActivities.length,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "LLM request failed." },
      { status: 502 }
    );
  }
}

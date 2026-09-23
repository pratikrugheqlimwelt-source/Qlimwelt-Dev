import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasServiceRole } from "@/lib/supabase/admin";
import { seedCompanyDemo } from "@/services/carbon/dashboardService";
import {
  findCompanyIdByEmail,
  seedCompanyDemoAdmin,
} from "@/services/carbon/seed-admin";

/**
 * Seed a realistic FY 2024 inventory.
 *
 * - Authenticated (no body): seeds the signed-in user's company
 * - `{ "email": "..." }` + SUPABASE_SERVICE_ROLE_KEY: seeds that account
 */
export async function POST(request: Request) {
  let body: { email?: string } = {};
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    body = {};
  }

  const email = (body.email ?? "").trim().toLowerCase();

  try {
    if (email) {
      if (!hasServiceRole()) {
        return NextResponse.json(
          { error: "SUPABASE_SERVICE_ROLE_KEY is required to seed by email." },
          { status: 400 }
        );
      }

      const companyId = await findCompanyIdByEmail(email);
      if (!companyId) {
        return NextResponse.json(
          {
            error: `No company found for ${email}. Sign in once and finish onboarding first.`,
          },
          { status: 404 }
        );
      }

      const result = await seedCompanyDemoAdmin(companyId);
      return NextResponse.json({
        ok: true,
        email,
        ...result,
        message: "Sample inventory loaded",
      });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership?.company_id) {
      return NextResponse.json({ error: "No company found for user" }, { status: 404 });
    }

    if (hasServiceRole()) {
      const result = await seedCompanyDemoAdmin(membership.company_id);
      return NextResponse.json({
        ok: true,
        email: user.email,
        ...result,
        message: "Sample inventory loaded",
      });
    }

    await seedCompanyDemo(membership.company_id);
    return NextResponse.json({
      ok: true,
      email: user.email,
      companyId: membership.company_id,
      message: "Sample inventory loaded",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 }
    );
  }
}

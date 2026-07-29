import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ExportAuthContext = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  userId: string;
  email: string;
  companyId: string;
  role: string;
};

export async function requireCompanyAuth(): Promise<
  { ok: true; ctx: ExportAuthContext } | { ok: false; response: NextResponse }
> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }),
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: membership, error: memberError } = await supabase
    .from("company_members")
    .select("company_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError || !membership?.company_id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No company membership." }, { status: 403 }),
    };
  }

  return {
    ok: true,
    ctx: {
      supabase,
      userId: user.id,
      email: user.email ?? "",
      companyId: membership.company_id as string,
      role: membership.role as string,
    },
  };
}

export function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function attachmentResponse(
  body: string,
  filename: string,
  format: "csv" | "json",
  status = 200
) {
  if (format === "json") {
    return new NextResponse(body, {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

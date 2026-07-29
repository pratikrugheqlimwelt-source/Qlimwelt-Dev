import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireMember() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.company_id) {
    return { error: NextResponse.json({ error: "No company membership." }, { status: 403 }) };
  }

  return {
    supabase,
    userId: user.id,
    companyId: membership.company_id as string,
  };
}

/** List evidence for company (optional activityId filter). */
export async function GET(request: NextRequest) {
  const auth = await requireMember();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, companyId } = auth as {
    supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
    companyId: string;
  };

  const activityId = request.nextUrl.searchParams.get("activityId");
  let q = supabase
    .from("evidence_files")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (activityId) q = q.eq("activity_id", activityId);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json(
      { error: error.message, hint: "Apply migration 005_evidence_storage.sql" },
      { status: 503 }
    );
  }
  return NextResponse.json({ files: data ?? [] });
}

/** Upload evidence file to Supabase Storage + metadata row. */
export async function POST(request: NextRequest) {
  const auth = await requireMember();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, companyId, userId } = auth as {
    supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
    companyId: string;
    userId: string;
  };

  const form = await request.formData();
  const file = form.get("file");
  const activityId = String(form.get("activityId") ?? "");
  const notes = String(form.get("notes") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 8MB)." }, { status: 400 });
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${companyId}/${activityId || "general"}/${Date.now()}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from("evidence").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json(
      {
        error: uploadError.message,
        hint: "Create the 'evidence' storage bucket and apply migration 005.",
      },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from("evidence_files")
    .insert({
      company_id: companyId,
      activity_id: activityId || null,
      file_name: file.name,
      storage_path: path,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      uploaded_by: userId,
      notes: notes || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark linked activity as having uploaded evidence when possible
  if (activityId) {
    await supabase
      .from("emission_activities")
      .update({ evidence_status: "uploaded" })
      .eq("id", activityId)
      .eq("company_id", companyId);
  }

  return NextResponse.json({ file: data });
}

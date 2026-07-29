import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Accept pending team invite for the authenticated user's email. */
export async function POST() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("accept_team_invite");
  if (error) {
    // RPC may be missing until migration 003 is applied
    return NextResponse.json(
      { accepted: false, reason: "rpc_unavailable", message: error.message },
      { status: 503 }
    );
  }

  return NextResponse.json(data ?? { accepted: false });
}

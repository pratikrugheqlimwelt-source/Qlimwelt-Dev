import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function safeRedirectPath(path: string | null): string {
  if (path && path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return "/dashboard/overview";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = safeRedirectPath(searchParams.get("redirect"));
  const authError = searchParams.get("error");

  if (authError || !code) {
    return NextResponse.redirect(`${origin}/login?error=callback`);
  }

  const supabase = await createServerSupabaseClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth callback]", exchangeError.message);
    }
    return NextResponse.redirect(`${origin}/login?error=callback`);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return NextResponse.redirect(`${origin}/login?error=callback`);
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const meta = user.user_metadata ?? {};
    const { data: upserted, error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          full_name: (meta.full_name as string) ?? (meta.name as string) ?? null,
          profile_image_url: (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
          onboarding_completed: false,
        },
        { onConflict: "id" }
      )
      .select("onboarding_completed")
      .single();

    if (upsertError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[auth callback profile]", upsertError.message);
      }
      return NextResponse.redirect(`${origin}/login?error=callback`);
    }

    profile = upserted;
  }

  const destination = profile?.onboarding_completed ? redirect : "/onboarding";
  return NextResponse.redirect(`${origin}${destination}`);
}

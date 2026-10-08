import { createClient } from "@/lib/supabase";
import type { Profile } from "@/types/auth";

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    // Surface real PostgREST hint in the UI (grants/RLS are the usual cause after a schema reset)
    console.error("[profile]", error.message, error.code, error.details);
    throw new Error(
      error.message?.includes("permission denied")
        ? "Profile access blocked (database grants). Run supabase/fix_profile_access.sql in Supabase SQL Editor."
        : "We couldn't load your profile. Please refresh the page."
    );
  }

  return data as Profile | null;
}

export async function upsertProfileFromAuth(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): Promise<Profile | null> {
  const supabase = createClient();
  const meta = user.user_metadata ?? {};
  const payload = {
    id: user.id,
    email: user.email ?? (meta.email as string) ?? "",
    full_name: (meta.full_name as string) ?? (meta.name as string) ?? null,
    profile_image_url: (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
    onboarding_completed: false,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("[profile upsert]", error);
    return fetchProfile(user.id);
  }

  return data as Profile;
}

import { createClient, isSupabaseConfigured } from "@/lib/supabase";

/**
 * OAuth callback origin must match the page the user is on.
 * Prefer `window.location.origin` in the browser so a mis-set
 * NEXT_PUBLIC_APP_URL (e.g. http://localhost:3000 baked into Production)
 * cannot break Google sign-in on qlimwelt.de / Vercel previews.
 */
function getOAuthRedirectOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
}

export async function signInWithGoogle(redirectPath?: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Add your environment variables to continue.");
  }

  const supabase = createClient();
  const origin = getOAuthRedirectOrigin();
  if (!origin) {
    throw new Error("Missing app URL for OAuth redirect.");
  }

  const redirectTo = `${origin}/auth/callback${
    redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ""
  }`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      scopes: "openid email profile",
    },
  });

  if (error) throw error;
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("popup")) {
      return "Sign in was cancelled. Please try again when you're ready.";
    }
    if (
      /network|fetch|Failed to fetch|ENOTFOUND|DNS|can't find the server/i.test(
        error.message
      )
    ) {
      return "We couldn't reach Supabase Auth. Check that your project is active (not paused) and NEXT_PUBLIC_SUPABASE_URL is correct.";
    }
    if (process.env.NODE_ENV === "development") {
      console.error("[auth]", error);
    }
  }
  return "We couldn't sign you in. Please try again.";
}

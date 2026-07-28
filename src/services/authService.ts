import { createClient, isSupabaseConfigured } from "@/lib/supabase";

function getOAuthRedirectOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export async function signInWithGoogle(redirectPath?: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Add your environment variables to continue.");
  }

  const supabase = createClient();
  const origin = getOAuthRedirectOrigin();
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
    if (error.message.includes("network")) {
      return "We couldn't reach the authentication service. Check your connection and try again.";
    }
    if (process.env.NODE_ENV === "development") {
      console.error("[auth]", error);
    }
  }
  return "We couldn't sign you in. Please try again.";
}

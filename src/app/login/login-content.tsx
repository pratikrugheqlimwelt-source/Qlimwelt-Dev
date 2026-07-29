"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/marketing/logo";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PublicOnlyRoute } from "@/components/auth/PublicOnlyRoute";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard/overview";
  const error = searchParams.get("error");

  const errorMessage =
    error === "callback"
      ? "Authentication failed. Please try signing in again."
      : error === "session"
        ? "Your session expired. Please sign in again."
        : error === "config"
          ? "Sign-in is not configured. Add Supabase environment variables and try again."
          : null;

  return (
    <PublicOnlyRoute>
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex justify-center">
              <Logo size="md" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">Welcome to Qlimwelt</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Understand your emissions, identify opportunities, and make confident climate decisions.
            </p>
          </div>

          {errorMessage && (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <GoogleSignInButton redirectTo={redirect} />

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            We only use your basic Google account information to create and secure your Qlimwelt account.
          </p>

          <p className="text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Back to website
            </Link>
          </p>
        </div>
      </div>
    </PublicOnlyRoute>
  );
}

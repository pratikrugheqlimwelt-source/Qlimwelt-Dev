"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/marketing/logo";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PublicOnlyRoute } from "@/components/auth/PublicOnlyRoute";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { useT } from "@/components/i18n/locale-provider";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard/overview";
  const error = searchParams.get("error");
  const t = useT();

  const errorMessage =
    error === "callback"
      ? t("login.errCallback")
      : error === "session"
        ? t("login.errSession")
        : error === "config"
          ? t("login.errConfig")
          : null;

  return (
    <PublicOnlyRoute>
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <LanguageToggle />
        </div>
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex justify-center">
              <Logo size="md" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">{t("login.welcome")}</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("login.subtitle")}
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
            {t("login.privacy")}
          </p>

          <p className="text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("login.backWebsite")}
            </Link>
          </p>
        </div>
      </div>
    </PublicOnlyRoute>
  );
}

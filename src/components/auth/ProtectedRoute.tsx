"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";
import { useAuth } from "@/hooks/useAuth";

const DEV_SEED_KEY = "qlimwelt_dev_seed";

function isDevSeedPreview() {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).get("seed") === "1") return true;
  try {
    if (sessionStorage.getItem(DEV_SEED_KEY) === "1") return true;
  } catch {
    /* ignore */
  }
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${DEV_SEED_KEY}=1`));
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [allowDevPreview, setAllowDevPreview] = useState(false);
  const [seedChecked, setSeedChecked] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      setAllowDevPreview(false);
      setSeedChecked(true);
      return;
    }
    const fromQuery = new URLSearchParams(window.location.search).get("seed") === "1";
    if (fromQuery) {
      try {
        sessionStorage.setItem(DEV_SEED_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    setAllowDevPreview(isDevSeedPreview());
    setSeedChecked(true);
  }, [pathname]);

  useEffect(() => {
    if (!seedChecked || loading) return;
    if (allowDevPreview) return;

    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (requireOnboarding && profile && !profile.onboarding_completed) {
      router.replace("/onboarding");
    }
  }, [user, profile, loading, router, pathname, requireOnboarding, allowDevPreview, seedChecked]);

  if (allowDevPreview) {
    return <>{children}</>;
  }

  if (!seedChecked || loading || !user || (requireOnboarding && profile && !profile.onboarding_completed)) {
    return <AuthLoadingScreen message="Checking your session…" />;
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (requireOnboarding && profile && !profile.onboarding_completed) {
      router.replace("/onboarding");
    }
  }, [user, profile, loading, router, pathname, requireOnboarding]);

  if (loading || !user || (requireOnboarding && profile && !profile.onboarding_completed)) {
    return <AuthLoadingScreen message="Checking your session…" />;
  }

  return <>{children}</>;
}

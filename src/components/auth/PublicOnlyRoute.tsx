"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";
import { useAuth } from "@/hooks/useAuth";

interface PublicOnlyRouteProps {
  children: React.ReactNode;
  redirectIfAuthenticated?: string;
}

export function PublicOnlyRoute({
  children,
  redirectIfAuthenticated = "/dashboard/overview",
}: PublicOnlyRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;

    if (profile?.onboarding_completed) {
      router.replace(redirectIfAuthenticated);
    } else {
      router.replace("/onboarding");
    }
  }, [user, profile, loading, router, redirectIfAuthenticated]);

  if (loading) {
    return <AuthLoadingScreen message="Loading…" />;
  }

  if (user) {
    return <AuthLoadingScreen message="Redirecting…" />;
  }

  return <>{children}</>;
}

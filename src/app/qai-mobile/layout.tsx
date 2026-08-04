"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardProvider } from "@/components/dashboard/providers/dashboard-provider";

export default function QaiMobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardProvider>{children}</DashboardProvider>
    </ProtectedRoute>
  );
}

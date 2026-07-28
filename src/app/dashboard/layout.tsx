"use client";

import { DashboardProvider } from "@/components/dashboard/providers/dashboard-provider";
import { DashboardShell } from "@/components/dashboard/shell/dashboard-shell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardProvider>
        <TooltipProvider>
          <DashboardShell>{children}</DashboardShell>
        </TooltipProvider>
      </DashboardProvider>
    </ProtectedRoute>
  );
}
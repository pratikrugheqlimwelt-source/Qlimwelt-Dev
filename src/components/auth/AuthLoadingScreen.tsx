"use client";

import { Loader2 } from "lucide-react";
import { Logo } from "@/components/marketing/logo";

interface AuthLoadingScreenProps {
  message?: string;
}

export function AuthLoadingScreen({ message = "Loading…" }: AuthLoadingScreenProps) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-white px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Logo size="md" />
      <Loader2 className="mt-8 h-8 w-8 animate-spin text-[#82D153]" aria-hidden="true" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

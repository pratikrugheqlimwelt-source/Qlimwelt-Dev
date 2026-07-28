"use client";

import Link from "next/link";
import { Logo } from "@/components/marketing/logo";

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border/60 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Logo size="sm" />
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back to website
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 lg:py-8">{children}</main>
    </div>
  );
}

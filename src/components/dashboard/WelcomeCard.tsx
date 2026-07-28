"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeCardProps {
  firstName?: string;
  companyName?: string;
}

export function WelcomeCard({ firstName, companyName }: WelcomeCardProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("qlimwelt_welcome");
      if (raw) {
        setVisible(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.removeItem("qlimwelt_welcome");
    setDismissed(true);
  };

  if (!visible || dismissed) return null;

  let name = firstName;
  let company = companyName;

  if (!name || !company) {
    try {
      const raw = sessionStorage.getItem("qlimwelt_welcome");
      if (raw) {
        const parsed = JSON.parse(raw) as { firstName?: string; companyName?: string };
        name = name ?? parsed.firstName;
        company = company ?? parsed.companyName;
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#82D153]/30 bg-gradient-to-r from-[#82D153]/10 via-white to-emerald-50 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#82D153]/20 text-[#3d8b2e]">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">
            Welcome to Qlimwelt{name ? `, ${name}` : ""}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your workspace for {company ?? "your company"} is ready. Explore emissions, targets, and
            climate intelligence from your dashboard.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleDismiss}
          aria-label="Dismiss welcome message"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

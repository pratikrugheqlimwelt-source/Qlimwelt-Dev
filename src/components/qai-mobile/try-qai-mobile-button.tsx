"use client";

import Link from "next/link";
import { Smartphone, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackQaiMobile } from "@/lib/qai-mobile/analytics";

type Variant = "hero" | "header" | "menu" | "inline";

export function TryQaiMobileButton({
  variant = "inline",
  className,
  showHint,
  label = "Try QAI Mobile",
}: {
  variant?: Variant;
  className?: string;
  showHint?: boolean;
  label?: string;
}) {
  const Icon = variant === "hero" ? Sparkles : Smartphone;

  return (
    <div className={cn(variant === "hero" && "flex flex-col gap-1.5", className)}>
      <Link
        href="/qai-mobile"
        onClick={() => trackQaiMobile("try_qai_mobile_clicked", { placement: variant })}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold",
          "bg-[#82D153] text-[#1a3d12] shadow-sm shadow-[#82D153]/25",
          "transition-colors duration-200 hover:bg-[#74c447]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82D153]",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          variant === "hero" && "rounded-xl px-5 py-3.5 text-sm",
          variant === "header" && "rounded-xl px-3 py-2 text-xs",
          variant === "menu" && "w-full justify-start rounded-xl px-2 py-2 text-sm font-medium",
          variant === "inline" && "rounded-xl px-4 py-2.5 text-sm"
        )}
      >
        <Icon className={cn("shrink-0", variant === "header" ? "h-3.5 w-3.5" : "h-4 w-4")} />
        {label}
      </Link>
      {showHint ? (
        <p className="text-xs text-muted-foreground">Your climate intelligence, wherever you go.</p>
      ) : null}
    </div>
  );
}

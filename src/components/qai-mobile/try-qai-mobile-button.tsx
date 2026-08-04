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
          "inline-flex items-center justify-center gap-2 font-semibold text-white",
          "bg-[#82D153] shadow-[0_8px_24px_-12px_rgba(130,209,83,0.85)]",
          "transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#74c447]",
          "hover:shadow-[0_14px_32px_-12px_rgba(130,209,83,0.95)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82D153]",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          variant === "hero" && "rounded-2xl px-5 py-3.5 text-sm",
          variant === "header" && "rounded-[14px] px-3 py-2 text-xs",
          variant === "menu" && "w-full justify-start rounded-xl px-2 py-2 text-sm font-medium",
          variant === "inline" && "rounded-2xl px-4 py-2.5 text-sm"
        )}
      >
        <Icon className={cn("shrink-0", variant === "header" ? "h-3.5 w-3.5" : "h-4 w-4")} />
        {label}
      </Link>
      {showHint ? (
        <p className="text-xs text-slate-500">Your climate intelligence, wherever you go.</p>
      ) : null}
    </div>
  );
}

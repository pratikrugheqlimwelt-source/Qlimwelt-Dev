"use client";

import { cn } from "@/lib/utils";

export function PhoneFrame({
  children,
  className,
  framed = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** When false, render edge-to-edge (mobile browser). */
  framed?: boolean;
}) {
  if (!framed) {
    return (
      <div
        className={cn(
          "relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#F7F8F6]",
          className
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={cn("relative mx-auto w-[360px] shrink-0", className)}>
      <div className="relative h-[720px] overflow-hidden rounded-[2.35rem] border-[10px] border-[#1a1c1a] bg-[#F7F8F6] shadow-[0_40px_80px_-28px_rgba(15,23,42,0.55)]">
        <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-6 w-28 -translate-x-1/2 rounded-full bg-[#1a1c1a]" />
        {/* Fixed inner viewport — never resizes between screens */}
        <div className="absolute inset-0 overflow-hidden">{children}</div>
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 h-1 w-28 -translate-x-1/2 rounded-full bg-black/25" />
      </div>
    </div>
  );
}

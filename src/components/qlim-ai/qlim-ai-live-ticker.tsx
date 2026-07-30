"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/components/dashboard/providers/dashboard-provider";
import { useT } from "@/components/i18n/locale-provider";
import { buildLiveScanFeed } from "@/lib/qlim-ai/live-scan-feed";
import { cn } from "@/lib/utils";

const TYPE_MS = 28;
const HOLD_MS = 3200;
const CLEAR_MS = 280;

/** Compact QAI notification ticker — types recommendation messages in the header. */
export function QlimAiLiveTicker({ className }: { className?: string }) {
  const t = useT();
  const router = useRouter();
  const { filteredActivities, reductionInitiatives, metrics } = useDashboard();
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [typing, setTyping] = useState(true);

  const feed = useMemo(
    () => buildLiveScanFeed(filteredActivities, reductionInitiatives, metrics, t),
    [filteredActivities, reductionInitiatives, metrics, t]
  );

  useEffect(() => {
    setIndex(0);
  }, [feed]);

  const current = feed[index] ?? feed[0];
  const fullText = current?.text ?? "";

  useEffect(() => {
    if (!fullText) return;

    let cancelled = false;
    let char = 0;
    setTyped("");
    setTyping(true);

    const typeTimer = window.setInterval(() => {
      if (cancelled) return;
      char += 1;
      setTyped(fullText.slice(0, char));
      if (char >= fullText.length) {
        window.clearInterval(typeTimer);
        setTyping(false);
      }
    }, TYPE_MS);

    return () => {
      cancelled = true;
      window.clearInterval(typeTimer);
    };
  }, [fullText, index]);

  useEffect(() => {
    if (!fullText || typing || feed.length === 0) return;

    let clearTimer: number | undefined;
    const hold = window.setTimeout(() => {
      setTyped("");
      clearTimer = window.setTimeout(() => {
        setIndex((i) => (i + 1) % feed.length);
      }, CLEAR_MS);
    }, HOLD_MS);

    return () => {
      window.clearTimeout(hold);
      if (clearTimer) window.clearTimeout(clearTimer);
    };
  }, [typing, fullText, feed.length]);

  if (!current) return null;

  return (
    <div
      className={cn(
        "group relative hidden min-w-0 max-w-xl flex-1 items-center md:flex",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={t("shell.aiTicker.ariaLabel")}
    >
      <button
        type="button"
        onClick={() => {
          if (current.href) router.push(current.href);
          else router.push("/dashboard/climate-intelligence");
        }}
        className={cn(
          "relative flex w-full max-w-md items-center gap-2.5 overflow-hidden rounded-xl border px-2.5 py-1.5 text-left transition-all",
          "border-border/70 bg-gradient-to-r from-white via-[#f4fbf0] to-white",
          "hover:border-[#82D153]/60 hover:shadow-[0_0_0_3px_rgba(130,209,83,0.12)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82D153]/40"
        )}
      >
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full bg-[#82D153]/15 animate-pulse"
            aria-hidden
          />
          <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#82D153]/35 bg-white shadow-sm">
            <Image
              src="/logo-mark.png"
              alt=""
              width={22}
              height={22}
              className="h-[18px] w-[18px] object-contain"
            />
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3d8b2e]">
              {t("shell.aiTicker.agent")}
            </span>
          </div>

          <p className="mt-0.5 truncate text-xs font-medium text-foreground">
            <span>{typed}</span>
            <span
              className={cn(
                "ml-px inline-block h-3 w-[2px] translate-y-[2px] bg-[#3d8b2e]",
                typing ? "animate-pulse" : "opacity-0"
              )}
              aria-hidden
            />
          </p>
        </div>
      </button>
    </div>
  );
}

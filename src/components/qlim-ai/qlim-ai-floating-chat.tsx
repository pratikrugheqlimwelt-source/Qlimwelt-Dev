"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Leaf } from "lucide-react";
import { QlimAiChat } from "@/components/qlim-ai/qlim-ai-chat";
import { useT } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

type QlimAiFloatingChatProps = {
  className?: string;
};

/** Floating leaf launcher — expands into the same interactive Qlim AI chat. */
export function QlimAiFloatingChat({ className }: QlimAiFloatingChatProps) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const welcomeMessages = useMemo(
    () => [
      {
        role: "assistant" as const,
        content: t("climatePage.welcomeContent"),
      },
    ],
    [t]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className={cn("pointer-events-none fixed bottom-5 right-5 z-[55] sm:bottom-6 sm:right-6", className)}>
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={t("common.qaiChatTitle")}
            className="pointer-events-auto flex h-[min(72vh,560px)] w-[min(calc(100vw-1.5rem),400px)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[0_20px_60px_-12px_rgba(15,23,42,0.35)]"
            initial={{ opacity: 0, y: 16, scale: 0.94, originX: 1, originY: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#82D153] via-emerald-500 to-teal-500" />
            <QlimAiChat
              messages={welcomeMessages}
              interactive
              fill
              onClose={() => setOpen(false)}
              className="h-full rounded-none border-0 shadow-none"
              messagesClassName="max-h-none"
            />
          </motion.div>
        ) : (
          <motion.button
            key="fab"
            type="button"
            aria-label={t("common.openQaiChat")}
            title={t("common.openQaiChat")}
            onClick={() => setOpen(true)}
            className="pointer-events-auto group relative flex h-14 w-14 items-center justify-center focus-visible:outline-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.25 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
          >
            <span
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full bg-white",
                "shadow-[0_8px_28px_-6px_rgba(15,23,42,0.18),0_2px_8px_-2px_rgba(15,23,42,0.08)]",
                "ring-1 ring-slate-200/90",
                "transition-[box-shadow,ring-color] duration-300",
                "group-hover:shadow-[0_12px_32px_-8px_rgba(61,139,46,0.25)]",
                "group-hover:ring-[#82D153]/45",
                "group-focus-visible:ring-2 group-focus-visible:ring-[#82D153] group-focus-visible:ring-offset-2"
              )}
            >
              <Leaf
                className="h-7 w-7 text-[#3d8b2e] transition-transform duration-300 group-hover:scale-110"
                strokeWidth={2}
                fill="currentColor"
                fillOpacity={0.18}
              />
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

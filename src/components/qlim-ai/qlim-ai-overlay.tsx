"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QlimAiExperience } from "@/components/qlim-ai/qlim-ai-experience";

type QlimAiOverlayProps = {
  open: boolean;
  onClose: () => void;
  chatExpanded?: boolean;
};

export function QlimAiOverlay({ open, onClose, chatExpanded = true }: QlimAiOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close Qlim AI overlay"
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="qlim-ai-title"
            className="fixed inset-x-3 top-[4vh] z-[70] mx-auto max-h-[92vh] max-w-5xl overflow-hidden rounded-2xl border border-border bg-background shadow-[0_24px_80px_-12px_rgba(0,0,0,0.15)] sm:inset-x-6 lg:inset-x-auto"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
            <div className="p-4 pt-5 sm:p-6 sm:pt-7">
              <QlimAiExperience
                variant="overlay"
                chatExpanded={chatExpanded}
                onClose={onClose}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

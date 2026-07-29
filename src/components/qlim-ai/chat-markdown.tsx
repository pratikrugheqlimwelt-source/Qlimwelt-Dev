import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Lightweight chat markdown: **bold**, ★ headers, bullets — no extra deps. */
export function ChatMarkdown({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");

  return (
    <div className={cn("space-y-2 text-[13px] leading-relaxed", className)}>
      {lines.map((line, i) => {
        const trimmed = line.trimEnd();
        if (!trimmed) return <div key={i} className="h-1.5" />;

        const isStarHeader = /^★ [A-Za-z]/.test(trimmed);
        const isBullet = /^([•\-*]|\d+\.)\s+/.test(trimmed);

        if (isStarHeader) {
          return (
            <p key={i} className="pt-1 text-[12px] font-semibold tracking-tight text-brand-dark first:pt-0">
              {renderInline(trimmed)}
            </p>
          );
        }

        if (isBullet) {
          const body = trimmed.replace(/^([•\-*]|\d+\.)\s+/, "");
          return (
            <p key={i} className="flex gap-2 pl-0.5 text-foreground/90">
              <span className="mt-[0.35em] h-1 w-1 shrink-0 rounded-full bg-brand-dark/50" />
              <span className="min-w-0 flex-1">{renderInline(body)}</span>
            </p>
          );
        }

        return (
          <p key={i} className="text-foreground/90">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|★★★★★|★★★★☆|★★★☆☆|★★☆☆☆|★☆☆☆☆)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (
      part === "★★★★★" ||
      part === "★★★★☆" ||
      part === "★★★☆☆" ||
      part === "★★☆☆☆" ||
      part === "★☆☆☆☆"
    ) {
      return (
        <span key={i} className="font-medium tracking-tight text-amber-600">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

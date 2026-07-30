"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={12}
      className={cn(
        "z-[100] max-w-xs rounded-lg border border-border bg-background px-3.5 py-2.5 text-xs leading-relaxed text-foreground shadow-lg animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/** Circular "?" help button — use beside titles or via HelpCorner */
function InfoTip({
  content,
  children,
  className,
  side = "top",
}: {
  content: string;
  children?: React.ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        {children ?? (
          <button
            type="button"
            aria-label="Help"
            className={cn(
              "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[11px] font-semibold text-muted-foreground shadow-sm transition-colors hover:border-brand/40 hover:bg-brand-light hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
              className
            )}
          >
            ?
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  );
}

/** Absolutely positions a "?" in the upper-right of a relative parent */
function HelpCorner({
  content,
  className,
  side = "bottom",
}: {
  content: string;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <div className={cn("absolute right-3 top-3 z-10", className)}>
      <InfoTip content={content} side={side} />
    </div>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, InfoTip, HelpCorner };

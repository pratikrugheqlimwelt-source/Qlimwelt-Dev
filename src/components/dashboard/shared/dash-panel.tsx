"use client";

import { HelpCorner } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Generic dashboard panel with an upper-right "?" help button.
 * Use for raw dash-card sections that are not ChartCard / MetricCard.
 */
export function DashPanel({
  tip,
  children,
  className,
  padding = true,
}: {
  tip: string;
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div className={cn("dash-card relative overflow-hidden", className)}>
      <HelpCorner content={tip} />
      <div className={cn(padding && "p-5", "pr-11")}>{children}</div>
    </div>
  );
}

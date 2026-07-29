import { HelpCorner } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title?: string;
  description?: string;
  tip?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, tip, actions, className }: PageHeaderProps) {
  if (!title && !description && !actions && !tip) return null;

  return (
    <div className={cn("relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", tip && "pr-10", className)}>
      <div className="min-w-0">
        {title && <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">{title}</h2>}
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      {tip && <HelpCorner content={tip} className="right-0 top-0" />}
    </div>
  );
}

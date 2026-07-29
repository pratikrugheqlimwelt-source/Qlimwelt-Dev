import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="dash-label">{title}</h2>
        {description && <p className="mt-1 text-xs text-muted-foreground/80">{description}</p>}
      </div>
      {action}
    </div>
  );
}

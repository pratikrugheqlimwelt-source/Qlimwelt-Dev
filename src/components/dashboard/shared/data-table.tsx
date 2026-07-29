import { HelpCorner } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
  /** Explains this table on "?" hover (upper-right) */
  tip?: string;
}

export function DataTable({ children, className, tip }: DataTableProps) {
  return (
    <div className={cn("dash-card relative overflow-hidden", className)}>
      {tip && <HelpCorner content={tip} />}
      <div className={cn("overflow-x-auto", tip && "pt-2")}>{children}</div>
    </div>
  );
}

export function DataTableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border/60 bg-muted/30 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </tr>
    </thead>
  );
}

export function DataTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border/40">{children}</tbody>;
}

export function DataTableRow({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "text-sm transition-colors",
        onClick && "cursor-pointer hover:bg-brand/[0.03]",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function DataTableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle font-sans text-sm", className)}>{children}</td>;
}

export function DataTableHead({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 font-semibold", className)}>{children}</th>;
}

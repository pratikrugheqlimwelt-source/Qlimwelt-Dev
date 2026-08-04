"use client";

import { cn } from "@/lib/utils";

/** Shared QAI Mobile control styles — keep radius, height, and alignment constant. */
export const qm = {
  pill: cn(
    "inline-flex h-8 shrink-0 items-center justify-center rounded-full px-3.5",
    "text-center text-[11px] font-semibold leading-none tracking-normal whitespace-nowrap",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82D153]/40"
  ),
  pillActive: "bg-[#82D153] text-white",
  pillIdle: "border border-black/[0.08] bg-white text-slate-600",
  primary: cn(
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl px-4",
    "bg-[#82D153] text-center text-sm font-semibold leading-none text-white",
    "transition hover:bg-[#74c447] active:scale-[0.99]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82D153]/40",
    "disabled:pointer-events-none disabled:opacity-40"
  ),
  secondary: cn(
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl px-4",
    "border border-black/[0.08] bg-white text-center text-sm font-semibold leading-none text-slate-800",
    "transition hover:bg-slate-50 active:scale-[0.99]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82D153]/40",
    "disabled:pointer-events-none disabled:opacity-40"
  ),
  ghost: cn(
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-3",
    "text-center text-[11px] font-semibold leading-none text-[#3d8f2e]",
    "transition hover:bg-[#82D153]/10"
  ),
  icon: cn(
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
    "text-slate-700 transition hover:bg-black/5",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82D153]/40"
  ),
  prompt: cn(
    "flex min-h-12 w-full items-center rounded-2xl border border-black/[0.06] bg-white px-4 py-3.5",
    "text-left text-sm font-medium leading-snug text-slate-800",
    "shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition active:scale-[0.99]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82D153]/40"
  ),
  chip: cn(
    "inline-flex h-8 items-center justify-center gap-1 rounded-full px-3.5",
    "text-center text-[11px] font-semibold leading-none whitespace-nowrap",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82D153]/40"
  ),
  danger: cn(
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl px-4",
    "border border-red-200 bg-red-50 text-center text-sm font-semibold leading-none text-red-600",
    "transition hover:bg-red-100 active:scale-[0.99]",
    "disabled:pointer-events-none disabled:opacity-40"
  ),
  row: cn(
    "flex h-12 w-full items-center gap-3 px-4 text-left",
    "text-sm font-medium leading-none text-slate-800"
  ),
} as const;

export function MobilePill({
  active,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(qm.pill, active ? qm.pillActive : qm.pillIdle, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function MobileButton({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles = {
    primary: qm.primary,
    secondary: qm.secondary,
    danger: qm.danger,
    ghost: qm.ghost,
  }[variant];
  return (
    <button type="button" className={cn(styles, className)} {...props}>
      {children}
    </button>
  );
}

export function MobileCard({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "w-full rounded-[20px] border border-black/[0.06] bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82D153]/40",
        onClick && "transition active:scale-[0.985]",
        className
      )}
    >
      {children}
    </Comp>
  );
}

export function MobileEmpty({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[20px] border border-dashed border-black/10 bg-white/70 px-4 py-8 text-center">
      <p className="text-sm font-semibold leading-snug text-slate-900">{title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{body}</p>
      {actionLabel && onAction ? (
        <MobileButton variant="primary" className="mx-auto mt-4 max-w-[200px]" onClick={onAction}>
          {actionLabel}
        </MobileButton>
      ) : null}
    </div>
  );
}

export function MobileLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#82D153] border-t-transparent" />
    </div>
  );
}

export function ScoreRing({
  score,
  size = 88,
  stroke = 8,
  label,
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, score)) / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8EDE4" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#82D153"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-lg font-bold tabular-nums text-slate-900">{score}</span>
        {label ? <span className="mt-0.5 text-[9px] font-medium text-slate-500">{label}</span> : null}
      </div>
    </div>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  if (!values.length || values.every((v) => v === 0)) {
    return <div className="h-10 w-full rounded-md bg-slate-100" />;
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-10 w-full">
      <polyline
        fill="none"
        stroke="#82D153"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

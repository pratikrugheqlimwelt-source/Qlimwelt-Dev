import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const iconHeights = {
  sm: 28,
  md: 32,
  lg: 40,
} as const;

const iconClass = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-10 w-10",
} as const;

const wordmarkSizes = {
  sm: "text-[15px]",
  md: "text-[17px]",
  lg: "text-xl",
} as const;

export function Logo({ variant = "full", className, size = "md" }: LogoProps) {
  const mark = (
    <Image
      src="/logo-mark.png"
      alt=""
      width={iconHeights[size]}
      height={iconHeights[size]}
      className={cn("shrink-0 object-contain", iconClass[size])}
      priority
      aria-hidden
    />
  );

  if (variant === "icon") {
    return (
      <Link
        href="/"
        aria-label="Qlimwelt home"
        className={cn("inline-flex shrink-0 transition-opacity hover:opacity-90", className)}
      >
        {mark}
      </Link>
    );
  }

  return (
    <Link
      href="/"
      aria-label="Qlimwelt home"
      className={cn(
        "inline-flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90",
        className
      )}
    >
      {mark}
      <span
        className={cn(
          "font-sans font-semibold tracking-[-0.02em] text-foreground",
          wordmarkSizes[size]
        )}
      >
        Qlimwelt
      </span>
    </Link>
  );
}

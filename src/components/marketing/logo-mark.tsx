import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
}

/**
 * Official Qlimwelt mark — four identical right triangles (pinwheel),
 * uniform central cross gap, rounded corners. Color #82D153.
 *
 * Geometry traced from brand assets: each piece is rotated 90° around center.
 */
export function LogoMark({ className }: LogoMarkProps) {
  const fill = "#82D153";

  // Single quadrant piece: right angle at inner corner, legs along gap edges, hypotenuse to outer diamond corner
  // viewBox 0 0 48 48 · center 24,24 · gap half-width 3.25
  const piece =
    "M 20.75 20.75 L 42 20.75 L 20.75 6 Z";

  const shared = {
    fill,
    stroke: fill,
    strokeWidth: 2.6,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path {...shared} d={piece} />
      <path {...shared} d={piece} transform="rotate(90 24 24)" />
      <path {...shared} d={piece} transform="rotate(180 24 24)" />
      <path {...shared} d={piece} transform="rotate(270 24 24)" />
    </svg>
  );
}

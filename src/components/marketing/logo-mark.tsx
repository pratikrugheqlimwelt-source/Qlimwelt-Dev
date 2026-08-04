import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
}

/**
 * Official Qlimwelt mark — four separated lime pinwheel wedges with a clear
 * central cross gap. Uses the approved brand PNG from the design system.
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <Image
      src="/logo-mark.png"
      alt=""
      width={48}
      height={48}
      className={cn("shrink-0 object-contain", className)}
      aria-hidden
      priority
    />
  );
}

/**
 * Inline SVG twin of the brand mark for contexts that need a vector.
 * Four right triangles · right angles toward center · clear cross gap · no stroke.
 */
export function LogoMarkSvg({ className }: LogoMarkProps) {
  const fill = "#82D153";
  const wedge = "M 19 19 L 43 19 L 19 5 Z";

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path fill={fill} d={wedge} />
      <path fill={fill} d={wedge} transform="rotate(90 24 24)" />
      <path fill={fill} d={wedge} transform="rotate(180 24 24)" />
      <path fill={fill} d={wedge} transform="rotate(270 24 24)" />
    </svg>
  );
}

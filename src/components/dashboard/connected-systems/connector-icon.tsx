"use client";

import { useState } from "react";
import * as simpleIcons from "simple-icons";
import { CONNECTOR_LOGOS, faviconUrl } from "@/lib/connected-systems/logos";
import { cn } from "@/lib/utils";

type SimpleIcon = {
  title: string;
  slug: string;
  hex: string;
  path: string;
};

function getSimpleIcon(key?: string): SimpleIcon | null {
  if (!key) return null;
  const icon = (simpleIcons as Record<string, SimpleIcon | undefined>)[key];
  return icon?.path ? icon : null;
}

export function ConnectorIcon({
  connectorId,
  mark,
  name,
  size = "md",
  className,
}: {
  connectorId: string;
  mark: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = CONNECTOR_LOGOS[connectorId];
  const brand = getSimpleIcon(meta?.simpleIcon);
  const [imgFailed, setImgFailed] = useState(false);

  const box =
    size === "sm" ? "h-9 w-9 rounded-lg" : size === "lg" ? "h-14 w-14 rounded-2xl" : "h-12 w-12 rounded-xl";
  const iconPx = size === "sm" ? 18 : size === "lg" ? 28 : 24;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-white ring-1 ring-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        box,
        className
      )}
      title={name}
      aria-hidden={!name}
    >
      {brand ? (
        <svg
          role="img"
          viewBox="0 0 24 24"
          width={iconPx}
          height={iconPx}
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <title>{brand.title}</title>
          <path d={brand.path} fill={`#${brand.hex}`} />
        </svg>
      ) : meta?.domain && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={faviconUrl(meta.domain, 128)}
          alt=""
          width={iconPx}
          height={iconPx}
          className="object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="text-[10px] font-bold tracking-wide text-slate-600">{mark}</span>
      )}
    </div>
  );
}

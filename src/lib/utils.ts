import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatCurrency(num: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatPercent(num: number): string {
  return `${num > 0 ? "+" : ""}${num.toFixed(1)}%`;
}

export function formatCO2(tonnes: number): string {
  if (tonnes >= 1000) {
    return `${formatNumber(tonnes / 1000, 1)}k tCO₂e`;
  }
  return `${formatNumber(tonnes, 1)} tCO₂e`;
}

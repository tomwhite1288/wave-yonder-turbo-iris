import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function formatHours(hours: number): string {
  if (!Number.isFinite(hours)) return "0.00";
  const sign = hours < 0 ? "-" : "";
  return `${sign}${Math.abs(hours).toFixed(2)}`;
}

export function formatDuration(minutes: number): string {
  const abs = Math.abs(Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatClock(iso: string | null | undefined, timeZone = "America/New_York"): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(iso: string | null | undefined, timeZone = "America/New_York"): string {
  if (!iso) return "—";
  const date = iso.length <= 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function todayIso(timeZone = "America/New_York"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

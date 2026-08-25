import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-elevated text-muted",
  ok: "bg-ok/15 text-ok",
  warn: "bg-warn/15 text-warn",
  danger: "bg-danger/15 text-danger",
  info: "bg-primary/15 text-primary",
} as const;

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: keyof typeof tones;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

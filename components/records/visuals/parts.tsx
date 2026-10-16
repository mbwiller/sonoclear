import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Small eyebrow-style title above a figure. */
export function FigureTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("eyebrow mb-3", className)}>{children}</h3>;
}

/** The caption under a figure, always visible as prose. */
export function FigureCaption({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <figcaption className={cn("mt-3 text-body-sm text-ink-muted text-pretty", className)}>{children}</figcaption>
  );
}

/** Rounds to two decimals so SVG attributes stay tidy. */
export function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Plain number text: 12, 15.5, 0.57. */
export function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
}

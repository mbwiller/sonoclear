import { cn } from "@/lib/cn";

const SIZES = {
  xs: { h: 12, w: 2, gap: 2 },
  sm: { h: 16, w: 3, gap: 3 },
  md: { h: 24, w: 4, gap: 4 },
  lg: { h: 44, w: 7, gap: 7 },
  xl: { h: 72, w: 10, gap: 10 },
} as const;

/**
 * The signature motif: three vertical bars in sage.
 * Live recording indicator, loading state, and the logo mark.
 */
export function Bars({
  live = false,
  size = "sm",
  label,
  className,
}: {
  live?: boolean;
  size?: keyof typeof SIZES;
  /** Accessible label. Omit when the bars are decorative. */
  label?: string;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      className={cn("bars shrink-0", className)}
      data-live={live ? "true" : "false"}
      style={{ "--bars-h": `${s.h}px`, "--bars-w": `${s.w}px`, "--bars-gap": `${s.gap}px` } as React.CSSProperties}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <span />
      <span />
      <span />
    </span>
  );
}

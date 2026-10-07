import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Small metadata chip: date, clinician type, duration. Not interactive. */
export function Chip({ children, icon, className }: { children: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full bg-sunken px-3 text-caption font-medium text-ink-muted tabular",
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/**
 * A selectable chip (e.g. visit type). Use inside a `role="radiogroup"` with `role="radio"`,
 * or as a toggle with `aria-pressed`.
 * `quiet` drops the outline: unselected options are plain text, only the chosen one has a fill.
 */
export function ChoiceChip({
  selected,
  quiet = false,
  className,
  children,
  ...rest
}: { selected: boolean; quiet?: boolean } & ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 items-center rounded-full px-4 text-body-sm font-medium",
        "transition-[background-color,border-color,color] duration-200 ease-calm",
        quiet
          ? selected
            ? "bg-sage-soft text-ink"
            : "text-ink-muted hover:bg-sunken hover:text-ink"
          : selected
            ? "border border-sage bg-sage-soft text-ink"
            : "border border-line bg-surface text-ink-muted hover:border-line-strong/60 hover:text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

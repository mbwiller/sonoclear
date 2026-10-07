import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "quiet";
type Size = "md" | "lg";

/**
 * Pill buttons. Primary is ink on paper; secondary is a hairline outline;
 * quiet is text only. Every size meets the 44px touch target.
 */
export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap",
    "transition-[background-color,color,border-color,opacity] duration-200 ease-calm",
    "disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45",
    size === "md" && "h-11 px-5 text-body-sm",
    size === "lg" && "h-13 px-7 text-body",
    variant === "primary" && "bg-ink text-paper hover:bg-ink/88",
    variant === "secondary" && "border border-line-strong/50 bg-surface text-ink hover:border-line-strong hover:bg-paper",
    variant === "quiet" && "px-3 text-ink-muted hover:bg-sunken hover:text-ink",
    className,
  );
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconAfter?: ReactNode;
}

export function Button({
  variant,
  size,
  icon,
  iconAfter,
  className,
  children,
  type = "button",
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button type={type} className={buttonStyles({ variant, size, className })} {...rest}>
      {icon}
      {children}
      {iconAfter}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  icon,
  iconAfter,
  className,
  children,
  ...rest
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonStyles({ variant, size, className })} {...rest}>
      {icon}
      {children}
      {iconAfter}
    </Link>
  );
}

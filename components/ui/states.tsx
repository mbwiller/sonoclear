import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Bars } from "./bars";

/** A calm working state: the three bars and one line. Announced to screen readers. */
export function LoadingState({ title, detail, className }: { title: string; detail?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center text-center", className)}>
      <Bars live size="md" />
      <p className="mt-6 font-display text-display-md text-ink">{title}</p>
      {detail ? <p className="mt-2 max-w-sm text-body text-ink-muted text-pretty">{detail}</p> : null}
    </div>
  );
}

/** Typographic empty state. No illustrations. */
export function EmptyState({ title, children, action, className }: { title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-card border border-dashed border-line px-6 py-8 text-center", className)}>
      <p className="font-display text-display-sm text-ink">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-md text-body-sm text-ink-muted text-pretty">{children}</div> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** A quiet informational note, e.g. an honest preview limitation. */
export function Note({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "attention"; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[18px] px-5 py-4 text-body-sm text-pretty",
        tone === "neutral" ? "bg-sunken text-ink" : "bg-attention-soft text-attention-ink",
        className,
      )}
    >
      {children}
    </div>
  );
}

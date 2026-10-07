import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/** Collapsed-by-default section built on <details>. */
export function Disclosure({
  summary,
  meta,
  children,
  className,
  defaultOpen = false,
}: {
  summary: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  return (
    <details className={cn("group rounded-card border border-line bg-surface", className)} open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-card px-5 py-3 [&::-webkit-details-marker]:hidden">
        <span className="flex flex-col">
          <span className="text-body font-medium text-ink">{summary}</span>
          {meta ? <span className="text-body-sm text-ink-muted">{meta}</span> : null}
        </span>
        <ChevronDown
          size={20}
          aria-hidden
          className="shrink-0 text-ink-muted transition-transform duration-300 ease-calm group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-line px-5 pb-5 pt-4">{children}</div>
    </details>
  );
}

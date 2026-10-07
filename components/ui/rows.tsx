import type { ReactNode } from "react";
import type { Term } from "@/lib/types";
import { cn } from "@/lib/cn";
import { TermLink } from "./term";

/** A list of labeled rows separated by hairlines. */
export function Rows({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn("divide-y divide-line rounded-card border border-line bg-surface px-5", className)}>{children}</dl>;
}

/**
 * One labeled row: label on the left (top on mobile), value on the right.
 * When a term is given, the value opens its definition.
 */
export function Row({
  label,
  value,
  plain,
  term,
}: {
  label: string;
  value: ReactNode;
  plain?: string;
  term?: Term;
}) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
      <dt className="text-body-sm text-ink-muted">{label}</dt>
      <dd className="min-w-0">
        <span className="text-body font-medium text-ink">
          {term ? (
            <TermLink term={term} className="relative after:absolute after:inset-x-0 after:-inset-y-2.5">
              {value}
            </TermLink>
          ) : (
            value
          )}
        </span>
        {plain ? <p className="mt-1 text-body-sm text-ink-muted text-pretty">{plain}</p> : null}
      </dd>
    </div>
  );
}

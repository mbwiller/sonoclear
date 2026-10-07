"use client";

import { useState, type ReactNode } from "react";
import type { Term } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Sheet } from "./sheet";

function TermSheet({ term, open, onClose }: { term: Term; open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} eyebrow="Term explained" title={term.term}>
      <p className="text-body text-ink text-pretty">{term.definition}</p>
      {term.alsoCalled?.length ? (
        <p className="mt-4 text-body-sm text-ink-muted">Also called {term.alsoCalled.join(", ")}.</p>
      ) : null}
    </Sheet>
  );
}

/** An inline term with a dotted underline. Tapping it opens a short definition. */
export function TermLink({ term, children, className }: { term: Term; children?: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cn(
          "inline rounded-sm text-left underline decoration-sage/70 decoration-dotted decoration-[1.5px] underline-offset-[5px] hover:decoration-sage transition-colors duration-200 hover:decoration-solid",
          className,
        )}
      >
        {children ?? term.term}
      </button>
      <TermSheet term={term} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** A term as a pill, for "Terms explained" lists. */
export function TermChip({ term }: { term: Term }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-body-sm font-medium text-ink transition-[border-color,background-color] duration-200 hover:border-sage hover:bg-sage-soft/50"
      >
        {term.term}
      </button>
      <TermSheet term={term} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

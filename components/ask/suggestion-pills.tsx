"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Keeps "HER2-negative" and "BI-RADS" whole when a pill wraps. */
function keepHyphenatedWhole(text: string): ReactNode {
  return text.split(/(\S*\w-\w\S*)/).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** Questions she can tap to ask. Quiet pills, never louder than the answer. */
export function SuggestionPills({
  questions,
  onAsk,
  disabled,
  align = "start",
  className,
  label,
}: {
  questions: string[];
  onAsk: (question: string) => void;
  disabled?: boolean;
  align?: "start" | "center";
  className?: string;
  /** Accessible name for the group. */
  label: string;
}) {
  return (
    <ul
      aria-label={label}
      className={cn(
        "flex flex-col gap-2.5 sm:flex-row sm:flex-wrap",
        align === "center" ? "sm:justify-center" : "sm:justify-start",
        className,
      )}
    >
      {questions.map((q) => (
        <li key={q} className="sm:max-w-full">
          <button
            type="button"
            onClick={() => onAsk(q)}
            disabled={disabled}
            className={cn(
              "flex min-h-12 w-full items-center rounded-full border border-line bg-surface px-5 py-2.5 text-left text-body-sm text-ink text-pretty",
              "sm:inline-flex sm:min-h-11 sm:w-auto sm:max-w-full sm:px-4 sm:py-2",
              "transition-[background-color,border-color] duration-200 ease-calm hover:border-sage hover:bg-sage-soft/50",
              "disabled:opacity-45",
            )}
          >
            <span>{keepHyphenatedWhole(q)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

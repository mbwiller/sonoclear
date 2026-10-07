"use client";

import type { FormEvent, Ref } from "react";
import Link from "next/link";
import { ArrowUp, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AskFocus } from "./focus";

/**
 * The visit or record she's asking about. The label goes back to it (an installed app has
 * no back button); the × lets the context go. Both are 44px targets.
 */
function FocusChip({ focus, onClear }: { focus: AskFocus; onClear: () => void }) {
  return (
    <span className="inline-flex h-11 max-w-full items-center rounded-full bg-sage-soft text-body-sm font-medium text-ink animate-fade-in">
      <Link
        href={focus.href}
        className="flex h-full min-w-0 items-center rounded-full pl-4 pr-1.5 transition-colors duration-200 hover:text-sage-ink"
      >
        <span className="truncate underline decoration-line-strong/50 underline-offset-[3px]">{focus.label}</span>
      </Link>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear: ${focus.label}`}
        className="grid size-11 shrink-0 place-items-center rounded-full text-ink-muted transition-colors duration-200 hover:bg-surface/70 hover:text-ink"
      >
        <X size={16} aria-hidden />
      </button>
    </span>
  );
}

/**
 * The pill-shaped question field. Enter asks. While an answer is on its way the field is
 * read-only (and says so to assistive tech) so keyboard focus stays where it is.
 */
export function Composer({
  ref,
  value,
  onChange,
  onSubmit,
  busy,
  placeholder,
  focus,
  onClearFocus,
  align,
}: {
  ref?: Ref<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
  placeholder: string;
  focus: AskFocus | null;
  onClearFocus: () => void;
  align: "start" | "center";
}) {
  const canAsk = !busy && value.trim().length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (canAsk) onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {focus ? (
        <div className={cn("mb-3 flex", align === "center" ? "justify-center" : "justify-start")}>
          <FocusChip focus={focus} onClear={onClearFocus} />
        </div>
      ) : null}
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border border-line bg-surface p-1.5 pl-6 shadow-soft",
          "transition-[border-color,outline-color] duration-200 ease-calm",
          "outline-2 outline-offset-2 outline-transparent has-[input:focus-visible]:outline-sage",
        )}
      >
        <label htmlFor="ask-question" className="sr-only">
          Your question
        </label>
        <input
          ref={ref}
          id="ask-question"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={busy}
          aria-disabled={busy || undefined}
          autoComplete="off"
          enterKeyHint="send"
          className={cn(
            "h-11 min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-muted/85 focus-visible:outline-none",
            busy && "text-ink-muted",
          )}
        />
        <button
          type="submit"
          aria-label="Ask"
          disabled={!canAsk}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-paper transition-[background-color,opacity] duration-200 ease-calm hover:bg-ink/88 disabled:bg-sunken disabled:text-ink-muted"
        >
          <ArrowUp size={20} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </form>
  );
}

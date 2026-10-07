"use client";

import Link from "next/link";
import { useId } from "react";
import { Check, CornerDownRight } from "lucide-react";
import { clinicianShortName, useCare, useCareActions } from "@/lib/care";
import { cn } from "@/lib/cn";
import { formatUpcoming } from "@/lib/dates";
import type { Todo } from "@/lib/types";
import { linkifyPhones } from "./prose";

/**
 * A checkable to-do. Shows its timing, any detail (phone numbers are tappable),
 * and a link back to the visit it came from.
 */
export function TodoRow({
  todo,
  showSource = true,
  showDetail = true,
  className,
}: {
  todo: Todo;
  /** Hide the "from visit" link when already on that visit's page. */
  showSource?: boolean;
  showDetail?: boolean;
  className?: string;
}) {
  const care = useCare();
  const { setTodoDone } = useCareActions();
  const id = useId();
  const source = todo.sourceVisitId ? care.visitById.get(todo.sourceVisitId) : undefined;
  const resolvedBy = todo.resolvedByVisitId ? care.visitById.get(todo.resolvedByVisitId) : undefined;
  const resolvedWho = resolvedBy ? clinicianShortName(resolvedBy, care) : null;

  // Timing matters only while a to-do is open; on a done one it goes stale.
  const due = !todo.done && todo.dueDate ? formatUpcoming(todo.dueDate) : null;
  const hasTiming = !todo.done && Boolean(todo.dueHint || due);

  return (
    <div className={cn("flex gap-3 py-3.5", className)}>
      <span className="relative -my-2.5 -ml-2.5 grid size-11 shrink-0 place-items-center">
        <input
          id={id}
          type="checkbox"
          checked={todo.done}
          onChange={(e) => setTodoDone(todo.id, e.target.checked)}
          aria-describedby={hasTiming ? `${id}-timing` : undefined}
          className="peer absolute inset-0 z-10 cursor-pointer appearance-none rounded-full focus-visible:outline-none"
        />
        <span
          aria-hidden
          className={cn(
            "grid size-6 place-items-center rounded-full border-[1.5px] transition-[background-color,border-color] duration-200 ease-calm",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-sage",
            todo.done ? "border-sage bg-sage text-surface" : "border-line-strong bg-surface peer-hover:border-ink",
          )}
        >
          <Check
            size={14}
            strokeWidth={2.25}
            className={cn("transition-opacity duration-200", todo.done ? "opacity-100" : "opacity-0")}
          />
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <label
          htmlFor={id}
          className={cn(
            "block cursor-pointer text-body text-pretty transition-colors duration-200",
            todo.done ? "text-ink-muted line-through decoration-line-strong/50" : "text-ink",
          )}
        >
          {todo.text}
        </label>
        {hasTiming ? (
          <p id={`${id}-timing`} className="mt-0.5 text-body-sm text-ink-muted">
            {todo.dueHint}
            {todo.dueHint && due ? " · " : null}
            {due ? <span className="whitespace-nowrap">{due}</span> : null}
          </p>
        ) : null}
        {showDetail && todo.detail && !todo.done ? (
          <p className="mt-1 text-body-sm text-ink-muted text-pretty">{linkifyPhones(todo.detail)}</p>
        ) : null}
        {todo.done && resolvedBy ? (
          <p className="mt-0.5 text-body-sm text-sage-ink">
            Covered during your visit{resolvedWho ? ` with ${resolvedWho}` : ""}
          </p>
        ) : null}
        {showSource && source ? (
          <Link
            href={`/visit/${source.id}`}
            className="relative -ml-1 mt-1 inline-flex min-h-8 items-center gap-1.5 rounded-full px-1 text-caption font-medium text-ink-muted transition-colors duration-200 after:absolute after:inset-x-0 after:-inset-y-1.5 hover:text-ink"
          >
            <CornerDownRight size={14} aria-hidden />
            <span className="underline decoration-line underline-offset-[3px]">{source.notes.title}</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

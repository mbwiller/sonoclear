"use client";

import { Bars } from "@/components/ui/bars";
import { Prose } from "@/components/ui/prose";
import { SourceChip } from "@/components/ui/source-chip";
import { cn } from "@/lib/cn";
import type { AskNote } from "./ask-store";
import { SuggestionPills } from "./suggestion-pills";

export const noteHeadingId = (id: string) => `${id}-question`;

/** The calm line under an answer that was cut short. */
export function incompleteLine(note: AskNote): string {
  return note.answer
    ? "This answer stopped partway through. You can ask again."
    : "This answer didn't come through. You can ask again.";
}

/** Shown as typed, with a capital first letter so it sits well as a heading. */
const asHeading = (q: string) => q.charAt(0).toUpperCase() + q.slice(1);

/**
 * The answer as document text. In a redirect, the question she could bring to her doctor
 * (the paragraph after one ending in a colon) is set apart so it's easy to carry.
 */
function AnswerBody({ text, kind }: { text: string; kind: AskNote["kind"] }) {
  if (kind !== "redirect") return <Prose text={text} className="max-w-[62ch]" />;
  const paragraphs = text.split(/\n\s*\n/);
  return (
    <div className="flex max-w-[62ch] flex-col gap-4">
      {paragraphs.map((p, i) =>
        i > 0 && paragraphs[i - 1].trimEnd().endsWith(":") ? (
          <blockquote key={i} className="my-1 border-l-2 border-sage py-0.5 pl-5 font-display text-display-sm text-ink text-pretty">
            {p.trim()}
          </blockquote>
        ) : (
          <Prose key={i} text={p} />
        ),
      )}
    </div>
  );
}

/**
 * One question and its answer, laid out like a short written note:
 * the question as a serif heading, the answer as document text, then where it came from.
 */
export function AskNoteView({
  note,
  onAsk,
  busy,
  onRetry,
}: {
  note: AskNote;
  onAsk: (question: string) => void;
  busy: boolean;
  onRetry: (note: AskNote) => void;
}) {
  const headingId = noteHeadingId(note.id);
  const done = note.status === "done";

  return (
    <article aria-labelledby={headingId} className="animate-rise-in">
      {note.focusLabel ? <p className="eyebrow mb-3">{note.focusLabel}</p> : null}
      <h2
        id={headingId}
        tabIndex={-1}
        className="scroll-mt-8 font-display text-display-md text-ink text-balance outline-none lg:text-[1.875rem] lg:leading-[1.16]"
      >
        {asHeading(note.question)}
      </h2>

      <div className="mt-5" aria-busy={note.status === "waiting" || note.status === "streaming"}>
        {note.status === "waiting" ? (
          <p className="flex min-h-7 items-center gap-3 text-body-sm text-ink-muted">
            <Bars live size="sm" />
            Looking through your visits and records
          </p>
        ) : null}

        {note.answer ? <AnswerBody text={note.answer} kind={note.kind} /> : null}

        {note.status === "incomplete" ? (
          <div
            className={cn(
              "flex flex-wrap items-center gap-x-3 gap-y-1",
              note.answer && "mt-5 border-t border-line pt-4",
            )}
          >
            <p className="text-body-sm text-ink-muted">{incompleteLine(note)}</p>
            <button
              type="button"
              onClick={() => onRetry(note)}
              disabled={busy}
              className="-ml-3 min-h-11 rounded-full px-3 text-body-sm font-medium text-ink underline decoration-line-strong/60 underline-offset-[3px] hover:decoration-ink disabled:opacity-45 sm:ml-0"
            >
              Ask again
            </button>
          </div>
        ) : null}

        {done && note.kind === "fallback" && note.suggestions.length > 0 ? (
          <SuggestionPills
            label="Questions you can ask in this preview"
            questions={note.suggestions}
            onAsk={onAsk}
            disabled={busy}
            className="mt-5 animate-fade-in"
          />
        ) : null}

        {done && note.sources.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2 animate-fade-in">
            <span className="sr-only">Sources:</span>
            {note.sources.map((s) => (
              <SourceChip key={`${s.kind}-${s.id}`} source={s} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

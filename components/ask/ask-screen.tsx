"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Contours } from "@/components/ui/contours";
import { useCare } from "@/lib/care";
import { cn } from "@/lib/cn";
import { services } from "@/services";
import { AskNoteView, incompleteLine, noteHeadingId } from "./ask-note";
import { askQuestion, isBusy, useAskStore, type AskNote } from "./ask-store";
import { Composer } from "./composer";
import { focusFor } from "./focus";
import { SuggestionPills } from "./suggestion-pills";

const TITLE_ID = "ask-title";
const BOUNDARY = "Sonoclear explains. Your care team decides.";
const LOOKING = "Looking through your visits and records.";

/** Compare questions loosely: case, spacing and punctuation don't matter. */
const normalizeQuestion = (q: string) => q.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** On touch screens, moving focus off the field closes the keyboard so the answer can be read. */
const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

/** What a screen reader hears: once when the answer starts, once when it's complete. */
function announcementFor(note: AskNote | undefined): string {
  if (!note) return "";
  switch (note.status) {
    case "waiting":
    case "streaming":
      return LOOKING;
    case "incomplete":
      return incompleteLine(note);
    case "done":
      return note.kind === "fallback" && note.suggestions.length
        ? `${note.answer} ${note.suggestions.join(" ")}`
        : note.answer;
  }
}

export function AskScreen() {
  const care = useCare();
  const router = useRouter();
  const searchParams = useSearchParams();

  const focusId = searchParams.get("focus");
  const focus = useMemo(() => (focusId ? focusFor(focusId, care) : null), [focusId, care]);

  const notes = useAskStore((s) => s.notes);
  const clear = useAskStore((s) => s.clear);
  const busy = isBusy(notes);
  const hasThread = notes.length > 0;

  const suggestions = useMemo(() => services.chat.suggestedQuestions(care, focus?.id), [care, focus?.id]);
  // After an answer, offer the working questions she hasn't asked yet.
  const last = notes.at(-1);
  const asked = new Set(notes.map((n) => normalizeQuestion(n.question)));
  const remaining = suggestions.filter((q) => !asked.has(normalizeQuestion(q)));
  const offerMore = last?.status === "done" && last.kind !== "fallback" && remaining.length > 0;
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /** Where to take the patient once the thread re-renders: a new note, or back to the top. */
  const pending = useRef<{ targetId: string; moveFocus: boolean; scroll: "into-view" | "top" } | null>(null);

  useEffect(() => {
    const p = pending.current;
    if (!p) return;
    const el = document.getElementById(p.targetId);
    if (!el) return;
    pending.current = null;
    const behavior = prefersReducedMotion() ? "auto" : "smooth";
    if (p.moveFocus) el.focus({ preventScroll: true });
    if (p.scroll === "top") window.scrollTo({ top: 0, behavior });
    else el.scrollIntoView({ behavior, block: "start" });
  }, [notes.length]);

  function ask(question: string, via: "field" | "pill") {
    const isFirst = notes.length === 0;
    const id = askQuestion(question, focus ?? undefined);
    if (!id) return;
    if (via === "field") setDraft("");
    pending.current = {
      targetId: noteHeadingId(id),
      // A tapped pill may disappear; typed questions keep focus in the field on desktop.
      moveFocus: via === "pill" || isTouch(),
      scroll: isFirst ? "top" : "into-view",
    };
  }

  function startOver() {
    clear();
    setDraft("");
    pending.current = { targetId: TITLE_ID, moveFocus: true, scroll: "top" };
  }

  function clearFocus() {
    router.replace("/ask", { scroll: false });
    if (!isTouch()) inputRef.current?.focus();
  }

  return (
    <div className="relative isolate">
      <Contours />
      <div
        className={cn(
          "relative mx-auto flex w-full max-w-[680px] flex-col px-5 sm:px-8 lg:px-12",
          "min-h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] lg:min-h-dvh",
          hasThread ? "pt-4 lg:pt-12" : "justify-center pb-16 pt-12 lg:pb-[12vh]",
        )}
      >
        {hasThread ? (
          <header className="flex min-h-11 items-center justify-between gap-4">
            <h1 id={TITLE_ID} tabIndex={-1} className="eyebrow outline-none">
              Your questions
            </h1>
            <Button
              variant="quiet"
              onClick={startOver}
              icon={<RotateCcw size={16} aria-hidden />}
              className="-mr-3"
            >
              Start over
            </Button>
          </header>
        ) : (
          <h1
            id={TITLE_ID}
            tabIndex={-1}
            className="mx-auto max-w-[14ch] text-center font-display text-display-xl text-ink text-balance outline-none sm:max-w-none sm:text-[2.75rem] lg:text-[3.25rem]"
          >
            What would you like to <em className="italic">understand</em>?
          </h1>
        )}

        {hasThread ? (
          <div className="flex-1 divide-y divide-line pb-6">
            {notes.map((note) => (
              <div key={note.id} className="py-10 first:pt-8 lg:py-12 lg:first:pt-10">
                <AskNoteView
                  note={note}
                  busy={busy}
                  onAsk={(q) => ask(q, "pill")}
                  onRetry={(n) => ask(n.question, "pill")}
                />
                {note === last && offerMore ? (
                  <div className="mt-12 animate-fade-in">
                    <p className="eyebrow mb-4">You could also ask</p>
                    <SuggestionPills label="You could also ask" questions={remaining} onAsk={(q) => ask(q, "pill")} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div
          className={cn(
            hasThread
              ? cn(
                  "sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 bg-paper pb-4 pt-2 lg:bottom-0 lg:pb-8",
                  "before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-8 before:bg-linear-to-b before:from-paper/0 before:to-paper",
                )
              : "mt-9 lg:mt-11",
          )}
        >
          <Composer
            ref={inputRef}
            value={draft}
            onChange={setDraft}
            onSubmit={() => ask(draft, "field")}
            busy={busy}
            placeholder={hasThread ? "Ask another question" : "Ask about your visits or results"}
            focus={focus}
            onClearFocus={clearFocus}
            align={hasThread ? "start" : "center"}
          />
          {hasThread ? <p className="mt-3 text-center text-caption text-ink-muted">{BOUNDARY}</p> : null}
        </div>

        {hasThread ? null : (
          <div className="mt-6 animate-fade-in">
            <SuggestionPills
              label="Questions you can ask"
              questions={suggestions}
              onAsk={(q) => ask(q, "pill")}
              disabled={busy}
              align="center"
            />
            <p className="mt-10 text-center text-caption text-ink-muted">{BOUNDARY}</p>
          </div>
        )}
      </div>

      <div aria-live="polite" className="sr-only">
        {announcementFor(notes.at(-1))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { FullScreen } from "@/components/capture/recording-overlay";
import { appointmentTitle } from "@/components/journey/format";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/layout";
import { Note } from "@/components/ui/states";
import { Prose } from "@/components/ui/prose";
import { useCare } from "@/lib/care";
import { cn } from "@/lib/cn";
import { formatLongDate, formatTime } from "@/lib/dates";
import type { AgentEvent, ArrangeKind, ArrangeOutcome, ArrangeTask } from "@/lib/types";
import { CHOICE_VERBS, PREVIEW_CAPTION, todoPlanText } from "./copy";
import { useRunStore, type OptionsEvent, type RunPhase } from "./run-store";
import { finishedSentences, Marker, StepList } from "./run-steps";

const frame =
  "mx-auto flex min-h-full w-full max-w-[30rem] flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.75rem,env(safe-area-inset-top))] lg:pb-14 lg:pt-12";

const OUTCOME_EYEBROW: Record<ArrangeKind, string> = { book: "Booked", request: "Requested", find: "Planned" };

export interface RunViewProps {
  phase: Exclude<RunPhase, "idle">;
  task: Pick<ArrangeTask, "title" | "kind">;
  events: AgentEvent[];
  /** Where the confirmation's events begin in `events`; null before she has chosen. */
  confirmFrom: number | null;
  options: OptionsEvent | null;
  chosenOptionId: string | null;
  outcome: ArrangeOutcome | null;
  limit: string | null;
  /** The live run moves focus to each new state and announces finished steps; the gallery doesn't. */
  live?: boolean;
  onChoose: (optionId: string) => void;
  onCancel: () => void;
  onDone: () => void;
}

/** The run, as one calm column: what Sonoclear is doing, then what she needs to decide, then the result. */
export function RunView({
  phase,
  task,
  events,
  confirmFrom,
  options,
  chosenOptionId,
  outcome,
  limit,
  live = false,
  onChoose,
  onCancel,
  onDone,
}: RunViewProps) {
  const promptRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const failedRef = useRef<HTMLDivElement>(null);

  // A new state starts where she should read from.
  useEffect(() => {
    if (!live) return;
    if (phase === "choosing") promptRef.current?.focus();
    if (phase === "done") resultRef.current?.focus();
    if (phase === "failed") failedRef.current?.focus();
  }, [live, phase]);

  const split = confirmFrom ?? events.length;
  const planEvents = events.slice(0, split);
  const confirmEvents = events.slice(split);
  const chosen = options?.options.find((o) => o.id === chosenOptionId);
  const planUnfinished = phase === "planning" ? "working" : phase === "failed" && confirmFrom === null ? "stopped" : "done";
  const confirmUnfinished = phase === "confirming" ? "working" : phase === "failed" ? "stopped" : "done";
  const started = planEvents.length > 0;

  return (
    <div className={frame}>
      <header>
        <p className="eyebrow">Arranging</p>
        <h2 className="mt-3 font-display text-display-md text-ink text-balance lg:text-display-lg">{task.title}</h2>
      </header>

      {live ? (
        <div aria-live="polite" className="sr-only">
          {finishedSentences(events).map((s, i) => (
            <p key={i}>{s}</p>
          ))}
        </div>
      ) : null}

      <div className="mt-8 flex flex-1 flex-col">
        {phase === "planning" && !started ? (
          <p className="flex gap-3 text-body text-ink-muted">
            <Marker state="working" />
            Getting started
          </p>
        ) : (
          <StepList events={planEvents} unfinished={planUnfinished} />
        )}

        {phase === "choosing" && options ? (
          <ChoiceBlock
            options={options}
            kind={task.kind}
            promptRef={promptRef}
            onChoose={onChoose}
            onCancel={onCancel}
          />
        ) : null}

        {(phase === "confirming" || phase === "done") && chosen ? (
          <p className="mt-6 border-t border-line pt-5 text-body-sm text-ink-muted text-pretty">
            {phase === "confirming" ? CHOICE_VERBS[task.kind].doing : "You chose"} <span className="font-medium text-ink">{chosen.title}</span>
          </p>
        ) : null}
        {confirmEvents.length ? <StepList events={confirmEvents} unfinished={confirmUnfinished} className="mt-5" /> : null}

        {phase === "done" && outcome ? (
          <OutcomeCard task={task} outcome={outcome} headingRef={resultRef} onDone={onDone} />
        ) : null}

        {phase === "failed" ? (
          <div ref={failedRef} tabIndex={-1} className="mt-8 animate-rise-in outline-none">
            <Note>{limit ?? "That didn't go through, and nothing was booked."}</Note>
            <div className="mt-6 flex">
              <Button size="lg" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
                Back
              </Button>
            </div>
          </div>
        ) : null}

        {phase === "planning" || phase === "confirming" ? (
          <div className="mt-8 flex">
            <Button variant="quiet" onClick={onCancel} className="-ml-5">
              Cancel
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The options to pick from. Native radios, so the arrow keys move the choice. */
function ChoiceBlock({
  options,
  kind,
  promptRef,
  onChoose,
  onCancel,
}: {
  options: OptionsEvent;
  kind: ArrangeKind;
  promptRef: React.RefObject<HTMLHeadingElement | null>;
  onChoose: (id: string) => void;
  onCancel: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const name = useId();
  const promptId = `${name}-prompt`;
  return (
    <section aria-labelledby={promptId} className="mt-10 animate-rise-in">
      <h3
        id={promptId}
        ref={promptRef}
        tabIndex={-1}
        className="scroll-mt-6 font-display text-display-md text-ink text-balance outline-none"
      >
        {options.prompt}
      </h3>
      {options.note ? <p className="mt-2 text-body text-ink-muted text-pretty">{options.note}</p> : null}

      <div role="radiogroup" aria-labelledby={promptId} className="mt-5 flex flex-col gap-2.5">
        {options.options.map((o) => (
          <label
            key={o.id}
            className={cn(
              "relative flex min-h-14 cursor-pointer items-start gap-4 rounded-card border bg-surface px-4 py-4 transition-colors duration-200 ease-calm",
              picked === o.id ? "border-sage" : "border-line hover:border-line-strong",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sage",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.id}
              checked={picked === o.id}
              onChange={() => setPicked(o.id)}
              className="absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none rounded-card opacity-0"
            />
            <span
              aria-hidden
              className={cn(
                "mt-px grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] transition-[background-color,border-color] duration-200 ease-calm",
                picked === o.id ? "border-sage bg-sage text-surface" : "border-line-strong bg-surface",
              )}
            >
              <Check size={14} strokeWidth={2.25} className={cn("transition-opacity duration-200", picked === o.id ? "opacity-100" : "opacity-0")} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-body font-medium text-ink text-pretty">{o.title}</span>
              <span className="block text-body-sm text-ink-muted text-pretty">{o.location}</span>
              {o.detail ? <span className="block text-body-sm text-ink-muted text-pretty">{o.detail}</span> : null}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button size="lg" disabled={!picked} onClick={() => picked && onChoose(picked)} className="w-full sm:w-auto">
          {CHOICE_VERBS[kind].action}
        </Button>
        <Button variant="quiet" onClick={onCancel} className="sm:px-4">
          Not now
        </Button>
      </div>
    </section>
  );
}

/** What was arranged, in the same words a note would use. */
export function OutcomeCard({
  task,
  outcome,
  headingRef,
  onDone,
  quiet = false,
}: {
  task: Pick<ArrangeTask, "title" | "kind">;
  outcome: ArrangeOutcome;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
  onDone: () => void;
  /** Without actions, for review. */
  quiet?: boolean;
}) {
  const care = useCare();
  const appt = outcome.appointment;
  const title = appt ? appointmentTitle(appt, care) : task.title;
  return (
    <div className="mt-8 animate-rise-in">
      <Card className="p-6">
        <p className="eyebrow">{OUTCOME_EYEBROW[task.kind]}</p>
        <h3 ref={headingRef} tabIndex={-1} className="mt-2 font-display text-display-sm text-ink text-balance outline-none">
          {title}
        </h3>
        {appt?.date ? (
          <p className="mt-2 text-body text-ink">
            {formatLongDate(appt.date)} at {formatTime(appt.date)}
          </p>
        ) : outcome.todoUpdate ? (
          <p className="mt-2 text-body text-ink text-pretty">{todoPlanText(outcome.todoUpdate)}</p>
        ) : null}
        {appt?.location ? <p className="text-body-sm text-ink-muted text-pretty">{appt.location}</p> : null}
        {outcome.reference ? (
          <p className="mt-3 text-caption text-ink-muted">
            Reference <span className="tabular">{outcome.reference}</span>
          </p>
        ) : null}

        <hr className="my-5 border-0 border-t border-line" />
        <Prose text={outcome.summary} />

        {outcome.prep?.length ? (
          <div className="mt-6">
            <h4 className="eyebrow mb-3">Before you go</h4>
            <Prose text={outcome.prep.map((p) => `- ${p}`).join("\n")} />
          </div>
        ) : null}
      </Card>

      {quiet ? null : (
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ButtonLink href="/journey" variant="secondary" size="lg" onClick={onDone} className="w-full sm:w-auto">
            See your journey
          </ButtonLink>
          <Button size="lg" onClick={onDone} className="w-full sm:w-auto">
            Done
          </Button>
        </div>
      )}
      <p className="mt-5 text-caption text-ink-muted text-pretty">{PREVIEW_CAPTION}</p>
    </div>
  );
}

/** The live run, as a full-screen layer. It stays up until she chooses a way out. */
export function AgentRun(): ReactNode {
  const s = useRunStore();
  if (s.phase === "idle" || !s.task) return null;
  return (
    <FullScreen label={`Arranging: ${s.task.title}`} focusKey="run">
      <RunView
        live
        phase={s.phase}
        task={s.task}
        events={s.events}
        confirmFrom={s.confirmFrom}
        options={s.options}
        chosenOptionId={s.chosenOptionId}
        outcome={s.outcome}
        limit={s.limit}
        onChoose={s.choose}
        onCancel={s.cancel}
        onDone={s.finish}
      />
    </FullScreen>
  );
}

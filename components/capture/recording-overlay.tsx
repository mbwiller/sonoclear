"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Bars } from "@/components/ui/bars";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/dates";
import type { TranscriptSegment } from "@/lib/types";
import { LiveTranscriptSheet } from "./live-transcript";

/**
 * A full-screen layer over the whole app, tab bar and sidebar included.
 * Built on a modal <dialog> so everything behind it is inert. Esc does not end a recording;
 * only End does. Closes itself when the screen is hidden, so it never leaves the app inert.
 */
export function FullScreen({ label, focusKey, children }: { label: string; focusKey: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const shownRef = useRef(false);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    shownRef.current = true;
    if (!dialog.open) dialog.showModal();
    return () => {
      shownRef.current = false;
      if (dialog.open) dialog.close();
    };
  }, []);

  // Each state change starts reading from the top of the layer.
  useEffect(() => {
    ref.current?.focus();
  }, [focusKey]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      tabIndex={-1}
      onCancel={(e) => e.preventDefault()}
      onClose={() => {
        // The browser may force-close on repeated Esc; recording continues, so stay up.
        const dialog = ref.current;
        if (shownRef.current && dialog && !dialog.open) dialog.showModal();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none animate-fade-in overflow-y-auto border-0 bg-paper p-0 text-ink outline-none backdrop:bg-transparent"
    >
      {children}
    </dialog>
  );
}

/** The ticking clock: real elapsed time, paused when paused. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(performance.now()), 250);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/** Who the visit is with, as a quiet line: "Breast surgeon · Dr. Marcus Ellery". */
function VisitLine({ typeLabel, name }: { typeLabel: string; name?: string }) {
  return (
    <p className="text-center text-body-sm text-ink-muted text-balance">
      {typeLabel}
      {name ? (
        <>
          <span aria-hidden className="mx-2">
            ·
          </span>
          <span className="sr-only">, </span>
          {name}
        </>
      ) : null}
    </p>
  );
}

const frame =
  "mx-auto flex min-h-full w-full max-w-[30rem] flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.75rem,env(safe-area-inset-top))] lg:pb-14 lg:pt-12";
const center = "flex flex-1 flex-col items-center justify-center py-10 text-center";
/** The slot the clock sits in; processing reuses it so the bars never move. */
const clockSlot = "mt-10 flex h-[4.25rem] items-center justify-center lg:h-[5rem]";
const controls = "flex min-h-28 flex-col items-center justify-end gap-4";

/** During: almost nothing. The bars, the time, who it's with, and three controls. */
export function DuringView({
  typeLabel,
  name,
  clinicianLabel,
  paused,
  interrupted,
  accumulatedMs,
  resumedAt,
  segments,
  onPause,
  onResume,
  onEnd,
}: {
  typeLabel: string;
  name?: string;
  clinicianLabel: string;
  paused: boolean;
  /** The engine stopped on its own: keep what's captured, offer only End. */
  interrupted: boolean;
  accumulatedMs: number;
  resumedAt: number | null;
  segments: TranscriptSegment[];
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const now = useNow(!paused);
  const elapsed = !paused && resumedAt !== null ? accumulatedMs + Math.max(0, now - resumedAt) : accumulatedMs;

  return (
    <div className={frame}>
      <VisitLine typeLabel={typeLabel} name={name} />

      <div className={center}>
        <Bars
          size="xl"
          live={!paused}
          className={cn("transition-opacity duration-300 ease-calm", paused && "opacity-35")}
        />
        <p className={cn(clockSlot, "font-display text-[4.25rem] leading-none tracking-[-0.02em] lg:text-[5rem]")}>
          <span className="sr-only">Time recorded: </span>
          <span className={cn("tabular transition-colors duration-300 ease-calm", paused ? "text-ink-muted" : "text-ink")}>
            {formatClock(elapsed)}
          </span>
        </p>
        <div aria-live="polite" className="mt-5 min-h-6">
          {interrupted ? (
            <p className="max-w-[20rem] text-body-sm text-ink-muted text-pretty">
              <span className="font-medium text-ink">The recording stopped.</span> What was captured so far is
              kept. Choose End to get your notes from it.
            </p>
          ) : (
            <p className={cn("text-body-sm font-medium", paused ? "text-ink-muted" : "text-sage-ink")}>
              {paused ? "Paused" : "Recording"}
            </p>
          )}
        </div>
      </div>

      <div className={controls}>
        <Button variant="quiet" onClick={() => setTranscriptOpen(true)} aria-haspopup="dialog">
          Show transcript
        </Button>
        <div className={cn("grid w-full gap-3", interrupted ? "max-w-[11rem]" : "max-w-[22rem] grid-cols-2")}>
          {interrupted ? null : (
            <Button variant="secondary" size="lg" onClick={paused ? onResume : onPause}>
              {paused ? "Resume" : "Pause"}
            </Button>
          )}
          <Button variant="primary" size="lg" onClick={onEnd}>
            End
          </Button>
        </div>
      </div>

      <LiveTranscriptSheet
        open={transcriptOpen}
        onClose={() => setTranscriptOpen(false)}
        segments={segments}
        clinicianLabel={clinicianLabel}
        paused={paused}
      />
    </div>
  );
}

/**
 * After End: one calm line while the notes come together. The bars stay exactly where they
 * were and the line takes the clock's place, so the screen settles rather than changes.
 * (A local variant of the shared LoadingState, sized to the recording layout.)
 */
export function ProcessingView({ typeLabel, name }: { typeLabel: string; name?: string }) {
  return (
    <div className={frame}>
      <VisitLine typeLabel={typeLabel} name={name} />
      <div className={center}>
        <Bars size="xl" live />
        <div className={clockSlot}>
          <p role="status" aria-live="polite" className="animate-fade-in font-display text-display-md text-ink lg:text-display-lg">
            Putting your notes together
          </p>
        </div>
        <p aria-hidden className="mt-5 h-6" />
      </div>
      <div aria-hidden className={controls} />
    </div>
  );
}

/**
 * If the notes couldn't be made: say so plainly, keep what was recorded, offer another try.
 * When nothing at all was captured there is nothing to retry, only a fresh start.
 */
export function FailedView({
  canRetry,
  onRetry,
  onDiscard,
}: {
  canRetry: boolean;
  onRetry: () => void;
  onDiscard: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div role="alert" className="flex max-w-sm animate-fade-in flex-col items-center text-center">
        <Bars size="md" />
        <p className="mt-6 font-display text-display-md text-ink text-balance">Your notes aren&rsquo;t ready yet</p>
        {canRetry ? (
          <>
            <p className="mt-2 text-body text-ink-muted text-pretty">
              Putting them together didn&rsquo;t work this time. Your transcript is still here, so you can try again.
            </p>
            <div className="mt-8 flex flex-col items-center gap-2">
              <Button onClick={onRetry} size="lg">
                Try again
              </Button>
              <Button variant="quiet" onClick={() => setConfirming(true)} aria-haspopup="dialog">
                Discard recording
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-body text-ink-muted text-pretty">
              The recording stopped before anything was captured, so there&rsquo;s nothing to make notes from.
            </p>
            <div className="mt-8">
              <Button onClick={onDiscard} size="lg">
                Start over
              </Button>
            </div>
          </>
        )}
      </div>
      <Sheet
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Discard this recording?"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
            <Button onClick={onDiscard}>Discard</Button>
          </div>
        }
      >
        <p className="text-body text-ink text-pretty">
          The transcript of this visit will be deleted, and no notes will be made from it.
        </p>
      </Sheet>
    </div>
  );
}

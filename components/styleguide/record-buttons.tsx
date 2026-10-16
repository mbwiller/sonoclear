"use client";

import type { ReactNode } from "react";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Candidates for the Start recording control, and the Pause / End pair that matches each,
 * so a family stays coherent from Capture to the During screen. Presentational only:
 * no store, no data. Capture wires one of these in; the gallery at /styleguide/record shows all.
 */
export type RecordVariant = "ink-disc" | "hairline-ring" | "pill" | "sage-disc" | "concentric";

export const RECORD_VARIANTS: RecordVariant[] = ["ink-disc", "hairline-ring", "pill", "sage-disc", "concentric"];

/* ---------- Glyphs (outline, stroke 1.5, like the nav set) ---------- */

type GlyphKind = "bars" | "pause" | "resume" | "end";

/** The thin three-bar mark, the same one the Capture tab uses. */
const GLYPH_PATHS: Record<GlyphKind, ReactNode> = {
  bars: <path d="M7 9.5v5M12 5.5v13M17 8v8" />,
  pause: <path d="M9.5 6.5v11M14.5 6.5v11" />,
  resume: <path d="M9 6.5v11l8.5-5.5z" strokeLinejoin="round" />,
  end: <rect x="7" y="7" width="10" height="10" rx="2" />,
};

function Glyph({ kind, size = 22 }: { kind: GlyphKind; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden
      className="shrink-0"
    >
      {GLYPH_PATHS[kind]}
    </svg>
  );
}

/* ---------- Shared class strings ---------- */

const buttonBase = "group flex flex-col items-center rounded-[28px] px-4 py-1 focus-visible:outline-none";
const focusRing =
  "group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-sage";
const motion = "transition-[background-color,border-color,transform] duration-200 ease-calm";
const label = "text-body font-medium text-ink";
const controlLabel = "text-body-sm font-medium text-ink";
const hairlineDisc = "border border-line-strong/55 bg-surface";

/* ---------- Start recording ---------- */

/**
 * The record button. Its accessible name is always "Start recording".
 * `pressed` shows the held-down look for the gallery; real presses use :active.
 */
export function RecordButton({
  variant,
  pressed = false,
  onClick,
  describedBy,
  className,
}: {
  variant: RecordVariant;
  pressed?: boolean;
  onClick?: () => void;
  describedBy?: string;
  className?: string;
}) {
  const common = { type: "button" as const, onClick, "aria-describedby": describedBy };

  if (variant === "pill") {
    return (
      <button
        {...common}
        className={buttonStyles({
          variant: "primary",
          size: "lg",
          className: cn("w-full max-w-sm gap-2.5 active:bg-ink/80", pressed && "bg-ink/80", className),
        })}
      >
        <Glyph kind="bars" />
        Start recording
      </button>
    );
  }

  let disc: ReactNode;
  switch (variant) {
    case "ink-disc":
      disc = (
        <span
          aria-hidden
          className={cn(
            "grid size-24 place-items-center rounded-full lg:size-28",
            motion,
            pressed ? "scale-[0.97] bg-ink/80" : "bg-ink group-hover:bg-ink/90",
            "group-active:scale-[0.97] group-active:bg-ink/80",
            focusRing,
          )}
        >
          <span className="size-6 rounded-[7px] bg-paper" />
        </span>
      );
      break;
    case "hairline-ring":
      disc = (
        <span
          aria-hidden
          className={cn(
            "grid size-24 place-items-center rounded-full border-[1.5px] border-line-strong lg:size-28",
            motion,
            pressed ? "bg-sage-soft" : "bg-surface group-hover:bg-paper",
            "group-active:bg-sage-soft",
            focusRing,
          )}
        >
          <span className="size-9 rounded-full bg-sage lg:size-10" />
        </span>
      );
      break;
    case "sage-disc":
      disc = (
        <span aria-hidden className="relative grid size-28 place-items-center rounded-full lg:size-32">
          <span className="record-breathe absolute -inset-2.5 rounded-full border border-sage" />
          <span
            className={cn(
              "grid size-full place-items-center rounded-full border border-sage",
              motion,
              pressed ? "bg-sage/45" : "bg-sage-soft group-hover:bg-sage/20",
              "group-active:bg-sage/45",
              focusRing,
            )}
          >
            <span className="font-display text-display-sm text-ink">Record</span>
          </span>
        </span>
      );
      break;
    case "concentric":
      disc = (
        <span
          aria-hidden
          className={cn(
            "grid size-28 place-items-center rounded-full border border-line-strong/55 bg-sunken lg:size-32",
            focusRing,
          )}
        >
          <span
            className={cn(
              "grid size-20 place-items-center rounded-full text-paper lg:size-24",
              motion,
              pressed ? "scale-[0.94] bg-ink/80" : "bg-ink group-hover:bg-ink/90",
              "group-active:scale-[0.94] group-active:bg-ink/80",
            )}
          >
            <Glyph kind="bars" size={30} />
          </span>
        </span>
      );
      break;
  }

  return (
    <button {...common} className={cn(buttonBase, "gap-4 lg:gap-5", className)}>
      {disc}
      <span className={label}>Start recording</span>
    </button>
  );
}

/* ---------- Pause and End ---------- */

/** One round control: a disc with a glyph (or a word) and, for most families, a label below. */
function DiscControl({
  name,
  onClick,
  discClassName,
  children,
  wordInside = false,
}: {
  name: string;
  onClick?: () => void;
  discClassName: string;
  children: ReactNode;
  /** The disc itself carries the visible word, so there is no label below. */
  wordInside?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} className="group flex flex-col items-center gap-2 rounded-2xl px-2 py-1 focus-visible:outline-none">
      <span
        aria-hidden={wordInside ? undefined : true}
        className={cn("grid place-items-center rounded-full", motion, discClassName, focusRing)}
      >
        {children}
      </span>
      {wordInside ? null : <span className={controlLabel}>{name}</span>}
    </button>
  );
}

/**
 * Pause (or Resume) and End for the During screen, in the same family as the record button.
 * `showPause={false}` leaves End alone, for when the engine has stopped by itself.
 */
export function RecordControls({
  variant,
  paused = false,
  showPause = true,
  onPause,
  onResume,
  onEnd,
  className,
}: {
  variant: RecordVariant;
  paused?: boolean;
  showPause?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
  className?: string;
}) {
  const pauseName = paused ? "Resume" : "Pause";
  const onPauseClick = paused ? onResume : onPause;

  if (variant === "pill") {
    return (
      <div className={cn("grid w-full gap-3", showPause ? "max-w-[22rem] grid-cols-2" : "max-w-[11rem]", className)}>
        {showPause ? (
          <button type="button" onClick={onPauseClick} className={buttonStyles({ variant: "secondary", size: "lg", className: "gap-2" })}>
            <Glyph kind={paused ? "resume" : "pause"} size={20} />
            {pauseName}
          </button>
        ) : null}
        <button type="button" onClick={onEnd} className={buttonStyles({ variant: "secondary", size: "lg", className: "gap-2" })}>
          <Glyph kind="end" size={20} />
          End
        </button>
      </div>
    );
  }

  let pause: ReactNode;
  let end: ReactNode;
  switch (variant) {
    case "ink-disc":
      pause = (
        <DiscControl name={pauseName} onClick={onPauseClick} discClassName={cn("size-16 text-ink group-hover:bg-paper", hairlineDisc)}>
          {paused ? (
            <Glyph kind="resume" size={24} />
          ) : (
            <span className="flex gap-1.5">
              <span className="h-5 w-[3px] rounded-full bg-ink" />
              <span className="h-5 w-[3px] rounded-full bg-ink" />
            </span>
          )}
        </DiscControl>
      );
      end = (
        <DiscControl name="End" onClick={onEnd} discClassName="size-16 bg-ink group-hover:bg-ink/90 group-active:bg-ink/80">
          <span className="size-5 rounded-[6px] bg-paper" />
        </DiscControl>
      );
      break;
    case "hairline-ring":
      pause = (
        <DiscControl
          name={pauseName}
          onClick={onPauseClick}
          discClassName="size-16 border-[1.5px] border-line-strong bg-surface text-ink group-hover:bg-paper group-active:bg-sage-soft"
        >
          {paused ? (
            <Glyph kind="resume" size={24} />
          ) : (
            <span className="flex gap-1.5">
              <span className="h-5 w-[3px] rounded-full bg-ink" />
              <span className="h-5 w-[3px] rounded-full bg-ink" />
            </span>
          )}
        </DiscControl>
      );
      end = (
        <DiscControl
          name="End"
          onClick={onEnd}
          discClassName="size-16 border-[1.5px] border-line-strong bg-surface group-hover:bg-paper group-active:bg-sage-soft"
        >
          <span className="size-5 rounded-[5px] bg-ink" />
        </DiscControl>
      );
      break;
    case "sage-disc":
      pause = (
        <DiscControl
          name={pauseName}
          onClick={onPauseClick}
          wordInside
          discClassName="size-[5.25rem] border border-line-strong/60 bg-sunken group-hover:bg-sage-soft"
        >
          <span className="font-display text-display-sm text-ink">{pauseName}</span>
        </DiscControl>
      );
      end = (
        <DiscControl
          name="End"
          onClick={onEnd}
          wordInside
          discClassName="size-[5.25rem] border border-line-strong/60 bg-sunken group-hover:bg-sage-soft"
        >
          <span className="font-display text-display-sm text-ink">End</span>
        </DiscControl>
      );
      break;
    case "concentric":
      pause = (
        <DiscControl name={pauseName} onClick={onPauseClick} discClassName={cn("size-16 text-ink group-hover:bg-paper", hairlineDisc)}>
          <Glyph kind={paused ? "resume" : "pause"} size={26} />
        </DiscControl>
      );
      end = (
        <DiscControl name="End" onClick={onEnd} discClassName="size-16 bg-ink text-paper group-hover:bg-ink/90 group-active:bg-ink/80">
          <Glyph kind="end" size={26} />
        </DiscControl>
      );
      break;
  }

  return (
    <div className={cn("flex items-start justify-center gap-8", className)}>
      {showPause ? pause : null}
      {end}
    </div>
  );
}

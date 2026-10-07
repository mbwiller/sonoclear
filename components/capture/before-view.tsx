"use client";

import { useId, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { Bars } from "@/components/ui/bars";
import { ChoiceChip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { Page, PageTitle } from "@/components/ui/layout";
import { getPatientContext, useCare } from "@/lib/care";
import { cn } from "@/lib/cn";
import type { VisitType } from "@/lib/types";
import { VISIT_TYPE_LABELS, VISIT_TYPES } from "@/lib/visit-types";
import { services } from "@/services";
import { captureDefaults, type CaptureSetup } from "./capture-state";

/** Before recording: who the visit is with, one consent reminder, and the record button. */
export function BeforeView({ onStart }: { onStart: (setup: CaptureSetup) => void }) {
  const care = useCare();
  const [defaults] = useState(() => captureDefaults(care));
  const [visitType, setVisitType] = useState<VisitType | null>(defaults.visitType);
  const [name, setName] = useState(defaults.clinicianName);
  const [nameEdited, setNameEdited] = useState(false);
  const [needsType, setNeedsType] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  const choose = (type: VisitType) => {
    setVisitType(type);
    setNeedsType(false);
    // A name we filled in belongs to the appointment's visit type; don't carry it to another.
    if (!nameEdited) setName(type === defaults.visitType ? defaults.clinicianName : "");
  };

  const start = () => {
    if (!visitType) {
      setNeedsType(true);
      groupRef.current?.querySelector<HTMLElement>('[role="radio"]')?.focus();
      return;
    }
    onStart({ visitType, clinicianName: name.trim() });
  };

  return (
    <Page width="default">
      <header className="max-w-[36rem]">
        <PageTitle>Record a visit</PageTitle>
        <p className="mt-3 text-body text-ink-muted text-pretty">
          Listen instead of taking notes; you&rsquo;ll get your to-dos and a summary afterward.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-7 lg:mt-11 lg:gap-8">
        <VisitTypePicker
          value={visitType}
          onChange={choose}
          invalid={needsType}
          groupRef={groupRef}
          previewNote={visitType ? (services.summarizer.previewNote?.({ visitType }, getPatientContext()) ?? null) : null}
        />
        <TextField
          id="capture-clinician"
          label="Clinician’s name"
          hint="(optional)"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameEdited(true);
          }}
          autoComplete="off"
          spellCheck={false}
          className="max-w-[26rem]"
        />
      </div>

      <RecordPanel onStart={start} />
    </Page>
  );
}

/** Visit type chips: a radio group with arrow-key navigation (roving tabindex). */
function VisitTypePicker({
  value,
  onChange,
  invalid,
  groupRef,
  previewNote,
}: {
  value: VisitType | null;
  onChange: (type: VisitType) => void;
  invalid: boolean;
  groupRef: RefObject<HTMLDivElement | null>;
  /** An honest line about what this preview can produce for the chosen type. */
  previewNote: string | null;
}) {
  const labelId = useId();
  const noteId = useId();
  const tabStop = value ? VISIT_TYPES.indexOf(value) : 0;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const n = VISIT_TYPES.length;
    let next: number;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (index + 1) % n;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (index - 1 + n) % n;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = n - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    onChange(VISIT_TYPES[next]);
    groupRef.current?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <div>
      <p id={labelId} className="text-body-sm font-medium text-ink">
        Who are you seeing?
      </p>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={noteId}
        aria-invalid={invalid || undefined}
        className="mt-2 -ml-3.5 grid grid-cols-2 gap-x-2 gap-y-0.5 sm:grid-cols-3"
      >
        {VISIT_TYPES.map((type, i) => {
          const selected = value === type;
          return (
            <ChoiceChip
              key={type}
              quiet
              role="radio"
              aria-checked={selected}
              tabIndex={i === tabStop ? 0 : -1}
              selected={selected}
              onClick={() => onChange(type)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className="justify-self-start whitespace-nowrap px-3.5"
            >
              {VISIT_TYPE_LABELS[type]}
            </ChoiceChip>
          );
        })}
      </div>
      <div id={noteId} aria-live="polite">
        {invalid ? (
          <p className="mt-3 text-body-sm font-medium text-attention-ink">Choose who you&rsquo;re seeing to start recording.</p>
        ) : previewNote ? (
          <p className="mt-3 text-body-sm text-ink-muted text-pretty">{previewNote}</p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The screen's focal point: a glass disc holding the three bars, floating over a soft wash
 * of color that drifts slowly behind it, so the glass has something to refract.
 */
function RecordPanel({ onStart }: { onStart: () => void }) {
  const consentId = useId();
  return (
    <div className="relative mt-6 flex flex-col items-center px-6 pb-6 pt-10 text-center lg:mt-8 lg:pb-8 lg:pt-14">
      <div aria-hidden className="record-aura">
        <span />
        <span />
        <span />
      </div>
      <button
        type="button"
        onClick={onStart}
        aria-describedby={consentId}
        className="group relative flex flex-col items-center gap-4 rounded-[28px] px-4 py-1 focus-visible:outline-none lg:gap-5"
      >
        <span
          aria-hidden
          className={cn(
            "glass-disc grid size-28 place-items-center rounded-full lg:size-[8.5rem]",
            "group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-sage",
          )}
        >
          <Bars size="lg" />
        </span>
        <span className="text-body font-medium text-ink">Start recording</span>
      </button>
      <p id={consentId} className="relative mt-2 text-body-sm text-ink-muted">
        Let your doctor know you&rsquo;re recording.
      </p>
    </div>
  );
}

"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { ChoiceChip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { getPatientContext } from "@/lib/care";
import type { VisitType } from "@/lib/types";
import { VISIT_TYPE_LABELS, VISIT_TYPES } from "@/lib/visit-types";
import { services } from "@/services";

/** Optional: change who the visit is with. Recording never waits on this. */
export function WhoSheet({
  open,
  onClose,
  visitType,
  onChooseType,
  name,
  onChangeName,
}: {
  open: boolean;
  onClose: () => void;
  visitType: VisitType;
  onChooseType: (type: VisitType) => void;
  name: string;
  onChangeName: (name: string) => void;
}) {
  const previewNote = services.summarizer.previewNote?.({ visitType }, getPatientContext()) ?? null;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Who are you seeing?"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-7 pt-2">
        <VisitTypePicker value={visitType} onChange={onChooseType} previewNote={previewNote} />
        <TextField
          id="capture-clinician"
          label="Clinician’s name"
          hint="(optional)"
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </Sheet>
  );
}

/** Visit type chips: a radio group with arrow-key navigation (roving tabindex). */
export function VisitTypePicker({
  value,
  onChange,
  previewNote,
}: {
  value: VisitType;
  onChange: (type: VisitType) => void;
  /** An honest line about what this preview can produce for the chosen type. */
  previewNote: string | null;
}) {
  const labelId = useId();
  const noteId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const tabStop = VISIT_TYPES.indexOf(value);

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
        Type of visit
      </p>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={noteId}
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
        {previewNote ? <p className="mt-3 text-body-sm text-ink-muted text-pretty">{previewNote}</p> : null}
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { formatTime, formatUpcoming } from "@/lib/dates";
import type { ISODate, VisitType } from "@/lib/types";
import { VISIT_TYPE_LABELS } from "@/lib/visit-types";

/** The appointment the chip was filled from, ready to show. */
export interface ChipMatch {
  status: "now" | "next";
  title: string;
  visitType: VisitType;
  /** The clinician's full name, as filled into the name field ("" when none). */
  clinicianName: string;
  /** "Dr. Ellery" */
  clinicianShortName: string;
  date: ISODate;
}

/**
 * One quiet line above the record button: who the visit is with, filled in from the schedule.
 * "Next  Surgical consult with Dr. Ellery · Monday at 10:30 AM   Change". Once the patient edits
 * the type or name it reads "Other visit · Dr. Lee" instead.
 */
export function VisitChip({
  visitType,
  name,
  match,
  onChange,
  className,
}: {
  visitType: VisitType;
  name: string;
  match: ChipMatch | null;
  onChange: () => void;
  className?: string;
}) {
  const typed = name.trim();
  const fromSchedule = !!match && visitType === match.visitType && typed === match.clinicianName;

  let eyebrow: string | null = null;
  let title: string;
  let rest: string | null = null;
  if (fromSchedule) {
    eyebrow = match.status === "now" ? "Now" : "Next";
    title = match.clinicianShortName ? `${match.title} with ${match.clinicianShortName.replace(" ", "\u00a0")}` : match.title;
    if (match.status === "next") rest = `${formatUpcoming(match.date)} at ${formatTime(match.date)}`;
  } else {
    title = visitType === "other" ? "Other visit" : `${VISIT_TYPE_LABELS[visitType]} visit`;
    if (typed) rest = typed;
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-1">
        <p className="min-w-0 text-body-sm text-ink-muted">
          {eyebrow ? <span className="eyebrow mr-2 align-[0.0625em]">{eyebrow}</span> : null}
          <span className="font-medium text-ink">{title}</span>
          {rest ? (
            <>
              <span aria-hidden className="mx-2 hidden sm:inline">
                ·
              </span>
              <span className="sr-only">, </span>
              <span className="block sm:inline">{rest}</span>
            </>
          ) : null}
        </p>
        <Button variant="quiet" onClick={onChange} aria-haspopup="dialog" className="-mr-2 px-2">
          Change<span className="sr-only"> who you&rsquo;re seeing</span>
        </Button>
      </div>
    </div>
  );
}

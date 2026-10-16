"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Page, PageTitle } from "@/components/ui/layout";
import { RecordButton } from "@/components/styleguide/record-buttons";
import { useCare } from "@/lib/care";
import type { VisitType } from "@/lib/types";
import { captureDefaults, type CaptureSetup } from "./capture-state";
import { VisitChip, type ChipMatch } from "./visit-chip";
import { WhoSheet } from "./who-sheet";

/**
 * Before recording: the record button first. Who the visit is with is filled in from the
 * schedule and shown as a quiet line; changing it is optional and lives in a sheet.
 */
export function BeforeView({ onStart }: { onStart: (setup: CaptureSetup) => void }) {
  const care = useCare();
  // This screen stays mounted under other tabs, so "now" moves on: recompute from the schedule
  // each minute and whenever the care data changes. Her own edits always win over the defaults.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  const defaults = useMemo(() => captureDefaults(care, now), [care, now]);
  const [typeChoice, setTypeChoice] = useState<VisitType | null>(null);
  const [nameChoice, setNameChoice] = useState<string | null>(null);
  const visitType = typeChoice ?? defaults.visitType;
  // A name filled in belongs to the appointment's visit type; don't carry it to another.
  const name = nameChoice ?? (visitType === defaults.visitType ? defaults.clinicianName : "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const consentId = useId();

  const match: ChipMatch | null = (() => {
    if (!defaults.match) return null;
    const { appointment, status } = defaults.match;
    const clinician = appointment.clinicianId ? care.clinicianById.get(appointment.clinicianId) : undefined;
    return {
      status,
      title: appointment.title,
      visitType: appointment.visitType,
      clinicianName: clinician?.name ?? "",
      clinicianShortName: clinician?.shortName ?? "",
      date: appointment.date ?? "",
    };
  })();

  return (
    <Page
      width="note"
      className="flex min-h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] flex-col pb-6 lg:min-h-dvh lg:pb-14"
    >
      <PageTitle>Record a visit</PageTitle>
      <VisitChip
        visitType={visitType}
        name={name}
        match={match}
        onChange={() => setSheetOpen(true)}
        className="mt-3"
      />

      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <RecordButton
          variant="sage-disc"
          describedBy={consentId}
          onClick={() => onStart({ visitType, clinicianName: name.trim(), appointmentId: defaults.match?.appointment.id })}
        />
        <p id={consentId} className="mt-4 text-body-sm text-ink-muted">
          Let your doctor know you&rsquo;re recording.
        </p>
        <p className="mt-8 text-caption text-ink-muted">
          You&rsquo;ll get your to-dos and a summary afterward.
        </p>
      </div>

      <WhoSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        visitType={visitType}
        onChooseType={setTypeChoice}
        name={name}
        onChangeName={setNameChoice}
      />
    </Page>
  );
}

"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackLink, Eyebrow, Page, PageTitle } from "@/components/ui/layout";
import { Row, Rows } from "@/components/ui/rows";
import { Sheet } from "@/components/ui/sheet";
import { SourceChip } from "@/components/ui/source-chip";
import { Note } from "@/components/ui/states";
import { useCare, useCareActions, useReplaySpeed } from "@/lib/care";
import { ageFrom, formatFullDate } from "@/lib/dates";
import type { Clinician } from "@/lib/types";
import { SpeedChoice } from "./speed-choice";

type SheetName = "export" | "delete" | "reset";

const STORED_HERE = "In this preview, your changes are stored only in this browser, on this device.";

/** A profile section: tracked label, then content. Separated by whitespace, like Visit and Record. */
function ProfileSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const headingId = `${id}-heading`;
  return (
    <section
      aria-labelledby={headingId}
      className="mt-14 lg:mt-16"
    >
      <Eyebrow id={headingId} className="mb-5">
        {title}
      </Eyebrow>
      {children}
    </section>
  );
}

function telHref(phone: string) {
  return `tel:+1${phone.replace(/\D/g, "")}`;
}

function CareTeamMember({ clinician }: { clinician: Clinician }) {
  return (
    <li className="flex flex-col gap-1 px-5 pb-2.5 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-4">
      <div className="min-w-0">
        <p className="text-body font-medium text-ink">{clinician.name}</p>
        <p className="mt-0.5 text-body-sm text-ink">{clinician.roleLabel}</p>
        <p className="text-body-sm text-ink-muted text-pretty">{clinician.practice}</p>
      </div>
      <a
        href={telHref(clinician.phone)}
        aria-label={`Call ${clinician.shortName} at ${clinician.phone}`}
        className="-ml-1 inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full px-1 text-body-sm font-medium text-ink tabular transition-colors duration-200 hover:text-sage-ink sm:ml-0 sm:self-center"
      >
        <Phone size={16} className="text-sage" aria-hidden />
        <span className="underline decoration-line-strong/50 underline-offset-[3px]">{clinician.phone}</span>
      </a>
    </li>
  );
}

/** A row that opens a sheet: title, one quiet line, chevron. */
function SheetRow({ title, detail, onOpen }: { title: string; detail: string; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        className="flex min-h-16 w-full items-center justify-between gap-4 rounded-card px-5 py-3.5 text-left transition-colors duration-200 hover:bg-paper"
      >
        <span className="flex flex-col">
          <span className="text-body font-medium text-ink">{title}</span>
          <span className="text-body-sm text-ink-muted">{detail}</span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-ink-muted" aria-hidden />
      </button>
    </li>
  );
}

export function ProfileScreen() {
  const care = useCare();
  const router = useRouter();
  const { setReplaySpeed, resetDemo } = useCareActions();
  const speed = useReplaySpeed();
  const [sheet, setSheet] = useState<SheetName | null>(null);

  const { patient } = care;
  const { diagnosis } = patient;
  const fullName = `${patient.firstName} ${patient.lastName}`;
  const initials = `${patient.firstName[0] ?? ""}${patient.lastName[0] ?? ""}`;

  const team = useMemo(
    () => patient.careTeam.map((id) => care.clinicianById.get(id)).filter((c): c is Clinician => Boolean(c)),
    [patient.careTeam, care.clinicianById],
  );
  const termById = useMemo(() => new Map(care.glossary.map((t) => [t.id, t])), [care.glossary]);

  function confirmReset() {
    // The Ask thread clears itself when the demo resets.
    resetDemo();
    setSheet(null);
    router.push("/journey");
  }

  const close = () => setSheet(null);

  return (
    <Page width="note">
      <BackLink href="/journey">Journey</BackLink>

      <header className="mt-6 flex items-center gap-5 lg:mt-8 lg:gap-6">
        <span
          aria-hidden
          className="grid size-16 shrink-0 place-items-center rounded-full border border-line bg-surface font-display text-[1.625rem] text-ink lg:size-20 lg:text-[2rem]"
        >
          {initials}
        </span>
        <div className="min-w-0">
          <PageTitle>{fullName}</PageTitle>
          <p className="mt-1.5 text-body text-ink-muted">
            Born {formatFullDate(patient.dateOfBirth)}
            <span aria-hidden> · </span>
            <span className="sr-only">, </span>
            {ageFrom(patient.dateOfBirth)} years old
          </p>
        </div>
      </header>

      <ProfileSection id="care-team" title="Care team">
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {team.map((c) => (
            <CareTeamMember key={c.id} clinician={c} />
          ))}
        </ul>
      </ProfileSection>

      <ProfileSection id="diagnosis" title="Diagnosis">
        <p className="font-display text-display-sm text-ink text-balance lg:text-display-md">{diagnosis.headline}</p>
        <Rows className="mt-5">
          {diagnosis.facts.map((f) => (
            <Row key={f.label} label={f.label} value={f.value} term={f.termId ? termById.get(f.termId) : undefined} />
          ))}
        </Rows>
        <Note className="mt-4">{diagnosis.stageNote}</Note>
        <div className="mt-5 flex flex-wrap gap-2">
          <SourceChip source={{ kind: "record", id: diagnosis.sourceRecordId, label: "From your pathology report" }} />
        </div>
      </ProfileSection>

      <ProfileSection id="family-history" title="Family history">
        <Rows>
          {patient.familyHistory.map((f) => (
            <Row
              key={`${f.relation}-${f.condition}`}
              label={f.relation}
              value={f.ageAtDiagnosis ? `${f.condition}, diagnosed at ${f.ageAtDiagnosis}` : f.condition}
              plain={f.note}
            />
          ))}
        </Rows>
      </ProfileSection>

      <ProfileSection id="privacy" title="Privacy & data">
        <p className="max-w-[60ch] text-body text-ink text-pretty">
          {STORED_HERE} That includes checked to-dos, recorded visits and records you&apos;ve added.
        </p>
        <ul className="mt-5 divide-y divide-line rounded-card border border-line bg-surface">
          <SheetRow title="Export your data" detail="Arrives with accounts" onOpen={() => setSheet("export")} />
          <SheetRow title="Delete your data" detail="Arrives with accounts" onOpen={() => setSheet("delete")} />
        </ul>
      </ProfileSection>

      <ProfileSection id="preview" title="Preview settings">
        <SpeedChoice value={speed} onChange={setReplaySpeed} />
        <div className="mt-10">
          <p className="text-body font-medium text-ink">Reset demo</p>
          <p className="mt-1 max-w-[60ch] text-body-sm text-ink-muted text-pretty">
            Clears your changes and returns the demo to where it starts.
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => setSheet("reset")} aria-haspopup="dialog">
            Reset demo
          </Button>
        </div>
      </ProfileSection>

      <Sheet
        open={sheet === "export"}
        onClose={close}
        eyebrow="Privacy & data"
        title="Export your data"
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={close}>
              Done
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 text-body text-ink text-pretty">
          <p>Exporting a copy of your visits, records and notes arrives with accounts.</p>
          <p className="text-ink-muted">{STORED_HERE} There&apos;s nothing stored anywhere else to export yet.</p>
        </div>
      </Sheet>

      <Sheet
        open={sheet === "delete"}
        onClose={close}
        eyebrow="Privacy & data"
        title="Delete your data"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="quiet" onClick={() => setSheet("reset")}>
              Reset demo instead
            </Button>
            <Button variant="secondary" onClick={close}>
              Done
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 text-body text-ink text-pretty">
          <p>Deleting your data arrives with accounts.</p>
          <p className="text-ink-muted">
            {STORED_HERE} To clear your changes now, reset the demo. Clearing this browser&apos;s site data does the same.
          </p>
        </div>
      </Sheet>

      <Sheet
        open={sheet === "reset"}
        onClose={close}
        eyebrow="Preview settings"
        title="Reset the demo?"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="quiet" onClick={close}>
              Cancel
            </Button>
            <Button onClick={confirmReset}>Reset demo</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 text-body text-ink text-pretty">
          <p>
            This clears everything changed in this preview: checked to-dos, recorded visits, added records and your
            questions in Ask.
          </p>
          <p className="text-ink-muted">You&apos;ll return to Journey, where the demo starts.</p>
        </div>
      </Sheet>
    </Page>
  );
}

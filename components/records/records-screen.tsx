"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Dna, File, FileText, FlaskConical, Microscope, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Eyebrow, Page, PageTitle } from "@/components/ui/layout";
import { useCare } from "@/lib/care";
import { formatShortDate } from "@/lib/dates";
import type { MedicalRecord, RecordType } from "@/lib/types";
import { RECORD_TYPE_LABELS, RECORD_TYPES } from "@/lib/visit-types";
import { AddRecordSheet } from "./add-record-sheet";
import { recordBlurb } from "./format";

/** One honest line for a group with nothing in it yet. */
const EMPTY_LINES: Record<RecordType, string> = {
  imaging: "Mammogram, ultrasound and MRI reports will be kept here.",
  pathology: "Reports on tissue from a biopsy or surgery will be kept here.",
  labs: "Blood test results will be kept here.",
  genetics: "Nothing here yet. Genetic testing, if you have it, usually comes after genetic counseling.",
  other: "Letters, referrals and anything else you add will be kept here.",
};

/** The same thin sage glyphs the Journey timeline uses, one per kind of record. */
const TYPE_GLYPHS: Record<RecordType, ReactNode> = {
  imaging: <FileText size={18} aria-hidden />,
  pathology: <Microscope size={18} aria-hidden />,
  labs: <FlaskConical size={18} aria-hidden />,
  genetics: <Dna size={18} aria-hidden />,
  other: <File size={18} aria-hidden />,
};

function RecordRow({ record }: { record: MedicalRecord }) {
  return (
    <li>
      <Link
        href={`/record/${record.id}`}
        className="group flex min-h-[4.5rem] items-center gap-3 px-5 py-4 transition-colors duration-200 ease-calm hover:bg-paper focus-visible:outline-offset-[-2px] sm:px-6"
      >
        <span className="mt-1 shrink-0 self-start text-sage">{TYPE_GLYPHS[record.type]}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-medium text-ink text-pretty">{record.title}</span>
          <span className="mt-0.5 block text-body-sm text-ink-muted tabular">
            {formatShortDate(record.date)}
            <span aria-hidden className="mx-1.5">
              ·
            </span>
            <span className="sr-only">, </span>
            {record.source}
          </span>
          <span className="mt-2 block text-body-sm text-ink text-pretty">{recordBlurb(record)}</span>
        </span>
        <ChevronRight
          size={20}
          aria-hidden
          className="shrink-0 text-ink-muted transition-transform duration-200 ease-calm group-hover:translate-x-0.5"
        />
      </Link>
    </li>
  );
}

function RecordGroup({ type, records }: { type: RecordType; records: MedicalRecord[] }) {
  const headingId = `records-${type}`;
  return (
    <section aria-labelledby={headingId}>
      <Eyebrow id={headingId} className="mb-3">
        {RECORD_TYPE_LABELS[type]}
      </Eyebrow>
      {records.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {records.map((r) => (
            <RecordRow key={r.id} record={r} />
          ))}
        </ul>
      ) : (
        <p className="border-t border-line pt-3 text-body-sm text-ink-muted text-pretty">{EMPTY_LINES[type]}</p>
      )}
    </section>
  );
}

export function RecordsScreen() {
  const care = useCare();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  // A fresh flow each time the sheet opens.
  const [session, setSession] = useState(0);

  const groups = RECORD_TYPES.map((type) => ({
    type,
    records: care.records.filter((r) => r.type === type).sort((a, b) => b.date.localeCompare(a.date)),
  }));

  return (
    <Page width="note">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div>
          <PageTitle>Records</PageTitle>
          <p className="mt-3 max-w-[46ch] text-body text-ink-muted text-pretty">
            Your reports and results in one place, explained in plain words where this preview can.
          </p>
        </div>
        <Button
          variant="secondary"
          className="self-start lg:self-auto"
          icon={<Plus size={18} aria-hidden />}
          aria-haspopup="dialog"
          onClick={() => {
            setSession((s) => s + 1);
            setAdding(true);
          }}
        >
          Add a record
        </Button>
      </header>

      <div className="mt-10 flex flex-col gap-10 lg:mt-14 lg:gap-12">
        {groups.map((g) => (
          <RecordGroup key={g.type} type={g.type} records={g.records} />
        ))}
      </div>

      <AddRecordSheet
        key={session}
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={(id) => {
          setAdding(false);
          router.push(`/record/${id}`);
        }}
      />
    </Page>
  );
}

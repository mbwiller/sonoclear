"use client";

import Link from "next/link";
import { use } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Disclosure } from "@/components/ui/disclosure";
import { BackLink, Eyebrow, Page, PageTitle, Section } from "@/components/ui/layout";
import { Prose } from "@/components/ui/prose";
import { QuestionList } from "@/components/ui/question-list";
import { Row, Rows } from "@/components/ui/rows";
import { SourceChip } from "@/components/ui/source-chip";
import { Note } from "@/components/ui/states";
import { clinicianShortName, useCare, useStorageError, type CareView } from "@/lib/care";
import { daysFromToday, formatShortDate, formatUpcoming } from "@/lib/dates";
import type { MedicalRecord } from "@/lib/types";
import { RECORD_TYPE_LABELS } from "@/lib/visit-types";
import { PaperText, PdfOriginal, PhotoOriginal } from "./original-document";

function NotFound() {
  return (
    <Page width="note">
      <BackLink href="/records">Records</BackLink>
      <PageTitle className="mt-6">This record isn&rsquo;t here</PageTitle>
      <p className="mt-3 max-w-[52ch] text-body text-ink-muted text-pretty">
        It may have been removed when the demo was reset. Everything else you&rsquo;ve saved is still in Records.
      </p>
      <ButtonLink href="/records" variant="secondary" className="mt-8">
        Go to your records
      </ButtonLink>
    </Page>
  );
}

/** "From your visit with Dr. Raman", or the visit's date when no clinician is named. */
function visitSourceLabel(record: MedicalRecord, care: CareView) {
  const visit = record.relatedVisitId ? care.visitById.get(record.relatedVisitId) : undefined;
  if (!visit) return null;
  const who = clinicianShortName(visit, care);
  return {
    id: visit.id,
    label: who ? `From your visit with ${who}` : `From your visit on ${formatShortDate(visit.date)}`,
  };
}

/** "You could bring these to your surgical consult with Dr. Ellery on Friday." */
function nextVisitLine(care: CareView): string | null {
  const appt = care.nextAppointment;
  if (!appt?.date) return null;
  const who = appt.clinicianId ? care.clinicianById.get(appt.clinicianId)?.shortName : undefined;
  const days = daysFromToday(appt.date);
  const when = days <= 1 ? formatUpcoming(appt.date).toLowerCase() : `on ${formatUpcoming(appt.date)}`;
  return `You could bring these to your ${appt.title.toLowerCase()}${who ? ` with ${who}` : ""} ${when}.`;
}

export function RecordScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const care = useCare();
  const storageError = useStorageError();
  const record = care.recordById.get(id);
  if (!record) return <NotFound />;

  const { explanation } = record;
  const recognized = explanation.recognized && explanation.summary.length > 0;
  const visitSource = visitSourceLabel(record, care);
  const questions = explanation.questionsToAsk ?? [];
  const bringLine = questions.length ? nextVisitLine(care) : null;
  const addedByYou = record.origin === "upload";
  // Visited pages stay mounted (hidden), so section ids carry the record id to stay unique.
  const prefix = `record-${record.id}`;

  return (
    <Page width="note">
      <div className="flex items-center justify-between gap-4">
        <BackLink href="/records">Records</BackLink>
        {recognized ? (
          <ButtonLink
            href={`/ask?focus=${encodeURIComponent(record.id)}`}
            variant="secondary"
            icon={<MessageCircleQuestion size={18} aria-hidden />}
          >
            Ask about this record
          </ButtonLink>
        ) : null}
      </div>

      <header className="mt-8 lg:mt-10">
        <Eyebrow as="p">{RECORD_TYPE_LABELS[record.type]}</Eyebrow>
        <PageTitle className="mt-3">{record.title}</PageTitle>
        <div className="mt-5 flex flex-wrap gap-2">
          <Chip>{formatShortDate(record.date)}</Chip>
          <Chip>{record.source}</Chip>
          {addedByYou && record.source !== "Added by you" ? <Chip>Added by you</Chip> : null}
        </div>
      </header>

      {addedByYou && storageError ? (
        <Note className="mt-8">
          This browser couldn&rsquo;t store this record, so it may not be here after you close the page. If its storage
          is full, resetting the demo in{" "}
          <Link href="/profile" className="underline decoration-line-strong/60 underline-offset-[3px] hover:decoration-ink">
            Profile
          </Link>{" "}
          frees space.
        </Note>
      ) : null}

      {recognized ? (
        <>
          <Section id={`${prefix}-explanation`} title="In plain words" className="mt-10 lg:mt-12">
            <Prose text={explanation.summary} />
          </Section>

          {explanation.keyFindings.length ? (
            <Section id={`${prefix}-findings`} title="Key findings" className="mt-12">
              {explanation.keyFindings.some((f) => f.term) ? (
                <p className="-mt-1 mb-4 text-body-sm text-ink-muted">Underlined results open a short explanation.</p>
              ) : null}
              <Rows>
                {explanation.keyFindings.map((f) => (
                  <Row key={f.label} label={f.label} value={f.value} plain={f.plain} term={f.term} />
                ))}
              </Rows>
            </Section>
          ) : null}

          {questions.length ? (
            <Section id={`${prefix}-questions`} title="Questions you could ask" className="mt-12">
              <QuestionList questions={questions} />
              {bringLine ? <p className="mt-4 text-body-sm text-ink-muted">{bringLine}</p> : null}
            </Section>
          ) : null}

          {visitSource ? (
            <SourceChip className="mt-8" source={{ kind: "visit", id: visitSource.id, label: visitSource.label }} />
          ) : null}
        </>
      ) : (
        <div className="mt-10">
          <Note>{explanation.note ?? "Explanations aren't available for this document in this preview."}</Note>
          {visitSource ? (
            <SourceChip className="mt-6" source={{ kind: "visit", id: visitSource.id, label: visitSource.label }} />
          ) : null}
        </div>
      )}

      <Section
        id={`${prefix}-original`}
        title="Original document"
        className="mt-12"
        action={
          addedByYou && formatShortDate(record.addedAt) !== formatShortDate(record.date) ? (
            <span className="text-caption text-ink-muted tabular">Added {formatShortDate(record.addedAt)}</span>
          ) : null
        }
      >
        {record.original.kind === "pdf" ? (
          <PdfOriginal original={record.original} />
        ) : (
          // Collapsed when there's an explanation to read first; open when the original is all there is.
          <Disclosure
            summary={
              record.original.kind === "image"
                ? "See your photo"
                : record.type === "other"
                  ? "Read the original text"
                  : "Read the original report"
            }
            meta={record.source}
            defaultOpen={!recognized}
          >
            {record.original.kind === "image" ? (
              <PhotoOriginal original={record.original} title={record.title} bare />
            ) : (
              <PaperText text={record.original.text} bare />
            )}
          </Disclosure>
        )}
      </Section>
    </Page>
  );
}

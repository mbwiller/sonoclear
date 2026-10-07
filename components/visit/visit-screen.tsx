"use client";

import Link from "next/link";
import { use } from "react";
import { Check, MessageCircleQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Disclosure } from "@/components/ui/disclosure";
import { BackLink, Card, Page, PageTitle, Section } from "@/components/ui/layout";
import { Prose } from "@/components/ui/prose";
import { QuestionList } from "@/components/ui/question-list";
import { SourceChip } from "@/components/ui/source-chip";
import { Note } from "@/components/ui/states";
import { TermChip } from "@/components/ui/term";
import { TodoRow } from "@/components/ui/todo-row";
import { clinicianShortName, useCare, type CareView } from "@/lib/care";
import { formatDuration, formatShortDate } from "@/lib/dates";
import type { Todo, Visit } from "@/lib/types";
import { VISIT_TYPE_LONG_LABELS } from "@/lib/visit-types";
import { TranscriptText } from "./transcript";
import { VisitNotFound } from "./visit-not-found";

/**
 * One visit, laid out like a note: what to do first, then what was said in plain words,
 * the records and terms that came up, questions for next time, and the full transcript.
 */
export function VisitScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const care = useCare();
  const visit = care.visitById.get(id);
  if (!visit) return <VisitNotFound />;
  return <VisitNote visit={visit} care={care} />;
}

function VisitNote({ visit, care }: { visit: Visit; care: CareView }) {
  const { notes } = visit;
  const who = clinicianShortName(visit, care);
  const typeLabel = VISIT_TYPE_LONG_LABELS[visit.visitType];
  const todos = care.todos.filter((t) => t.sourceVisitId === visit.id);
  const records = visit.relatedRecordIds.flatMap((rid) => care.recordById.get(rid) ?? []);
  const covered = (notes.resolvedTodoIds ?? []).flatMap((tid) => care.todos.find((t) => t.id === tid) ?? []);
  // Visited pages stay mounted (hidden), so ids carry the visit id to stay unique.
  const sectionPrefix = `visit-${visit.id}`;
  const movedTo = notes.stageUpdate ? care.stages.find((s) => s.id === notes.stageUpdate?.toStageId) : undefined;
  const hasOutcomes = Boolean(movedTo || covered.length);

  return (
    <Page width="note">
      <div className="flex items-center justify-between gap-4">
        <BackLink href="/journey">Journey</BackLink>
        <ButtonLink
          href={`/ask?focus=${encodeURIComponent(visit.id)}`}
          variant="secondary"
          icon={<MessageCircleQuestion size={18} aria-hidden />}
        >
          Ask about this visit
        </ButtonLink>
      </div>

      <header className="mt-8 lg:mt-10">
        <PageTitle>{notes.title}</PageTitle>
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="About this visit">
          <li>
            <Chip>{formatShortDate(visit.date)}</Chip>
          </li>
          <li>
            <Chip>{who ? `${typeLabel} · ${who}` : typeLabel}</Chip>
          </li>
          {visit.durationMs > 0 ? (
            <li>
              <Chip>{formatDuration(visit.durationMs)}</Chip>
            </li>
          ) : null}
        </ul>
      </header>

      <div className="mt-12 flex flex-col gap-12 lg:mt-14 lg:gap-14">
        {todos.length || hasOutcomes ? (
          <div className="flex flex-col gap-6">
            {todos.length ? (
              <Section id={`${sectionPrefix}-todos`} title="To-dos">
                <Card className="px-5">
                  <ul className="divide-y divide-line">
                    {todos.map((todo) => (
                      <li key={todo.id}>
                        <TodoRow todo={todo} showSource={false} />
                      </li>
                    ))}
                  </ul>
                </Card>
              </Section>
            ) : null}
            {hasOutcomes ? <VisitOutcomes stageTitle={movedTo?.title} covered={covered} /> : null}
          </div>
        ) : null}

        <Section id={`${sectionPrefix}-summary`} title="Summary">
          <Prose text={notes.summary} />
          {notes.limitationNote ? <Note className="mt-6">{notes.limitationNote}</Note> : null}
        </Section>

        {records.length ? (
          <Section id={`${sectionPrefix}-records`} title="Records from this visit">
            <ul className="flex flex-wrap gap-2">
              {records.map((record) => (
                <li key={record.id}>
                  <SourceChip source={{ kind: "record", id: record.id, label: record.title }} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {notes.terms.length ? (
          <Section id={`${sectionPrefix}-terms`} title="Terms explained">
            <ul className="flex flex-wrap gap-2">
              {notes.terms.map((term) => (
                <li key={term.id}>
                  <TermChip term={term} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {notes.questionsForNextTime.length ? (
          <Section id={`${sectionPrefix}-questions`} title="Questions to ask next time">
            <QuestionList questions={notes.questionsForNextTime} />
          </Section>
        ) : null}

        {visit.transcript?.segments.length ? (
          <Section id={`${sectionPrefix}-transcript`} title="Full transcript">
            <Disclosure
              summary="Read the transcript"
              meta={[formatDuration(visit.transcript.durationMs || visit.durationMs), who ? `You and ${who}` : null]
                .filter(Boolean)
                .join(" · ")}
            >
              <TranscriptText transcript={visit.transcript} clinicianLabel={who ?? "Clinician"} />
            </Disclosure>
          </Section>
        ) : null}
      </div>
    </Page>
  );
}

/** Quiet lines on what the visit changed: the journey stage, and earlier to-dos it covered. */
function VisitOutcomes({ stageTitle, covered }: { stageTitle?: string; covered: Todo[] }) {
  return (
    <ul className="flex flex-col gap-4 px-1 text-body-sm text-ink-muted">
      {stageTitle ? (
        <li className="flex gap-3">
          <span aria-hidden className="mt-[3px] grid size-[18px] shrink-0 place-items-center rounded-full bg-sage-soft">
            <span className="size-2 rounded-full border-[1.5px] border-sage bg-surface" />
          </span>
          <span>
            Your journey moved to <span className="font-medium text-ink">{stageTitle}</span>.{" "}
            <Link
              href="/journey"
              className="whitespace-nowrap font-medium text-ink underline decoration-line-strong/50 underline-offset-[3px] transition-colors duration-200 hover:decoration-ink"
            >
              See your journey
            </Link>
          </span>
        </li>
      ) : null}
      {covered.length ? (
        <li className="flex gap-3">
          <span aria-hidden className="mt-[3px] grid size-[18px] shrink-0 place-items-center rounded-full bg-sage text-surface">
            <Check size={11} strokeWidth={2.75} />
          </span>
          <div className="min-w-0">
            This visit covered {covered.length === 1 ? "an earlier to-do" : `${covered.length} earlier to-dos`}, now
            marked done:
            <ul className="mt-2 flex flex-col gap-1.5">
              {covered.map((t) => (
                <li key={t.id} className="relative pl-4 text-ink">
                  <span aria-hidden className="absolute left-0 top-[0.72em] h-px w-2 bg-ink-muted" />
                  {t.text}
                </li>
              ))}
            </ul>
          </div>
        </li>
      ) : null}
    </ul>
  );
}

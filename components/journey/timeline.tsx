"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CalendarDays, Check, ChevronDown, ChevronRight, FileText, NotebookText } from "lucide-react";
import { Section } from "@/components/ui/layout";
import type { CareView, StageView } from "@/lib/care";
import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/dates";
import type { StageId, StageStatus } from "@/lib/types";
import { RECORD_TYPE_LABELS, VISIT_TYPE_LONG_LABELS } from "@/lib/visit-types";
import { appointmentTitle, appointmentWhen } from "./format";
import type { JourneyIds } from "./ids";

/** Read after the stage title by screen readers, since the markers are visual only. */
const STATUS_TEXT: Record<StageStatus, string> = {
  done: "done",
  current: "current stage",
  ahead: "ahead",
};

/**
 * The seven stages, joined by a hairline. The current stage is open by default;
 * done stages open to show their visits and records; stages ahead stay quiet and general.
 */
export function Timeline({ care, ids }: { care: CareView; ids: JourneyIds }) {
  // Only her own taps are stored, so when the journey moves forward the new current stage opens.
  const [toggled, setToggled] = useState<Partial<Record<StageId, boolean>>>({});
  const stages = care.stageViews;

  return (
    <Section id={ids.timeline} title="Your journey" className="lg:pt-7">
      <ol className="mt-1">
        {stages.map((stage, i) => {
          const isOpen = toggled[stage.id] ?? stage.status === "current";
          const next = stages[i + 1];
          return (
            <StageItem
              key={stage.id}
              stage={stage}
              care={care}
              ids={ids}
              open={isOpen}
              onToggle={() => setToggled((t) => ({ ...t, [stage.id]: !isOpen }))}
              connector={next ? (next.status === "ahead" ? "ahead" : "travelled") : null}
            />
          );
        })}
      </ol>
    </Section>
  );
}

function StageItem({
  stage,
  care,
  ids,
  open,
  onToggle,
  connector,
}: {
  stage: StageView;
  care: CareView;
  ids: JourneyIds;
  open: boolean;
  onToggle: () => void;
  connector: "travelled" | "ahead" | null;
}) {
  const panelId = ids.stage(stage.id);
  const firstDate = [...stage.visits.map((v) => v.date), ...stage.records.map((r) => r.date)].sort()[0];

  return (
    <li className="relative">
      {connector ? (
        <span
          aria-hidden
          className={cn(
            "absolute left-3 top-[25px] bottom-[-25px] w-px -translate-x-1/2",
            connector === "travelled" ? "bg-sage/45" : "bg-line",
          )}
        />
      ) : null}
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="group flex w-full items-start gap-4 rounded-2xl py-3 text-left"
        >
          <StageMarker status={stage.status} />
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className={cn(
                "font-display text-display-sm transition-colors duration-200",
                stage.status === "ahead" ? "text-ink-muted group-hover:text-ink" : "text-ink",
              )}
            >
              {stage.title}
            </span>
            {stage.status === "current" ? (
              <span
                aria-hidden
                className="inline-flex h-6 items-center rounded-full bg-sage-soft px-2.5 text-caption font-medium text-sage-ink"
              >
                Now
              </span>
            ) : null}
            <span className="sr-only">, {STATUS_TEXT[stage.status]}</span>
          </span>
          {stage.status === "done" && firstDate ? (
            <span className="mt-[3px] shrink-0 text-body-sm text-ink-muted tabular">{formatShortDate(firstDate)}</span>
          ) : null}
          <ChevronDown
            size={18}
            aria-hidden
            className={cn(
              "mt-1 shrink-0 transition-[transform,color] duration-300 ease-calm",
              stage.status === "ahead" ? "text-ink-muted/60 group-hover:text-ink-muted" : "text-ink-muted",
              open && "rotate-180",
            )}
          />
        </button>
      </h3>
      <div id={panelId} hidden={!open} className="pb-7 pl-10">
        {open ? <StageBody stage={stage} care={care} /> : null}
      </div>
    </li>
  );
}

function StageMarker({ status }: { status: StageStatus }) {
  return (
    <span aria-hidden className="relative z-10 mt-px grid size-6 shrink-0 place-items-center">
      {status === "done" ? (
        <span className="grid size-[18px] place-items-center rounded-full bg-sage text-surface">
          <Check size={11} strokeWidth={2.75} />
        </span>
      ) : status === "current" ? (
        <span className="grid size-6 place-items-center rounded-full bg-sage-soft">
          <span className="size-3 rounded-full border-2 border-sage bg-surface" />
        </span>
      ) : (
        <span className="size-3 rounded-full border-[1.5px] border-line-strong/60 bg-paper" />
      )}
    </span>
  );
}

function StageBody({ stage, care }: { stage: StageView; care: CareView }) {
  const isAhead = stage.status === "ahead";

  const rows: ReactNode[] = [];
  if (!isAhead) {
    for (const visit of stage.visits) {
      rows.push(
        <ItemRow
          key={visit.id}
          href={`/visit/${visit.id}`}
          icon={<NotebookText size={18} aria-hidden />}
          title={visit.notes.title}
          meta={`${formatShortDate(visit.date)} · ${VISIT_TYPE_LONG_LABELS[visit.visitType]} visit`}
        />,
      );
    }
    for (const record of stage.records) {
      rows.push(
        <ItemRow
          key={record.id}
          href={`/record/${record.id}`}
          icon={<FileText size={18} aria-hidden />}
          title={record.title}
          meta={`${formatShortDate(record.date)} · ${RECORD_TYPE_LABELS[record.type]} record`}
        />,
      );
    }
  }
  for (const appointment of stage.appointments) {
    rows.push(
      <ItemRow
        key={appointment.id}
        icon={<CalendarDays size={18} aria-hidden />}
        title={appointmentTitle(appointment, care)}
        meta={appointmentWhen(appointment)}
      />,
    );
  }

  return (
    <div className="animate-fade-in">
      {isAhead ? <p className="eyebrow mb-2">What usually happens</p> : null}
      <p className="text-body text-ink-muted text-pretty">{stage.description}</p>
      {rows.length ? (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">{rows}</ul>
      ) : null}
    </div>
  );
}

function ItemRow({ href, icon, title, meta }: { href?: string; icon: ReactNode; title: string; meta: string }) {
  const inner = (
    <>
      <span className="mt-0.5 shrink-0 text-sage">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm font-medium text-ink text-pretty">{title}</span>
        <span className="block text-caption text-ink-muted">{meta}</span>
      </span>
      {href ? <ChevronRight size={18} aria-hidden className="mt-0.5 shrink-0 text-ink-muted" /> : null}
    </>
  );
  return (
    <li>
      {href ? (
        <Link
          href={href}
          className="flex min-h-14 items-start gap-3 px-4 py-3 transition-colors duration-200 hover:bg-paper focus-visible:rounded-none"
        >
          {inner}
        </Link>
      ) : (
        <div className="flex min-h-14 items-start gap-3 px-4 py-3">{inner}</div>
      )}
    </li>
  );
}

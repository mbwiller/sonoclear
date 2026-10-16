"use client";

import { useEffect, useMemo, useRef } from "react";
import { appointmentTitle, appointmentWhen } from "@/components/journey/format";
import { Card, Page, PageTitle, Section } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/states";
import { useCare } from "@/lib/care";
import { formatLongDate, formatTime } from "@/lib/dates";
import type { Arrangement, ArrangeTask } from "@/lib/types";
import { services } from "@/services";
import { AgentRun } from "./agent-run";
import { PREVIEW_CAPTION, todoPlanText } from "./copy";
import { ArrangedRow, BookedRow, TaskRow } from "./home-rows";
import { useRunStore } from "./run-store";

/** "Thursday, October 29 at 8:15 AM · Westgate", or what a request or search left in place. */
function arrangedWhen(a: Arrangement): string {
  const appt = a.outcome.appointment;
  if (appt?.date) {
    return [`${formatLongDate(appt.date)} at ${formatTime(appt.date)}`, appt.location].filter(Boolean).join(" · ");
  }
  return (a.outcome.todoUpdate ? todoPlanText(a.outcome.todoUpdate) : a.outcome.summary[0]) ?? "";
}

export function ArrangeScreen() {
  const care = useCare();
  const start = useRunStore((s) => s.start);
  const phase = useRunStore((s) => s.phase);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const prevPhase = useRef<string | null>(null);

  // When she closes a finished run, she lands back at the top of this screen.
  useEffect(() => {
    if (prevPhase.current === "done" && phase === "idle") titleRef.current?.focus();
    prevPhase.current = phase;
  }, [phase]);
  useEffect(() => () => {
    prevPhase.current = null;
  }, []);

  const tasks = useMemo(() => services.scheduling.tasks(care), [care]);
  const toArrange = tasks.filter((t) => !care.arrangementByTaskId.has(t.id));
  // From the arrangements, not the tasks: a task can drop out of the list (she ticked its to-do
  // herself) while the booking it led to is still hers to look back on.
  const arranged = care.arrangements
    .filter((a) => care.arrangementByTaskId.get(a.taskId) === a)
    .map((a) => ({ arrangement: a, title: tasks.find((t) => t.id === a.taskId)?.title ?? a.taskTitle }));
  const arrangedAppointmentIds = new Set(care.arrangements.flatMap((a) => (a.outcome.appointment ? [a.outcome.appointment.id] : [])));
  const booked = care.upcomingAppointments.filter(
    (a) => a.status === "scheduled" && a.date && !arrangedAppointmentIds.has(a.id),
  );

  const waitingReason = (t: ArrangeTask) =>
    t.waitsFor && !care.arrangementByTaskId.has(t.waitsFor.taskId) ? t.waitsFor.reason : undefined;

  // The empty line names the surgeon while the consult is still ahead.
  const surgeon = care.clinicians.find((c) => c.role === "breast-surgeon");
  const consultAhead = Boolean(
    surgeon && care.upcomingAppointments.some((a) => a.clinicianId === surgeon.id && a.status === "scheduled"),
  );

  return (
    <Page width="note">
      <PageTitle ref={titleRef} tabIndex={-1} className="outline-none">
        Arrange
      </PageTitle>
      <p className="mt-3 text-body text-ink-muted text-pretty">
        Sonoclear can call and book the things your care team asked for.
      </p>
      <p className="mt-2 text-caption text-ink-muted text-pretty">{PREVIEW_CAPTION}</p>

      <div className="mt-10 flex flex-col gap-10">
        {arranged.length ? (
          <Section title="Arranged">
            <Card>
              <ul className="divide-y divide-line">
                {arranged.map(({ arrangement, title }) => (
                  <ArrangedRow
                    key={arrangement.id}
                    title={title}
                    when={arrangedWhen(arrangement)}
                    reference={arrangement.outcome.reference}
                    log={arrangement.log}
                  />
                ))}
              </ul>
            </Card>
          </Section>
        ) : null}

        <Section title="To arrange">
          {toArrange.length ? (
            <Card>
              <ul className="divide-y divide-line">
                {toArrange.map((t) => (
                  <TaskRow key={t.id} task={t} waitingReason={waitingReason(t)} onArrange={() => start(t)} />
                ))}
              </ul>
            </Card>
          ) : (
            <EmptyState title="Nothing to arrange right now">
              {consultAhead && surgeon
                ? `After your surgical consult, anything ${surgeon.shortName} asks for will show up here.`
                : "When your care team asks for something new, it will show up here."}
            </EmptyState>
          )}
        </Section>

        {booked.length ? (
          <Section title="Already booked">
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              {booked.map((a) => (
                <BookedRow
                  key={a.id}
                  title={appointmentTitle(a, care)}
                  when={[appointmentWhen(a), a.location].filter(Boolean).join(" · ")}
                />
              ))}
            </ul>
          </Section>
        ) : null}
      </div>

      <AgentRun />
    </Page>
  );
}

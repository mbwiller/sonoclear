"use client";

import Link from "next/link";
import { ArrowDown, CalendarDays, MapPin } from "lucide-react";
import { Card, Eyebrow } from "@/components/ui/layout";
import type { CareView } from "@/lib/care";
import { formatRelativeDay } from "@/lib/dates";
import type { Appointment } from "@/lib/types";
import { appointmentTitle, appointmentWhen, openTodoCount } from "./format";
import type { JourneyIds } from "./ids";

/**
 * "What's next?" The next scheduled appointment, or, when nothing is booked yet,
 * the appointments still to be arranged. Always ends with her open to-dos.
 */
export function UpNextCard({ care, ids }: { care: CareView; ids: JourneyIds }) {
  const next = care.nextAppointment;
  const unscheduled = care.upcomingAppointments.filter((a) => !a.date);
  const lead: Appointment | undefined = next ?? unscheduled[0];
  const alsoAhead = next ? [] : unscheduled.slice(1);
  const openCount = care.openTodos.length;

  return (
    <Card aria-labelledby={ids.upNextHeading} role="region" className="overflow-hidden">
      <div className="px-6 pb-6 pt-5 lg:px-7 lg:pb-7 lg:pt-6">
        <div className="flex min-h-7 items-center justify-between gap-4">
          <Eyebrow id={ids.upNextHeading}>Up next</Eyebrow>
          {next?.date ? (
            <span className="inline-flex h-7 items-center rounded-full bg-sage-soft px-3 text-caption font-medium text-sage-ink">
              {formatRelativeDay(next.date)}
            </span>
          ) : null}
        </div>

        {lead ? (
          <>
            <p className="mt-4 font-display text-display-md text-ink text-balance">{appointmentTitle(lead, care)}</p>
            {lead.date ? (
              <ul className="mt-4 flex flex-col gap-2 text-body text-ink">
                <li className="flex items-start gap-3">
                  <CalendarDays size={18} aria-hidden className="mt-[3px] shrink-0 text-ink-muted" />
                  <span>{appointmentWhen(lead)}</span>
                </li>
                {lead.location ? (
                  <li className="flex items-start gap-3">
                    <MapPin size={18} aria-hidden className="mt-[3px] shrink-0 text-ink-muted" />
                    <span>{lead.location}</span>
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="mt-2 text-body text-ink-muted">Not scheduled yet</p>
            )}
            {lead.note ? <p className="mt-4 text-body-sm text-ink-muted text-pretty">{lead.note}</p> : null}

            {alsoAhead.length ? (
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-caption font-medium text-ink-muted">Also to be arranged</p>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {alsoAhead.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-4 text-body-sm">
                      <span className="text-ink">{appointmentTitle(a, care)}</span>
                      <span className="text-ink-muted">Not scheduled yet</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <p className="mt-4 font-display text-display-md text-ink">Nothing booked right now</p>
            <p className="mt-2 text-body-sm text-ink-muted text-pretty">
              When your next appointment is set, it will show here.
            </p>
          </>
        )}
      </div>

      <Link
        href={`#${ids.todos}`}
        className="group flex min-h-14 items-center justify-between gap-4 border-t border-line px-6 text-body-sm font-medium text-ink transition-colors duration-200 hover:bg-paper lg:px-7"
      >
        <span>{openCount ? openTodoCount(openCount) : "No open to-dos"}</span>
        <ArrowDown
          size={18}
          aria-hidden
          className="text-ink-muted transition-transform duration-200 ease-calm group-hover:translate-y-0.5"
        />
      </Link>
    </Card>
  );
}

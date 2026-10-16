"use client";

import { useMemo, type ReactNode } from "react";
import { RunView, type RunViewProps } from "@/components/arrange/agent-run";
import { PREVIEW_CAPTION } from "@/components/arrange/copy";
import { ArrangedRow, BookedRow, TaskRow } from "@/components/arrange/home-rows";
import type { OptionsEvent } from "@/components/arrange/run-store";
import { BackLink, Card, Page, PageTitle, Section } from "@/components/ui/layout";
import { calendar, formatLongDate, formatTime, getDemoToday, weekdayOnOrAfterAt } from "@/lib/dates";
import type { AgentEvent, ArrangeOutcome } from "@/lib/types";

const noop = () => undefined;

/** A paper frame, to judge the run the way it sits on a phone. */
function Frame({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col overflow-hidden rounded-card border border-line bg-paper">
      <figcaption className="eyebrow border-b border-line px-6 py-3">{caption}</figcaption>
      {children}
    </figure>
  );
}

/** Sample words for the review pages only. The real scripts live with the scheduling service. */
function sample() {
  const cal = calendar(getDemoToday());
  // Clinics are closed at weekends, so a sample day that lands on one moves to Monday.
  const weekday = (offset: number, h: number, m: number) => weekdayOnOrAfterAt(cal, offset, h, m);
  const slots = [weekday(9, 8, 15), weekday(10, 13, 30), weekday(12, 7, 45)];
  const where = ["Linden Health Imaging, Westgate", "Linden Health Imaging, Riverside", "Linden Health Imaging, Westgate"];
  const when = (iso: string) => `${formatLongDate(iso)} at ${formatTime(iso)}`;

  const plan: AgentEvent[] = [
    { type: "step", id: "order", text: "Reading the order from Dr. Ellery" },
    { type: "step-done", id: "order", result: "Breast MRI, both breasts, before your surgery." },
    { type: "step", id: "places", text: "Finding imaging offices near you" },
    { type: "step-done", id: "places", result: "Two Linden Health locations do breast MRI." },
    { type: "step", id: "call", text: "Calling Linden Health Imaging scheduling" },
    {
      type: "call",
      office: "Linden Health Imaging scheduling",
      phone: "(617) 555-0168",
      lines: [
        { speaker: "sonoclear", text: "Hello, I'm calling for Claire Donovan. Dr. Ellery ordered a breast MRI before surgery." },
        { speaker: "office", text: "I have that order. Is she able to come in the morning?" },
        { speaker: "sonoclear", text: "She is. What is the earliest you have?" },
        { speaker: "office", text: "I can offer three times over the next two weeks." },
      ],
    },
    { type: "step-done", id: "call", result: "Three openings in the next two weeks." },
  ];
  const options: OptionsEvent = {
    type: "options",
    prompt: "Which works for you?",
    note: "Each one takes about 45 minutes. Nothing is booked until you choose.",
    options: slots.map((date, i) => ({
      id: `slot-${i}`,
      title: when(date),
      date,
      location: where[i],
      detail: i === 0 ? "Earliest opening" : i === 1 ? "Closest to home" : "Early morning",
    })),
  };
  const outcome: ArrangeOutcome = {
    summary: [
      "Your breast MRI is booked. The imaging office has Dr. Ellery’s order on file.",
      "Your journey now shows it as the next thing coming up.",
    ],
    appointment: {
      id: "appointment-mri",
      title: "Breast MRI",
      visitType: "other",
      stageId: "treatment-planning",
      status: "scheduled",
      date: slots[0],
      location: where[0],
    },
    prep: ["Wear a top with no metal, and leave jewelry at home.", "Plan on about 45 minutes."],
    reference: "LH-MRI-20931",
  };
  const confirm: AgentEvent[] = [
    { type: "step", id: "book", text: "Booking it with Linden Health Imaging" },
    { type: "step-done", id: "book", result: "Confirmed by the office." },
    { type: "outcome", outcome },
  ];
  return { plan, options, outcome, confirm, slots, when, where };
}

export function ArrangeGallery() {
  const s = useMemo(() => sample(), []);
  const task = { title: "Schedule your breast MRI", kind: "book" } as const;
  const base: Omit<RunViewProps, "phase" | "events"> = {
    task,
    confirmFrom: null,
    options: null,
    chosenOptionId: null,
    outcome: null,
    limit: null,
    onChoose: noop,
    onCancel: noop,
    onDone: noop,
  };
  const planned = s.plan;
  const withOptions = [...planned, s.options];
  const pick = s.options.options[0];

  return (
    <Page width="wide">
      <BackLink href="/styleguide">Styleguide</BackLink>
      <PageTitle className="mt-2">Arrange</PageTitle>
      <p className="mt-3 max-w-[40rem] text-body text-ink-muted text-pretty">
        The home screen&rsquo;s three sections and the four states of a run, built from sample words so the design can be
        judged before the real scripts are in.
      </p>

      <div className="mt-12 flex flex-col gap-14">
        <div className="flex max-w-[680px] flex-col gap-10">
          <Section title="Arranged">
            <Card>
              <ul className="divide-y divide-line">
                <ArrangedRow
                  title="Request your imaging discs"
                  when={`${s.when(s.slots[2])} · ${s.where[2]}`}
                  reference="LH-DISC-40318"
                  log={s.plan}
                />
                <ArrangedRow
                  title="Find a time for your pre-op bloodwork"
                  when="Walk-in, any Linden Health lab, within two weeks. No fasting."
                  log={s.plan}
                />
              </ul>
            </Card>
          </Section>

          <Section title="To arrange">
            <Card>
              <ul className="divide-y divide-line">
                <TaskRow
                  task={{
                    title: "Schedule your breast MRI",
                    detail: "Both breasts, before your surgery.",
                    office: { label: "Linden Health Imaging", phone: "(617) 555-0168" },
                  }}
                  onArrange={noop}
                />
                <TaskRow
                  task={{
                    title: "Book genetic counseling",
                    detail: "Your referral from Dr. Ellery was sent on the day of your consult.",
                    office: { label: "Linden Health Cancer Genetics", phone: "(617) 555-0175" },
                  }}
                  onArrange={noop}
                />
                <TaskRow
                  task={{
                    title: "Book your follow-up with Dr. Ellery",
                    detail: "To settle the plan once your MRI is done.",
                    office: { label: "Dr. Ellery’s office", phone: "(617) 555-0162" },
                  }}
                  waitingReason="Waits until your MRI has a date."
                  onArrange={noop}
                />
              </ul>
            </Card>
          </Section>

          <Section title="Already booked">
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              <BookedRow title="Surgical consult with Dr. Ellery" when={`${s.when(s.slots[0])} · Linden Health Surgery`} />
            </ul>
          </Section>

          <p className="text-caption text-ink-muted text-pretty">{PREVIEW_CAPTION}</p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-2">
          <Frame caption="Planning">
            <RunView {...base} phase="planning" events={planned.slice(0, 5)} />
          </Frame>
          <Frame caption="Choosing">
            <RunView {...base} phase="choosing" events={withOptions} options={s.options} />
          </Frame>
          <Frame caption="Confirming">
            <RunView
              {...base}
              phase="confirming"
              events={[...withOptions, s.confirm[0]]}
              confirmFrom={withOptions.length}
              options={s.options}
              chosenOptionId={pick.id}
            />
          </Frame>
          <Frame caption="Done">
            <RunView
              {...base}
              phase="done"
              events={[...withOptions, ...s.confirm]}
              confirmFrom={withOptions.length}
              options={s.options}
              chosenOptionId={pick.id}
              outcome={s.outcome}
            />
          </Frame>
          <Frame caption="Could not finish">
            <RunView
              {...base}
              phase="failed"
              events={planned.slice(0, 5)}
              limit="The office didn’t pick up. Nothing was booked, and you can try again in a moment."
            />
          </Frame>
        </div>
      </div>
    </Page>
  );
}

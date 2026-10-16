// CLINICAL REVIEW PENDING
/**
 * Arrange script: book the breast MRI Dr. Ellery ordered at the surgical consult.
 * Calls Linden Health Imaging scheduling, (617) 555-0168 (PLAN.md §3). Westgate is 3 miles away,
 * Riverside 8. Resolves the "Schedule your breast MRI" to-do and schedules `appt-breast-mri`.
 */
import { weekdayOnOrAfterAt, type Calendar } from "@/lib/dates";
import type { ArrangeOption, ArrangeTask, PatientContext } from "@/lib/types";
import { OFFICES, PLACES } from "../places";
import {
  Script,
  chronological,
  consultTodo,
  consultVisit,
  identityLines,
  isOfferable,
  limitScript,
  option,
  whenText,
  type TimedEvent,
} from "./shared";

export const TASK_ID = "arrange-mri";
const REFERENCE = "LH-MRI-20931";

export function task(ctx: PatientContext): ArrangeTask | null {
  const visit = consultVisit(ctx);
  const todo = consultTodo(ctx, "schedule-mri");
  if (!visit || !isOfferable(todo)) return null;
  return {
    id: TASK_ID,
    kind: "book",
    title: "Schedule your breast MRI",
    detail: "Dr. Ellery ordered an MRI of both breasts before surgery.",
    office: OFFICES.imagingScheduling,
    sourceVisitId: visit.id,
    todoId: todo.id,
    appointmentId: "appt-breast-mri",
  };
}

/** In date order, soonest first. */
function options(cal: Calendar): ArrangeOption[] {
  return chronological([
    option("mri-westgate-early", weekdayOnOrAfterAt(cal, 13, 8, 15), PLACES.westgateImaging.name, "Earliest opening · about 45 minutes"),
    option("mri-riverside", weekdayOnOrAfterAt(cal, 15, 10, 0), PLACES.riversideImaging.name, `${PLACES.riversideImaging.miles} miles away · about 45 minutes`),
    option("mri-westgate-late", weekdayOnOrAfterAt(cal, 18, 16, 40), PLACES.westgateImaging.name, "Late afternoon · about 45 minutes"),
  ]);
}

export function plan(cal: Calendar, ctx: PatientContext): TimedEvent[] {
  const [a, riverside, b] = options(cal);
  return new Script("mri-plan")
    .step("Reading your consult notes", "Dr. Ellery ordered a breast MRI of both breasts before surgery.")
    .step("Checking the order", "Placed at your consult · Linden Health Imaging.")
    .step(
      "Looking at Linden Health MRI locations",
      `${PLACES.westgateImaging.short}, ${PLACES.westgateImaging.miles} miles away, and ${PLACES.riversideImaging.short}, ${PLACES.riversideImaging.miles} miles away, both do breast MRI.`,
    )
    .step(`Calling ${OFFICES.imagingScheduling.label}, ${OFFICES.imagingScheduling.phone}`, "Three openings found.", {
      office: OFFICES.imagingScheduling.label,
      phone: OFFICES.imagingScheduling.phone,
      lines: [
        { speaker: "sonoclear", text: "Hello. This is Sonoclear, calling for Claire Donovan. Dr. Ellery ordered a breast MRI for her." },
        ...identityLines(ctx),
        { speaker: "office", text: "I see the order. It's for both breasts, with contrast. The scan takes about 45 minutes." },
        { speaker: "sonoclear", text: "What openings do you have in the next few weeks?" },
        {
          speaker: "office",
          text: `At Westgate: ${whenText(a.date)}, and ${whenText(b.date)}. At Riverside: ${whenText(riverside.date)}.`,
        },
        { speaker: "sonoclear", text: "Can you hold all three until the end of the day? Claire will choose." },
        { speaker: "office", text: "Yes, until end of day. She should arrive 15 minutes early and wear nothing with metal." },
      ],
    })
    .end({
      type: "options",
      prompt: "Which works for you?",
      options: [a, riverside, b],
      note: "Scheduling is holding all three openings until the end of the day.",
    });
}

export function confirm(cal: Calendar, ctx: PatientContext, optionId: string): TimedEvent[] {
  const chosen = options(cal).find((o) => o.id === optionId);
  if (!chosen) return limitScript("That opening is no longer on the list. Pick one of the times shown.");
  const todo = consultTodo(ctx, "schedule-mri");
  const todoText = todo?.text ?? "Schedule your breast MRI";
  return new Script("mri-confirm")
    .step(`Holding ${chosen.title}`)
    .step("Confirming with scheduling", `Confirmed. Reference ${REFERENCE}.`)
    .end({
      type: "outcome",
      outcome: {
        summary: [
          `Linden Health Imaging has you down, and the reference is on the card above. It's on your journey now, and your “${todoText}” to-do is done.`,
        ],
        appointment: {
          id: "appt-breast-mri",
          title: "Breast MRI",
          visitType: "other",
          stageId: "treatment-planning",
          status: "scheduled",
          date: chosen.date,
          location: chosen.location,
          note: "Arrive 15 minutes early. No metal. The contrast dye goes through a vein in your arm.",
        },
        resolvedTodoIds: todo ? [todo.id] : [],
        prep: [
          "Arrive 15 minutes early.",
          "Wear clothes with no metal; you'll change into a gown.",
          "They'll ask about allergies and kidney health before the contrast dye.",
          "They'll also ask about implants, a pacemaker, and whether you might be pregnant.",
          "You lie face down for about 45 minutes.",
        ],
        reference: REFERENCE,
      },
    });
}

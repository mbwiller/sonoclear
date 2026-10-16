// CLINICAL REVIEW PENDING
/**
 * Arrange script: book the follow-up with Dr. Ellery after the MRI and genetic counseling.
 * Calls Dr. Ellery's office, (617) 555-0162 (PLAN.md §3). Waits for both: the openings fall
 * after the later of the two dates, so the task is offered with `waitsFor` until the MRI is
 * arranged, and then until genetic counseling is too (when it is still on her list).
 * Schedules a new appointment and resolves the "Book a follow-up" to-do.
 */
import { formatLongDate, weekdayAfterDate, type Calendar } from "@/lib/dates";
import type { ArrangeOption, ArrangeTask, PatientContext } from "@/lib/types";
import { OFFICES, PLACES } from "../places";
import {
  Script,
  arrangementFor,
  bookedAppointment,
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

export const TASK_ID = "arrange-follow-up";
const REFERENCE = "BS-55012";
const MRI_TASK_ID = "arrange-mri";
const GENETICS_TASK_ID = "arrange-genetics";

/** Genetic counseling counts while its to-do is still on her list; if she ticked it off herself, we can't know its date. */
function waitsForGenetics(ctx: PatientContext): boolean {
  return !arrangementFor(ctx, GENETICS_TASK_ID) && isOfferable(consultTodo(ctx, "book-genetics"));
}

export function task(ctx: PatientContext): ArrangeTask | null {
  const visit = consultVisit(ctx);
  const todo = consultTodo(ctx, "book-follow-up");
  if (!visit || !isOfferable(todo)) return null;
  const missing = !arrangementFor(ctx, MRI_TASK_ID) ? MRI_TASK_ID : waitsForGenetics(ctx) ? GENETICS_TASK_ID : null;
  return {
    id: TASK_ID,
    kind: "book",
    title: "Book your follow-up with Dr. Ellery",
    detail: "Dr. Ellery asked to see you after your MRI and genetic counseling to settle the plan.",
    office: OFFICES.drEllery,
    sourceVisitId: visit.id,
    todoId: todo.id,
    ...(missing
      ? {
          waitsFor: {
            taskId: missing,
            reason: "Once your MRI and genetic counseling dates are set, Sonoclear can find a follow-up after both.",
          },
        }
      : {}),
  };
}

function mriDate(ctx: PatientContext): string | null {
  return bookedAppointment(arrangementFor(ctx, MRI_TASK_ID))?.date ?? null;
}

function geneticsDate(ctx: PatientContext): string | null {
  return bookedAppointment(arrangementFor(ctx, GENETICS_TASK_ID))?.date ?? null;
}

/** The later of the MRI and genetic counseling dates, or null while either is still missing. */
function readyAfter(ctx: PatientContext): string | null {
  const mri = mriDate(ctx);
  if (!mri || waitsForGenetics(ctx)) return null;
  const genetics = geneticsDate(ctx);
  return genetics && Date.parse(genetics) > Date.parse(mri) ? genetics : mri;
}

function options(ctx: PatientContext): ArrangeOption[] {
  const after = readyAfter(ctx);
  if (!after) return [];
  const where = PLACES.breastSurgery.name;
  return chronological([
    option("follow-up-first", weekdayAfterDate(after, 5, 9, 30), where, "About 30 minutes"),
    option("follow-up-second", weekdayAfterDate(after, 7, 14, 15), where, "About 30 minutes"),
    option("follow-up-third", weekdayAfterDate(after, 10, 11, 0), where, "About 30 minutes"),
  ]);
}

const NEEDS_DATES = "Your MRI and genetic counseling dates need to be set first. Then Sonoclear can look for a follow-up after both.";

export function plan(_cal: Calendar, ctx: PatientContext): TimedEvent[] {
  const mri = mriDate(ctx);
  const genetics = geneticsDate(ctx);
  if (!mri || !readyAfter(ctx)) return limitScript(NEEDS_DATES);
  const [a, b, c] = options(ctx);
  const checked = genetics
    ? `MRI on ${formatLongDate(mri)}. Genetic counseling on ${formatLongDate(genetics)}.`
    : `MRI on ${formatLongDate(mri)}.`;
  const dates = genetics
    ? `It's ${formatLongDate(mri)}, and her genetic counseling is ${formatLongDate(genetics)}. She'd like a time after both.`
    : `It's ${formatLongDate(mri)}. She'd like a time after that.`;
  return new Script("follow-up-plan")
    .step("Reading your consult notes", "Dr. Ellery asked to see you after your MRI and genetic counseling.")
    .step(genetics ? "Checking your MRI and counseling dates" : "Checking your MRI date", checked)
    .step(`Calling ${OFFICES.drEllery.label}, ${OFFICES.drEllery.phone}`, "Three openings found.", {
      office: OFFICES.drEllery.label,
      phone: OFFICES.drEllery.phone,
      lines: [
        { speaker: "sonoclear", text: "Hello. This is Sonoclear, calling for Claire Donovan. Dr. Ellery asked to see her after her MRI." },
        ...identityLines(ctx),
        { speaker: "office", text: "Yes. Do you have the MRI date?" },
        { speaker: "sonoclear", text: dates },
        { speaker: "office", text: "Results go to Dr. Ellery's office, usually within two business days of the scan." },
        {
          speaker: "office",
          text: `Dr. Ellery has ${whenText(a.date)}, ${whenText(b.date)}, and ${whenText(c.date)}. Visits are about 30 minutes.`,
        },
        { speaker: "sonoclear", text: "Please hold all three until the end of the day. Claire will choose." },
        { speaker: "office", text: "Held until end of day." },
      ],
    })
    .end({
      type: "options",
      prompt: "Which works for you?",
      options: [a, b, c],
      note: "Dr. Ellery's office is holding all three times until the end of the day.",
    });
}

export function confirm(_cal: Calendar, ctx: PatientContext, optionId: string): TimedEvent[] {
  if (!readyAfter(ctx)) return limitScript(NEEDS_DATES);
  const chosen = options(ctx).find((o) => o.id === optionId);
  if (!chosen) return limitScript("That time is no longer on the list. Pick one of the times shown.");
  const todo = consultTodo(ctx, "book-follow-up");
  const arrangedGenetics = !!geneticsDate(ctx);
  return new Script("follow-up-confirm")
    .step(`Holding ${chosen.title}`)
    .step("Confirming with Dr. Ellery's office", `Confirmed. Reference ${REFERENCE}.`)
    .end({
      type: "outcome",
      outcome: {
        summary: [
          "Dr. Ellery's office has you down, and the reference is on the card above.",
          `It's on your journey now, after your MRI${arrangedGenetics ? " and genetic counseling" : ""}. Your “${todo?.text ?? "Book a follow-up with Dr. Ellery after your MRI"}” to-do is done.`,
        ],
        appointment: {
          id: "appt-surgeon-follow-up",
          title: "Follow-up",
          visitType: "breast-surgeon",
          clinicianId: "dr-ellery",
          stageId: "treatment-planning",
          status: "scheduled",
          date: chosen.date,
          location: chosen.location,
          note: "Bring the questions you wrote down while reading the booklet.",
        },
        resolvedTodoIds: todo ? [todo.id] : [],
        prep: [
          "Bring the questions you wrote down while reading the booklet.",
          "This is the visit where you and Dr. Ellery settle the plan.",
        ],
        reference: REFERENCE,
      },
    });
}

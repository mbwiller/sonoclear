// CLINICAL REVIEW PENDING
/**
 * Arrange script: book genetic counseling after Dr. Ellery's referral.
 * Calls Linden Health Cancer Genetics, (617) 555-0175 (PLAN.md §3). Resolves the
 * "Book your genetic counseling appointment" to-do and schedules `appt-genetic-counseling`.
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

export const TASK_ID = "arrange-genetics";
const REFERENCE = "CG-20931";
const VIDEO = "Video visit";

export function task(ctx: PatientContext): ArrangeTask | null {
  const visit = consultVisit(ctx);
  const todo = consultTodo(ctx, "book-genetics");
  if (!visit || !isOfferable(todo)) return null;
  return {
    id: TASK_ID,
    kind: "book",
    title: "Book genetic counseling",
    detail: "Dr. Ellery sent a referral to Linden Health Cancer Genetics at your consult.",
    office: OFFICES.cancerGenetics,
    sourceVisitId: visit.id,
    todoId: todo.id,
    appointmentId: "appt-genetic-counseling",
  };
}

/** In date order, soonest first. */
function options(cal: Calendar): ArrangeOption[] {
  return chronological([
    option("genetics-in-person-early", weekdayOnOrAfterAt(cal, 9, 14, 0), PLACES.elmStreetGenetics.name, "In person · about an hour"),
    option("genetics-video", weekdayOnOrAfterAt(cal, 11, 11, 30), VIDEO, "Video visit · about an hour"),
    option("genetics-in-person-late", weekdayOnOrAfterAt(cal, 14, 9, 0), PLACES.elmStreetGenetics.name, "In person · about an hour"),
  ]);
}

export function plan(cal: Calendar, ctx: PatientContext): TimedEvent[] {
  const [a, b, c] = options(cal);
  return new Script("genetics-plan")
    .step("Reading your consult notes", "Dr. Ellery sent a referral to Linden Health Cancer Genetics.")
    .step(`Calling ${OFFICES.cancerGenetics.label}, ${OFFICES.cancerGenetics.phone}`, "Three openings found.", {
      office: OFFICES.cancerGenetics.label,
      phone: OFFICES.cancerGenetics.phone,
      lines: [
        { speaker: "sonoclear", text: "Hello. This is Sonoclear, calling for Claire Donovan. Dr. Ellery sent a referral for genetic counseling." },
        ...identityLines(ctx),
        { speaker: "office", text: "Yes, the referral arrived. The first visit is about an hour. It can be in person at Elm Street, or by video." },
        { speaker: "sonoclear", text: "What openings do you have?" },
        {
          speaker: "office",
          text: `Three. ${whenText(a.date)} in person, ${whenText(b.date)} by video, and ${whenText(c.date)} in person.`,
        },
        { speaker: "sonoclear", text: "Please hold all three until the end of the day. Claire will choose." },
        { speaker: "office", text: "Held until end of day." },
      ],
    })
    .end({
      type: "options",
      prompt: "Which works for you?",
      options: [a, b, c],
      note: "Cancer Genetics is holding all three openings until the end of the day.",
    });
}

export function confirm(cal: Calendar, ctx: PatientContext, optionId: string): TimedEvent[] {
  const chosen = options(cal).find((o) => o.id === optionId);
  if (!chosen) return limitScript("That opening is no longer on the list. Pick one of the times shown.");
  const todo = consultTodo(ctx, "book-genetics");
  const todoText = todo?.text ?? "Book your genetic counseling appointment";
  const video = chosen.location === VIDEO;
  return new Script("genetics-confirm")
    .step(`Holding ${chosen.title}`)
    .step("Confirming with Cancer Genetics", `Confirmed. Reference ${REFERENCE}.`)
    .end({
      type: "outcome",
      outcome: {
        summary: [
          video
            ? "Linden Health Cancer Genetics has you down for a video visit, and the reference is on the card above. They will send the link before the visit."
            : "Linden Health Cancer Genetics has you down, and the reference is on the card above.",
          `It's on your journey now, and your “${todoText}” to-do is done.`,
        ],
        appointment: {
          id: "appt-genetic-counseling",
          title: "Genetic counseling",
          visitType: "genetic-counselor",
          stageId: "treatment-planning",
          status: "scheduled",
          date: chosen.date,
          location: video ? VIDEO : PLACES.elmStreetGenetics.name,
          note: "Bring what you know about your mother's diagnosis.",
        },
        resolvedTodoIds: todo ? [todo.id] : [],
        prep: [
          "Bring what you know about your mother's diagnosis, even if it's only the year and her age.",
          "They'll ask about relatives on both sides of your family.",
          "Testing, if you choose it, is a blood or saliva sample.",
        ],
        reference: REFERENCE,
      },
    });
}

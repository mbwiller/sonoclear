// CLINICAL REVIEW PENDING
/**
 * Arrange script: find a place and time for the pre-op bloodwork Dr. Ellery ordered
 * (a CBC and a basic metabolic panel, any Linden Health lab, within two weeks, no fasting).
 * No call to plan: the order is in the system and two of the three options are walk-in. Only the
 * Suite 300 option is an appointment, so choosing it places a short call to the laboratory.
 * If the MRI is already booked at Westgate within the two weeks, the first option is the morning of the MRI.
 * The to-do stays open, with a plan, until the blood is drawn.
 */
import { atTime, daysFromToday, formatLongDate, weekdayOnOrAfterAt, type Calendar } from "@/lib/dates";
import type { ArrangeOption, ArrangeTask, PatientContext } from "@/lib/types";
import { OFFICES, PLACES } from "../places";
import {
  Script,
  arrangementFor,
  bookedAppointment,
  chronological,
  consultAppointment,
  consultTodo,
  consultVisit,
  identityLines,
  isOfferable,
  limitScript,
  option,
  whenText,
  type TimedEvent,
} from "./shared";

export const TASK_ID = "arrange-bloodwork";
const REFERENCE = "LAB-ORD-7730612";

export function task(ctx: PatientContext): ArrangeTask | null {
  const visit = consultVisit(ctx);
  const todo = consultTodo(ctx, "preop-bloodwork");
  if (!visit || !isOfferable(todo)) return null;
  return {
    id: TASK_ID,
    kind: "find",
    title: "Find a time for your pre-op bloodwork",
    detail: "Dr. Ellery ordered routine blood tests before surgery. Any Linden Health lab works.",
    office: OFFICES.laboratory,
    sourceVisitId: visit.id,
    todoId: todo.id,
  };
}

/**
 * The MRI date, when it is booked at Westgate and falls inside the two weeks the order allows.
 * Then the blood draw can happen the same morning, in the same building.
 */
function coordinatedMri(cal: Calendar, ctx: PatientContext): string | null {
  const arranged = arrangementFor(ctx, "arrange-mri");
  const mri = bookedAppointment(arranged);
  const atWestgate = arranged?.optionId?.startsWith("mri-westgate") || mri?.location === PLACES.westgateImaging.name;
  if (!mri?.date || !atWestgate) return null;
  const consult = consultAppointment(ctx)?.date;
  const lastDay = consult ? daysFromToday(consult, cal.today) + 14 : daysFromToday(cal.day(14), cal.today);
  return daysFromToday(mri.date, cal.today) <= lastDay ? mri.date : null;
}

function options(cal: Calendar, ctx: PatientContext): ArrangeOption[] {
  const mri = coordinatedMri(cal, ctx);
  return chronological([
    mri
      ? option("bloodwork-westgate", atTime(mri, 7, 30), PLACES.westgateLab.name, "Walk in before your MRI · same building")
      : option("bloodwork-westgate", weekdayOnOrAfterAt(cal, 2, 8, 0), PLACES.westgateLab.name, "Walk in · open until 5"),
    option("bloodwork-elm", weekdayOnOrAfterAt(cal, 1, 7, 30), PLACES.elmStreetLab.name, "Walk in · open until 6"),
    option("bloodwork-suite-300", weekdayOnOrAfterAt(cal, 3, 9, 0), PLACES.suite300Draw.name, "By appointment"),
  ]);
}

export function plan(cal: Calendar, ctx: PatientContext): TimedEvent[] {
  const script = new Script("bloodwork-plan").step(
    "Checking the order",
    "A CBC and a basic metabolic panel, any Linden Health lab, within two weeks. No need to fast.",
  );
  const mri = coordinatedMri(cal, ctx);
  if (mri) script.step("Checking your MRI date", `MRI on ${formatLongDate(mri)}, at Westgate. The lab is in the same building.`);
  script.step(
    "Looking at Linden Health labs and hours",
    `${PLACES.westgateLab.short} lab, ${PLACES.westgateLab.hours}. ${PLACES.elmStreetLab.short} lab, ${PLACES.elmStreetLab.hours}. ${PLACES.suite300Draw.short} draw station, ${PLACES.suite300Draw.hours}.`,
  );
  return script.end({
    type: "options",
    prompt: "Which works for you?",
    options: options(cal, ctx),
    note: "Two of these are walk-in, so nothing is held. The order is already in the system.",
  });
}

export function confirm(cal: Calendar, ctx: PatientContext, optionId: string): TimedEvent[] {
  const chosen = options(cal, ctx).find((o) => o.id === optionId);
  if (!chosen) return limitScript("That choice is no longer on the list. Pick one of the options shown.");
  const todo = consultTodo(ctx, "preop-bloodwork");
  const byAppointment = optionId === "bloodwork-suite-300";
  const script = new Script("bloodwork-confirm");
  if (byAppointment) {
    script.step(`Calling ${OFFICES.laboratory.label}, ${OFFICES.laboratory.phone}`, "Booked.", {
      office: OFFICES.laboratory.label,
      phone: OFFICES.laboratory.phone,
      lines: [
        {
          speaker: "sonoclear",
          text: "Hello. This is Sonoclear, calling for Claire Donovan. She'd like a draw appointment at Suite 300 for the CBC and basic metabolic panel Dr. Ellery ordered.",
        },
        ...identityLines(ctx),
        { speaker: "office", text: `I see the order. ${whenText(chosen.date)} works. No fasting is needed.` },
      ],
    });
  } else script.step(`Noting ${chosen.title}`, "Walk-in. No appointment needed.");
  script.step("Checking the order is in the system", `Found. Reference ${REFERENCE}.`);

  return script.end({
    type: "outcome",
    outcome: {
      summary: [
        byAppointment
          ? "Your blood draw is booked, and the time and place are on the card above."
          : "Your blood draw is planned. You can walk in, so no appointment is needed. The time and place are on the card above.",
        `It's on your journey now. Your “${todo?.text ?? "Get your pre-op bloodwork"}” to-do stays open until the blood is drawn. No need to fast.`,
      ],
      appointment: {
        id: "appt-preop-bloodwork",
        title: "Pre-op bloodwork",
        visitType: "other",
        stageId: "treatment-planning",
        status: "scheduled",
        date: chosen.date,
        location: chosen.location,
        note: byAppointment ? "Appointment booked." : "Walk in; no appointment needed. No need to fast.",
      },
      ...(todo
        ? {
            todoUpdate: {
              id: todo.id,
              // The date lives in `dueDate`, so it moves with the story; the prose has none.
              detail: `Planned: ${chosen.location}. No need to fast.`,
              dueHint: "Planned for the morning",
              dueDate: chosen.date,
            },
          }
        : {}),
      prep: ["Bring a photo ID and your insurance card.", "No need to fast.", "The order is already in the system."],
      reference: REFERENCE,
    },
  });
}

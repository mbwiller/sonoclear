// CLINICAL REVIEW PENDING
/**
 * Arrange script: request the imaging discs Dr. Raman asked her to bring to Dr. Ellery.
 * Offered before the surgical consult is recorded. Calls Linden Health Breast Imaging,
 * (617) 555-0147 (PLAN.md §3). The to-do stays open: she still has to collect the disc.
 */
import { atTime, daysFromToday, formatLongDate, formatWeekday, isWeekdayDate, weekdayOnOrAfterAt, type Calendar } from "@/lib/dates";
import type { ArrangeOption, ArrangeTask, PatientContext } from "@/lib/types";
import { OFFICES, PLACES } from "../places";
import {
  Script,
  consultAppointment,
  consultVisit,
  dayWord,
  identityLines,
  isOfferable,
  limitScript,
  option,
  type TimedEvent,
} from "./shared";

export const TASK_ID = "arrange-imaging-discs";
const TODO_ID = "todo-imaging-discs";
const REFERENCE = "RQ-4471";

export function task(ctx: PatientContext): ArrangeTask | null {
  if (consultVisit(ctx)) return null;
  const todo = ctx.todos.find((t) => t.id === TODO_ID);
  if (!isOfferable(todo)) return null;
  return {
    id: TASK_ID,
    kind: "request",
    title: "Request your imaging discs",
    detail: "Dr. Raman asked you to bring your mammogram and ultrasound images to Dr. Ellery.",
    office: OFFICES.breastImaging,
    sourceVisitId: todo.sourceVisitId ?? undefined,
    todoId: todo.id,
  };
}

/** The front desk closes at 6 PM. */
const DESK_CLOSES = 18;

/**
 * Ready after 2 PM the next weekday. If that is the day of the consult itself, the disc would
 * be ready after she needs it, so the pickup moves to today, but only while the front desk is
 * still open: from 2 PM, or the next hour if it is already past 2. After that, there is no pickup.
 */
export function pickupDate(cal: Calendar, ctx: PatientContext, now: Date = new Date()): string | null {
  const next = weekdayOnOrAfterAt(cal, 1, 14, 0);
  const consult = consultAppointment(ctx)?.date;
  if (!consult || daysFromToday(next, cal.today) < daysFromToday(consult, cal.today)) return next;
  const today = cal.day(0);
  const hour = Math.max(14, now.getHours() + 1);
  return isWeekdayDate(today) && hour < DESK_CLOSES ? atTime(today, hour) : null;
}

export function options(cal: Calendar, ctx: PatientContext, now: Date = new Date()): ArrangeOption[] {
  const mail = weekdayOnOrAfterAt(cal, 4, 12, 0);
  const pickup = pickupDate(cal, ctx, now);
  const mailOption: ArrangeOption = {
    id: "discs-mail",
    title: `Mailed to you, around ${formatLongDate(mail)}`,
    date: mail,
    location: "By mail, to the address Linden Health has on file",
    detail: "3 to 5 business days",
  };
  return pickup
    ? [option("discs-pickup", pickup, `${PLACES.westgateBreastImaging.name}, front desk`, "Ready after 2 PM · bring a photo ID"), mailOption]
    : [mailOption];
}

export function plan(cal: Calendar, ctx: PatientContext): TimedEvent[] {
  const [first, second] = options(cal, ctx);
  const pickup = second ? first : null;
  const mail = second ?? first;
  const consult = consultAppointment(ctx)?.date;
  const mailAfterConsult = !!consult && Date.parse(mail.date) > Date.parse(consult);
  const mailing = "Mailing takes 3 to 5 business days";
  const note = [
    pickup ? null : "The front desk is closed for today, so mail is the only way to get it.",
    consult && mailAfterConsult ? `${mailing}, so it would arrive after your consult on ${formatWeekday(consult)}.` : `${mailing}.`,
  ]
    .filter(Boolean)
    .join(" ");
  return new Script("discs-plan")
    .step("Reading your results visit", "Dr. Raman asked you to bring your imaging discs to Dr. Ellery.")
    .step(`Calling ${OFFICES.breastImaging.label}, ${OFFICES.breastImaging.phone}`, pickup ? "Two ways to get your disc." : "One way to get your disc.", {
      office: OFFICES.breastImaging.label,
      phone: OFFICES.breastImaging.phone,
      lines: [
        { speaker: "sonoclear", text: "Hello. This is Sonoclear, calling for Claire Donovan. She needs her mammogram and ultrasound images on a disc for Dr. Ellery." },
        ...identityLines(ctx),
        { speaker: "office", text: "We can copy both onto one disc." },
        { speaker: "sonoclear", text: "When could it be ready?" },
        {
          speaker: "office",
          text: pickup
            ? `After 2 PM ${dayWord(pickup.date, cal.today)}, at the Westgate front desk. We can also mail it. That takes three to five business days.`
            : "We can mail it. That takes three to five business days. The front desk is closed for today.",
        },
        { speaker: "sonoclear", text: pickup ? "Does she need anything to pick it up?" : "Does she need to do anything for the mailing?" },
        { speaker: "office", text: pickup ? "A photo ID. The front desk is open 7 AM to 6 PM." : "No. We send it to the address on file." },
      ],
    })
    .end({
      type: "options",
      prompt: "How would you like to get your discs?",
      options: [first, ...(second ? [second] : [])],
      note,
    });
}

export function confirm(cal: Calendar, ctx: PatientContext, optionId: string): TimedEvent[] {
  const chosen = options(cal, ctx).find((o) => o.id === optionId);
  if (!chosen) return limitScript("That choice is no longer on the list. Pick one of the options shown.");
  const pickup = optionId === "discs-pickup";
  const todoText = ctx.todos.find((t) => t.id === TODO_ID)?.text ?? "Gather your imaging discs";
  const script = new Script("discs-confirm")
    .step(pickup ? "Placing the request for your disc" : "Placing the request to mail your disc")
    .step(`Confirming with ${OFFICES.breastImaging.label}`, `Confirmed. Reference ${REFERENCE}.`);

  // The date lives in `dueDate`, so it moves with the story; the prose has none.
  const detail = pickup
    ? `Ready at the Westgate front desk after 2 PM. Bring a photo ID. ${OFFICES.breastImaging.phone}`
    : `Being mailed to you. It should arrive in 3 to 5 business days. ${OFFICES.breastImaging.phone}`;
  const summary = [
    `Your request is in for a disc with your mammogram and ultrasound images. The ${pickup ? "pickup" : "mailing"} details are on your to-do.`,
    `Your “${todoText}” to-do stays open until ${pickup ? "you pick it up" : "the disc arrives"}.`,
  ];
  return script.end({
    type: "outcome",
    outcome: {
      summary,
      todoUpdate: {
        id: TODO_ID,
        detail,
        dueHint: pickup ? "Before your surgical consult" : "Arriving by mail",
        dueDate: chosen.date,
      },
      prep: pickup ? ["Bring a photo ID.", "The front desk is open 7 AM to 6 PM."] : ["Mail takes 3 to 5 business days.", `Questions about the mailing: ${OFFICES.breastImaging.phone}.`],
      reference: REFERENCE,
    },
  });
}

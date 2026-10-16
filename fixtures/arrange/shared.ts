// CLINICAL REVIEW PENDING
/**
 * Shared pieces for the Arrange scripts: the timed-event shape, a small builder that keeps
 * pacing and step ids consistent, and lookups into the patient's context.
 * Pure: nothing here reads the clock or the store.
 */
import { daysFromToday, formatFullDate, formatLongDate, formatTime, formatWeekday } from "@/lib/dates";
import type {
  AgentEvent,
  Appointment,
  ArrangeOption,
  Arrangement,
  CallLine,
  PatientContext,
  Todo,
  Visit,
} from "@/lib/types";

/** An event and how long to wait, at normal pace, before showing it. */
export interface TimedEvent {
  delayMs: number;
  event: AgentEvent;
}

export const CONSULT_APPOINTMENT_ID = "appt-surgical-consult";

/* ---------- Pacing ---------- */

// Fixed cycles, not random, so every run of a script feels the same and stays pure.
const START_MS = [420, 520, 380, 600, 450, 350];
const DONE_MS = [1100, 1400, 1000, 1300, 1500, 1200, 900];
const CALL_MS = 1300;
const AFTER_MS = 500;

type CallInput = { office: string; phone: string; lines: CallLine[] };

/** Builds a script: steps that start and finish, an optional call, and a closing event. */
export class Script {
  private readonly events: TimedEvent[] = [];
  private count = 0;

  constructor(private readonly prefix: string) {}

  /** One step. With `call`, the simulated call sits between the step starting and finishing. */
  step(text: string, result?: string, call?: CallInput): this {
    const n = this.count++;
    const id = `${this.prefix}-${n + 1}`;
    this.events.push({ delayMs: START_MS[n % START_MS.length], event: { type: "step", id, text } });
    if (call) this.events.push({ delayMs: CALL_MS, event: { type: "call", ...call } });
    const done: AgentEvent = result === undefined ? { type: "step-done", id } : { type: "step-done", id, result };
    this.events.push({ delayMs: call ? DONE_MS[DONE_MS.length - 1] : DONE_MS[n % DONE_MS.length], event: done });
    return this;
  }

  /** The closing event (options, outcome or limit). Returns the finished script. */
  end(event: AgentEvent): TimedEvent[] {
    return [...this.events, { delayMs: AFTER_MS, event }];
  }
}

/** A script that only says why it can't go on. */
export function limitScript(text: string): TimedEvent[] {
  return [{ delayMs: 400, event: { type: "limit", text } }];
}

/* ---------- Words ---------- */

/** "Thursday, October 29 at 8:15 AM" */
export function whenText(iso: string): string {
  return `${formatLongDate(iso)} at ${formatTime(iso)}`;
}

/** "tomorrow", "today", or the weekday, for use inside a sentence. */
export function dayWord(iso: string, base: Date): string {
  const n = daysFromToday(iso, base);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  return formatWeekday(iso);
}

/** A front desk asks who the call is about. These three lines follow Sonoclear's greeting on every call. */
export function identityLines(ctx: PatientContext): CallLine[] {
  return [
    { speaker: "office", text: "Can you confirm her date of birth?" },
    { speaker: "sonoclear", text: `${formatFullDate(ctx.patient.dateOfBirth)}.` },
    { speaker: "office", text: "Thank you." },
  ];
}

/** Options as a patient reads a calendar: soonest first. */
export function chronological(options: ArrangeOption[]): ArrangeOption[] {
  return [...options].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

export function option(id: string, iso: string, location: string, detail?: string): ArrangeOption {
  return { id, title: whenText(iso), date: iso, location, ...(detail ? { detail } : {}) };
}

/* ---------- The patient's context ---------- */

/** The recorded surgical consult, if there is one. */
export function consultVisit(ctx: PatientContext): Visit | undefined {
  return ctx.visits.find((v) => v.appointmentId === CONSULT_APPOINTMENT_ID);
}

export function consultAppointment(ctx: PatientContext): Appointment | undefined {
  return ctx.appointments.find((a) => a.id === CONSULT_APPOINTMENT_ID);
}

/** A to-do from the consult, found by the end of its id (`${visitId}-schedule-mri`). */
export function consultTodo(ctx: PatientContext, suffix: string): Todo | undefined {
  return ctx.todos.find((t) => t.id.endsWith(`-${suffix}`));
}

/** A task is offered while its to-do is open, or was fulfilled by an arrangement. A to-do she ticked off herself hides it. */
export function isOfferable(todo: Todo | undefined): todo is Todo {
  return !!todo && (!todo.done || !!todo.arrangedById);
}

export function arrangementFor(ctx: PatientContext, taskId: string): Arrangement | undefined {
  return [...ctx.arrangements].reverse().find((a) => a.taskId === taskId);
}

export function bookedAppointment(arrangement: Arrangement | undefined): Appointment | undefined {
  return arrangement?.outcome.appointment;
}

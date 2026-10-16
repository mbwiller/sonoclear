/**
 * Guards for state read back from localStorage. Saved data can be old, partial or
 * hand-edited; anything that doesn't fit is dropped rather than allowed to break a screen.
 */
import { VISIT_TYPES } from "./visit-types";
import type { AgentEvent, Appointment, Arrangement, ArrangeOutcome, ISODate, MedicalRecord, Todo, Visit } from "./types";

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isDate = (v: unknown): v is string => isStr(v) && !Number.isNaN(Date.parse(v));
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);

function isTodo(v: unknown): v is Todo {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.text) &&
    isStr(v.stageId) &&
    isDate(v.createdAt) &&
    typeof v.done === "boolean" &&
    (v.dueDate === undefined || isDate(v.dueDate))
  );
}

export function isVisit(v: unknown): v is Visit {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.visitType) || !isDate(v.date) || !isStr(v.stageId)) return false;
  if (typeof v.durationMs !== "number" || !isStrArray(v.relatedRecordIds)) return false;
  if (v.transcript !== null && !(isObj(v.transcript) && Array.isArray(v.transcript.segments))) return false;
  const n = v.notes;
  return (
    isObj(n) &&
    isStr(n.title) &&
    Array.isArray(n.todos) &&
    n.todos.every(isTodo) &&
    isStrArray(n.summary) &&
    Array.isArray(n.terms) &&
    isStrArray(n.questionsForNextTime)
  );
}

export function isRecord(v: unknown): v is MedicalRecord {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.type) || !isStr(v.title) || !isDate(v.date) || !isStr(v.stageId)) return false;
  const o = v.original;
  const e = v.explanation;
  return (
    isObj(o) &&
    (o.kind === "text" || o.kind === "image" || o.kind === "pdf") &&
    isObj(e) &&
    typeof e.recognized === "boolean" &&
    isStrArray(e.summary) &&
    Array.isArray(e.keyFindings)
  );
}

const APPOINTMENT_STATUSES: readonly unknown[] = ["scheduled", "unscheduled", "completed"];

function isAppointment(v: unknown): v is Appointment {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.title) &&
    (VISIT_TYPES as readonly unknown[]).includes(v.visitType) &&
    isStr(v.stageId) &&
    APPOINTMENT_STATUSES.includes(v.status) &&
    (v.date === null || isDate(v.date)) &&
    (v.clinicianId === undefined || isStr(v.clinicianId)) &&
    (v.location === undefined || isStr(v.location)) &&
    (v.note === undefined || isStr(v.note))
  );
}

function isOutcome(v: unknown): v is ArrangeOutcome {
  if (!isObj(v) || !isStrArray(v.summary)) return false;
  const u = v.todoUpdate;
  return (
    (v.appointment === undefined || isAppointment(v.appointment)) &&
    (v.resolvedTodoIds === undefined || isStrArray(v.resolvedTodoIds)) &&
    (u === undefined ||
      (isObj(u) && isStr(u.id) && isStr(u.detail) && (u.dueHint === undefined || isStr(u.dueHint)) && (u.dueDate === undefined || isDate(u.dueDate)))) &&
    (v.prep === undefined || isStrArray(v.prep)) &&
    (v.reference === undefined || isStr(v.reference))
  );
}

/** One entry of a saved replay. Entries that don't fit are dropped, so a screen never dereferences a hole. */
export function isEvent(e: unknown): e is AgentEvent {
  if (!isObj(e)) return false;
  switch (e.type) {
    case "step":
      return isStr(e.id) && isStr(e.text);
    case "step-done":
      return isStr(e.id) && (e.result === undefined || isStr(e.result));
    case "call":
      return (
        isStr(e.office) &&
        isStr(e.phone) &&
        Array.isArray(e.lines) &&
        e.lines.every((l) => isObj(l) && (l.speaker === "sonoclear" || l.speaker === "office") && isStr(l.text))
      );
    case "options":
      return (
        isStr(e.prompt) &&
        (e.note === undefined || isStr(e.note)) &&
        Array.isArray(e.options) &&
        e.options.every(
          (o) => isObj(o) && isStr(o.id) && isStr(o.title) && isDate(o.date) && isStr(o.location) && (o.detail === undefined || isStr(o.detail)),
        )
      );
    case "limit":
      return isStr(e.text);
    case "outcome":
      return isOutcome(e.outcome);
    default:
      return false;
  }
}

/**
 * Saves written before `taskTitle` existed get one from the appointment they booked, rather than
 * being dropped. Anything that isn't an object passes through for `isArrangement` to reject.
 */
export function withTaskTitle(v: unknown): unknown {
  if (!isObj(v) || v.taskTitle !== undefined) return v;
  const appointment = isObj(v.outcome) && isObj(v.outcome.appointment) ? v.outcome.appointment : undefined;
  return { ...v, taskTitle: appointment && isStr(appointment.title) ? appointment.title : "Arranged" };
}

export function isArrangement(v: unknown): v is Arrangement {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.taskId) &&
    isStr(v.taskTitle) &&
    (v.optionId === undefined || isStr(v.optionId)) &&
    isDate(v.arrangedAt) &&
    Array.isArray(v.log) &&
    isOutcome(v.outcome)
  );
}

/** Keeps only the replay entries that fit; the arrangement itself stays. */
export function cleanArrangement(a: Arrangement): Arrangement {
  const saved: unknown[] = a.log;
  return saved.every(isEvent) ? a : { ...a, log: saved.filter(isEvent) };
}

export function isTodoOverride(v: unknown): v is { done: boolean; at: ISODate } {
  return isObj(v) && typeof v.done === "boolean" && isDate(v.at);
}

/* ---------- Keeping the patient's own items in step with the story ---------- */

/** Moves a timestamp by whole calendar days, keeping its local time of day. */
export function shiftISO(iso: ISODate, days: number): ISODate {
  if (!days) return iso;
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const shiftOpt = (iso: ISODate | undefined, days: number) => (iso ? shiftISO(iso, days) : iso);

function shiftTodo(t: Todo, days: number): Todo {
  return { ...t, createdAt: shiftISO(t.createdAt, days), dueDate: shiftOpt(t.dueDate, days), doneAt: shiftOpt(t.doneAt, days) };
}

export function shiftVisit(v: Visit, days: number): Visit {
  if (!days) return v;
  return { ...v, date: shiftISO(v.date, days), notes: { ...v.notes, todos: v.notes.todos.map((t) => shiftTodo(t, days)) } };
}

export function shiftRecord(r: MedicalRecord, days: number): MedicalRecord {
  if (!days) return r;
  return {
    ...r,
    date: shiftISO(r.date, days),
    addedAt: shiftISO(r.addedAt, days),
    explanation: { ...r.explanation, documentDate: shiftOpt(r.explanation.documentDate, days) },
  };
}

export function shiftArrangement(a: Arrangement, days: number): Arrangement {
  if (!days) return a;
  const appt = a.outcome.appointment;
  const update = a.outcome.todoUpdate;
  const shiftOutcome = (o: ArrangeOutcome): ArrangeOutcome => {
    const ap = o.appointment;
    const up = o.todoUpdate;
    return {
      ...o,
      ...(ap ? { appointment: { ...ap, date: shiftOpt(ap.date ?? undefined, days) ?? null } } : {}),
      ...(up?.dueDate ? { todoUpdate: { ...up, dueDate: shiftISO(up.dueDate, days) } } : {}),
    };
  };
  // The replay's prose is a record of what was said and isn't rewritten; its dates still move with the story.
  const log = a.log.map((e): AgentEvent => {
    if (e.type === "options") return { ...e, options: e.options.map((o) => ({ ...o, date: shiftISO(o.date, days) })) };
    if (e.type === "outcome") return { ...e, outcome: shiftOutcome(e.outcome) };
    return e;
  });
  return {
    ...a,
    arrangedAt: shiftISO(a.arrangedAt, days),
    outcome: appt || update ? shiftOutcome(a.outcome) : a.outcome,
    log,
  };
}

/**
 * Guards for state read back from localStorage. Saved data can be old, partial or
 * hand-edited; anything that doesn't fit is dropped rather than allowed to break a screen.
 */
import type { ISODate, MedicalRecord, Todo, Visit } from "./types";

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

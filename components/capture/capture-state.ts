import type { CareView } from "@/lib/care";
import { startOfDay } from "@/lib/dates";
import type { Appointment, Clinician, ISODate, Transcript, TranscriptSegment, VisitNotes, VisitType } from "@/lib/types";

/** What the patient chose before recording. */
export interface CaptureSetup {
  visitType: VisitType;
  /** As typed; may be empty. */
  clinicianName: string;
  /** The appointment the Before screen matched when she pressed record, so the link uses what she saw. */
  appointmentId?: string;
}

/* ---------- Segments ---------- */

/**
 * Folds one incoming segment into the transcript so far, following the session's id rules:
 * interim results for an utterance share an id and replace each other; a final (same id or a
 * new one) supersedes every interim that started before it ended. Lines stay in time order.
 */
export function mergeSegment(segments: TranscriptSegment[], incoming: TranscriptSegment): TranscriptSegment[] {
  // A late interim that a final already covers (same id, or started before a final ended) is stale.
  if (!incoming.isFinal && segments.some((s) => s.isFinal && (s.id === incoming.id || s.endMs > incoming.startMs))) {
    return segments;
  }
  let next = segments.filter((s) => s.id !== incoming.id);
  if (incoming.isFinal) next = next.filter((s) => s.isFinal || s.startMs >= incoming.endMs);
  next.push(incoming);
  return next.sort((a, b) => a.startMs - b.startMs);
}

/** What was captured so far, as a transcript: used when the engine can't hand one back. */
export function transcriptSoFar(segments: TranscriptSegment[], recordedMs: number): Transcript {
  const finals = segments.filter((s) => s.isFinal);
  return { segments: finals, durationMs: Math.max(recordedMs, finals.at(-1)?.endMs ?? 0) };
}

/* ---------- Notes ---------- */

/**
 * The summarizer's to-dos, made safe to save: each belongs to this visit, starts open,
 * is dated to the visit, and has an id no other visit can collide with.
 */
export function normalizeNotes(notes: VisitNotes, visitId: string, startedAt: ISODate): VisitNotes {
  const prefix = `${visitId}-`;
  return {
    ...notes,
    todos: notes.todos.map((t) => ({
      ...t,
      id: t.id.startsWith(prefix) ? t.id : prefix + t.id,
      sourceVisitId: visitId,
      createdAt: startedAt,
      done: false,
      doneAt: undefined,
      resolvedByVisitId: undefined,
    })),
  };
}

/* ---------- Who the visit is with ---------- */

const MINUTE = 60_000;
/** An appointment counts as "now" from this long before it starts… */
const EARLY_MS = 90 * MINUTE;
/** …until this long after it starts. */
const LATE_MS = 4 * 60 * MINUTE;

export interface AppointmentMatch {
  appointment: Appointment;
  /** "now": it is on or about to be; "next": the earliest one still ahead. */
  status: "now" | "next";
}

/**
 * Which scheduled appointment this recording most likely belongs to. Only visits someone holds
 * count (a clinician is named, or the visit type isn't "other"), so the MRI or a blood draw
 * never shows up as the visit to record.
 * One that starts within 90 minutes, or began within the last 4 hours, is "now" (the nearest
 * start wins). Otherwise the earliest scheduled appointment from today on is "next". Else null.
 */
export function matchAppointment(care: CareView, now: Date): AppointmentMatch | null {
  const t = now.getTime();
  const scheduled = care.upcomingAppointments.filter(
    (a): a is Appointment & { date: ISODate } =>
      a.status === "scheduled" && !!a.date && (!!a.clinicianId || a.visitType !== "other"),
  );

  let current: Appointment | undefined;
  let closest = Infinity;
  for (const a of scheduled) {
    const start = new Date(a.date).getTime();
    const distance = Math.abs(start - t);
    if (t >= start - EARLY_MS && t <= start + LATE_MS && distance < closest) {
      current = a;
      closest = distance;
    }
  }
  if (current) return { appointment: current, status: "now" };

  const startOfToday = startOfDay(now);
  const next = scheduled.find((a) => new Date(a.date) >= startOfToday);
  return next ? { appointment: next, status: "next" } : null;
}

/** Pre-selection for the Before screen: the matched appointment's visit type and clinician. */
export function captureDefaults(
  care: CareView,
  now: Date = new Date(),
): { visitType: VisitType; clinicianName: string; match: AppointmentMatch | null } {
  const match = matchAppointment(care, now);
  if (!match) return { visitType: "other", clinicianName: "", match: null };
  const { appointment } = match;
  const clinician = appointment.clinicianId ? care.clinicianById.get(appointment.clinicianId) : undefined;
  return { visitType: appointment.visitType, clinicianName: clinician?.name ?? "", match };
}

const words = (s: string) => s.toLowerCase().split(/[^a-z'-]+/).filter(Boolean);

function lastName(c: Clinician): string {
  return words(c.name).at(-1) ?? "";
}

export interface ResolvedVisit {
  clinician: Clinician | undefined;
  appointmentId: string | undefined;
  /** The name as typed, trimmed; undefined when empty. */
  typedName: string | undefined;
}

/**
 * Links the recording to the care team and the appointment where it honestly can: the one the
 * Before screen matched (`setup.appointmentId`), if its visit type is still the one chosen and it
 * hasn't been completed since; and a care-team clinician whose role matches and whose last name
 * was typed (or, with no name typed, the clinician of that appointment).
 */
export function resolveVisit(setup: CaptureSetup, care: CareView): ResolvedVisit {
  const typed = setup.clinicianName.trim();
  const appt = setup.appointmentId ? care.appointments.find((a) => a.id === setup.appointmentId) : undefined;
  const apptMatches = !!appt && appt.status !== "completed" && appt.visitType === setup.visitType;
  const typedWords = new Set(words(typed));
  const clinician = care.clinicians.find((c) => {
    if (c.role !== setup.visitType) return false;
    if (typed) return typedWords.has(lastName(c));
    return apptMatches && appt.clinicianId === c.id;
  });
  return {
    clinician,
    appointmentId: apptMatches ? appt.id : undefined,
    typedName: typed || undefined,
  };
}

/** "Dr. Marcus Ellery": the full name to show while recording, if any. */
export function displayName(resolved: ResolvedVisit): string | undefined {
  return resolved.typedName ?? resolved.clinician?.name;
}

/** "Dr. Ellery", a short typed name, or "Clinician": the transcript's speaker label. */
export function clinicianLabel(resolved: ResolvedVisit): string {
  if (resolved.clinician) return resolved.clinician.shortName;
  const typed = resolved.typedName;
  if (!typed) return "Clinician";
  const parts = typed.split(/\s+/);
  if (/^dr\.?$/i.test(parts[0]) && parts.length > 1) return `Dr. ${parts.at(-1)}`;
  return typed;
}

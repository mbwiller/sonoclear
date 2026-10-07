import type { CareView } from "@/lib/care";
import type { Clinician, ISODate, Transcript, TranscriptSegment, VisitNotes, VisitType } from "@/lib/types";

/** What the patient chose before recording. */
export interface CaptureSetup {
  visitType: VisitType;
  /** As typed; may be empty. */
  clinicianName: string;
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

/** Pre-selection for the Before form: the next scheduled appointment, when there is one. */
export function captureDefaults(care: CareView): { visitType: VisitType | null; clinicianName: string } {
  const appt = care.nextAppointment;
  if (!appt) return { visitType: null, clinicianName: "" };
  const clinician = appt.clinicianId ? care.clinicianById.get(appt.clinicianId) : undefined;
  return { visitType: appt.visitType, clinicianName: clinician?.name ?? "" };
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
 * Links the recording to the care team and the upcoming appointment where it honestly can:
 * a care-team clinician whose role matches and whose last name was typed (or, with no name typed,
 * the clinician of the matching appointment).
 */
export function resolveVisit(setup: CaptureSetup, care: CareView): ResolvedVisit {
  const typed = setup.clinicianName.trim();
  const appt = care.nextAppointment;
  const apptMatches = !!appt && appt.visitType === setup.visitType;
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

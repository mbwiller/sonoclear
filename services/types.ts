/**
 * Service interfaces. Screens depend on these, never on implementations or fixtures.
 * Mock implementations live in `services/mock`; real ones replace them in `services/index.ts`.
 */
import type {
  ChatMessage,
  ISODate,
  PatientContext,
  PatientSeed,
  RecordExplanation,
  RecordId,
  RecordUpload,
  SourceRef,
  Transcript,
  TranscriptSegment,
  VisitId,
  VisitNotes,
  VisitType,
  AppointmentId,
  ClinicianId,
} from "@/lib/types";

/* ---------- Transcription ---------- */

export interface TranscriptionProvider {
  start(opts: { visitType: VisitType }): TranscriptionSession;
}

/**
 * A live transcription. Segment rules every implementation follows:
 * - Interim results (`isFinal: false`) for one utterance share an id and replace each other.
 * - A final result may reuse that id or arrive with a new one. Either way it supersedes
 *   every interim segment that started before it ended.
 * - `stop()` resolves with the finished transcript, or rejects if it can't be produced.
 */
export interface TranscriptionSession {
  onSegment(cb: (s: TranscriptSegment) => void): void;
  /** Problems after start (microphone lost, engine stopped). Optional for mocks. */
  onError?(cb: (error: Error) => void): void;
  pause(): void;
  resume(): void;
  stop(): Promise<Transcript>;
}

/* ---------- Visit understanding ---------- */

export interface VisitMeta {
  id: VisitId;
  visitType: VisitType;
  clinicianId?: ClinicianId;
  clinicianName?: string;
  appointmentId?: AppointmentId;
  startedAt: ISODate;
  durationMs: number;
}

export interface VisitSummarizer {
  summarize(input: { transcript: Transcript; visit: VisitMeta; patient: PatientContext }): Promise<VisitNotes>;
  /** Preview only: an honest note about what this visit type will produce. Real implementations omit it. */
  previewNote?(input: { visitType: VisitType }, patient: PatientContext): string | null;
}

/* ---------- Records ---------- */

export interface RecordInterpreter {
  interpret(record: RecordUpload, patient: PatientContext): Promise<RecordExplanation>;
  /** Preview only: the text of a sample document the patient can try. Real implementations omit it. */
  sampleText?(): string;
}

/* ---------- Ask ---------- */

export type ChatChunk =
  | { type: "text"; text: string }
  | { type: "sources"; sources: SourceRef[] }
  | { type: "meta"; kind: NonNullable<ChatMessage["kind"]>; suggestions?: string[] };

export interface ChatProvider {
  ask(input: {
    messages: ChatMessage[];
    patient: PatientContext;
    focus?: VisitId | RecordId;
  }): AsyncIterable<ChatChunk>;
  /** Questions to offer on the empty Ask page, optionally tuned to a focused visit or record. */
  suggestedQuestions(patient: PatientContext, focus?: VisitId | RecordId): string[];
}

/* ---------- Patient data ---------- */

export interface PatientDataSource {
  /** The demo's starting state, with every date computed relative to `today`. */
  loadSeed(today: Date): PatientSeed;
}

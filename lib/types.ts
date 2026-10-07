/**
 * Core domain types. Shared by fixtures, services and screens.
 * Dates are ISO 8601 strings. Fixtures build them with helpers in `lib/dates.ts`.
 */

export type ISODate = string;

export type PatientId = string;
export type ClinicianId = string;
export type VisitId = string;
export type RecordId = string;
export type TodoId = string;
export type TermId = string;
export type AppointmentId = string;

export type StageId =
  | "screening"
  | "diagnostic-imaging"
  | "biopsy"
  | "diagnosis"
  | "treatment-planning"
  | "treatment"
  | "follow-up";

export type StageStatus = "done" | "current" | "ahead";

export type VisitType =
  | "pcp"
  | "radiologist"
  | "breast-surgeon"
  | "medical-oncologist"
  | "radiation-oncologist"
  | "genetic-counselor"
  | "other";

export type RecordType = "imaging" | "pathology" | "labs" | "genetics" | "other";

/** A medical term with a short plain-language definition. */
export interface Term {
  id: TermId;
  /** As it appears to the patient, e.g. "ER-positive". */
  term: string;
  /** One to three short sentences. Plain words first, then the medical term. */
  definition: string;
  alsoCalled?: string[];
}

export interface Clinician {
  id: ClinicianId;
  name: string;
  /** Short display name used in titles, e.g. "Dr. Ellery". */
  shortName: string;
  role: VisitType;
  /** e.g. "Breast surgeon". */
  roleLabel: string;
  practice: string;
  phone: string;
}

export interface DiagnosisFact {
  label: string;
  value: string;
  termId?: TermId;
}

export interface DiagnosisSnapshot {
  /** e.g. "Invasive ductal carcinoma, left breast". */
  headline: string;
  facts: DiagnosisFact[];
  /** Honest note that stage is not known yet. */
  stageNote: string;
  sourceRecordId: RecordId;
}

export interface FamilyHistoryEntry {
  relation: string;
  condition: string;
  ageAtDiagnosis?: number;
  note?: string;
}

export interface Patient {
  id: PatientId;
  firstName: string;
  lastName: string;
  dateOfBirth: ISODate;
  affectedSide: "left" | "right";
  diagnosis: DiagnosisSnapshot;
  familyHistory: FamilyHistoryEntry[];
  careTeam: ClinicianId[];
}

export interface Stage {
  id: StageId;
  order: number;
  title: string;
  /** Two or three sentences on what this stage is and what usually happens in it. General, never predictive. */
  description: string;
}

export interface Appointment {
  id: AppointmentId;
  title: string;
  visitType: VisitType;
  clinicianId?: ClinicianId;
  stageId: StageId;
  status: "scheduled" | "unscheduled" | "completed";
  /** Null when not yet scheduled. */
  date: ISODate | null;
  location?: string;
  /** One short line, e.g. "The imaging office will call to schedule." */
  note?: string;
  completedVisitId?: VisitId;
}

export interface TranscriptSegment {
  id: string;
  speaker: "patient" | "clinician" | "unknown";
  text: string;
  startMs: number;
  endMs: number;
  isFinal: boolean;
}

export interface Transcript {
  segments: TranscriptSegment[];
  durationMs: number;
}

export interface Todo {
  id: TodoId;
  text: string;
  /** Optional extra line shown when expanded, e.g. a phone number. */
  detail?: string;
  /** Plain-language timing without calendar dates, e.g. "Before your surgical consult". */
  dueHint?: string;
  dueDate?: ISODate;
  sourceVisitId: VisitId | null;
  stageId: StageId;
  createdAt: ISODate;
  done: boolean;
  doneAt?: ISODate;
  /** Set when a later visit covered this to-do. */
  resolvedByVisitId?: VisitId;
}

export interface StageUpdate {
  toStageId: StageId;
  note?: string;
}

/** Structured notes produced from a visit transcript. */
export interface VisitNotes {
  /** e.g. "Surgical consult with Dr. Ellery". */
  title: string;
  todos: Todo[];
  /** A few short plain-language paragraphs. */
  summary: string[];
  terms: Term[];
  questionsForNextTime: string[];
  stageUpdate?: StageUpdate;
  /** Existing to-dos this visit covered. */
  resolvedTodoIds?: TodoId[];
  /** Honest note when notes are limited (e.g. visit type unsupported in this preview). */
  limitationNote?: string;
}

export interface Visit {
  id: VisitId;
  visitType: VisitType;
  clinicianId?: ClinicianId;
  /** Free-text clinician name when the clinician isn't in the care team. */
  clinicianName?: string;
  date: ISODate;
  durationMs: number;
  stageId: StageId;
  appointmentId?: AppointmentId;
  transcript: Transcript | null;
  notes: VisitNotes;
  relatedRecordIds: RecordId[];
  origin: "fixture" | "captured";
}

export interface KeyFinding {
  label: string;
  value: string;
  /** Optional plain-language gloss shown under the value. */
  plain?: string;
  term?: Term;
}

export interface RecordExplanation {
  /** False when the document couldn't be interpreted in this preview. */
  recognized: boolean;
  suggestedType: RecordType;
  suggestedTitle: string;
  documentDate?: ISODate;
  source?: string;
  /** Plain-language explanation, a few short paragraphs. Empty when not recognized. */
  summary: string[];
  keyFindings: KeyFinding[];
  questionsToAsk?: string[];
  /** Honest note shown when not recognized or partially recognized. */
  note?: string;
}

export type RecordOriginal =
  | { kind: "text"; text: string }
  | { kind: "image"; fileName: string; dataUrl: string }
  | { kind: "pdf"; fileName: string; sizeBytes: number };

export interface MedicalRecord {
  id: RecordId;
  type: RecordType;
  title: string;
  date: ISODate;
  /** Facility or clinician that produced the document. */
  source: string;
  stageId: StageId;
  relatedVisitId?: VisitId;
  original: RecordOriginal;
  explanation: RecordExplanation;
  origin: "fixture" | "upload";
  addedAt: ISODate;
}

export interface RecordUpload {
  kind: "photo" | "pdf" | "text";
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  /** Pasted text, when kind is "text". */
  text?: string;
  /** Downscaled image data URL, when kind is "photo". */
  dataUrl?: string;
  /** The file itself, for interpreters that read it. Kept in memory only; never saved. */
  file?: Blob;
}

export type SourceRef =
  | { kind: "visit"; id: VisitId; label: string }
  | { kind: "record"; id: RecordId; label: string }
  | { kind: "appointment"; id: AppointmentId; label: string };

export interface ChatMessage {
  id: string;
  role: "patient" | "guide";
  text: string;
  sources?: SourceRef[];
  /** For guide messages: what kind of answer this is. */
  kind?: "answer" | "redirect" | "fallback";
  /** Suggested follow-ups (fallback answers list what the preview can help with). */
  suggestions?: string[];
  createdAt: ISODate;
}

/** Everything the services may know about the patient right now. */
export interface PatientContext {
  today: ISODate;
  patient: Patient;
  clinicians: Clinician[];
  stages: Stage[];
  currentStageId: StageId;
  visits: Visit[];
  records: MedicalRecord[];
  todos: Todo[];
  appointments: Appointment[];
}

/** The starting state of the demo, before any of the patient's own changes. */
export interface PatientSeed {
  patient: Patient;
  clinicians: Clinician[];
  stages: Stage[];
  currentStageId: StageId;
  visits: Visit[];
  records: MedicalRecord[];
  todos: Todo[];
  appointments: Appointment[];
  glossary: Term[];
}

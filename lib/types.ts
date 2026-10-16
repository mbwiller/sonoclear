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
  /** Set when an arrangement made through Arrange fulfilled this to-do. */
  arrangedById?: string;
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

/**
 * A quiet figure in a record's "At a glance" section: one idea each, drawn with hairlines
 * and a single sage accent, with a one-line caption in plain words. Never a chart.
 */
export type RecordVisual =
  /** Where in the breast: a clock-face position and distance from the nipple, with an optional size. */
  | { kind: "locator"; side: "left" | "right"; clock: number; distanceCm: number; sizeCm?: number; caption: string }
  /** A number line with the patient's value marked, e.g. BI-RADS 0–6, grade 1–3, Nottingham 3–9. */
  | {
      kind: "scale";
      title: string;
      min: number;
      max: number;
      value: number;
      valueLabel: string;
      marks: { value: number; label: string }[];
      caption: string;
    }
  /** A size drawn to scale against a ruler, with an everyday comparison in words. */
  | { kind: "measure"; title: string; cm: number; compare: string; caption: string }
  /** Receptor and marker results as tiles: present (filled dot), absent (hollow), or a number. */
  | {
      kind: "markers";
      title: string;
      caption?: string;
      items: { label: string; present: boolean | null; value: string; percent?: number; plain: string; term?: Term }[];
    }
  /** Lab values on their reference ranges. */
  | {
      kind: "ranges";
      title: string;
      caption?: string;
      rows: { label: string; value: number; unit: string; low: number; high: number; plain?: string }[];
    }
  /** Numbered steps, e.g. what happened during a biopsy and what happens next. */
  | { kind: "sequence"; title: string; caption?: string; steps: { label: string; detail?: string }[] }
  /** Images from the study, each with an optional mark (fractions of the image) and a caption. */
  | {
      kind: "images";
      title: string;
      note: string;
      images: {
        src: string;
        alt: string;
        caption: string;
        /** Natural pixel size, so the box is reserved before the image loads and marks stay aligned. */
        width: number;
        height: number;
        mark?: { x: number; y: number; r: number; label: string };
      }[];
    };

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
  /** Quiet figures shown under the record header, in this order. */
  visuals?: RecordVisual[];
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
  /** What Sonoclear has arranged for her so far. */
  arrangements: Arrangement[];
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

/* ---------- Arrange ---------- */
export type ArrangeTaskId = string;
export type ArrangeKind = "book" | "request" | "find";

export interface ArrangeTask {
  id: ArrangeTaskId;                 // stable: "arrange-mri", "arrange-genetics", "arrange-bloodwork", "arrange-follow-up", "arrange-imaging-discs"
  kind: ArrangeKind;
  title: string;                     // "Schedule your breast MRI"
  detail: string;                    // one line: what and why, from the visit
  office: { label: string; phone: string };
  sourceVisitId?: VisitId;
  todoId?: TodoId;                   // the to-do this fulfils or updates
  appointmentId?: AppointmentId;     // existing unscheduled appointment this will schedule
  /** Set when another task must be arranged first, e.g. the follow-up waits for the MRI. */
  waitsFor?: { taskId: ArrangeTaskId; reason: string };
}

export interface ArrangeOption {
  id: string;
  title: string;                     // "Thursday, October 29 at 8:15 AM"
  date: ISODate;
  location: string;
  detail?: string;                   // "Earliest opening · about 45 minutes"
}

export interface CallLine { speaker: "sonoclear" | "office"; text: string }

export type AgentEvent =
  | { type: "step"; id: string; text: string }                         // a step starts (shows live bars)
  | { type: "step-done"; id: string; result?: string }                 // it finished; optional one-line result
  | { type: "call"; office: string; phone: string; lines: CallLine[] } // simulated call, shown collapsed
  | { type: "options"; prompt: string; options: ArrangeOption[]; note?: string } // plan() ends here
  | { type: "outcome"; outcome: ArrangeOutcome }                       // confirm() (or a no-choice plan()) ends here
  | { type: "limit"; text: string };                                   // honest limitation

export interface ArrangeOutcome {
  summary: string[];                 // 1–3 short paragraphs, voice per VISION
  appointment?: Appointment;         // new, or the same id as an existing unscheduled one (then it replaces it)
  resolvedTodoIds?: TodoId[];        // to-dos this fulfils ("Schedule your MRI" is done once scheduled)
  /** To-dos that stay open but now have a plan. Keep dates out of `detail`; put them in `dueDate` so they shift with the story. */
  todoUpdate?: { id: TodoId; detail: string; dueHint?: string; dueDate?: ISODate };
  prep?: string[];                   // what to bring or know
  reference?: string;                // "LH-MRI-20931"
}

export interface Arrangement {
  id: string;
  taskId: ArrangeTaskId;
  /** The task's title at the time, so the Arranged list can name it even after the task is gone. */
  taskTitle: string;
  optionId?: string;
  outcome: ArrangeOutcome;
  /**
   * What was shown, replayable on the Arranged detail view. A historical record: its prose is
   * never rewritten when the story's dates shift, only its `options[].date` values are.
   */
  log: AgentEvent[];
  arrangedAt: ISODate;
}

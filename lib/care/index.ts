"use client";

/**
 * The patient's care, as screens see it: the starting account from the data service,
 * merged with her own changes from the store. Screens read from here and never from fixtures.
 */
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { services } from "@/services";
import { getDemoToday } from "@/lib/dates";
import { useDemoStore, type DemoState } from "@/lib/store";
import type {
  Appointment,
  Arrangement,
  ArrangeTaskId,
  Clinician,
  MedicalRecord,
  PatientContext,
  PatientSeed,
  RecordId,
  Stage,
  StageId,
  StageStatus,
  Term,
  Todo,
  Visit,
  VisitId,
} from "@/lib/types";

let seedCache: PatientSeed | null = null;

/** The starting account, built once per page load. */
export function getSeed(): PatientSeed {
  if (!seedCache) seedCache = services.patientData.loadSeed(getDemoToday());
  return seedCache;
}

export interface StageView extends Stage {
  status: StageStatus;
  visits: Visit[];
  records: MedicalRecord[];
  todos: Todo[];
  /** Appointments in this stage that haven't happened yet. */
  appointments: Appointment[];
}

export interface CareView extends PatientContext {
  glossary: Term[];
  stageViews: StageView[];
  currentStage: StageView;
  openTodos: Todo[];
  doneTodos: Todo[];
  /** The next scheduled appointment that hasn't happened yet. */
  nextAppointment: Appointment | null;
  /** Appointments still ahead: scheduled ones by date, then unscheduled ones. */
  upcomingAppointments: Appointment[];
  visitById: Map<VisitId, Visit>;
  recordById: Map<RecordId, MedicalRecord>;
  clinicianById: Map<string, Clinician>;
  /** What Sonoclear has arranged, oldest first. */
  arrangements: Arrangement[];
  /** The latest arrangement for each task. */
  arrangementByTaskId: Map<ArrangeTaskId, Arrangement>;
}

type Deltas = Pick<DemoState, "todoOverrides" | "capturedVisits" | "uploadedRecords" | "arrangements">;

const byDate = <T extends { date: string }>(a: T, b: T) => a.date.localeCompare(b.date);

/** Pure merge of seed + the patient's changes. */
export function deriveCare(seed: PatientSeed, deltas: Deltas): CareView {
  const today = getDemoToday();
  const visits = [...seed.visits, ...deltas.capturedVisits].sort(byDate);
  const records = [...seed.records, ...deltas.uploadedRecords].sort(byDate);

  const allTodos = [...seed.todos, ...deltas.capturedVisits.flatMap((v) => v.notes.todos)];
  const todoUpdates = new Map(deltas.arrangements.flatMap((a) => (a.outcome.todoUpdate ? [[a.outcome.todoUpdate.id, a.outcome.todoUpdate] as const] : [])));
  const todos: Todo[] = allTodos.map((base) => {
    const u = todoUpdates.get(base.id);
    const t = u ? { ...base, detail: u.detail, dueHint: u.dueHint ?? base.dueHint, dueDate: u.dueDate ?? base.dueDate } : base;
    const o = deltas.todoOverrides[t.id];
    if (!o) return t;
    return {
      ...t,
      done: o.done,
      doneAt: o.done ? o.at : undefined,
      resolvedByVisitId: o.done ? o.resolvedByVisitId : undefined,
      arrangedById: o.done ? o.arrangedById : undefined,
    };
  });

  // What Sonoclear booked replaces the unscheduled appointment it was for, or is added.
  const booked: Appointment[] = [...seed.appointments];
  for (const { outcome } of deltas.arrangements) {
    const arranged = outcome.appointment;
    if (!arranged) continue;
    const i = booked.findIndex((a) => a.id === arranged.id);
    if (i >= 0) booked[i] = { ...booked[i], ...arranged, status: "scheduled" };
    else booked.push({ ...arranged, status: "scheduled" });
  }
  // Then a recorded visit completes the appointment it was linked to, whoever scheduled it.
  const completedBy = new Map<string, Visit>();
  for (const v of deltas.capturedVisits) if (v.appointmentId) completedBy.set(v.appointmentId, v);
  const appointments: Appointment[] = booked.map((a) => {
    const v = completedBy.get(a.id);
    return v ? { ...a, status: "completed", completedVisitId: v.id } : a;
  });

  const order = new Map(seed.stages.map((s) => [s.id, s.order]));
  let currentStageId: StageId = seed.currentStageId;
  for (const v of deltas.capturedVisits) {
    const to = v.notes.stageUpdate?.toStageId;
    if (to && (order.get(to) ?? 0) > (order.get(currentStageId) ?? 0)) currentStageId = to;
  }
  const currentOrder = order.get(currentStageId) ?? 0;

  const pending = appointments.filter((a) => a.status !== "completed");
  const upcomingAppointments = [
    ...pending.filter((a) => a.date).sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")),
    ...pending.filter((a) => !a.date),
  ];
  const nextAppointment =
    upcomingAppointments.find((a) => a.status === "scheduled" && a.date && new Date(a.date) >= today) ?? null;

  const stageViews: StageView[] = seed.stages.map((stage) => ({
    ...stage,
    status: stage.order < currentOrder ? "done" : stage.order === currentOrder ? "current" : "ahead",
    visits: visits.filter((v) => v.stageId === stage.id),
    records: records.filter((r) => r.stageId === stage.id),
    todos: todos.filter((t) => t.stageId === stage.id),
    appointments: upcomingAppointments.filter((a) => a.stageId === stage.id),
  }));

  // Newest visit's to-dos first, so what she needs to do after a visit leads.
  const indexed = todos.map((t, i) => ({ t, i }));
  const openTodos = indexed
    .filter(({ t }) => !t.done)
    .sort((a, b) => b.t.createdAt.localeCompare(a.t.createdAt) || a.i - b.i)
    .map(({ t }) => t);
  const doneTodos = todos.filter((t) => t.done).sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""));

  return {
    today: today.toISOString(),
    patient: seed.patient,
    clinicians: seed.clinicians,
    stages: seed.stages,
    currentStageId,
    visits,
    records,
    todos,
    appointments,
    glossary: seed.glossary,
    stageViews,
    currentStage: stageViews.find((s) => s.id === currentStageId) ?? stageViews[0],
    openTodos,
    doneTodos,
    nextAppointment,
    upcomingAppointments,
    visitById: new Map(visits.map((v) => [v.id, v])),
    recordById: new Map(records.map((r) => [r.id, r])),
    clinicianById: new Map(seed.clinicians.map((c) => [c.id, c])),
    arrangements: deltas.arrangements,
    arrangementByTaskId: new Map(deltas.arrangements.map((a) => [a.taskId, a])),
  };
}

const selectDeltas = (s: DemoState): Deltas => ({
  todoOverrides: s.todoOverrides,
  capturedVisits: s.capturedVisits,
  uploadedRecords: s.uploadedRecords,
  arrangements: s.arrangements,
});

/** One shared view per set of changes, so many components reading it compute it once. */
let cached: { deltas: Deltas; view: CareView } | null = null;

function careFor(deltas: Deltas): CareView {
  const hit =
    cached &&
    cached.deltas.todoOverrides === deltas.todoOverrides &&
    cached.deltas.capturedVisits === deltas.capturedVisits &&
    cached.deltas.uploadedRecords === deltas.uploadedRecords &&
    cached.deltas.arrangements === deltas.arrangements;
  if (!hit) cached = { deltas, view: deriveCare(getSeed(), deltas) };
  return cached!.view;
}

/** Everything about the patient's care, kept current with her changes. */
export function useCare(): CareView {
  const deltas = useDemoStore(useShallow(selectDeltas));
  return useMemo(() => careFor(deltas), [deltas]);
}

export function useVisit(id: VisitId | undefined): Visit | undefined {
  const care = useCare();
  return id ? care.visitById.get(id) : undefined;
}

export function useRecord(id: RecordId | undefined): MedicalRecord | undefined {
  const care = useCare();
  return id ? care.recordById.get(id) : undefined;
}

/**
 * For event handlers that call services: the patient context right now, as plain data
 * (no lookup maps or view helpers), ready to hand to any implementation.
 */
export function getPatientContext(): PatientContext {
  const v = careFor(selectDeltas(useDemoStore.getState()));
  return {
    today: v.today,
    patient: v.patient,
    clinicians: v.clinicians,
    stages: v.stages,
    currentStageId: v.currentStageId,
    visits: v.visits,
    records: v.records,
    todos: v.todos,
    appointments: v.appointments,
    arrangements: v.arrangements,
  };
}

/** Store actions, stable across renders. */
export function useCareActions() {
  return useDemoStore(
    useShallow((s) => ({
      setTodoDone: s.setTodoDone,
      addCapturedVisit: s.addCapturedVisit,
      addUploadedRecord: s.addUploadedRecord,
      addArrangement: s.addArrangement,
      setReplaySpeed: s.setReplaySpeed,
      resetDemo: s.resetDemo,
    })),
  );
}

export function useReplaySpeed() {
  return useDemoStore((s) => s.replaySpeed);
}

/** Increments on every Reset demo; key local state on it to start fresh. */
export function useResetCount() {
  return useDemoStore((s) => s.resetCount);
}

/** True when the browser refused to save the latest change. */
export function useStorageError() {
  return useDemoStore((s) => s.storageError);
}

/** The patient's name and initials, from the starting account (never from saved changes). */
export function getPatientName(): { full: string; first: string; initials: string } {
  const { firstName, lastName } = getSeed().patient;
  return { full: `${firstName} ${lastName}`, first: firstName, initials: `${firstName[0] ?? ""}${lastName[0] ?? ""}` };
}

/** "Dr. Ellery", or the free-text name, or null. */
export function clinicianShortName(visit: Pick<Visit, "clinicianId" | "clinicianName">, care: CareView): string | null {
  if (visit.clinicianId) return care.clinicianById.get(visit.clinicianId)?.shortName ?? null;
  return visit.clinicianName?.trim() || null;
}

/** A new id for things the patient creates. */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

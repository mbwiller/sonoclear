/**
 * The patient's own changes, persisted to localStorage.
 *
 * Only deltas live here. The starting account is rebuilt from the data service on
 * every load (so fixture dates stay relative to today) and merged in `lib/care`.
 */
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { getDemoToday, nowISO } from "./dates";
import { cleanArrangement, isArrangement, isRecord, isTodoOverride, isVisit, shiftArrangement, withTaskTitle, shiftISO, shiftRecord, shiftVisit } from "./persisted";
import type { Arrangement, ISODate, MedicalRecord, TodoId, Visit, VisitId } from "./types";

export type ReplaySpeed = "realtime" | "demo" | "fast";

const REPLAY_SPEEDS: readonly ReplaySpeed[] = ["realtime", "demo", "fast"];

/** Fixture milliseconds per real millisecond for each replay speed. */
export const REPLAY_FACTOR: Record<ReplaySpeed, number> = { realtime: 1, demo: 24, fast: 72 };

export interface TodoOverride {
  done: boolean;
  at: ISODate;
  resolvedByVisitId?: VisitId;
  arrangedById?: string;
}

interface DemoData {
  todoOverrides: Record<TodoId, TodoOverride>;
  capturedVisits: Visit[];
  uploadedRecords: MedicalRecord[];
  arrangements: Arrangement[];
  replaySpeed: ReplaySpeed;
  /**
   * The demo day these changes were saved against. On load, the patient's own items
   * move by the days since, so a visit recorded "today" stays in step with the story.
   */
  anchorDay: ISODate | null;
}

interface SessionData {
  /** Increments on every reset, so screens holding local state can start fresh. */
  resetCount: number;
  /** True when the browser refused to save (storage full or blocked). */
  storageError: boolean;
}

interface DemoActions {
  setTodoDone(id: TodoId, done: boolean): void;
  /** Saves a captured visit and applies what it covered (resolved to-dos). */
  addCapturedVisit(visit: Visit): void;
  addUploadedRecord(record: MedicalRecord): void;
  /** Saves an arrangement and applies what it fulfilled (resolved to-dos). */
  addArrangement(arrangement: Arrangement): void;
  setReplaySpeed(speed: ReplaySpeed): void;
  resetDemo(): void;
}

export type DemoState = DemoData & SessionData & DemoActions;

const INITIAL: DemoData = {
  todoOverrides: {},
  capturedVisits: [],
  uploadedRecords: [],
  arrangements: [],
  replaySpeed: "demo",
  anchorDay: null,
};

export const STORAGE_KEY = "sonoclear-demo";

let onWrite: (ok: boolean) => void = () => {};

/** localStorage that never throws (private mode, quota, server render). */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return typeof window === "undefined" ? null : window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(name, value);
      onWrite(true);
    } catch {
      // Storage full or unavailable: keep working in memory and say so.
      onWrite(false);
    }
  },
  removeItem: (name) => {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(name);
    } catch {
      // Ignore.
    }
  },
};

/** Whole days between two demo days. */
function daysBetween(fromIso: ISODate, to: Date): number {
  const from = new Date(fromIso);
  from.setHours(0, 0, 0, 0);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/** Validates saved data, drops what doesn't fit, and brings the patient's items up to today. */
export function restore(saved: unknown): DemoData {
  const s = (typeof saved === "object" && saved !== null ? saved : {}) as Partial<Record<keyof DemoData, unknown>>;
  const today = getDemoToday();
  const anchor = typeof s.anchorDay === "string" && !Number.isNaN(Date.parse(s.anchorDay)) ? s.anchorDay : null;
  const days = anchor ? daysBetween(anchor, today) : 0;

  const overrides: Record<TodoId, TodoOverride> = {};
  if (typeof s.todoOverrides === "object" && s.todoOverrides !== null) {
    for (const [id, o] of Object.entries(s.todoOverrides)) {
      if (isTodoOverride(o)) overrides[id] = { ...(o as TodoOverride), at: shiftISO(o.at, days) };
    }
  }

  return {
    todoOverrides: overrides,
    capturedVisits: (Array.isArray(s.capturedVisits) ? s.capturedVisits.filter(isVisit) : []).map((v) => shiftVisit(v, days)),
    uploadedRecords: (Array.isArray(s.uploadedRecords) ? s.uploadedRecords.filter(isRecord) : []).map((r) => shiftRecord(r, days)),
    arrangements: (Array.isArray(s.arrangements) ? s.arrangements.map(withTaskTitle).filter(isArrangement) : []).map((a) =>
      shiftArrangement(cleanArrangement(a), days),
    ),
    replaySpeed: REPLAY_SPEEDS.includes(s.replaySpeed as ReplaySpeed) ? (s.replaySpeed as ReplaySpeed) : "demo",
    anchorDay: today.toISOString(),
  };
}

const today = () => getDemoToday().toISOString();

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      ...INITIAL,
      resetCount: 0,
      storageError: false,
      setTodoDone: (id, done) =>
        set((s) => ({ todoOverrides: { ...s.todoOverrides, [id]: { done, at: nowISO() } }, anchorDay: today() })),
      addCapturedVisit: (visit) =>
        set((s) => {
          const at = nowISO();
          const resolved = Object.fromEntries(
            (visit.notes.resolvedTodoIds ?? []).map((id) => [id, { done: true, at, resolvedByVisitId: visit.id }]),
          );
          return {
            capturedVisits: [...s.capturedVisits.filter((v) => v.id !== visit.id), visit],
            todoOverrides: { ...s.todoOverrides, ...resolved },
            anchorDay: today(),
          };
        }),
      addUploadedRecord: (record) =>
        set((s) => ({
          uploadedRecords: [...s.uploadedRecords.filter((r) => r.id !== record.id), record],
          anchorDay: today(),
        })),
      addArrangement: (arrangement) =>
        set((s) => {
          const at = nowISO();
          const resolved = Object.fromEntries(
            (arrangement.outcome.resolvedTodoIds ?? []).map((id) => [id, { done: true, at, arrangedById: arrangement.id }]),
          );
          return {
            arrangements: [...s.arrangements.filter((a) => a.id !== arrangement.id), arrangement],
            todoOverrides: { ...s.todoOverrides, ...resolved },
            anchorDay: today(),
          };
        }),
      setReplaySpeed: (replaySpeed) => set({ replaySpeed }),
      resetDemo: () => set((s) => ({ ...INITIAL, replaySpeed: s.replaySpeed, resetCount: s.resetCount + 1 })),
    }),
    {
      name: STORAGE_KEY,
      // v2: validated restore and anchorDay. v3: arrangements. Older data restores as-is.
      version: 3,
      storage: createJSONStorage(() => safeStorage),
      migrate: (persisted) => restore(persisted),
      merge: (persisted, current) => ({ ...current, ...restore(persisted) }),
      partialize: ({ todoOverrides, capturedVisits, uploadedRecords, arrangements, replaySpeed, anchorDay }) => ({
        todoOverrides,
        capturedVisits,
        uploadedRecords,
        arrangements,
        replaySpeed,
        anchorDay,
      }),
    },
  ),
);

onWrite = (ok) => {
  if (useDemoStore.getState().storageError === ok) useDemoStore.setState({ storageError: !ok });
};

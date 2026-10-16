"use client";

/**
 * The recording, kept at module level so it outlives the Capture screen. Hidden routes can be
 * dropped from memory; when she comes back, the paused recording is still here.
 * In memory only: gone on refresh, and cleared by Reset demo.
 */
import { create } from "zustand";
import { getPatientContext, newId, type CareView } from "@/lib/care";
import type { ISODate, Transcript, TranscriptSegment, Visit } from "@/lib/types";
import { services, type TranscriptionSession, type VisitMeta } from "@/services";
import {
  displayName,
  mergeSegment,
  normalizeNotes,
  resolveVisit,
  transcriptSoFar,
  type CaptureSetup,
} from "./capture-state";

export type CapturePhase = "before" | "recording" | "processing" | "failed" | "landed";

interface CaptureData {
  phase: CapturePhase;
  /** Bumped on every reset so the Before form starts fresh from the latest care data. */
  generation: number;
  session: TranscriptionSession | null;
  setup: CaptureSetup | null;
  startedAt: ISODate | null;
  status: "recording" | "paused";
  /** The engine reported a problem; what was captured so far is kept. */
  interrupted: boolean;
  segments: TranscriptSegment[];
  /** `performance.now()` when the last non-final segment arrived while recording; drives the bars. */
  lastInterimAt: number | null;
  /** Real recorded time before the current run, in ms. */
  accumulatedMs: number;
  /** `performance.now()` when the current run began; null while paused. */
  resumedAt: number | null;
  transcript: Transcript | null;
  meta: VisitMeta | null;
  /** The last Reset demo count this recording has seen. */
  resetCountSeen: number | null;
}

/** What finishing a visit needs from the screen. */
export interface FinishContext {
  care: CareView;
  save: (visit: Visit) => void;
}

interface CaptureActions {
  start(setup: CaptureSetup): void;
  pause(): void;
  resume(): void;
  end(ctx: FinishContext): Promise<void>;
  retry(save: FinishContext["save"]): Promise<void>;
  /** Back to Before, keeping the form as it was. */
  discard(): void;
  /** Back to Before, with a fresh form. */
  reset(): void;
  /** Reset demo clears any recording; call with the current count. */
  syncResetCount(count: number): void;
}

const INITIAL: Omit<CaptureData, "generation" | "resetCountSeen"> = {
  phase: "before",
  session: null,
  setup: null,
  startedAt: null,
  status: "recording",
  interrupted: false,
  segments: [],
  lastInterimAt: null,
  accumulatedMs: 0,
  resumedAt: null,
  transcript: null,
  meta: null,
};

/** Increments whenever a recording starts or is thrown away; stale async work checks it. */
let run = 0;

/** Set while the Capture screen is on screen; finishing a visit navigates through it. */
let onLanded: ((visitId: string) => void) | null = null;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

function frozen(s: CaptureData, at = performance.now()): Pick<CaptureData, "accumulatedMs" | "resumedAt"> {
  const current = s.resumedAt === null ? 0 : Math.max(0, at - s.resumedAt);
  return { accumulatedMs: s.accumulatedMs + current, resumedAt: null };
}

function discardSession(session: TranscriptionSession | null) {
  // The transcript isn't wanted; a failure to stop doesn't matter either.
  session?.stop().catch(() => undefined);
}

export const useCaptureStore = create<CaptureData & CaptureActions>()((set, get) => {
  const summarize = async (transcript: Transcript, meta: VisitMeta, save: FinishContext["save"]) => {
    const mine = run;
    set({ phase: "processing", transcript, meta });
    try {
      const raw = await services.summarizer.summarize({ transcript, visit: meta, patient: getPatientContext() });
      if (run !== mine) return;
      const notes = normalizeNotes(raw, meta.id, meta.startedAt);
      const visit: Visit = {
        id: meta.id,
        visitType: meta.visitType,
        clinicianId: meta.clinicianId,
        clinicianName: meta.clinicianId ? undefined : meta.clinicianName,
        date: meta.startedAt,
        durationMs: transcript.durationMs,
        stageId: notes.stageUpdate?.toStageId ?? getPatientContext().currentStageId,
        appointmentId: meta.appointmentId,
        transcript,
        notes,
        relatedRecordIds: [],
        origin: "captured",
      };
      save(visit);
      if (onLanded) {
        set({ phase: "landed" });
        onLanded(visit.id);
      } else {
        // She left while the notes were being made. They're saved; Capture is ready again.
        get().reset();
      }
    } catch {
      if (run === mine) set({ phase: "failed" });
    }
  };

  return {
    ...INITIAL,
    generation: 0,
    resetCountSeen: null,

    start(setup) {
      discardSession(get().session);
      const mine = ++run;
      const session = services.transcription.start({ visitType: setup.visitType });
      const current = () => run === mine && get().session === session;
      session.onSegment((segment) => {
        if (!current()) return;
        set((s) => ({
          segments: mergeSegment(s.segments, segment),
          lastInterimAt: !segment.isFinal && s.status === "recording" ? performance.now() : s.lastInterimAt,
        }));
      });
      session.onError?.(() => {
        if (!current()) return;
        session.pause();
        set((s) => ({ interrupted: true, status: "paused", ...frozen(s) }));
      });
      set({
        ...INITIAL,
        phase: "recording",
        session,
        setup,
        startedAt: new Date().toISOString(),
        resumedAt: performance.now(),
      });
    },

    pause() {
      const s = get();
      if (s.phase !== "recording" || s.status === "paused") return;
      s.session?.pause();
      set({ status: "paused", ...frozen(s) });
    },

    resume() {
      const s = get();
      if (s.phase !== "recording" || s.status === "recording" || s.interrupted) return;
      s.session?.resume();
      set({ status: "recording", resumedAt: performance.now() });
    },

    async end({ care, save }) {
      const s = get();
      const { session, setup, startedAt } = s;
      if (s.phase !== "recording" || !session || !setup || !startedAt) return;
      const mine = run;
      // Let go of the session first, so nothing can pause it while it stops.
      set({ session: null, phase: "processing", status: "paused", ...frozen(s) });

      const resolved = resolveVisit(setup, care);
      const metaFor = (transcript: Transcript): VisitMeta => ({
        id: newId("visit"),
        visitType: setup.visitType,
        clinicianId: resolved.clinician?.id,
        clinicianName: displayName(resolved),
        appointmentId: resolved.appointmentId,
        startedAt,
        durationMs: transcript.durationMs,
      });

      let transcript: Transcript;
      try {
        transcript = await session.stop();
      } catch {
        if (run !== mine) return;
        // Keep what was captured so she can still try to get notes from it.
        const soFar = transcriptSoFar(get().segments, get().accumulatedMs);
        set({ phase: "failed", transcript: soFar, meta: metaFor(soFar) });
        return;
      }
      if (run !== mine) return;
      await summarize(transcript, metaFor(transcript), save);
    },

    async retry(save) {
      const { transcript, meta, phase } = get();
      if (phase !== "failed" || !transcript || !meta) return;
      await summarize(transcript, meta, save);
    },

    discard() {
      run++;
      discardSession(get().session);
      set({ ...INITIAL });
    },

    reset() {
      run++;
      discardSession(get().session);
      set((s) => ({ ...INITIAL, generation: s.generation + 1 }));
    },

    syncResetCount(count) {
      const seen = get().resetCountSeen;
      if (seen === count) return;
      set({ resetCountSeen: count });
      if (seen !== null) get().reset();
    },
  };
});

/**
 * The Capture screen is showing. Cancels a pending "hidden" (a development double-mount
 * looks like hide-then-show) and lets finished notes navigate to the new visit.
 */
export function captureShown(navigate: (visitId: string) => void) {
  clearTimeout(hideTimer);
  onLanded = navigate;
}

/** The Capture screen was hidden or dropped: pause a live recording; after landing, start fresh. */
export function captureHidden() {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    onLanded = null;
    const s = useCaptureStore.getState();
    if (s.phase === "recording") s.pause();
    if (s.phase === "landed") s.reset();
  }, 0);
}

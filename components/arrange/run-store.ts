"use client";

/**
 * The Arrange run, kept at module level like the recording: it survives moving between tabs
 * and is gone on refresh and after Reset demo. Nothing is booked until she chooses an option
 * and the confirmation finishes; cancelling at any point leaves everything as it was.
 */
import { create } from "zustand";
import { services } from "@/services";
import { getPatientContext, newId } from "@/lib/care";
import { nowISO } from "@/lib/dates";
import { useDemoStore } from "@/lib/store";
import type { AgentEvent, Arrangement, ArrangeOutcome, ArrangeTask } from "@/lib/types";

export type RunPhase = "idle" | "planning" | "choosing" | "confirming" | "done" | "failed";
export type OptionsEvent = Extract<AgentEvent, { type: "options" }>;

interface RunData {
  phase: RunPhase;
  task: ArrangeTask | null;
  /** Everything shown so far: the plan, then the confirmation. */
  events: AgentEvent[];
  /** Where the confirmation's events begin in `events`; null until she has chosen. */
  confirmFrom: number | null;
  options: OptionsEvent | null;
  chosenOptionId: string | null;
  outcome: ArrangeOutcome | null;
  limit: string | null;
}

interface RunActions {
  start(task: ArrangeTask): void;
  choose(optionId: string): void;
  /** Stops whatever is on its way and goes back to the list. Nothing is booked. */
  cancel(): void;
  /** The run is over and she has seen it; back to the list. */
  finish(): void;
}

const INITIAL: RunData = {
  phase: "idle",
  task: null,
  events: [],
  confirmFrom: null,
  options: null,
  chosenOptionId: null,
  outcome: null,
  limit: null,
};

const FAILED_LINE = "That didn't go through, and nothing was booked. You can try again in a moment.";

/** Only the stream started by the latest start/choose (and not since cancelled) may write. */
let generation = 0;
/** Tells the service to stop what it's doing when a run ends, is replaced, or is cancelled. */
let controller: AbortController | null = null;

function abortRun() {
  generation += 1;
  controller?.abort();
  controller = null;
}

function beginRun(): { mine: number; signal: AbortSignal } {
  abortRun();
  controller = new AbortController();
  return { mine: generation, signal: controller.signal };
}

export const useRunStore = create<RunData & RunActions>()((set, get) => {
  /** Shows a stream's events as they arrive and acts on the one that ends it. */
  const drive = async (open: () => AsyncIterable<AgentEvent>, mine: number) => {
    const current = () => mine === generation;
    const fail = (text: string) => set({ phase: "failed", limit: text });
    try {
      for await (const event of open()) {
        // Leaving the loop also tells the service's iterator to stop.
        if (!current()) return;
        set((s) => ({ events: [...s.events, event] }));
        if (event.type === "options") {
          set({ options: event, phase: "choosing" });
          return;
        }
        if (event.type === "limit") {
          fail(event.text);
          return;
        }
        if (event.type === "outcome") {
          const { task, chosenOptionId, events } = get();
          if (!task) return;
          const arrangement: Arrangement = {
            id: newId("arrangement"),
            taskId: task.id,
            taskTitle: task.title,
            optionId: chosenOptionId ?? undefined,
            outcome: event.outcome,
            log: events.filter((e) => e.type !== "outcome"),
            arrangedAt: nowISO(),
          };
          useDemoStore.getState().addArrangement(arrangement);
          set({ outcome: event.outcome, phase: "done" });
          return;
        }
      }
      // The stream ended without choices, an outcome or a reason.
      if (current()) fail(FAILED_LINE);
    } catch {
      if (current()) fail(FAILED_LINE);
    }
  };

  return {
    ...INITIAL,

    start(task) {
      const { mine, signal } = beginRun();
      set({ ...INITIAL, phase: "planning", task });
      void drive(() => services.scheduling.plan({ task, patient: getPatientContext(), signal }), mine);
    },

    choose(optionId) {
      const { phase, task, options, events } = get();
      if (phase !== "choosing" || !task || !options?.options.some((o) => o.id === optionId)) return;
      const { mine, signal } = beginRun();
      set({ phase: "confirming", chosenOptionId: optionId, confirmFrom: events.length });
      void drive(() => services.scheduling.confirm({ task, optionId, patient: getPatientContext(), signal }), mine);
    },

    cancel() {
      abortRun();
      set({ ...INITIAL });
    },

    finish() {
      abortRun();
      set({ ...INITIAL });
    },
  };
});

// Reset demo ends any run too, wherever it's started from.
if (typeof window !== "undefined") {
  useDemoStore.subscribe((s, prev) => {
    if (s.resetCount !== prev.resetCount) useRunStore.getState().cancel();
  });
}

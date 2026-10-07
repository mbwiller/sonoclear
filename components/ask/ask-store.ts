"use client";

/**
 * The Ask thread for this session. In memory only (PLAN §1): it survives moving between
 * screens, and is gone on refresh, on "Start over" and after Reset demo.
 */
import { create } from "zustand";
import { services } from "@/services";
import { getPatientContext, newId } from "@/lib/care";
import { useDemoStore } from "@/lib/store";
import type { ChatMessage, RecordId, SourceRef, VisitId } from "@/lib/types";

/**
 * waiting → streaming → done. A stream that fails, or is replaced by a newer question,
 * ends as "incomplete": what arrived is kept and clearly marked as cut short.
 */
export type NoteStatus = "waiting" | "streaming" | "done" | "incomplete";

/** One question and its answer, shown as a note. */
export interface AskNote {
  id: string;
  question: string;
  askedAt: string;
  focus?: VisitId | RecordId;
  /** e.g. "About your visit with Dr. Raman", captured when the question was asked. */
  focusLabel?: string;
  status: NoteStatus;
  kind?: NonNullable<ChatMessage["kind"]>;
  answer: string;
  sources: SourceRef[];
  suggestions: string[];
}

interface AskState {
  notes: AskNote[];
  update(id: string, patch: Partial<AskNote> | ((n: AskNote) => Partial<AskNote>)): void;
  /** Stops any answer on its way and empties the thread. */
  clear(): void;
}

/**
 * Only the stream started by the latest question (and not since cleared) may write.
 * Every new question and every clear bumps this, so older streams stop at their next chunk.
 */
let generation = 0;

const inFlight = (n: AskNote) => n.status === "waiting" || n.status === "streaming";

export const useAskStore = create<AskState>()((set) => ({
  notes: [],
  update: (id, patch) =>
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...(typeof patch === "function" ? patch(n) : patch) } : n)),
    })),
  clear: () => {
    generation += 1;
    set({ notes: [] });
  },
}));

// Reset demo clears the thread too, wherever it's started from.
if (typeof window !== "undefined") {
  useDemoStore.subscribe((s, prev) => {
    if (s.resetCount !== prev.resetCount) useAskStore.getState().clear();
  });
}

/** The conversation so far, as the chat service expects it. Cut-short answers are left out. */
export function toMessages(notes: AskNote[]): ChatMessage[] {
  return notes
    .filter((n) => n.status === "done")
    .flatMap((n): ChatMessage[] => [
      { id: `${n.id}-q`, role: "patient", text: n.question, createdAt: n.askedAt },
      { id: `${n.id}-a`, role: "guide", text: n.answer, kind: n.kind, sources: n.sources, suggestions: n.suggestions, createdAt: n.askedAt },
    ]);
}

export function isBusy(notes: AskNote[]): boolean {
  return notes.some(inFlight);
}

/** Adds sources, skipping any already listed (same kind and id). */
function mergeSources(current: SourceRef[], incoming: SourceRef[]): SourceRef[] {
  const seen = new Set(current.map((s) => `${s.kind}:${s.id}`));
  const merged = [...current];
  for (const s of incoming) {
    const key = `${s.kind}:${s.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(s);
    }
  }
  return merged;
}

/**
 * Asks the chat service and streams the answer into a new note. A question asked while
 * another answer is still on its way replaces that stream; the older note is marked incomplete.
 * Returns the new note's id, or null for an empty question.
 */
export function askQuestion(question: string, focus?: { id: VisitId | RecordId; label: string }): string | null {
  const text = question.trim();
  if (!text) return null;

  generation += 1;
  const gen = generation;
  const id = newId("ask");
  const askedAt = new Date().toISOString();
  const { notes } = useAskStore.getState();
  const messages: ChatMessage[] = [...toMessages(notes), { id: `${id}-q`, role: "patient", text, createdAt: askedAt }];

  useAskStore.setState({
    notes: [
      ...notes.map((n): AskNote => (inFlight(n) ? { ...n, status: "incomplete" } : n)),
      {
        id,
        question: text,
        askedAt,
        focus: focus?.id,
        focusLabel: focus?.label,
        status: "waiting",
        answer: "",
        sources: [],
        suggestions: [],
      },
    ],
  });

  void stream(id, gen, messages, focus?.id);
  return id;
}

async function stream(id: string, gen: number, messages: ChatMessage[], focus?: VisitId | RecordId) {
  const { update } = useAskStore.getState();
  const current = () => gen === generation;
  try {
    for await (const chunk of services.chat.ask({ messages, patient: getPatientContext(), focus })) {
      // Leaving the loop also tells the service's iterator to stop.
      if (!current()) return;
      if (chunk.type === "meta") update(id, { kind: chunk.kind, suggestions: chunk.suggestions ?? [] });
      else if (chunk.type === "text") update(id, (n) => ({ status: "streaming", answer: n.answer + chunk.text }));
      else update(id, (n) => ({ sources: mergeSources(n.sources, chunk.sources) }));
    }
    if (current()) update(id, (n) => ({ status: "done", answer: n.answer.trim() }));
  } catch {
    // Keep what arrived, and never let a cut-off answer look complete.
    if (current()) update(id, (n) => ({ status: "incomplete", answer: n.answer.trim() }));
  }
}

import type { PatientContext, RecordId, VisitId } from "@/lib/types";
import { FALLBACK_TEXT, REDIRECT, SCRIPTED_QUESTIONS, type ScriptedQuestionId } from "@/fixtures/chat";
import type { ChatChunk, ChatProvider } from "../types";
import { delay } from "./delay";

/** Which question to offer first when Ask opens focused on a visit or record. */
const FOCUS_ORDER: Record<string, ScriptedQuestionId> = {
  "visit-results": "er-her2",
  "record-pathology": "er-her2",
  "visit-diagnostic-imaging": "bi-rads-5",
  "record-diagnostic-imaging": "bi-rads-5",
  "record-screening-mammogram": "bi-rads-5",
};

function* chunksOf(text: string): Generator<string> {
  // Small word groups, keeping whitespace, so the answer streams like a real model's.
  const parts = text.match(/\S+\s*/g) ?? [];
  for (let i = 0; i < parts.length; i += 3) yield parts.slice(i, i + 3).join("");
}

/**
 * Answers exactly three questions, redirects advice-seeking questions to the care team,
 * and falls back honestly for everything else.
 */
export class ScriptedChatProvider implements ChatProvider {
  async *ask({
    messages,
    patient,
  }: {
    messages: { role: string; text: string }[];
    patient: PatientContext;
    focus?: VisitId | RecordId;
  }): AsyncIterable<ChatChunk> {
    const question = [...messages].reverse().find((m) => m.role === "patient")?.text ?? "";
    await delay(650);

    const scripted = SCRIPTED_QUESTIONS.find((q) => q.matches(question, patient));
    if (scripted) {
      const { text, sources } = scripted.answer(patient);
      yield { type: "meta", kind: "answer" };
      yield* this.stream(text);
      yield { type: "sources", sources };
      return;
    }

    if (REDIRECT.matches(question)) {
      const { text, sources } = REDIRECT.answer(patient, question);
      yield { type: "meta", kind: "redirect" };
      yield* this.stream(text);
      yield { type: "sources", sources };
      return;
    }

    yield { type: "meta", kind: "fallback", suggestions: this.suggestedQuestions(patient) };
    yield* this.stream(FALLBACK_TEXT);
  }

  suggestedQuestions(patient: PatientContext, focus?: VisitId | RecordId): string[] {
    const first = focus ? FOCUS_ORDER[focus] ?? (patient.visits.find((v) => v.id === focus)?.appointmentId ? "next-steps" : undefined) : undefined;
    const ordered = first
      ? [...SCRIPTED_QUESTIONS].sort((a, b) => Number(b.id === first) - Number(a.id === first))
      : SCRIPTED_QUESTIONS;
    return ordered.map((q) => q.prompt(patient));
  }

  private async *stream(text: string): AsyncIterable<ChatChunk> {
    for (const piece of chunksOf(text)) {
      await delay(28);
      yield { type: "text", text: piece };
    }
  }
}

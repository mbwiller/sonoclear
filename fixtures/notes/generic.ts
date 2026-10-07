// CLINICAL REVIEW PENDING
/**
 * Notes for a recorded visit we have no scripted fixture for.
 * Honest about what this preview can do: the transcript is kept (no audio is stored),
 * but there is no summary, to-do list or glossary for this kind of visit yet.
 */
import type { VisitNotes, VisitType } from "@/lib/types";

export function buildGenericNotes(args: { visitType: VisitType; visitTypeLabel: string; clinicianName?: string }): VisitNotes {
  const name = args.clinicianName?.trim();

  return {
    title: name ? `Visit with ${name}` : `${args.visitTypeLabel} visit`,
    todos: [],
    summary: [
      "The full transcript of this visit is saved below. You can read through what was said whenever you like.",
    ],
    terms: [],
    questionsForNextTime: [],
    limitationNote:
      "Full notes for this kind of visit aren't available in this preview yet. There's no summary, to-do list or glossary for it, only the transcript.",
  };
}

import type { Transcript, VisitType } from "@/lib/types";
import { GENERIC_CHECKIN_TRANSCRIPT } from "@/fixtures/transcripts/generic-checkin";
import { SURGICAL_CONSULT_TRANSCRIPT } from "@/fixtures/transcripts/surgical-consult";

/** The demo records the surgical consult; other visit types replay a short, generic check-in. */
export function transcriptFixtureFor(visitType: VisitType): Transcript {
  return visitType === "breast-surgeon" ? SURGICAL_CONSULT_TRANSCRIPT : GENERIC_CHECKIN_TRANSCRIPT;
}

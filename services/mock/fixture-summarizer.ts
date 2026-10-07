import { calendar, getDemoToday } from "@/lib/dates";
import type { PatientContext, VisitNotes, VisitType } from "@/lib/types";
import { VISIT_TYPE_LABELS } from "@/lib/visit-types";
import { buildGenericNotes } from "@/fixtures/notes/generic";
import { buildSurgicalConsultNotes } from "@/fixtures/notes/surgical-consult";
import type { VisitSummarizer } from "../types";
import { delay } from "./delay";

/** The scheduled consult the fixture notes describe. */
const SURGICAL_CONSULT_APPOINTMENT = "appt-surgical-consult";

function consultRecorded(patient: PatientContext): boolean {
  return patient.visits.some((v) => v.appointmentId === SURGICAL_CONSULT_APPOINTMENT);
}

/**
 * Returns pre-written notes. The first breast surgeon visit gets the surgical consult fixture;
 * anything else gets honest, limited notes.
 */
export class FixtureVisitSummarizer implements VisitSummarizer {
  async summarize({ visit, patient }: Parameters<VisitSummarizer["summarize"]>[0]): Promise<VisitNotes> {
    await delay(2200);
    if (visit.visitType === "breast-surgeon" && !consultRecorded(patient)) {
      return buildSurgicalConsultNotes({ cal: calendar(getDemoToday()), visitId: visit.id, createdAt: visit.startedAt });
    }
    return buildGenericNotes({
      visitType: visit.visitType,
      visitTypeLabel: VISIT_TYPE_LABELS[visit.visitType],
      clinicianName: visit.clinicianName,
    });
  }

  previewNote({ visitType }: { visitType: VisitType }, patient: PatientContext): string | null {
    if (visitType !== "breast-surgeon") return "In this preview, full notes are available for the surgical consult.";
    if (consultRecorded(patient)) return "In this preview, full notes are available for the first surgical consult only.";
    return null;
  }
}

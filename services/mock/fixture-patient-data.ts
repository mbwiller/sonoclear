import { calendar } from "@/lib/dates";
import type { PatientSeed } from "@/lib/types";
import { buildAppointments } from "@/fixtures/appointments";
import { CLINICIANS } from "@/fixtures/clinicians";
import { GLOSSARY } from "@/fixtures/glossary";
import { buildPatient } from "@/fixtures/patient";
import { buildRecords } from "@/fixtures/records";
import { INITIAL_STAGE_ID, STAGES } from "@/fixtures/stages";
import { buildVisits } from "@/fixtures/visits";
import type { PatientDataSource } from "../types";

/** Claire's account, built from fixtures with every date relative to `today`. */
export class FixturePatientDataSource implements PatientDataSource {
  loadSeed(today: Date): PatientSeed {
    const cal = calendar(today);
    const visits = buildVisits(cal);
    return {
      patient: buildPatient(cal),
      clinicians: CLINICIANS,
      stages: STAGES,
      currentStageId: INITIAL_STAGE_ID,
      visits,
      records: buildRecords(cal),
      todos: visits.flatMap((v) => v.notes.todos),
      appointments: buildAppointments(cal),
      glossary: GLOSSARY,
    };
  }
}

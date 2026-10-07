// CLINICAL REVIEW PENDING
/**
 * Claire's medical records at demo start, oldest first.
 */
import type { Calendar } from "@/lib/dates";
import type { MedicalRecord } from "@/lib/types";
import { buildBaselineLabs } from "./baseline-labs";
import { buildBiopsyProcedure } from "./biopsy-procedure";
import { buildDiagnosticImaging } from "./diagnostic-imaging";
import { buildPathology } from "./pathology";
import { buildScreeningMammogram } from "./screening-mammogram";

export { buildBaselineLabs, buildBiopsyProcedure, buildDiagnosticImaging, buildPathology, buildScreeningMammogram };

export function buildRecords(cal: Calendar): MedicalRecord[] {
  return [
    buildScreeningMammogram(cal),
    buildDiagnosticImaging(cal),
    buildBiopsyProcedure(cal),
    buildPathology(cal),
    buildBaselineLabs(cal),
  ];
}

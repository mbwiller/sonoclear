// CLINICAL REVIEW PENDING
/**
 * Claire Donovan, the one patient this preview runs on.
 * Facts follow PLAN.md §3 (clinical fact sheet).
 */
import type { Calendar } from "@/lib/dates";
import type { DiagnosisFact, Patient } from "@/lib/types";
import type { GlossaryTermId } from "./glossary";

/** Narrows term ids to ones the glossary actually defines. */
const termId = (id: GlossaryTermId): GlossaryTermId => id;

const DIAGNOSIS_FACTS: DiagnosisFact[] = [
  { label: "Type", value: "Invasive ductal carcinoma", termId: termId("invasive-ductal-carcinoma") },
  { label: "Grade", value: "Grade 2 of 3", termId: termId("tumor-grade") },
  { label: "Estrogen receptor", value: "Positive, 95%", termId: termId("er-positive") },
  { label: "Progesterone receptor", value: "Positive, 80%", termId: termId("pr-positive") },
  { label: "HER2", value: "Negative (IHC 1+)", termId: termId("her2-negative") },
  { label: "Size on imaging", value: "1.4 cm", termId: termId("breast-ultrasound") },
  { label: "Lymph nodes on ultrasound", value: "No suspicious nodes seen", termId: termId("axillary-lymph-nodes") },
  { label: "Stage", value: "Not known yet", termId: termId("staging") },
];

export function buildPatient(cal: Calendar): Patient {
  return {
    id: "patient-claire",
    firstName: "Claire",
    lastName: "Donovan",
    dateOfBirth: cal.yearsAgo(47, 143),
    affectedSide: "left",
    careTeam: ["dr-raman", "dr-whitfield", "dr-ellery"],
    diagnosis: {
      headline: "Invasive ductal carcinoma, left breast",
      facts: DIAGNOSIS_FACTS,
      stageNote:
        "Your stage isn't known yet. It is usually confirmed after surgery, once the tissue and lymph nodes have been looked at fully, along with any further imaging.",
      sourceRecordId: "record-pathology",
    },
    familyHistory: [
      {
        relation: "Mother",
        condition: "Breast cancer",
        ageAtDiagnosis: 52,
        note: "She was treated and is alive. The details of her cancer, such as its type, aren't known.",
      },
    ],
  };
}

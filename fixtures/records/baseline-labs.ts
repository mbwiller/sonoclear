// CLINICAL REVIEW PENDING
/**
 * Baseline labs (day −14), ordered by Dr. Priya Raman at the results visit (3:30 PM) and drawn just after it.
 * CBC with differential and comprehensive metabolic panel, all within reference ranges.
 */
import { term } from "@/fixtures/glossary";
import { formatFullDate, type Calendar } from "@/lib/dates";
import type { MedicalRecord } from "@/lib/types";

const SOURCE = "Linden Health Laboratory";

export function buildBaselineLabs(cal: Calendar): MedicalRecord {
  const date = cal.day(-14, 17, 10);
  const labDate = formatFullDate(date);

  const text = `LINDEN HEALTH LABORATORY
Clinical Laboratory Report

PATIENT: DONOVAN, CLAIRE
MRN: LH-482761
SEX: F    AGE: 47
ORDERING PHYSICIAN: Priya Raman, MD, Linden Health Primary Care, Elm Street
ACCESSION: LAB-7730592
COLLECTED: ${labDate}, 4:05 PM
REPORTED: ${labDate}, 5:10 PM
SPECIMEN: Whole blood (EDTA), serum
FASTING: No

COMPLETE BLOOD COUNT (CBC) WITH DIFFERENTIAL
Test                      Result   Flag   Units         Reference range
White blood cells         6.2             x10^3/uL      4.0-10.5
Red blood cells           4.48            x10^6/uL      3.90-5.20
Hemoglobin                13.4            g/dL          12.0-15.5
Hematocrit                40.1            %             35.5-46.0
MCV                       89.5            fL            80.0-100.0
MCH                       29.9            pg            27.0-33.0
MCHC                      33.4            g/dL          32.0-36.0
RDW                       13.1            %             11.5-15.0
Platelets                 248             x10^3/uL      150-400
MPV                       9.8             fL            7.5-11.5
Neutrophils               58              %             40-75
Lymphocytes               31              %             20-45
Monocytes                 7               %             2-10
Eosinophils               3               %             0-6
Basophils                 1               %             0-2
Absolute neutrophils      3.6             x10^3/uL      1.8-7.7
Absolute lymphocytes      1.9             x10^3/uL      1.0-4.8
Absolute monocytes        0.4             x10^3/uL      0.2-0.9
Absolute eosinophils      0.2             x10^3/uL      0.0-0.5
Absolute basophils        0.1             x10^3/uL      0.0-0.2

COMPREHENSIVE METABOLIC PANEL (CMP)
Test                      Result   Flag   Units         Reference range
Glucose                   92              mg/dL         70-99
Urea nitrogen (BUN)       14              mg/dL         7-20
Creatinine                0.78            mg/dL         0.57-1.00
eGFR                      94              mL/min/1.73m2 >=60
Sodium                    139             mmol/L        136-145
Potassium                 4.2             mmol/L        3.5-5.1
Chloride                  103             mmol/L        98-107
Carbon dioxide            25              mmol/L        22-29
Anion gap                 11              mmol/L        7-16
Calcium                   9.4             mg/dL         8.6-10.3
Total protein             7.1             g/dL          6.0-8.3
Albumin                   4.3             g/dL          3.5-5.0
Globulin                  2.8             g/dL          1.9-3.7
Albumin/globulin ratio    1.5                           1.1-2.5
Total bilirubin           0.6             mg/dL         0.2-1.2
Alkaline phosphatase      68              U/L           35-104
AST                       21              U/L           10-35
ALT                       18              U/L           7-35

eGFR is calculated with the CKD-EPI creatinine equation (race-free).
No results are outside the reference range.

Results released electronically by Linden Health Laboratory.
Reviewed by ordering physician: Priya Raman, MD`;

  return {
    id: "record-baseline-labs",
    type: "labs",
    title: "Blood count and metabolic panel",
    date,
    source: SOURCE,
    stageId: "diagnosis",
    relatedVisitId: "visit-results",
    original: { kind: "text", text },
    origin: "fixture",
    addedAt: date,
    explanation: {
      recognized: true,
      suggestedType: "labs",
      suggestedTitle: "Blood count and metabolic panel",
      documentDate: date,
      source: SOURCE,
      summary: [
        "This is a routine set of blood tests from the day you got your biopsy results. Dr. Raman ordered them to get a picture of your general health at the start. Doctors often call these baseline labs.",
        "There are two parts. The first looks at your red blood cells, white blood cells and platelets. Doctors call this a complete blood count, or CBC. The second checks your blood sugar, salts and minerals, and how your kidneys and liver are working. Doctors call this a comprehensive metabolic panel, or CMP.",
        "Every result is within the normal range. Having these on file gives your care team a starting point to compare with if you have more blood tests later.",
      ],
      keyFindings: [
        {
          label: "Complete blood count",
          value: "All results within the reference range",
          plain: "Your red cells, white cells and platelets are all at normal levels.",
          term: term("cbc"),
        },
        {
          label: "Hemoglobin",
          value: "13.4 g/dL (range 12.0–15.5)",
          plain: "The protein in red blood cells that carries oxygen. Yours is normal.",
          term: term("cbc"),
        },
        {
          label: "White blood cells",
          value: "6.2 × 10³/µL (range 4.0–10.5)",
          plain: "The cells that fight infection. Your count is normal.",
          term: term("cbc"),
        },
        {
          label: "Platelets",
          value: "248 × 10³/µL (range 150–400)",
          plain: "The cells that help your blood clot. Your count is normal.",
          term: term("cbc"),
        },
        {
          label: "Comprehensive metabolic panel",
          value: "All results within the reference range",
          plain: "Your blood sugar, salts, minerals, kidney and liver tests are all normal.",
          term: term("metabolic-panel"),
        },
        {
          label: "Kidney function",
          value: "Creatinine 0.78 mg/dL, eGFR 94",
          plain: "How well your kidneys filter your blood. Both numbers are normal.",
          term: term("metabolic-panel"),
        },
        {
          label: "Liver tests",
          value: "AST 21, ALT 18, alkaline phosphatase 68 U/L; bilirubin 0.6 mg/dL",
          plain: "Signs of how your liver is working. All are normal.",
          term: term("metabolic-panel"),
        },
      ],
      questionsToAsk: [
        "Are any of these results ones you'll want to check again later?",
        "Do I need to do anything to get ready for future blood tests, like fasting?",
      ],
    },
  };
}

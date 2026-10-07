// CLINICAL REVIEW PENDING
/**
 * Fixtures for the record upload flow.
 * The sample report is last year's routine screening mammogram, the one upload this preview can explain.
 */
import { formatFullDate, type Calendar } from "@/lib/dates";
import type { RecordExplanation } from "@/lib/types";
import { term } from "./glossary";

/** Days before today that last year's routine screening mammogram took place. */
const PRIOR_SCREENING_OFFSET = -396; // Same prior exam the screening and diagnostic reports compare against.

const PRIOR_SCREENING_SOURCE = "Linden Health Imaging, Westgate";

/** Text for the "Use a sample report" link on the upload screen. */
export function sampleUploadText(cal: Calendar): string {
  const examDate = formatFullDate(cal.day(PRIOR_SCREENING_OFFSET));
  return [
    "LINDEN HEALTH IMAGING",
    "Westgate",
    "",
    "SCREENING MAMMOGRAM REPORT",
    "",
    "Patient: Claire Donovan",
    `Exam date: ${examDate}`,
    "Exam: Bilateral digital screening mammogram",
    "Ordering physician: Priya Raman, MD",
    "",
    "CLINICAL HISTORY:",
    "Routine annual screening. No current breast symptoms. Mother with breast cancer diagnosed at age 52.",
    "",
    "COMPARISON:",
    "Prior screening mammograms.",
    "",
    "TECHNIQUE:",
    "Standard craniocaudal (CC) and mediolateral oblique (MLO) views of both breasts.",
    "",
    "BREAST COMPOSITION:",
    "The breasts are heterogeneously dense, which may obscure small masses (category C).",
    "",
    "FINDINGS:",
    "There are no suspicious masses, calcifications or areas of architectural distortion in either breast.",
    "No significant change from prior examinations.",
    "",
    "IMPRESSION:",
    "No mammographic evidence of malignancy.",
    "",
    "BI-RADS 1: Negative.",
    "",
    "RECOMMENDATION:",
    "Routine annual screening mammogram.",
    "",
    "Electronically signed by Hannah Whitfield, MD",
    "Linden Health Breast Imaging",
  ].join("\n");
}

export interface UploadFixture {
  id: string;
  /** Lower-case phrases that must all appear in the uploaded text for a match. */
  textKeywords: string[];
  /** Lower-case words, any of which in a file name suggests a match. */
  build(cal: Calendar): RecordExplanation;
}

export const UPLOAD_FIXTURES: UploadFixture[] = [
  {
    id: "prior-screening",
    textKeywords: ["screening mammogram", "heterogeneously dense", "bi-rads 1", "negative", "routine annual screening"],
    build(cal) {
      return {
        recognized: true,
        suggestedType: "imaging",
        suggestedTitle: "Screening mammogram from last year",
        documentDate: cal.day(PRIOR_SCREENING_OFFSET),
        source: PRIOR_SCREENING_SOURCE,
        summary: [
          "This is the report from your routine screening mammogram, about a year before your recent one. It was normal. The radiologist saw nothing that needed a closer look and rated it BI-RADS 1, which means negative.",
          "It also notes that your breast tissue is heterogeneously dense. That means more gland and support tissue than fat. It's common, and it matches what your recent mammogram showed.",
          "Radiologists often compare new images with earlier ones to see what has changed. Keeping this report with your other records makes it easy to bring along or share with your care team.",
        ],
        keyFindings: [
          {
            label: "Breast density",
            value: "Heterogeneously dense (category C)",
            plain: "More gland and support tissue than fat. Common and normal.",
            term: term("dense-breast-tissue"),
          },
          {
            label: "Findings",
            value: "No suspicious masses, calcifications or distortion",
            plain: "Nothing on the images needed a closer look.",
            term: term("mass"),
          },
          {
            label: "BI-RADS category",
            value: "BI-RADS 1: Negative",
            plain: "A normal result.",
            term: term("bi-rads"),
          },
          {
            label: "Recommendation",
            value: "Routine annual screening",
            plain: "The usual next step was another screening mammogram a year later.",
            term: term("screening-mammogram"),
          },
        ],
        questionsToAsk: [
          "Would it help to send these earlier images along with my recent ones?",
          "Does my breast density change which kinds of imaging are useful for me?",
        ],
      };
    },
  },
];

/** Shown when an upload doesn't match any fixture. */
export const UNRECOGNIZED_UPLOAD_NOTE: string =
  "Explanations aren't available for this document in this preview. It's saved here so you can find it easily and bring it to your appointments.";

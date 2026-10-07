// CLINICAL REVIEW PENDING
/**
 * Screening mammogram report (day −32). Linden Health Imaging, Westgate.
 * BI-RADS 0, possible mass in the left upper outer quadrant, heterogeneously dense breasts.
 */
import { term } from "@/fixtures/glossary";
import { formatFullDate, type Calendar } from "@/lib/dates";
import type { MedicalRecord } from "@/lib/types";

const SOURCE = "Linden Health Imaging, Westgate";

export function buildScreeningMammogram(cal: Calendar): MedicalRecord {
  const date = cal.day(-32, 8, 0);
  const examDate = formatFullDate(date);
  const priorDate = formatFullDate(cal.day(-396, 8, 30));

  const text = `LINDEN HEALTH IMAGING
Westgate Imaging Center
Department of Radiology

PATIENT: DONOVAN, CLAIRE
MRN: LH-482761
SEX: F    AGE: 47
ORDERING PHYSICIAN: Priya Raman, MD, Linden Health Primary Care, Elm Street
ACCESSION: WG-M-583140
DATE OF EXAM: ${examDate}

EXAM
Screening mammogram, bilateral, digital with tomosynthesis (3D).

CLINICAL HISTORY
Routine annual screening. No current breast symptoms. Family history of breast cancer in mother, diagnosed at age 52. No personal history of breast surgery or biopsy.

TECHNIQUE
Standard craniocaudal (CC) and mediolateral oblique (MLO) views of both breasts were obtained with digital breast tomosynthesis and synthesized 2D images. Computer-aided detection was used.

COMPARISON
Screening mammogram dated ${priorDate}, which was negative (BI-RADS 1).

BREAST COMPOSITION
The breasts are heterogeneously dense, which may obscure small masses (ACR category C).

FINDINGS
Left breast: A possible mass is seen in the upper outer quadrant at middle depth, visible on the CC and MLO views. It was not definitely seen on the prior examination. No suspicious calcifications or areas of architectural distortion.

Right breast: No suspicious masses, calcifications, or areas of architectural distortion.

The skin and nipples are unremarkable.

IMPRESSION
Possible mass in the left breast, upper outer quadrant. Additional imaging evaluation of the left breast is recommended.

BI-RADS CATEGORY 0: INCOMPLETE. NEED ADDITIONAL IMAGING EVALUATION.

RECOMMENDATION
Diagnostic mammogram and ultrasound of the left breast.

The patient will be contacted by Linden Health Breast Imaging to schedule additional imaging. A results letter, including breast density information, has been sent to the patient.

Interpreted by: Hannah Whitfield, MD, Breast Imaging
Electronically signed: ${examDate}, 4:12 PM`;

  return {
    id: "record-screening-mammogram",
    type: "imaging",
    title: "Screening mammogram",
    date,
    source: SOURCE,
    stageId: "screening",
    original: { kind: "text", text },
    origin: "fixture",
    addedAt: date,
    explanation: {
      recognized: true,
      suggestedType: "imaging",
      suggestedTitle: "Screening mammogram",
      documentDate: date,
      source: SOURCE,
      summary: [
        "This is the report from your routine screening mammogram. The radiologist, Dr. Whitfield, compared the pictures with your mammogram from about a year earlier, which was normal.",
        "She saw a possible mass in the upper outer part of your left breast, the area toward your armpit. Here, a mass means an area that looks like a lump on the pictures. It isn't a diagnosis on its own. It needed a closer look before anyone could say what it was.",
        "The result is BI-RADS 0. That means the result is incomplete, not a diagnosis. The report also notes that your breasts are heterogeneously dense. That is common, and it can make small areas harder to see on a mammogram.",
        "The report recommended a diagnostic mammogram and an ultrasound of your left breast. The imaging center called you the next day to set those up, and you had them a week later.",
      ],
      keyFindings: [
        {
          label: "Finding",
          value: "Possible mass, left breast",
          plain: "An area that looked like a lump on the pictures and needed a closer look.",
          term: term("mass"),
        },
        {
          label: "Location",
          value: "Upper outer quadrant, middle depth",
          plain: "The upper part of the breast, on the side toward your armpit.",
          term: term("upper-outer-quadrant"),
        },
        {
          label: "Breast density",
          value: "Heterogeneously dense (category C)",
          plain: "Your breasts have a lot of glandular and fibrous tissue. This is common and can hide small areas on a mammogram.",
          term: term("dense-breast-tissue"),
        },
        {
          label: "Right breast",
          value: "No suspicious findings",
          plain: "Nothing of concern was seen in your right breast.",
        },
        {
          label: "Comparison",
          value: "Prior screening mammogram, negative (BI-RADS 1)",
          plain: "Your mammogram about a year earlier was normal. The area in your left breast was not clearly seen then.",
        },
        {
          label: "BI-RADS",
          value: "0: Incomplete, need additional imaging evaluation",
          plain: "The radiologist needed more pictures before giving a final result.",
          term: term("bi-rads-0"),
        },
        {
          label: "Recommendation",
          value: "Diagnostic mammogram and ultrasound, left breast",
          plain: "A more detailed mammogram of the area, plus an ultrasound.",
          term: term("diagnostic-mammogram"),
        },
      ],
      questionsToAsk: [
        "Is the area on this screening mammogram the same one that was biopsied?",
        "What does my breast density mean for how my breasts are imaged from now on?",
        "Can I get a copy of these images to bring to other appointments?",
      ],
    },
  };
}

// CLINICAL REVIEW PENDING
/**
 * Diagnostic mammogram and ultrasound report (day −25). Dr. Hannah Whitfield.
 * Irregular spiculated mass, left breast 2 o'clock, 6 cm from the nipple, 1.4 × 1.1 × 1.2 cm. BI-RADS 5.
 */
import { term } from "@/fixtures/glossary";
import { formatFullDate, type Calendar } from "@/lib/dates";
import type { MedicalRecord } from "@/lib/types";

const SOURCE = "Linden Health Breast Imaging, Westgate";

export function buildDiagnosticImaging(cal: Calendar): MedicalRecord {
  const date = cal.day(-25, 9, 30);
  const examDate = formatFullDate(date);
  const screeningDate = formatFullDate(cal.day(-32, 8, 0));
  const priorDate = formatFullDate(cal.day(-396, 8, 30));

  const text = `LINDEN HEALTH BREAST IMAGING
Westgate
Phone (617) 555-0147

PATIENT: DONOVAN, CLAIRE
MRN: LH-482761
SEX: F    AGE: 47
ORDERING PHYSICIAN: Priya Raman, MD, Linden Health Primary Care, Elm Street
ACCESSION: WG-D-583977 / WG-U-583978
DATE OF EXAM: ${examDate}

EXAM
1. Diagnostic mammogram, left, digital with tomosynthesis.
2. Ultrasound, left breast, limited, and left axilla.

CLINICAL HISTORY
47-year-old woman recalled from screening mammogram for a possible mass in the left breast, upper outer quadrant (BI-RADS 0). No palpable abnormality reported. Family history of breast cancer in mother, diagnosed at age 52.

TECHNIQUE
Left full-field craniocaudal and mediolateral views with tomosynthesis, and spot compression views of the area of concern. Targeted real-time ultrasound of the left breast at the site of the mammographic finding, and ultrasound of the left axilla.

COMPARISON
Screening mammograms dated ${screeningDate} and ${priorDate}.

FINDINGS
Mammogram: The breasts are heterogeneously dense, which may obscure small masses (ACR category C). The possible mass seen on screening persists on spot compression views as an irregular mass with spiculated margins in the left breast at 2 o'clock, middle depth, corresponding to the screening finding. No associated suspicious calcifications. No other suspicious masses, calcifications, or areas of architectural distortion in the left breast.

Ultrasound, left breast: At 2 o'clock, 6 cm from the nipple, there is an irregular hypoechoic mass with spiculated margins, not parallel to the skin, with posterior acoustic shadowing. It measures 1.4 x 1.1 x 1.2 cm (transverse x anteroposterior x longitudinal). Internal vascularity is present on color Doppler. This corresponds to the mammographic finding.

Ultrasound, left axilla: Several lymph nodes are seen, with normal oval shape, thin cortices, and preserved fatty hila. No suspicious lymph nodes.

Right breast: No suspicious findings on the recent screening mammogram of ${screeningDate}.

IMPRESSION
1. Irregular hypoechoic mass with spiculated margins in the left breast at 2 o'clock, 6 cm from the nipple, measuring 1.4 x 1.1 x 1.2 cm on ultrasound. Highly suggestive of malignancy.
2. No suspicious left axillary lymph nodes.
3. No suspicious findings in the right breast.

BI-RADS CATEGORY 5: HIGHLY SUGGESTIVE OF MALIGNANCY.

RECOMMENDATION
Ultrasound-guided core needle biopsy of the left breast mass at 2 o'clock.

The findings and recommendation were discussed with the patient in person at the time of the exam. The biopsy is being scheduled with Linden Health Breast Imaging. Dr. Raman's office has been notified.

Interpreted by: Hannah Whitfield, MD, Breast Imaging
Electronically signed: ${examDate}, 11:48 AM`;

  return {
    id: "record-diagnostic-imaging",
    type: "imaging",
    title: "Diagnostic mammogram and ultrasound",
    date,
    source: SOURCE,
    stageId: "diagnostic-imaging",
    relatedVisitId: "visit-diagnostic-imaging",
    original: { kind: "text", text },
    origin: "fixture",
    addedAt: date,
    explanation: {
      recognized: true,
      suggestedType: "imaging",
      suggestedTitle: "Diagnostic mammogram and ultrasound",
      documentDate: date,
      source: SOURCE,
      summary: [
        "This is the report from the closer look at your left breast: a diagnostic mammogram and an ultrasound. Dr. Whitfield read the images and talked with you about them the same day.",
        "She found a mass at 2 o'clock in your left breast, about 6 cm from the nipple. It has an irregular shape and edges with thin lines reaching out from it. Doctors call these edges spiculated. On ultrasound it measured about 1.4 cm at its widest, a little over half an inch.",
        "The lymph nodes in your left armpit looked normal on ultrasound. Nothing of concern was seen in your right breast. Lymph nodes can also be checked in other ways later in the process.",
        "The result is BI-RADS 5. That means the area looks very likely to be cancer, but imaging alone can't confirm it. Only a biopsy can. The report recommended an ultrasound-guided core needle biopsy, which you had six days later.",
      ],
      keyFindings: [
        {
          label: "Finding",
          value: "Irregular mass with spiculated margins",
          plain: "An area with an uneven shape and edges that reach out into the tissue around it.",
          term: term("spiculated"),
        },
        {
          label: "Location",
          value: "Left breast, 2 o'clock, 6 cm from the nipple",
          plain: "Above the nipple and toward your armpit, a little more than two inches from the nipple.",
          term: term("clock-position"),
        },
        {
          label: "Size on ultrasound",
          value: "1.4 x 1.1 x 1.2 cm",
          plain: "A little over half an inch at its widest. Size is measured again, more exactly, after surgery.",
          term: term("breast-ultrasound"),
        },
        {
          label: "Ultrasound appearance",
          value: "Hypoechoic",
          plain: "Darker than the tissue around it on the ultrasound.",
          term: term("hypoechoic"),
        },
        {
          label: "Left armpit lymph nodes",
          value: "No suspicious lymph nodes",
          plain: "The lymph nodes in your left armpit looked normal on ultrasound.",
          term: term("axillary-lymph-nodes"),
        },
        {
          label: "Right breast",
          value: "No suspicious findings",
          plain: "Nothing of concern was seen in your right breast.",
        },
        {
          label: "BI-RADS",
          value: "5: Highly suggestive of malignancy",
          plain: "The area looks very likely to be cancer. A biopsy is needed to know for certain.",
          term: term("bi-rads-5"),
        },
        {
          label: "Recommendation",
          value: "Ultrasound-guided core needle biopsy",
          plain: "Taking a few small samples of tissue with a needle, guided by ultrasound.",
          term: term("core-needle-biopsy"),
        },
      ],
      questionsToAsk: [
        "What does it mean that my lymph nodes looked normal on ultrasound, and what can't an ultrasound show?",
        "If I have a breast MRI, will it be compared with these images?",
        "Is anything else in either breast being watched?",
      ],
      visuals: [
        {
          kind: "images",
          title: "A closer look",
          note: "The mass has an irregular shape, with thin lines reaching out into the tissue around it. Doctors call these edges spiculated.",
          images: [
            {
              src: "/imaging/left-cc-spot.jpg",
              alt: "Magnified mammogram of the left breast from above, with a ring around the mass",
              caption: "Left breast, CC view, magnified",
              width: 600,
              height: 600,
              mark: { x: 0.5, y: 0.5, r: 0.16, label: "The mass" },
            },
            {
              src: "/imaging/left-mlo-spot.jpg",
              alt: "Magnified mammogram of the left breast from the side, with a ring around the mass",
              caption: "Left breast, MLO view, magnified",
              width: 600,
              height: 600,
              mark: { x: 0.5, y: 0.5, r: 0.16, label: "The mass" },
            },
          ],
        },
        {
          kind: "locator",
          side: "left",
          clock: 2,
          distanceCm: 6,
          sizeCm: 1.4,
          caption:
            "The mass is at 2 o'clock in your left breast, about 6 cm from the nipple, toward your armpit. The ring shows its size on the same scale.",
        },
        {
          kind: "measure",
          title: "Size on ultrasound",
          cm: 1.4,
          compare: "about the size of a blueberry",
          caption: "It measured 1.4 cm at its widest, a little over half an inch.",
        },
        {
          kind: "scale",
          title: "BI-RADS category",
          min: 0,
          max: 6,
          value: 5,
          valueLabel: "BI-RADS 5",
          marks: [0, 1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) })),
          caption: "5 means very likely cancer; only a biopsy can say for certain.",
        },
      ],
    },
  };
}

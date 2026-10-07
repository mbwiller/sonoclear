// CLINICAL REVIEW PENDING
/**
 * Breast biopsy pathology report (reported day −14, specimen collected day −19). Dr. Samuel Okafor.
 * Invasive ductal carcinoma, Nottingham grade 2 (3+2+1 = 6/9), ER+ 95% strong, PR+ 80% moderate to strong,
 * HER2-negative (IHC 1+), Ki-67 about 15%, LVI not identified.
 */
import { term } from "@/fixtures/glossary";
import { formatFullDate, type Calendar } from "@/lib/dates";
import type { MedicalRecord } from "@/lib/types";

const SOURCE = "Linden Health Pathology";

export function buildPathology(cal: Calendar): MedicalRecord {
  const date = cal.day(-14, 11, 0);
  const reportedDate = formatFullDate(date);
  const collectedDate = formatFullDate(cal.day(-19, 9, 15));

  const text = `LINDEN HEALTH PATHOLOGY
Department of Pathology and Laboratory Medicine

SURGICAL PATHOLOGY REPORT

PATIENT: DONOVAN, CLAIRE
MRN: LH-482761
SEX: F    AGE: 47
ACCESSION: SP-L-30418
COLLECTED: ${collectedDate}, 9:31 AM
RECEIVED: ${collectedDate}, 11:20 AM
REPORTED: ${reportedDate}, 11:00 AM
SUBMITTING PHYSICIAN: Hannah Whitfield, MD, Linden Health Breast Imaging, Westgate
COPY TO: Priya Raman, MD, Linden Health Primary Care, Elm Street

CLINICAL HISTORY
47-year-old woman with an irregular mass in the left breast at 2 o'clock, 6 cm from the nipple, 1.4 cm on ultrasound, BI-RADS 5. Ultrasound-guided core needle biopsy.

SPECIMEN
A. Left breast, 2 o'clock, 6 cm from nipple, ultrasound-guided core needle biopsy.

FINAL DIAGNOSIS
A. LEFT BREAST, 2 O'CLOCK, 6 CM FROM NIPPLE, ULTRASOUND-GUIDED CORE NEEDLE BIOPSY:
   - INVASIVE DUCTAL CARCINOMA (INVASIVE CARCINOMA OF NO SPECIAL TYPE).
   - NOTTINGHAM HISTOLOGIC GRADE 2 OF 3 (TOTAL SCORE 6 OF 9).
   - INVASIVE CARCINOMA PRESENT IN 3 OF 3 CORES; LARGEST LINEAR EXTENT IN A SINGLE CORE, 9 MM.
   - LYMPHOVASCULAR INVASION: NOT IDENTIFIED.
   - SEE BIOMARKER RESULTS AND COMMENT.

NOTTINGHAM HISTOLOGIC GRADE
Glandular (acinar) / tubular differentiation:   Score 3 (less than 10% of tumor)
Nuclear pleomorphism:                           Score 2
Mitotic rate:                                   Score 1
Total score:                                    6 of 9
Overall grade:                                  Grade 2

BREAST BIOMARKER RESULTS (block A1)
Estrogen receptor (ER):          POSITIVE
   Percentage of cells with nuclear positivity: 95%
   Average intensity of staining: Strong
Progesterone receptor (PgR):     POSITIVE
   Percentage of cells with nuclear positivity: 80%
   Average intensity of staining: Moderate to strong
HER2 (immunohistochemistry):     NEGATIVE (SCORE 1+)
   Incomplete membrane staining that is faint or barely perceptible, in more than 10% of invasive tumor cells.
Ki-67:                           Approximately 15% of invasive tumor cell nuclei

Antibodies: ER (SP1), PgR (1E2), HER2 (4B5), Ki-67 (30-9). External and internal controls stained appropriately.
Cold ischemia time: less than 1 hour. Fixation: 10% neutral buffered formalin, within the recommended 6 to 72 hours.
ER, PgR, and HER2 results are reported according to current ASCO/CAP guidelines.

COMMENT
The core biopsies show invasive ductal carcinoma, Nottingham grade 2. Invasive carcinoma is present in all three cores, with a largest linear extent of 9 mm in a single core. Measurements on core biopsy do not represent tumor size. Final tumor size, margins, and lymph node status are assessed on the surgical excision specimen. The findings are consistent with the imaging findings (BI-RADS 5).

GROSS DESCRIPTION
Received in formalin, labeled with the patient's name and "left breast 2:00, 6 cm FN," are three tan-white cylindrical cores of tissue measuring 1.2, 1.4, and 1.6 cm in length and 0.15 cm in diameter. Time placed in formalin: 9:31 AM. The specimen is entirely submitted in cassette A1.

MICROSCOPIC DESCRIPTION
Sections show nests, cords, and single malignant epithelial cells infiltrating a fibrous (desmoplastic) stroma. Tubule formation is seen in less than 10% of the tumor. Nuclei are moderately enlarged with moderate variation in size and shape. Mitotic figures are infrequent. No lymphovascular invasion is identified.

Electronically signed: Samuel Okafor, MD, Pathologist
${reportedDate}, 11:00 AM`;

  return {
    id: "record-pathology",
    type: "pathology",
    title: "Breast biopsy pathology report",
    date,
    source: SOURCE,
    stageId: "diagnosis",
    relatedVisitId: "visit-results",
    original: { kind: "text", text },
    origin: "fixture",
    addedAt: date,
    explanation: {
      recognized: true,
      suggestedType: "pathology",
      suggestedTitle: "Breast biopsy pathology report",
      documentDate: date,
      source: SOURCE,
      summary: [
        "This is the pathology report from your biopsy. A pathologist, Dr. Okafor, looked at your three tissue samples under a microscope and ran extra tests on them. Dr. Raman went over these results with you at your results visit.",
        "The samples show breast cancer. The cancer started in a milk duct and has grown into nearby tissue. Doctors call this invasive ductal carcinoma. It is the most common type of breast cancer. The cells are grade 2 on a scale of 1 to 3. Grade describes how different the cells look from normal cells. It is not the same as stage.",
        "The cancer cells have receptors for the hormones estrogen and progesterone. Doctors call this ER-positive and PR-positive. They don't have extra amounts of a protein called HER2, so the cancer is HER2-negative. Hormone therapy is often part of treatment for ER-positive cancers. Your care team will talk with you about whether it applies to you.",
        "A biopsy shows only a small part of the area. Your stage isn't known yet. The full size of the tumor and whether any lymph nodes are involved are confirmed after surgery and any further imaging.",
      ],
      keyFindings: [
        {
          label: "Diagnosis",
          value: "Invasive ductal carcinoma (invasive carcinoma of no special type)",
          plain: "Cancer that started in a milk duct and has grown into nearby breast tissue.",
          term: term("invasive-ductal-carcinoma"),
        },
        {
          label: "Grade",
          value: "Nottingham grade 2 (score 6 of 9)",
          plain: "A middle grade on a scale of 1 to 3. It describes how different the cells look from normal cells.",
          term: term("tumor-grade"),
        },
        {
          label: "Estrogen receptor (ER)",
          value: "Positive, 95%, strong",
          plain: "Almost all of the cancer cells have receptors for estrogen.",
          term: term("er-positive"),
        },
        {
          label: "Progesterone receptor (PR)",
          value: "Positive, 80%, moderate to strong",
          plain: "Most of the cancer cells have receptors for progesterone.",
          term: term("pr-positive"),
        },
        {
          label: "HER2",
          value: "Negative (IHC 1+)",
          plain: "The cells don't have extra HER2 protein. A score of 0 or 1+ counts as negative.",
          term: term("her2-negative"),
        },
        {
          label: "Ki-67",
          value: "About 15%",
          plain: "The share of cancer cells that were dividing when the samples were taken.",
          term: term("ki-67"),
        },
        {
          label: "Lymphovascular invasion",
          value: "Not identified",
          plain: "No cancer cells were seen in tiny blood or lymph vessels in these samples.",
          term: term("lymphovascular-invasion"),
        },
        {
          label: "Cancer in the samples",
          value: "3 of 3 cores; largest extent 9 mm in one core",
          plain: "This is how much cancer was in one sample, not the size of the tumor. Tumor size is measured fully after surgery.",
        },
      ],
      questionsToAsk: [
        "What do my ER, PR and HER2 results mean for the next steps we'll talk about?",
        "What else needs to happen before my stage is known?",
        "Will any more tests be done on this tissue, or on tissue removed later?",
      ],
    },
  };
}

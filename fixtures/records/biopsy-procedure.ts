// CLINICAL REVIEW PENDING
/**
 * Ultrasound-guided core needle biopsy procedure note (day −19). Dr. Hannah Whitfield.
 * 14-gauge, 3 cores, lidocaine, titanium marker clip, post-procedure mammogram, no complications.
 */
import { term } from "@/fixtures/glossary";
import { formatFullDate, type Calendar } from "@/lib/dates";
import type { MedicalRecord } from "@/lib/types";

const SOURCE = "Linden Health Breast Imaging, Westgate";

export function buildBiopsyProcedure(cal: Calendar): MedicalRecord {
  const date = cal.day(-19, 9, 15);
  const procedureDate = formatFullDate(date);
  const diagnosticDate = formatFullDate(cal.day(-25, 9, 30));

  const text = `LINDEN HEALTH BREAST IMAGING
Westgate
Phone (617) 555-0147

PATIENT: DONOVAN, CLAIRE
MRN: LH-482761
SEX: F    AGE: 47
REFERRING PHYSICIAN: Priya Raman, MD, Linden Health Primary Care, Elm Street
ACCESSION: WG-B-584612
DATE OF PROCEDURE: ${procedureDate}

PROCEDURE
1. Ultrasound-guided core needle biopsy, left breast, with placement of a marker clip.
2. Post-procedure mammogram, left, two views.

PERFORMED BY
Hannah Whitfield, MD

INDICATION
Irregular hypoechoic mass with spiculated margins in the left breast at 2 o'clock, 6 cm from the nipple, measuring 1.4 x 1.1 x 1.2 cm, assessed as BI-RADS 5 on diagnostic mammogram and ultrasound of ${diagnosticDate}.

CONSENT
The risks, benefits, and alternatives of the procedure, including bleeding, infection, bruising, and the possibility of a non-diagnostic sample, were discussed with the patient. Her questions were answered, and written informed consent was obtained. A time-out was performed to confirm the patient, procedure, side, and site.

TECHNIQUE
With the patient supine, the mass was located with ultrasound. The skin was prepped with chlorhexidine and draped in sterile fashion. Local anesthesia was given with 1% lidocaine to the skin and 1% lidocaine with epinephrine to the deeper tissues. A small skin nick was made. Under real-time ultrasound guidance, using a lateral approach, three core samples were obtained from the mass with a 14-gauge spring-loaded biopsy device. Images documented the needle passing through the mass. The specimens were placed in 10% neutral buffered formalin at 9:31 AM and sent to Linden Health Pathology.

A titanium marker clip was then placed at the biopsy site under ultrasound guidance. Hemostasis was achieved with manual pressure. The skin was closed with adhesive strips and a sterile dressing was applied.

POST-PROCEDURE MAMMOGRAM
Left craniocaudal and mediolateral views show the marker clip at the biopsy site, in the expected location of the biopsied mass.

COMPLICATIONS
None. Estimated blood loss minimal. The patient tolerated the procedure well and left in stable condition.

AFTERCARE
Verbal and written instructions were given. Apply an ice pack for 15 to 20 minutes at a time as needed. Acetaminophen may be taken for soreness. Avoid heavy lifting and strenuous exercise for 24 hours. Bruising at the site is common. Call Linden Health Breast Imaging at (617) 555-0147 for bleeding that does not stop with pressure, increasing swelling, redness, or fever.

IMPRESSION
1. Technically successful ultrasound-guided 14-gauge core needle biopsy of the left breast mass at 2 o'clock, 6 cm from the nipple. Three cores obtained.
2. Titanium marker clip placed. Post-procedure mammogram confirms the clip at the biopsy site.
3. No immediate complications.

Pathology is pending. Results are expected in about 3 to 5 business days and will be sent to Dr. Raman, who will review them with the patient. Imaging and pathology results will be reviewed for concordance when available.

Electronically signed: Hannah Whitfield, MD, ${procedureDate}, 10:06 AM`;

  return {
    id: "record-biopsy-procedure",
    type: "imaging",
    title: "Ultrasound-guided core needle biopsy",
    date,
    source: SOURCE,
    stageId: "biopsy",
    relatedVisitId: "visit-biopsy",
    original: { kind: "text", text },
    origin: "fixture",
    addedAt: date,
    explanation: {
      recognized: true,
      suggestedType: "imaging",
      suggestedTitle: "Ultrasound-guided core needle biopsy",
      documentDate: date,
      source: SOURCE,
      summary: [
        "This is the note from your biopsy. Dr. Whitfield used ultrasound to guide a hollow needle to the mass in your left breast and took three small samples of tissue. Doctors call this an ultrasound-guided core needle biopsy.",
        "The skin and the tissue underneath were numbed with lidocaine, so you were awake but the area was numb. A tiny titanium marker clip was left where the samples came from. It marks the exact spot for future imaging and surgery. A quick mammogram afterward showed the clip in the right place.",
        "There were no complications. You were told to use ice for 15 to 20 minutes at a time, take acetaminophen for soreness, and skip heavy lifting and hard exercise for 24 hours. Bruising afterward is common.",
        "The samples went to the pathology lab to be looked at under a microscope. Those results are in your pathology report, which came back five days later.",
      ],
      keyFindings: [
        {
          label: "Procedure",
          value: "Ultrasound-guided core needle biopsy, left breast",
          plain: "A hollow needle took small samples of tissue, guided by ultrasound.",
          term: term("core-needle-biopsy"),
        },
        {
          label: "Site",
          value: "Left breast, 2 o'clock, 6 cm from the nipple",
          plain: "The same area seen on your diagnostic mammogram and ultrasound.",
          term: term("clock-position"),
        },
        {
          label: "Samples",
          value: "3 cores, 14-gauge needle",
          plain: "Three thin strips of tissue, taken through one small opening in the skin.",
        },
        {
          label: "Anesthesia",
          value: "Local, 1% lidocaine",
          plain: "Numbing medicine at the biopsy spot. You were awake for the procedure.",
        },
        {
          label: "Marker",
          value: "Titanium marker clip placed",
          plain: "A tiny clip that marks the spot so it can be found again on imaging or during surgery.",
          term: term("marker-clip"),
        },
        {
          label: "Post-procedure mammogram",
          value: "Clip at the biopsy site",
          plain: "A quick mammogram showed the clip sitting where the samples were taken.",
        },
        {
          label: "Complications",
          value: "None",
          plain: "The procedure went as planned.",
        },
        {
          label: "Specimens",
          value: "Sent to Linden Health Pathology",
          plain: "The samples were sent to be examined under a microscope.",
          term: term("pathology-report"),
        },
      ],
      questionsToAsk: [
        "Did the biopsy results match what the imaging showed?",
        "Will the marker clip show up on future imaging, and does it ever need to come out?",
        "Who should I call if I notice changes at the biopsy site?",
      ],
    },
  };
}

// CLINICAL REVIEW PENDING
/**
 * The three recorded visits before the demo starts: diagnostic imaging (day −25), biopsy (day −19)
 * and biopsy results (day −14). All dates come from the Calendar passed in.
 */
import { term } from "@/fixtures/glossary";
import { BIOPSY_TRANSCRIPT } from "@/fixtures/transcripts/biopsy";
import { DIAGNOSTIC_IMAGING_TRANSCRIPT } from "@/fixtures/transcripts/diagnostic-imaging";
import { RESULTS_TRANSCRIPT } from "@/fixtures/transcripts/results";
import type { Calendar } from "@/lib/dates";
import type { Visit } from "@/lib/types";

export function buildVisits(cal: Calendar): Visit[] {
  const imagingDate = cal.day(-25, 10, 15);
  const biopsyDate = cal.day(-19, 9, 27);
  const resultsDate = cal.day(-14, 15, 30);
  const consultDate = cal.day(3, 10, 30);

  const imaging: Visit = {
    id: "visit-diagnostic-imaging",
    visitType: "radiologist",
    clinicianId: "dr-whitfield",
    date: imagingDate,
    durationMs: DIAGNOSTIC_IMAGING_TRANSCRIPT.durationMs,
    stageId: "diagnostic-imaging",
    transcript: DIAGNOSTIC_IMAGING_TRANSCRIPT,
    relatedRecordIds: ["record-diagnostic-imaging"],
    origin: "fixture",
    notes: {
      title: "Imaging results with Dr. Whitfield",
      summary: [
        "Dr. Whitfield went over your extra mammogram pictures and your ultrasound from that morning. She found a spot in your left breast that has its own shape and edges. Doctors call this a mass. It sits at about 2 o'clock, if you picture the breast as a clock face, and about 6 cm from the nipple. It measures about 1.4 cm, a little over half an inch.",
        "On ultrasound, the spot looks darker than the tissue around it. Doctors call this hypoechoic. Its edges are uneven, with fine lines reaching out. Doctors call these edges spiculated. She explained that this shape is more often seen with cancer.",
        "She gave the images a 5 on a scale called BI-RADS. This means the pictures look very likely to be cancer. Only a biopsy can say for sure. The lymph nodes under your left arm looked normal on ultrasound. Your right breast showed nothing of concern.",
        "The next step she described is a biopsy. A thin hollow needle, guided by ultrasound, takes a few small samples of the mass. Doctors call this an ultrasound-guided core needle biopsy. The results will go to Dr. Raman.",
      ],
      terms: [
        term("mass"),
        term("clock-position"),
        term("hypoechoic"),
        term("spiculated"),
        term("bi-rads-5"),
        term("axillary-lymph-nodes"),
        term("core-needle-biopsy"),
      ],
      questionsForNextTime: [
        "How long will the biopsy take from start to finish?",
        "Should I pause any medicines or supplements before the biopsy?",
        "Who will call me with the results, and about when?",
      ],
      todos: [
        {
          id: "todo-book-biopsy",
          text: "Book your biopsy appointment",
          detail: "Linden Health Breast Imaging can schedule it. Call (617) 555-0147.",
          dueHint: "This week",
          sourceVisitId: "visit-diagnostic-imaging",
          stageId: "diagnostic-imaging",
          createdAt: imagingDate,
          done: true,
          doneAt: cal.day(-24, 9, 20),
        },
        {
          id: "todo-biopsy-medicines",
          text: "Tell the scheduling team about any blood thinners or supplements",
          detail: "Aspirin, blood thinners and fish oil are worth mentioning. They'll tell you if anything needs to pause.",
          dueHint: "Before your biopsy",
          sourceVisitId: "visit-diagnostic-imaging",
          stageId: "diagnostic-imaging",
          createdAt: imagingDate,
          done: true,
          doneAt: cal.day(-24, 9, 25),
        },
      ],
    },
  };

  const biopsy: Visit = {
    id: "visit-biopsy",
    visitType: "radiologist",
    clinicianId: "dr-whitfield",
    date: biopsyDate,
    durationMs: BIOPSY_TRANSCRIPT.durationMs,
    stageId: "biopsy",
    transcript: BIOPSY_TRANSCRIPT,
    relatedRecordIds: ["record-biopsy-procedure"],
    origin: "fixture",
    notes: {
      title: "Biopsy with Dr. Whitfield",
      summary: [
        "Dr. Whitfield took small samples from the mass in your left breast. First she numbed the area with lidocaine. Then she used a hollow needle, guided by ultrasound, to take 3 thin samples. Doctors call this an ultrasound-guided core needle biopsy.",
        "She placed a tiny titanium marker where the samples came from. Doctors call this a marker clip. Most people can't feel it. It lets doctors find the exact spot later. A quick mammogram afterward showed the clip in the right place.",
        "For the first day or two, use an ice pack for 15 to 20 minutes at a time. Acetaminophen can help with soreness. Avoid heavy lifting and strenuous exercise for 24 hours. Bruising is common. Call (617) 555-0147 if bleeding soaks through, redness spreads, or you get a fever.",
        "The samples go to a pathologist, who looks at them under a microscope and writes up the results. Doctors call this the pathology report. Results usually take about 3 to 5 business days. They go to Dr. Raman.",
      ],
      terms: [
        term("core-needle-biopsy"),
        term("mass"),
        term("marker-clip"),
        term("pathology-report"),
      ],
      questionsForNextTime: [
        "Who will call me to set up a time to go over the results?",
        "What will the pathology report tell us, and what will it not tell us yet?",
        "Can I get a copy of the pathology report for my own records?",
      ],
      todos: [
        {
          id: "todo-ice-pack",
          text: "Keep an ice pack handy for the first day or two",
          detail: "15 to 20 minutes at a time, with a cloth between the pack and your skin.",
          dueHint: "The day of your biopsy and the next day",
          sourceVisitId: "visit-biopsy",
          stageId: "biopsy",
          createdAt: biopsyDate,
          done: true,
          doneAt: cal.day(-18, 20, 0),
        },
        {
          id: "todo-rest-after-biopsy",
          text: "Skip heavy lifting and hard exercise for a day",
          dueHint: "For 24 hours after your biopsy",
          sourceVisitId: "visit-biopsy",
          stageId: "biopsy",
          createdAt: biopsyDate,
          done: true,
          doneAt: cal.day(-18, 10, 0),
        },
      ],
    },
  };

  const results: Visit = {
    id: "visit-results",
    visitType: "pcp",
    clinicianId: "dr-raman",
    date: resultsDate,
    durationMs: RESULTS_TRANSCRIPT.durationMs,
    stageId: "diagnosis",
    transcript: RESULTS_TRANSCRIPT,
    relatedRecordIds: ["record-pathology", "record-baseline-labs"],
    origin: "fixture",
    notes: {
      title: "Biopsy results with Dr. Raman",
      summary: [
        "Dr. Raman went over your biopsy results. The samples showed breast cancer. The cancer started in a milk duct and has grown into nearby breast tissue. Doctors call this invasive ductal carcinoma. It is the most common type of breast cancer. Invasive does not mean it has spread elsewhere.",
        "Under the microscope, the cells look somewhat different from normal cells. Doctors call this grade 2, the middle of three grades. The pathologist's score was 6 out of 9.",
        "Most of the cells have receptors for the hormones estrogen and progesterone. Doctors call this ER-positive (95%) and PR-positive (80%). The cells do not make extra amounts of a protein called HER2. Doctors call this HER2-negative, with a score of 1+.",
        "The stage is not known yet. It is usually confirmed after surgery and any further imaging. Dr. Raman referred you to Dr. Ellery, a breast surgeon, and said he may order a breast MRI. She also said genetic counseling is worth asking about, since you were diagnosed before 50 and your mother was diagnosed at 52. A nurse drew routine blood work as a baseline.",
      ],
      terms: [
        term("invasive-ductal-carcinoma"),
        term("tumor-grade"),
        term("er-positive"),
        term("pr-positive"),
        term("her2-negative"),
        term("staging"),
        term("genetic-counseling"),
      ],
      questionsForNextTime: [
        "Will I need a breast MRI, and who schedules it?",
        "Is genetic counseling a good fit for me, given my mother's history?",
        "What else needs to happen before my stage is known?",
        "What would help to know about my mother's diagnosis?",
      ],
      todos: [
        {
          id: "todo-imaging-discs",
          text: "Gather your imaging discs for Dr. Ellery",
          detail: "Linden Health Breast Imaging can copy your mammogram and ultrasound images to a disc. Call (617) 555-0147.",
          dueHint: "Before your surgical consult",
          dueDate: consultDate,
          sourceVisitId: "visit-results",
          stageId: "diagnosis",
          createdAt: resultsDate,
          done: false,
        },
        {
          id: "todo-consult-questions",
          text: "Write down your questions for the surgical consult",
          detail: "Keep a running list. Small questions count too.",
          dueHint: "Before your surgical consult",
          dueDate: consultDate,
          sourceVisitId: "visit-results",
          stageId: "diagnosis",
          createdAt: resultsDate,
          done: false,
        },
        {
          id: "todo-ask-genetics",
          text: "Ask about genetic counseling, given your mother's history",
          detail: "You were diagnosed before 50, and your mother was diagnosed at 52.",
          dueHint: "At your surgical consult",
          sourceVisitId: "visit-results",
          stageId: "diagnosis",
          createdAt: resultsDate,
          done: false,
        },
        {
          id: "todo-call-surgeon",
          text: "Call Dr. Ellery's office to book a consult",
          detail: "Linden Health Breast Surgery, Suite 300. Call (617) 555-0162.",
          sourceVisitId: "visit-results",
          stageId: "diagnosis",
          createdAt: resultsDate,
          done: true,
          doneAt: cal.day(-13, 11, 0),
        },
      ],
    },
  };

  return [imaging, biopsy, results];
}

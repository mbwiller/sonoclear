// CLINICAL REVIEW PENDING
/**
 * Notes for the scripted surgical consult with Dr. Marcus Ellery.
 * Returned by the fixture summarizer after the consult transcript finishes.
 * Must agree with PLAN.md §3 "Consult output". Pure: all dates come from `cal`.
 */
import { term } from "@/fixtures/glossary";
import type { Calendar } from "@/lib/dates";
import type { VisitNotes } from "@/lib/types";

/** The first weekday on or after `offset` days from today, so "call by" never lands on a weekend. */
function weekdayOnOrAfter(cal: Calendar, offset: number): string {
  let o = offset;
  while ([0, 6].includes(new Date(cal.day(o)).getDay())) o += 1;
  return cal.day(o);
}

export function buildSurgicalConsultNotes(args: { cal: Calendar; visitId: string; createdAt: string }): VisitNotes {
  const { cal, visitId, createdAt } = args;
  const mriCallBy = weekdayOnOrAfter(cal, 4);

  return {
    title: "Surgical consult with Dr. Ellery",
    todos: [
      {
        id: `${visitId}-schedule-mri`,
        text: "Schedule your breast MRI",
        detail: "If they haven't called by then, call Linden Health Imaging scheduling at (617) 555-0168.",
        dueHint: "The imaging office should call within a few days",
        dueDate: mriCallBy,
        sourceVisitId: visitId,
        stageId: "treatment-planning",
        createdAt,
        done: false,
      },
      {
        id: `${visitId}-book-genetics`,
        text: "Book your genetic counseling appointment",
        detail: "Dr. Ellery sent the referral at your consult. Call Linden Health Cancer Genetics at (617) 555-0175 to book.",
        dueHint: "Before your follow-up with Dr. Ellery",
        sourceVisitId: visitId,
        stageId: "treatment-planning",
        createdAt,
        done: false,
      },
      {
        id: `${visitId}-preop-bloodwork`,
        text: "Get your pre-op bloodwork",
        detail: "A blood count (CBC) and a basic metabolic panel. Any Linden Health lab. No need to fast.",
        dueHint: "Within the next two weeks",
        dueDate: cal.day(14),
        sourceVisitId: visitId,
        stageId: "treatment-planning",
        createdAt,
        done: false,
      },
      {
        id: `${visitId}-read-booklet`,
        text: "Read the booklet on lumpectomy and mastectomy",
        detail: "Write down anything it brings up. Bring those questions to your follow-up.",
        dueHint: "Before your follow-up with Dr. Ellery",
        sourceVisitId: visitId,
        stageId: "treatment-planning",
        createdAt,
        done: false,
      },
      {
        id: `${visitId}-book-follow-up`,
        text: "Book a follow-up with Dr. Ellery after your MRI",
        detail: "Call Dr. Ellery's office at (617) 555-0162. Ask for a time after your MRI and genetic counseling.",
        dueHint: "Once your MRI date is set",
        sourceVisitId: visitId,
        stageId: "treatment-planning",
        createdAt,
        done: false,
      },
    ],
    summary: [
      "You met Dr. Ellery, a breast surgeon, to talk about surgery. He went over your imaging and biopsy results. The area in your left breast is about 1.4 cm, at the 2 o'clock position. It is invasive ductal carcinoma, grade 2. It is ER-positive, PR-positive and HER2-negative. The lymph nodes under your arm looked normal on ultrasound, and his exam matched the imaging.",
      "He described two kinds of surgery, and he will go through both with you in more detail. One removes the tumor with a rim of normal tissue and keeps the rest of the breast. This is a lumpectomy, also called breast-conserving surgery. It is usually followed by radiation therapy. The other removes the whole breast. This is a mastectomy. Nothing was decided today. Your MRI and genetic counseling results can shape the choice.",
      "With either surgery, he would also take out the first few lymph nodes under your arm, usually one to three, and have them checked for cancer cells. This is a sentinel lymph node biopsy. A tracer, and sometimes a blue dye, helps him find those nodes.",
      "Before surgery, you'll have a detailed scan of both breasts. This is a breast MRI. Dense tissue can be hard to read on a mammogram, so the MRI gives another look. He also referred you for genetic counseling, because you were diagnosed before 50 and your mother had breast cancer. And he asked for routine blood tests before surgery: a CBC and a basic metabolic panel.",
      "After surgery, all of the tissue is examined. That is when the stage is confirmed. You will likely meet a medical oncologist then, to talk about whether other treatments make sense. You asked about recovery. He said it varies from person to person, and he'll give you a clearer picture once there's a plan. You'll see him again after your MRI and genetic counseling to settle the plan together.",
    ],
    terms: [
      term("lumpectomy"),
      term("mastectomy"),
      term("radiation-therapy"),
      term("sentinel-lymph-node-biopsy"),
      term("breast-mri"),
      term("genetic-counseling"),
      term("pre-op-bloodwork"),
      term("medical-oncologist"),
      term("staging"),
    ],
    questionsForNextTime: [
      "What did my MRI show, and does it change anything about the surgery options?",
      "How do my genetic counseling results fit into the plan?",
      "What would recovery look like for me with each option?",
      "What would the day of surgery look like?",
    ],
    stageUpdate: {
      toStageId: "treatment-planning",
      note: "You've met your surgeon, so you're now planning treatment.",
    },
    resolvedTodoIds: ["todo-imaging-discs", "todo-consult-questions", "todo-ask-genetics"],
  };
}

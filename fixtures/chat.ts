// CLINICAL REVIEW PENDING
/**
 * Scripted content for Ask.
 *
 * Exactly three working questions, a boundary redirect for advice, decision and prognosis
 * questions, and an honest fallback for everything else. Consumed by
 * `services/mock/scripted-chat.ts`.
 *
 * Answer text is a document-style note: paragraphs separated by a blank line, lines starting
 * with "- " form a short list. No headings, bold, links or emoji.
 *
 * Facts must agree with the clinical fact sheet in PLAN.md §3. Dates come only from the
 * patient context and the formatters in `lib/dates.ts`.
 */
import { formatTime, formatUpcoming } from "@/lib/dates";
import type { Appointment, PatientContext, SourceRef, Todo, Visit } from "@/lib/types";

export type ScriptedQuestionId = "er-her2" | "next-steps" | "bi-rads-5";

export interface ScriptedAnswer {
  text: string;
  sources: SourceRef[];
}

export interface ScriptedQuestion {
  id: ScriptedQuestionId;
  /** The suggestion text shown on the Ask page. */
  prompt(ctx: PatientContext): string;
  /** Forgiving keyword logic, case- and punctuation-insensitive. */
  matches(question: string, ctx: PatientContext): boolean;
  answer(ctx: PatientContext): ScriptedAnswer;
}

export const FALLBACK_TEXT = "I can't answer that in this preview yet. Here are a few things I can help with.";


const CONSULT_APPOINTMENT_ID = "appt-surgical-consult";

/* ------------------------------------------------------------------------------------------ */
/* Matching helpers                                                                            */
/* ------------------------------------------------------------------------------------------ */

/** Lowercase, drop apostrophes, turn every other non-alphanumeric into a space. */
function normalize(question: string): string {
  return ` ${question
    .toLowerCase()
    .replace(/['’‘`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

/** True when the normalized text contains any of the phrases as whole words. */
function hasAny(text: string, phrases: readonly string[]): boolean {
  return phrases.some((p) => text.includes(` ${p} `));
}

function joinParagraphs(parts: (string | null | undefined)[]): string {
  return parts.filter((p): p is string => typeof p === "string" && p.length > 0).join("\n\n");
}

function list(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

/* ------------------------------------------------------------------------------------------ */
/* Patient-context helpers                                                                     */
/* ------------------------------------------------------------------------------------------ */

function consultVisit(ctx: PatientContext): Visit | undefined {
  return ctx.visits.find((v) => v.appointmentId === CONSULT_APPOINTMENT_ID);
}

function consultAppointment(ctx: PatientContext): Appointment | undefined {
  return ctx.appointments.find((a) => a.id === CONSULT_APPOINTMENT_ID);
}

function surgeonName(ctx: PatientContext, appointment: Appointment | undefined): string {
  const clinician = ctx.clinicians.find((c) => c.id === appointment?.clinicianId);
  return clinician?.shortName ?? "Dr. Ellery";
}

/** "today", "tomorrow", "on Thursday", "on Oct 9". */
function whenPhrase(iso: string): string {
  const upcoming = formatUpcoming(iso);
  if (upcoming === "Today" || upcoming === "Tomorrow") return upcoming.toLowerCase();
  return `on ${upcoming}`;
}

/** The patient's live copy of a to-do (she may have checked it off), else the note's copy. */
function liveTodo(ctx: PatientContext, todo: Todo): Todo {
  return ctx.todos.find((t) => t.id === todo.id) ?? todo;
}

function consultSource(ctx: PatientContext): SourceRef {
  const consult = consultVisit(ctx);
  return consult
    ? { kind: "visit", id: consult.id, label: "From your surgical consult" }
    : { kind: "appointment", id: CONSULT_APPOINTMENT_ID, label: "Your surgical consult" };
}

/* ------------------------------------------------------------------------------------------ */
/* Redirect: advice, decision and prognosis questions                                          */
/* ------------------------------------------------------------------------------------------ */

const PROGNOSIS_PHRASES = [
  "chances",
  "odds",
  "survival",
  "survive",
  "prognosis",
  "outlook",
  "life expectancy",
  "will i die",
  "going to die",
  "am i dying",
  "how long do i have",
  "curable",
  "cure rate",
  "be cured",
  "die",
  "dying",
  "death",
  "terminal",
  "recurrence",
  "recur",
  "it come back",
  "it comes back",
  "cancer come back",
  "cancer comes back",
  "5 year",
  "five year",
] as const;

const DOCTOR_PHRASES = [
  "second opinion",
  "better doctor",
  "better surgeon",
  "another doctor",
  "another surgeon",
  "different doctor",
  "different surgeon",
  "switch doctors",
  "switch surgeons",
] as const;

/** Decision phrases besides "should i" and "recommend", which have their own checks below. */
const DECISION_PHRASES = [
  "which surgery",
  "lumpectomy or mastectomy",
  "mastectomy or lumpectomy",
  "what would you do",
  "what would you choose",
  "if you were me",
  "best treatment",
  "best option",
  "best surgery",
  "which treatment",
  "which is better",
] as const;

/** "Should I bring…", "What should I expect…" are process questions, not advice. */
const PROCESS_SHOULD = /\bshould i (bring|expect|ask|prepare|know|write|call|read|wear|eat)\b/;

/** "What did Dr. Whitfield recommend?" asks what was said, not for advice. */
const REPORTED_RECOMMENDATION = /\b(did|does) (dr|doctor|my|he|she|they|the)\b.*\brecommend/;

function isAdviceQuestion(question: string): boolean {
  const text = normalize(question);
  if (hasAny(text, PROGNOSIS_PHRASES) || hasAny(text, DOCTOR_PHRASES)) return true;

  const withoutProcess = text.replace(PROCESS_SHOULD, " ");
  if (hasAny(withoutProcess, ["should i"])) return true;

  if (/\brecommend/.test(text) && REPORTED_RECOMMENDATION.test(text) === false) return true;

  return hasAny(text, DECISION_PHRASES);
}

type RedirectTopic = "prognosis" | "doctor" | "surgery" | "treatment" | "general";

function redirectTopic(question: string): RedirectTopic {
  const text = normalize(question);
  if (hasAny(text, PROGNOSIS_PHRASES)) return "prognosis";
  if (hasAny(text, DOCTOR_PHRASES)) return "doctor";
  if (hasAny(text, ["lumpectomy", "lumpectomies", "mastectomy", "mastectomies", "surgery", "surgeries", "operation", "reconstruction"])) {
    return "surgery";
  }
  if (
    hasAny(text, ["treatment", "treatments", "chemo", "chemotherapy", "radiation", "hormone therapy", "tamoxifen", "medication", "medicine", "therapy"])
  ) {
    return "treatment";
  }
  return "general";
}

const DECISION_OPENING = "That's a decision for you and Dr. Ellery. Here's a question you could bring to him:";
/** A second opinion is her own choice, so this one doesn't frame it as a decision made with Dr. Ellery. */
const DOCTOR_OPENING = "That's your decision, and your care team can help you think it through. Here's a question you could bring to Dr. Ellery:";
const PROGNOSIS_OPENING =
  "That's a question for Dr. Ellery and the rest of your care team, who know the details of your situation. Here's a question you could bring to him:";

export const REDIRECT: {
  matches(question: string): boolean;
  answer(ctx: PatientContext, question: string): ScriptedAnswer;
} = {
  matches: isAdviceQuestion,

  answer(ctx, question) {
    const afterConsult = Boolean(consultVisit(ctx));
    const nextStepsOffer = afterConsult
      ? "what happens between now and your surgery"
      : "what usually happens at a surgical consult";

    let opening = DECISION_OPENING;
    let suggested: string;
    let offer: string;

    switch (redirectTopic(question)) {
      case "prognosis":
        opening = PROGNOSIS_OPENING;
        suggested = "What can you tell me about my outlook right now, and what information are we still waiting on?";
        offer = "What I can do is explain what your pathology report says, including your ER, PR and HER2 results.";
        break;
      case "doctor":
        opening = DOCTOR_OPENING;
        suggested = "Do people with a diagnosis like mine often get a second opinion, and how would that fit with the timing of my care?";
        offer = `What I can do is explain your results and ${nextStepsOffer}.`;
        break;
      case "surgery":
        suggested = afterConsult
          ? "How will my MRI and genetic counseling results shape the choice between lumpectomy and mastectomy?"
          : "What surgical options fit my situation, and what will help us choose between them?";
        offer = `What I can do is explain ${nextStepsOffer}, and what your pathology results mean.`;
        break;
      case "treatment":
        suggested = "Which of my results matter most for planning my treatment, and when will we talk through the options?";
        offer = "What I can do is explain what your ER, PR and HER2 results mean in plain words.";
        break;
      default:
        suggested = "What are my options right now, and what information do we still need before deciding?";
        offer = `What I can do is explain your pathology and imaging results, and ${nextStepsOffer}.`;
    }

    return {
      text: joinParagraphs([opening, suggested, offer]),
      sources: [consultSource(ctx)],
    };
  },
};

/* ------------------------------------------------------------------------------------------ */
/* Question 1: ER-positive, HER2-negative                                                      */
/* ------------------------------------------------------------------------------------------ */

const erHer2: ScriptedQuestion = {
  id: "er-her2",

  prompt: () => "What does ER-positive, HER2-negative mean?",

  matches(question) {
    if (isAdviceQuestion(question)) return false;
    const text = normalize(question);
    if (hasAny(text, ["her2", "her 2", "hormone receptor", "hormone receptors", "estrogen", "oestrogen", "progesterone", "receptor", "receptors", "ihc"])) {
      return true;
    }
    // "ER positive", "ER+ mean", "PR status"
    return /\b(er|pr)\b/.test(text) && hasAny(text, ["positive", "negative", "pos", "neg", "status", "result", "results", "mean", "means"]);
  },

  answer: () => ({
    text: joinParagraphs([
      "Your pathology report, which Dr. Raman went over with you, checked the cancer cells for three things: two hormone receptors and a protein called HER2.",
      "The cancer cells have receptors, small docking points, for the hormone estrogen. When estrogen attaches, it can help the cells grow. Your report found these receptors in 95% of the cells. Doctors call this ER-positive. PR-positive means the same thing for progesterone, another hormone. Yours was 80%. Together, these mean the cancer is hormone receptor-positive.",
      "HER2 is a protein that helps cells grow. In some cancers, the cells make far too much of it. Your cancer cells don't make extra amounts of it. Your test scored 1+, which counts as HER2-negative.",
      "Medicine that lowers estrogen or blocks it from reaching the cells is often part of treatment for hormone receptor-positive cancers. Doctors call this hormone therapy. Your care team will explain whether it applies to you.",
    ]),
    sources: [
      { kind: "record", id: "record-pathology", label: "From your pathology report" },
      { kind: "visit", id: "visit-results", label: "From your visit with Dr. Raman" },
    ],
  }),
};

/* ------------------------------------------------------------------------------------------ */
/* Question 2: what happens next (adapts to whether the consult has happened)                  */
/* ------------------------------------------------------------------------------------------ */

const NEXT_STEP_PHRASES = [
  "next",
  "next step",
  "next steps",
  "whats next",
  "what is next",
  "what happens next",
  "what comes next",
  "what happens now",
  "what now",
  "between now",
  "consult",
  "consultation",
  "surgical consult",
  "surgery consult",
  "before my surgery",
  "before surgery",
  "before the surgery",
  "before the consult",
  "before my consult",
  "until my surgery",
  "until surgery",
  "lead up to",
  "timeline",
] as const;

function answerBeforeConsult(ctx: PatientContext): ScriptedAnswer {
  const appointment = consultAppointment(ctx);
  const surgeon = surgeonName(ctx, appointment);
  const location = appointment?.location ? `, at ${appointment.location}` : "";

  const when = appointment?.date
    ? `Your surgical consult with ${surgeon} is ${whenPhrase(appointment.date)} at ${formatTime(appointment.date)}${location}.`
    : `Your surgical consult with ${surgeon} isn't on the calendar yet.`;

  const open = ctx.todos.filter((t) => t.done === false && t.stageId === "diagnosis");
  const todos =
    open.length > 0
      ? `Before then, a few things are still on your list:\n${list(open.map((t) => t.text))}`
      : "Everything on your list for this stage is done.";

  return {
    text: joinParagraphs([
      when,
      todos,
      `At the consult, ${surgeon} will usually examine you and go over your imaging and pathology results with you. Surgeons often explain the surgical options at a first visit. A first consult is mostly about information. Decisions usually come later, once all the results are in.`,
      "Dr. Raman mentioned that the surgeon may order more imaging, such as a breast MRI. She also said genetic counseling is worth asking about, given your mother's history.",
    ]),
    sources: [
      { kind: "appointment", id: CONSULT_APPOINTMENT_ID, label: "Your surgical consult" },
      { kind: "visit", id: "visit-results", label: "From your visit with Dr. Raman" },
    ],
  };
}

function answerAfterConsult(ctx: PatientContext, consult: Visit): ScriptedAnswer {
  const surgeon = surgeonName(ctx, consultAppointment(ctx));
  const todos = consult.notes.todos.map((t) => liveTodo(ctx, t));
  const items = todos.map((t) => (t.done ? `${t.text} (done)` : t.text));

  const bloodwork = todos.find((t) => /blood/i.test(t.text));
  const bloodworkLine =
    bloodwork?.done === true
      ? "You've already had your pre-op bloodwork, the routine check before surgery."
      : "The pre-op bloodwork is a routine check before surgery. You can go to any Linden Health lab within two weeks, and you don't need to fast.";

  return {
    text: joinParagraphs([
      items.length > 0 ? `${surgeon} laid out a few steps before surgery:\n${list(items)}` : `${surgeon} laid out a few steps before surgery.`,
      "The breast MRI looks at both breasts in more detail. Dense breast tissue can be hard to read on a mammogram, so the MRI helps check for anything else. Genetic counseling looks at whether an inherited gene change could be involved, given your age and your mother's history. Both results can shape the choice of surgery.",
      bloodworkLine,
      `Once the MRI and genetic counseling are done, you'll see ${surgeon} again to settle the plan. That's usually when a surgery date is set.`,
    ]),
    sources: [{ kind: "visit", id: consult.id, label: "From your surgical consult" }],
  };
}

const nextSteps: ScriptedQuestion = {
  id: "next-steps",

  prompt: (ctx) =>
    consultVisit(ctx) ? "What happens between now and my surgery?" : "What happens between now and my surgery consult?",

  matches(question) {
    if (isAdviceQuestion(question)) return false;
    const text = normalize(question);
    if (hasAny(text, NEXT_STEP_PHRASES)) return true;
    // "When is my surgery?", "What should I expect before surgery?"
    return hasAny(text, ["surgery", "operation"]) && hasAny(text, ["before", "until", "between", "when", "prepare", "expect", "happens", "happen"]);
  },

  answer(ctx) {
    const consult = consultVisit(ctx);
    return consult ? answerAfterConsult(ctx, consult) : answerBeforeConsult(ctx);
  },
};

/* ------------------------------------------------------------------------------------------ */
/* Question 3: BI-RADS 5                                                                       */
/* ------------------------------------------------------------------------------------------ */

const biRads5: ScriptedQuestion = {
  id: "bi-rads-5",

  prompt: () => "What did my radiologist mean by BI-RADS 5?",

  matches(question) {
    if (isAdviceQuestion(question)) return false;
    const text = normalize(question);
    if (hasAny(text, ["bi rads", "bi rad", "birads", "birad", "rads"])) return true;
    if (/\bradiologist\b.*\b(mean|meant|say|said)\b/.test(text)) return true;
    return hasAny(text, ["mammogram", "imaging", "ultrasound"]) && hasAny(text, ["score", "number", "rating", "category"]);
  },

  answer: () => ({
    text: joinParagraphs([
      "BI-RADS is a scale radiologists use to sum up what they see on breast imaging. It runs from 0 to 6. Each number says how the pictures look and what should happen next.",
      `In plain words:\n${list([
        "0 means more pictures are needed",
        "1 and 2 mean normal, or clearly not cancer",
        "3 means probably not cancer, check again soon",
        "4 means suspicious, a biopsy is needed",
        "5 means very likely cancer, a biopsy is needed",
        "6 means a biopsy has already shown cancer",
      ])}`,
      "Your screening mammogram came back as BI-RADS 0. That meant the radiologist needed more pictures, which is why you were called back. At your diagnostic mammogram and ultrasound, Dr. Whitfield rated what she saw a 5. The pictures looked very likely to be cancer, so a biopsy was needed to know for sure.",
      "Your biopsy then confirmed it. A BI-RADS number describes the pictures only. The biopsy is what gives the answer.",
    ]),
    sources: [
      { kind: "record", id: "record-diagnostic-imaging", label: "From your imaging report" },
      { kind: "visit", id: "visit-diagnostic-imaging", label: "From your visit with Dr. Whitfield" },
    ],
  }),
};

export const SCRIPTED_QUESTIONS: ScriptedQuestion[] = [erHer2, nextSteps, biRads5];

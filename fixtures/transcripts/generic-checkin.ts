// CLINICAL REVIEW PENDING
/**
 * Short generic check-in, about 3 minutes.
 * Replayed when Claire records a visit type we have no scripted fixture for, so it
 * must fit any clinician: no clinician name, no specialty, no new medical facts.
 * Claire's summary only repeats what she already knows at this point in her journey.
 */
import type { Transcript } from "@/lib/types";

export const GENERIC_CHECKIN_TRANSCRIPT: Transcript = {
  segments: [
    {
      id: "checkin-001",
      speaker: "clinician",
      text: "Hi, Claire. Come on in, have a seat. Thanks for coming in today.",
      startMs: 0,
      endMs: 6400,
      isFinal: true,
    },
    {
      id: "checkin-002",
      speaker: "patient",
      text: "Thanks. Before we start, is it okay if I record this? It helps me to listen back later. There's been a lot to keep track of.",
      startMs: 7500,
      endMs: 18700,
      isFinal: true,
    },
    {
      id: "checkin-003",
      speaker: "clinician",
      text: "Of course, that's fine. A lot of people find that helpful. Go right ahead.",
      startMs: 19200,
      endMs: 26000,
      isFinal: true,
    },
    {
      id: "checkin-004",
      speaker: "clinician",
      text: "So, let's go over where things stand. Could you tell me what you know so far, in your own words? I've read through your records, but I'd like to hear it from you. It helps me make sure we're working from the same information.",
      startMs: 35000,
      endMs: 55100,
      isFinal: true,
    },
    {
      id: "checkin-005",
      speaker: "patient",
      text: "Sure. Um, so my mammogram last year was normal. Then my most recent screening mammogram showed something in my left breast. I had more imaging, a mammogram and an ultrasound, and then a biopsy. It came back as invasive ductal carcinoma. It's hormone receptor positive, both ER and PR, and HER2 negative. I had to look up what all of that meant.",
      startMs: 56400,
      endMs: 82300,
      isFinal: true,
    },
    {
      id: "checkin-006",
      speaker: "patient",
      text: "They told me the stage isn't known yet, that it gets confirmed later on. My mom had breast cancer too, when she was fifty-two, so that's come up as well. And I'm seeing Dr. Ellery, the breast surgeon, for the surgery side of things.",
      startMs: 82900,
      endMs: 101800,
      isFinal: true,
    },
    {
      id: "checkin-007",
      speaker: "clinician",
      text: "That matches what I have here. You've clearly been keeping careful track, and that really does help.",
      startMs: 108800,
      endMs: 116900,
      isFinal: true,
    },
    {
      id: "checkin-008",
      speaker: "patient",
      text: "I've been trying. It's a lot of names and offices and appointments, all at once.",
      startMs: 117700,
      endMs: 124400,
      isFinal: true,
    },
    {
      id: "checkin-009",
      speaker: "clinician",
      text: "It is a lot. Part of my job is making sure everyone involved in your care is working from the same picture. I'll coordinate with the rest of your team, so you don't have to carry every piece of information between offices yourself.",
      startMs: 125100,
      endMs: 144700,
      isFinal: true,
    },
    {
      id: "checkin-010",
      speaker: "patient",
      text: "That would help. Thank you.",
      startMs: 145800,
      endMs: 148400,
      isFinal: true,
    },
    {
      id: "checkin-011",
      speaker: "clinician",
      text: "And if something comes up after today, call the office and someone will get back to you. Before we go on, is there anything you'd like to ask me, or anything you want me to explain again?",
      startMs: 151400,
      endMs: 168400,
      isFinal: true,
    },
    {
      id: "checkin-012",
      speaker: "patient",
      text: "Not right now, I don't think. I'll write things down if I think of anything.",
      startMs: 169300,
      endMs: 176000,
      isFinal: true,
    },
  ],
  durationMs: 180000,
};

# Sonoclear — VISION.md

Working name: **Sonoclear** (provisional; see Open Questions).

This file is the source of truth for the product. Read it fully before writing code. When something here conflicts with a default habit (a component library's stock look, a generic chat UI), this file wins.

---

## 1. What we are building

Sonoclear is a patient-side companion for people going through a breast cancer diagnosis. Doctors already have AI scribes. Patients have nothing: they sit through appointments with a radiologist, a surgeon and an oncologist while frightened, with limited medical vocabulary, and walk out unsure what was said or what to do next.

Sonoclear does four things:

1. **Captures** a doctor's visit (recording and transcription) so the patient can listen instead of scribbling.
2. **Turns the visit into a to-do list** and a plain-language summary.
3. **Holds their records** (imaging, pathology, labs, genetics) and explains each in plain language.
4. **Answers questions** about their own situation, grounded in their visits and records.

All of it hangs on one spine: a **journey timeline** that answers "where am I, and what's next?"

**User:** the patient herself. No caregiver or shared access in this version.
**Platform:** responsive web app, mobile-first, with a real desktop layout. Not a native app yet.
**Distribution:** direct to patients. Later, physicians may recommend it.

## 2. Product principles

1. **To-dos first.** Ten minutes after a visit, the first thing the patient sees is what she needs to do. Summary and transcript come after.
2. **Explain, never advise.** Sonoclear explains what things mean and how the process works. It does not recommend treatments, second opinions, or decisions. The care team decides.
3. **A guide, not a therapist.** The voice is a calm, knowledgeable friend. It is kind, but it does not perform emotional support or ask how the patient is feeling.
4. **Calm is a feature.** No alarm colors, no urgency mechanics, no statistics about survival, no gamification (streaks, confetti, progress percentages).
5. **Nothing looks AI-generated.** See section 6. This is a hard requirement, not a preference.
6. **Honest about what it is.** No "AI-powered" badges, and no compliance claims ("HIPAA compliant") until they are true.

## 3. MVP scope

The MVP is the foundation of the real product, not a throwaway. It is a high-fidelity front end running on **one realistic mock patient**, with every AI capability mocked behind an interface that a real implementation will later replace.

**In scope**
- All five surfaces: Journey (home), Capture, Records, Ask, Profile
- A complete, clickable demo arc (section 5)
- Scripted "recording" that replays a fixture visit through the same interface real transcription will use
- Scripted chat with exactly three working questions
- Record upload UI (photo, PDF, pasted text) with mocked interpretation
- Mobile (390px) and desktop (1280px+) layouts

**Out of scope for now**
- Any LLM or transcription API call
- Microphone access (do not request the permission in the MVP)
- Accounts, auth, backend, database
- Onboarding (the app opens directly into the mock patient's populated account)
- Caregiver sharing, calendar sync, notifications, patient-portal import

## 4. The mock patient

All dates are **offsets from a single `DEMO_TODAY` constant** so the demo never goes stale. Never hard-code calendar dates in components.

**Claire Donovan, 47.** Left breast. Mother was diagnosed with breast cancer at 52. She is post-biopsy and pre-surgery: diagnosed, and about to meet her surgeon.

| Offset | Event | Clinician | In the app |
|---|---|---|---|
| −32 days | Routine screening mammogram; called back | (imaging center) | Record only |
| −25 days | Diagnostic mammogram + ultrasound: 1.4 cm mass, **BI-RADS 5** | Dr. Hannah Whitfield, radiologist | Recorded visit + imaging report |
| −19 days | Ultrasound-guided core needle biopsy | Dr. Whitfield | Recorded visit (short) |
| −14 days | Biopsy results: **invasive ductal carcinoma, grade 2, ER-positive, PR-positive, HER2-negative** | Dr. Priya Raman, PCP | Recorded visit + pathology report |
| +3 days | Surgical consult | Dr. Marcus Ellery, breast surgeon | Upcoming — **this is the visit the demo records** |
| unscheduled | Breast MRI | — | Upcoming to-do |
| unscheduled | Genetic counseling | — | Upcoming to-do |

Stage is not yet known; the app says, truthfully, that staging is confirmed after surgery and further imaging.

Open to-dos at demo start (from the results visit): gather imaging discs for the surgeon, write down questions for the surgical consult, ask about genetic counseling given her mother's history. One to-do is already checked (called the surgeon's office).

**The scripted surgical consult** (the fixture replayed during Capture) covers: lumpectomy versus mastectomy as options the surgeon will discuss further, sentinel lymph node biopsy, an MRI before surgery, a genetic counseling referral, and pre-op bloodwork. It produces 4–5 new to-dos and moves her journey forward.

All medical content in fixtures must be plausible and internally consistent. It will be reviewed by a breast oncologist before any real patient sees it; mark every fixture file with a `// CLINICAL REVIEW PENDING` header.

## 5. Screens

Navigation: four tabs — **Journey · Capture · Records · Ask** — as a bottom bar on mobile and a left sidebar on desktop. Profile sits behind an avatar button at the top right of Journey.

### Journey (home)
- Serif greeting ("Good afternoon, Claire") and the profile avatar.
- **Up next** card: the next appointment and the count of open to-dos.
- **Open to-dos**: checkable, each with a due hint and a link back to the visit it came from.
- **Timeline**: a vertical list of fixed stages — Screening → Diagnostic imaging → Biopsy → Diagnosis → Treatment planning → Treatment → Follow-up. Each stage is done, current, or ahead. The current stage is expanded. Under each stage: its visits, records and to-dos, plus two or three sentences on what this stage is and what usually happens in it.
- Future stages are visible but quiet. They describe the process in general terms and never predict her specific treatment.

### Capture
1. **Before:** choose the visit type from chips (PCP, Radiologist, Breast surgeon, Medical oncologist, Radiation oncologist, Genetic counselor, Other), optionally name the clinician, and see one line: *"Let your doctor know you're recording."* One large record button.
2. **During:** a nearly empty screen. A timer, the visit type, and **three animated vertical bars** showing that transcription is live. A small, secondary "Show transcript" control reveals the live transcript in a sheet. Pause and End controls. Nothing else.
3. **After:** a brief "Putting your notes together" state, then the visit page.

The patient picks the visit type herself. Automatic classification comes later, once transcription is real.

### Visit page
Laid out like a note, not a dashboard. Serif title ("Surgical consult with Dr. Ellery"), small chips for date, clinician type and duration, then in this order:
1. **To-dos** (checkable; they also appear on Journey)
2. **Summary** in plain language, a few short paragraphs
3. **Terms explained** — medical terms from the visit; tapping one opens a short definition
4. **Questions to ask next time**
5. **Full transcript**, collapsed by default, with speaker labels

An "Ask about this visit" control opens Ask with this visit as context.

### Records
- List grouped by type: Imaging, Pathology, Labs, Genetics, Other.
- Add a record by **photo, PDF upload, or pasted text**.
- Record page: plain-language explanation first, then key findings as labeled rows with tappable definitions (e.g. "ER-positive"), then the original document.
- In the MVP, uploading shows the full flow and returns a mocked interpretation; a file that matches no fixture is saved with the honest note that explanations aren't available in this preview.

### Ask
- An open, quiet page in the spirit of Counsel's home: a serif prompt ("What would you like to understand?"), a pill-shaped input, and three suggested questions.
- The three working questions:
  1. "What does ER-positive, HER2-negative mean?"
  2. "What happens between now and my surgery consult?"
  3. "What did my radiologist mean by BI-RADS 5?"
- Answers read like a well-written note: document-style text, not a chat bubble. Each cites where it came from with a chip linking to the visit or record ("From your pathology report").
- Anything else gets: *"I can't answer that in this preview yet. Here are a few things I can help with."*
- Boundaries (these also govern the future real model):
  - Explains terms, results, and process. Describes options in general terms.
  - Does not recommend a treatment, a doctor, or a second opinion; does not interpret prognosis or give survival figures. It redirects: *"That's a decision for you and Dr. Ellery. Here's a question you could bring to him."*
  - A persistent, unobtrusive line: *"Sonoclear explains. Your care team decides."*

### Profile
Name and date of birth, care team (name, role, phone), a diagnosis snapshot, family history, and a Privacy & Data section (export and delete, shown as placeholders).

### The demo arc
Open on Journey → read the Up next card → open the results visit → open the pathology record → ask the ER/HER2 question → go to Capture, record the surgical consult → land on the new visit page with new to-dos → return to Journey and see the timeline advanced. This flow must work end to end with no dead ends.

## 6. Design system

References: Counsel Health and Nolla Health (calm, clinical, premium), Granola (the note layout and the recording indicator), Wispr Flow (typographic confidence). We borrow their restraint, not their assets.

### Color
One paper background, one ink, one accent. Hex values below were estimated from screenshots; tune them by eye, then freeze them as tokens.

| Token | Value | Use |
|---|---|---|
| `paper` | `#F8F7F3` | App background |
| `surface` | `#FFFFFF` | Cards, inputs, sheets |
| `sunken` | `#F1EFE8` | Chips, quiet fills |
| `line` | `#E5E2D8` | 1px hairlines |
| `ink` | `#232F5C` | Text, primary buttons (deep navy) |
| `ink-muted` | `#5E6682` | Secondary text |
| `sage` | `#6B7A4C` | The single accent: active states, recording bars, checkmarks |
| `sage-soft` | `#E3E8D6` | Selected chips, accent fills |
| `attention` | `#A9781F` | Rare: something genuinely needs action |

**No pink anywhere**, and no pink ribbon. No red; a result is never shown in an alarm color. No lavender or second accent.

### Type
- **Display serif** for greetings, page and visit titles, the Ask prompt: Newsreader (or a comparable transitional serif), regular weight, tight leading. Italic is allowed for one emphasized word, sparingly.
- **Sans** for everything else: Instrument Sans (or a comparable quiet grotesk). Do not ship the untouched default Inter-on-white look.
- Body text is 17px minimum on mobile. Small-caps or tracked uppercase labels (12–13px) for section eyebrows, as on Counsel and Wispr.
- Load fonts with `next/font`.

### Shape and components
- Pills: buttons, chips and the Ask input are fully rounded. Cards use a 20–24px radius.
- Depth comes from hairlines and background shifts, not shadows. One very soft shadow is allowed on the Ask input and on sheets.
- Icons: one thin-stroke outline set, used sparingly. No filled icons, no emoji.
- The recording indicator is three vertical bars in `sage`, animating gently. It is the product's signature motif; reuse it as the loading state and in the logo lockup.
- Texture: a faint line-contour pattern (like Counsel's hero) may sit behind Journey's header and the Ask page. Nothing else gets a background graphic.
- Photography: warm, natural-light, cinematic photos in the manner of Nolla, on the welcome and empty states only. Never behind data. Licensed photos only; no generated images.

### Motion
Slow and small: 200–300ms ease-out fades and short slides. Respect `prefers-reduced-motion`. Nothing bounces.

### Voice
A calm, knowledgeable friend. Short sentences. Second person. Plain words first, the medical term second: *"The cancer started in a milk duct and has grown into nearby tissue. Doctors call this invasive ductal carcinoma."* No exclamation marks, no cheerleading, no "I'm so sorry you're going through this."

### What "zero AI feel" means, concretely
Do not produce any of the following:
- Purple or blue gradients, gradient text, glassmorphism, glow effects
- Sparkle or wand icons, robot avatars, "AI" or "✨" labels, emoji
- Stock component-library styling left at its defaults
- Three-up feature cards with an icon, a heading and two lines of grey text
- Chat bubbles with tails and avatars for the assistant
- Lorem ipsum or placeholder content of any kind; every string is real and specific to Claire
- Dense dashboards, charts, or progress rings

When unsure, remove something.

### Accessibility
Users are stressed and may be older. WCAG AA contrast, 44px minimum touch targets, full keyboard support on desktop, visible focus rings in `sage`, and no interaction that depends on timing.

## 7. Architecture

**Stack:** Next.js (App Router), TypeScript (strict), Tailwind with the tokens above as the theme. Latest stable versions. No backend. State in a small client store, persisted to `localStorage` so a checked to-do survives a refresh; include a "Reset demo" action in Profile. Add a web app manifest so the demo can be installed to a phone's home screen.

**The rule that matters most:** screens never import fixtures. They call services, and services are interfaces with mock implementations today and real ones later. Adding real transcription must mean writing one new class, not touching screens.

```ts
// Transcription: the mock replays a timed fixture; the real one streams from a mic.
interface TranscriptionProvider {
  start(opts: { visitType: VisitType }): TranscriptionSession;
}
interface TranscriptionSession {
  onSegment(cb: (s: TranscriptSegment) => void): void;
  pause(): void; resume(): void;
  stop(): Promise<Transcript>;
}
interface TranscriptSegment {
  id: string; speaker: 'patient' | 'clinician' | 'unknown';
  text: string; startMs: number; endMs: number; isFinal: boolean;
}

// Visit understanding: transcript in, structured notes out.
interface VisitSummarizer {
  summarize(input: { transcript: Transcript; visit: VisitMeta; patient: PatientContext }): Promise<VisitNotes>;
}
// VisitNotes = { todos, summary, terms, questionsForNextTime, stageUpdate? }

interface RecordInterpreter {
  interpret(record: RecordUpload, patient: PatientContext): Promise<RecordExplanation>;
}

interface ChatProvider {
  ask(input: { messages: ChatMessage[]; patient: PatientContext; focus?: VisitId | RecordId }): AsyncIterable<ChatChunk>;
}
// ChatChunk carries text plus source references to visits and records.
```

Mock implementations: `ScriptedTranscriptionProvider` (replays a fixture at an adjustable speed, with a fast mode for demos), `FixtureVisitSummarizer`, `FixtureRecordInterpreter`, `ScriptedChatProvider` (matches the three questions, streams the answer, falls back otherwise). Select implementations in one place (`services/index.ts`).

**Data model (core types):** `Patient`, `Clinician`, `Stage`, `Visit`, `Transcript`, `VisitNotes`, `Todo` (with `sourceVisitId`), `MedicalRecord`, `RecordExplanation`, `Term`, `ChatMessage`. Fixtures live in `/fixtures` as typed TypeScript, with dates as offsets from `DEMO_TODAY`.

**Suggested layout**
```
app/            routes: (tabs)/journey, capture, records, ask; visit/[id]; record/[id]; profile
components/     ui/ (primitives)  journey/  capture/  visit/  records/  ask/
services/       interfaces + mock implementations + index.ts
fixtures/       patient, visits, transcripts, records, chat
lib/            dates (DEMO_TODAY), store, tokens
```

## 8. Build order

Stop after each milestone and show screenshots at 390px and 1280px before continuing. The design bar is checked at every stop, not at the end.

1. **Foundation:** scaffold, tokens, fonts, app shell (bottom tabs and desktop sidebar).
2. **Primitives:** a `/styleguide` route showing type, color, buttons, chips, cards, sheets, the three-bar indicator, to-do rows. Get this right before building screens.
3. **Data and services:** types, fixtures for Claire, all four mock services.
4. **Journey.**
5. **Visit page.**
6. **Capture** (before, during, after) wired through `TranscriptionProvider` and `VisitSummarizer`.
7. **Records** (list, add flow, record page).
8. **Ask.**
9. **Profile, desktop refinement, accessibility pass, manifest,** and a full run of the demo arc.

## 9. After the MVP

**Phase 2 — real transcription.** Implement `TranscriptionProvider` against a real engine. Known constraint: mobile browsers can suspend audio capture when the screen locks or the tab is backgrounded, which is fatal for a 30–60 minute appointment. Expect this phase to require a native wrapper or a native app. Decide that at the start of Phase 2, not the end.

**Phase 3 — real understanding.** Implement `VisitSummarizer`, `RecordInterpreter` and `ChatProvider` with a language model. Answers must be grounded in two things only: the patient's own visits and records, and a clinician-reviewed library of breast cancer content. Every answer cites its source. Build an evaluation set of real patient questions (including the frightening ones) and test the section 5 boundaries before any patient uses it.

**Phase 4 — real patients.** Accounts, encrypted storage, consent flows, and a supervised pilot.

## 10. Privacy, compliance and model choices

This section is planning context, not legal advice. Get health-privacy counsel before any real patient data is collected.

### HIPAA
HIPAA applies to covered entities (providers, plans) and their business associates. A direct-to-consumer app that a patient chooses and uses on her own is generally neither, so HIPAA does not apply by default. A physician merely recommending the app does not change that. HIPAA **would** apply if a hospital or clinic contracts with us to provide the app on its behalf; then we are a business associate and need a BAA.

### What applies instead
- **FTC Health Breach Notification Rule.** Covers health apps outside HIPAA. Since the 2024 amendments, a "breach" includes our own unauthorized disclosure of health data (for example, sending it to an advertising or analytics platform), not only a hack.
- **FTC Act, Section 5.** Privacy promises must be true. Do not write "HIPAA compliant" or "your data never leaves your phone" unless it is.
- **State health-data laws**, notably Washington's My Health My Data Act and California's rules, which require specific consent and carry real penalties.

### Our posture
Build to HIPAA-grade standards anyway: encryption in transit and at rest, strict access control, audit logs, BAAs with every vendor that touches data, and **no third-party ad or analytics trackers anywhere near health data**. Patients will expect it (our reference products all advertise it), and any future hospital partnership will require it.

### Recording consent
Recording laws vary by state. Federal law and most states (including New York) require only one party's consent. Roughly a dozen states, including California, Florida, Illinois, Maryland, Massachusetts, Pennsylvania and Washington, require everyone's consent; published lists disagree at the margins. The product therefore always prompts the patient to tell her doctor, in every state, and should eventually log that she confirmed. Clinics may also have their own policies.

### FDA
Software that explains and educates is generally outside device regulation. Software that gives patient-specific diagnostic or treatment recommendations can be regulated as a medical device. The "explain, never advise" principle is what keeps us on the right side of this; confirm with regulatory counsel before launch.

### Local models versus cloud
The privacy question splits by task:

- **Transcription** is the best candidate for on-device processing. Open speech models run on current phones, and "your audio never leaves your phone" is a strong, true promise. The costs are battery over a long visit, weaker speaker separation, and weaker accuracy on medical vocabulary. This needs a native app.
- **Summarization, record interpretation and chat** are where correctness matters most, and where small on-device models are currently weakest on long transcripts and medical nuance. A wrong explanation of a pathology report is a worse outcome than a well-protected cloud call.

Working recommendation: **transcribe on-device if quality holds up; run understanding in the cloud** under a BAA with zero data retention, sending only the text needed. Keep the audio on the device and let the patient delete it. Re-test small local models at each phase, since they improve quickly. The service interfaces in section 7 make either choice a swap.

### Testing with real people
Until counsel has signed off: synthetic data only. Showing the mock-patient demo to interviewees for feedback is fine. Having a real patient record a real appointment is not, and a study doing so would likely need IRB review.

## 11. Open questions

1. **Name.** "SonoClear" is already the name of a Norwegian medical device company working in oncology (an ultrasound fluid for brain tumor surgery, with an FDA breakthrough designation). Fine as a working title; resolve before anything is public.
2. **Clinical review** of all fixture content and of the future content library.
3. **Photography** source and licensing.
4. **Native versus web** for real recording (Phase 2).
5. **Logo** and whether the three-bar motif carries it.

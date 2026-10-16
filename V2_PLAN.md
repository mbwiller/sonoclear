# Sonoclear v2 — Build Plan

Source: `CONVERSATION.md` (Matt's brain dump, Oct 16). `VISION.md` stays the source of truth for product and design; `PLAN.md` records how v1 was built and the clinical fact sheet every fixture obeys. This file turns the brain dump into decisions, a contract for the new feature, and granular workstreams that Sonnet 5.5 subagents build while the lead (Fable) orchestrates, reviews screenshots, integrates, and verifies.

Run order at a glance: **Phase 1** foundations (one agent) → **Phase 2** four workstreams in parallel → **Gate A** Matt picks the record button → **Phase 3** apply + tests → **Phase 4** three independent reviews → **Phase 5** lead verification and commit.

---

## 0. What v2 is

v1 is a complete, calm, clinically-plausible demo. v2 keeps everything Matt called out as working and makes four changes:

1. **Capture is record-first.** One tap from the tab to recording. The visit-type picker becomes a one-line, pre-filled context chip. The liquid-glass disc is replaced by a button Matt picks from a gallery of on-theme candidates. The During screen loses its "blue".
2. **Records are visual.** Every record gets quiet, on-theme diagrams (where the mass is, how big, what the score means, what the markers are, which labs are in range) so someone with limited health literacy can orient before reading. Imaging records get an image panel (source: open question Q1). Records' "Add a record" button stops shouting.
3. **A fifth tab: Arrange.** A simulated scheduling agent that takes what came out of a visit (MRI, genetic counseling, bloodwork, follow-up, imaging discs), checks the order, looks up locations, "calls" the office, brings back options, and books the one she chooses. Everything it books lands on Journey. Strictly logistics; it never advises.
4. **The demo arc gets a third act.** Record the consult → Arrange the MRI → Journey shows it as Up next.

### Untouched (Matt's positives; do not restyle)
Journey layout and the journey path graphic (he retracted that note: "mobile-first, it looks perfectly great"), the Up next card, open/completed to-dos, the visit page, Profile (especially the care team), Ask (answers, follow-up pills, source chips), the live transcript sheet, the moving recording bars, the processing state, and the visit page's to-dos after a recording. Color tokens and type stay frozen.

---

## 1. Brain dump → decisions

| # | Matt said | Decision | Workstream |
|---|---|---|---|
| 1 | Journey stage line could be enhanced… then "disregard, it looks perfectly great on mobile" | No change. | — |
| 2 | Records' "Add a record" is blue; Records feels aesthetically different from Ask/Journey | `Add a record` becomes a secondary (hairline) pill. The only ink-filled control left on the tab screens is Ask's send button. Record rows get a small sage type glyph (same ones the timeline uses) so the list reads as a set of documents. | W2 |
| 3 | Ultrasound/mammogram records: fake imaging shown graphically; records should be more visual and clearer for limited health literacy | Typed `visuals` on `RecordExplanation`, rendered as inline-SVG "quiet diagrams" in an **At a glance** section under the record header. Imaging records also get an image panel; its source is **Q1**. | W2 |
| 4 | Pathology and the other reports: add on-theme graphical features | Same mechanism: grade scale, marker panel (ER/PR/HER2/Ki-67), Nottingham breakdown, lab range rows, biopsy sequence. | W2 |
| 5 | Record a visit: Start recording must be front and center; who you're seeing minimal or noted at the end | Record control is the first thing on screen. Who-with is a pre-filled one-line chip ("Surgical consult · Dr. Ellery · Mon 10:30 AM") with **Change**, which opens the existing picker in a sheet. See **Q2**. | W1 |
| 6 | The glass button looks AI-generated; the three bars on it are not great; generate a few buttons to pick from | A **record-button gallery** (5 candidates, idle + pressed, with matching Pause/End controls) built on `/styleguide/record`. Screenshots at 390/1280 → Matt picks → **Gate A**. The aura/glass CSS is deleted. | W1a → Gate A → W1b |
| 7 | During recording: keep it on theme, "I like how it looks, but the fact that it's blue" | The ink-filled End pill (and the heavy ink timer) are the blue. Pause/End become controls from the chosen button family; timer stays serif but lighter. See **Q3**. | W1b |
| 8 | Bars will later follow real audio | Optional polish now: bars react to interim transcript chunks (simulated amplitude), decaying between words. Reduced motion respected. | W1b (stretch) |
| 9 | New tab: a booking/scheduler agent; simulated; its own tab rather than inside Ask; maybe an upcharge | **Arrange** tab (name: **Q4**). Service interface `SchedulingAgent` + `ScriptedSchedulingAgent` mock + fixtures, store persistence, Journey integration. No paywall in the demo unless Matt wants a quiet "Plus" label (**Q4**). Logistics only (**Q5**). | W3 + W4 |
| 10 | "…or look into the best treatment options" | Out of scope for the agent: VISION §2 "explain, never advise" and the FDA note in §10. The agent executes what clinicians ordered and arranges logistics. | — |

---

## 2. Open questions for Matt (defaults in bold; the build starts on the defaults unless told otherwise)

- **Q1 · Imaging pictures.** (a) **Illustrated in-theme diagrams only** (clock-face locator, size, BI-RADS scale): no licensing risk, consistent with VISION §6 "no generated images", and more legible to a lay reader than a grayscale study. (b) Also show a real de-identified mammogram/ultrasound from an open dataset. This needs a source Matt approves or supplies (Kaggle/TCIA need logins; MIAS is research-only). If Matt drops files into `public/imaging/`, W2 wires them into an "image study" panel with a sage annotation ring and an honest caption ("Example images from a de-identified teaching set"). Default: (a) now, (b) when files arrive.
- **Q2 · Who you're seeing.** **Pre-filled chip + Change** (one tap to record; the mock transcription needs the visit type at start anyway) vs. ask at the end of the recording. Default: chip.
- **Q3 · "Blue" on the recording screen.** Read as the ink-filled End button and the heavy navy timer. Default: End/Pause take the chosen button family; timer stays serif in ink but smaller and lighter weight. Tell me if "blue" meant something else.
- **Q4 · Tab name and premium framing.** Name: **Arrange** (calm verb, no "AI" or "agent" in the UI) vs. Book / Plan / Concierge. Premium: **none in the demo** vs. a quiet "Sonoclear Plus" eyebrow on the tab's intro state.
- **Q5 · Agent scope.** **Logistics only**: schedule tests and visits the care team ordered, request records, find locations and hours, coordinate dates across offices. Never treatment research or recommendations.
- **Q6 · `sonoclear-logo.jpg`.** Reference only, or should the in-app lockup / PWA icons be regenerated from it? Default: reference only; it already matches the in-app lockup.

---

## 3. Rules that carry over, plus v2 rules

Everything in `PLAN.md` §0 and §7 still applies (screens never import fixtures; no calendar dates outside `lib/dates.ts`; token colors only; native `<dialog>`; `// CLINICAL REVIEW PENDING` on fixtures; the voice). New for v2:

- **Quiet diagrams, not dashboards.** VISION §6 bans dashboards, charts, progress rings and percentages-as-gamification. Visuals here are figures in a note: one idea each, hairline strokes in `ink`/`line-strong`, a single `sage` accent for "you are here", paper fills, a one-line caption in prose. No gridlines, no legends, no tooltips, no color-coding of good/bad (a positive receptor is a sage filled dot; a negative one is a hollow dot; the caption explains). Never red.
- **No gadget look.** The record button is a button, not a device. No gradients, glass, glow, blur, aura, or drop shadows beyond `shadow-soft`.
- **The agent is honest and asks before it acts.** It never books without the patient choosing an option. The Arrange tab says once, quietly, that calls and bookings are simulated in this preview. No "AI", "agent", "assistant" labels; the copy says what Sonoclear did ("Called Linden Health Imaging scheduling").
- **Dates stay relative.** Every option date is `cal.day(offset)` nudged to a weekday; every outcome is consistent with the story (the MRI lands before the follow-up; bloodwork within two weeks of the consult; the disc is ready before the consult).
- **Next 16.4 rules** (from `PLAN.md` §7): read `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md` (Activity: hidden routes stay mounted) and `01-getting-started/03-layouts-and-pages.md` before touching routes. No `Date.now()`/`Math.random()` at module scope. Params arrive as a Promise.

---

## 4. Architecture additions

### 4.1 Navigation
`components/shell/nav-items.ts`: add `{ href: "/arrange", label: "Arrange" }` after Ask (five tabs: Journey · Capture · Records · Ask · Arrange). `tab-bar.tsx` grid becomes `grid-cols-5`. `nav-icon.tsx`: `CalendarCheck` from lucide (outline, stroke 1.5). `activeTab()` maps `/arrange*`. Route `app/(tabs)/arrange/page.tsx` renders `<ClientOnly><ArrangeScreen/></ClientOnly>` like the others.

### 4.2 Types (`lib/types.ts`) — the contract W3 and W4 build against

```ts
/* ---------- Records: visuals ---------- */
export type RecordVisual =
  | { kind: "locator"; side: "left" | "right"; clock: number; distanceCm: number; sizeCm?: number; caption: string }
  | { kind: "scale"; title: string; min: number; max: number; value: number; valueLabel: string;
      marks: { value: number; label: string }[]; caption: string }
  | { kind: "measure"; title: string; cm: number; compare: string; caption: string }
  | { kind: "markers"; title: string; caption?: string;
      items: { label: string; present: boolean | null; value: string; percent?: number; plain: string; term?: Term }[] }
  | { kind: "ranges"; title: string; caption?: string;
      rows: { label: string; value: number; unit: string; low: number; high: number; plain?: string }[] }
  | { kind: "sequence"; title: string; caption?: string; steps: { label: string; detail?: string }[] }
  | { kind: "images"; title: string; note: string;
      images: { src: string; alt: string; caption: string; mark?: { x: number; y: number; r: number; label: string } }[] };

export interface RecordExplanation {
  // existing fields unchanged …
  /** Quiet diagrams shown under the record header. Order is display order. */
  visuals?: RecordVisual[];
}

/* ---------- Arrange ---------- */
export type ArrangeTaskId = string;
export type ArrangeKind = "book" | "request" | "find";

export interface ArrangeTask {
  id: ArrangeTaskId;                 // stable: "arrange-mri", "arrange-genetics", "arrange-bloodwork", "arrange-follow-up", "arrange-imaging-discs"
  kind: ArrangeKind;
  title: string;                     // "Schedule your breast MRI"
  detail: string;                    // one line: what and why, from the visit
  office: { label: string; phone: string };
  sourceVisitId?: VisitId;
  todoId?: TodoId;                   // the to-do this fulfils or updates
  appointmentId?: AppointmentId;     // existing unscheduled appointment this will schedule
  /** Set when another task must be arranged first, e.g. the follow-up waits for the MRI. */
  waitsFor?: { taskId: ArrangeTaskId; reason: string };
}

export interface ArrangeOption {
  id: string;
  title: string;                     // "Thursday, October 29 at 8:15 AM"
  date: ISODate;
  location: string;
  detail?: string;                   // "Earliest opening · about 45 minutes"
}

export interface CallLine { speaker: "sonoclear" | "office"; text: string }

export type AgentEvent =
  | { type: "step"; id: string; text: string }                         // a step starts (shows live bars)
  | { type: "step-done"; id: string; result?: string }                 // it finished; optional one-line result
  | { type: "call"; office: string; phone: string; lines: CallLine[] } // simulated call, shown collapsed
  | { type: "options"; prompt: string; options: ArrangeOption[]; note?: string } // plan() ends here
  | { type: "outcome"; outcome: ArrangeOutcome }                       // confirm() (or a no-choice plan()) ends here
  | { type: "limit"; text: string };                                   // honest limitation

export interface ArrangeOutcome {
  summary: string[];                 // 1–3 short paragraphs, voice per VISION
  appointment?: Appointment;         // new, or the same id as an existing unscheduled one (then it replaces it)
  resolvedTodoIds?: TodoId[];        // to-dos this fulfils ("Schedule your MRI" is done once scheduled)
  todoUpdate?: { id: TodoId; detail: string; dueHint?: string }; // to-dos that stay open but now have a plan
  prep?: string[];                   // what to bring or know
  reference?: string;                // "LH-MRI-20931"
}

export interface Arrangement {
  id: string;
  taskId: ArrangeTaskId;
  optionId?: string;
  outcome: ArrangeOutcome;
  log: AgentEvent[];                 // what was shown, replayable on the Arranged detail view
  arrangedAt: ISODate;
}
```

`Todo` gains `arrangedById?: string` (set when an arrangement resolved it). `TodoOverride` gains `arrangedById?: string`. `PatientContext` and `PatientSeed` gain `arrangements: Arrangement[]` on the context only (seed has none).

### 4.3 Service interface (`services/types.ts`)

```ts
export interface SchedulingAgent {
  /** What could be arranged right now, from the patient's to-dos and appointments. Pure. */
  tasks(patient: PatientContext): ArrangeTask[];
  /** Works a task up to the point where the patient must choose (ends with "options"), or straight to an outcome. */
  plan(input: { task: ArrangeTask; patient: PatientContext }): AsyncIterable<AgentEvent>;
  /** Books the chosen option (ends with "outcome"). */
  confirm(input: { task: ArrangeTask; optionId: string; patient: PatientContext }): AsyncIterable<AgentEvent>;
}
```
`services/index.ts` adds `scheduling: new ScriptedSchedulingAgent()`. A real implementation later is one class.

### 4.4 Store and care (`lib/store.ts`, `lib/persisted.ts`, `lib/care/index.ts`)
- `DemoData.arrangements: Arrangement[]`; actions `addArrangement(a)` (also applies `resolvedTodoIds` as overrides with `arrangedById`, and `todoUpdate`), persisted and validated (`isArrangement`), shifted by `anchorDay` like visits (`shiftArrangement`: `arrangedAt`, `outcome.appointment.date`). `resetDemo` clears them.
- `deriveCare`: after appointments are built from the seed, apply each arrangement's `outcome.appointment` (replace by id, else append; status `"scheduled"`). Apply `todoUpdate` to the matching to-do's `detail`/`dueHint`. Expose `arrangements`, `arrangementByTaskId`.
- `CareView` gains `arrangements`, `arrangementByTaskId: Map<ArrangeTaskId, Arrangement>`.
- `getPatientContext()` includes `arrangements`.
- `components/ask/ask-store.ts` needs nothing; the scripted "next steps" answer already reads live to-dos.

### 4.5 Fixtures
- `fixtures/places.ts`: Linden Health locations (Westgate, Riverside, Elm Street lab, Suite 300), fictional addresses, distances, hours. `// CLINICAL REVIEW PENDING`.
- `fixtures/arrange/{imaging-discs,mri,genetics,bloodwork,follow-up}.ts`: each exports `task(ctx)`, `plan(cal, ctx)` and `confirm(cal, ctx, optionId)` as event arrays with per-event delays. `fixtures/arrange/index.ts` lists them.
- `fixtures/records/*.ts`: add `visuals` to the five records; `fixtures/uploads.ts`: add visuals to the sample upload.

---

## 5. Workstreams

Each workstream is one subagent brief. The lead writes the brief from this section, points at files, and reviews screenshots. Agents verify their own work with `npx tsc --noEmit -p .`, `npx eslint <files>`, and `node scripts/shoot.mjs <routes> --name <ws>` at 390 and 1280, then **look at every PNG**. The dev server runs on :3000 during the build; agents never start a second one and never run `next build`.

### W0 · Foundations (Phase 1) — Sonnet 5.5, effort **high**
Goal: the contract in §4 exists and compiles; the fifth tab exists with a placeholder; nothing visible changes elsewhere.
- [ ] Add §4.2 types verbatim to `lib/types.ts`; §4.3 interface to `services/types.ts`.
- [ ] `services/mock/scripted-scheduling.ts`: `ScriptedSchedulingAgent` stub (`tasks()` returns `[]`, `plan`/`confirm` yield one `limit` event). Register in `services/index.ts`.
- [ ] Store: `arrangements` + `addArrangement` + guards + shifting + `resetDemo`. Unit test: restore drops malformed arrangements; shifts dates.
- [ ] `deriveCare`: merge arrangements per §4.4; `getPatientContext` includes them. Unit test: an arrangement that schedules `appt-breast-mri` makes it `nextAppointment` after the consult, and resolves its to-do.
- [ ] Nav: five tabs, icon, `activeTab`, route, `ArrangeScreen` placeholder (title "Arrange", one honest line).
- [ ] e2e: `a11y.spec.ts` ROUTES gains `/arrange`; nothing else breaks (`npm run test:unit`; the e2e suite runs in Phase 3).
- [ ] `RecordExplanation.visuals` is optional, so existing fixtures compile unchanged.
Acceptance: typecheck, lint, unit tests green; `/arrange` renders at both widths; tab bar has five evenly spaced items with the sage indicator working.

### W1a · Capture: record-first layout + button gallery (Phase 2) — Sonnet 5.5, effort **high**
Files: `components/capture/before-view.tsx`, `capture-state.ts`, `app/globals.css` (delete `.record-aura`, `.glass-disc`), new `components/capture/visit-chip.tsx`, `components/capture/who-sheet.tsx`, new `app/styleguide/record/page.tsx` + `components/styleguide/record-buttons.tsx`.
- [ ] **Layout (390 first):** title "Record a visit" stays small; the record control sits in the upper-middle of the first viewport with its label and the consent line; nothing else competes. Desktop: same, centered in the note column.
- [ ] **Visit chip:** one line above the control: `Surgical consult · Dr. Ellery · Monday 10:30 AM` + quiet `Change`. Derived from `captureDefaults`/`nextAppointment`. With no upcoming appointment it reads `Other visit · Change`. The honest preview note (`previewNote`) moves into the sheet.
- [ ] **Who sheet:** the existing `VisitTypePicker` radio group + clinician name field inside `Sheet`, title "Who are you seeing?", footer `Done`. Keyboard and a11y as today (role=radiogroup, roving tabindex). Recording always works in one tap; the sheet is optional.
- [ ] **Gallery** at `/styleguide/record`: five candidates, each shown idle and pressed, in a paper frame at real size, each with its matching Pause/End pair for the During screen so the family is coherent. Candidates:
  1. **Ink disc** — solid `ink` circle (96px / 112px desktop), small `paper` rounded-square glyph in the centre (classic record/stop language), label below.
  2. **Hairline ring** — `surface` disc with a 1.5px `line-strong` ring and a `sage` filled dot at centre; pressed state fills `sage-soft`.
  3. **Pill** — a full-width `lg` primary pill "Start recording" with the thin three-bar nav glyph; the least gadget-like, most like the rest of the app.
  4. **Sage-soft disc** — `sage-soft` fill, `sage` hairline, word "Record" set in the display serif inside the disc; a slow 4s breathe on the ring only (none under reduced motion).
  5. **Concentric** — `sunken` outer ring, `ink` inner disc with the thin bar glyph in `paper` (the nav icon, not the chunky Bars).
  Rules: no gradient, glass, glow, blur or shadow (except `shadow-soft` on at most one candidate); 44px+ targets; the same `aria-describedby` consent wiring as now.
- [ ] Wire candidate 3 (pill) as the temporary live button so the page is coherent before Gate A.
- [ ] Shots: `/capture` and `/styleguide/record` at both widths, plus the During view via a setup file. Zero console errors.
Acceptance: first viewport on 390×844 shows title, chip, button, label, consent line, with the tab bar; `recordSurgicalConsult` in e2e still works by the accessible name "Start recording" (the test's "Breast surgeon radio is checked" step will be updated in W5 to assert the chip text).

### Gate A (Matt) — pick the button
The lead posts the gallery screenshots; Matt picks a candidate (or a mix). Also closes Q1 if images have been supplied.

### W1b · Capture: apply the pick + During polish (Phase 3) — Sonnet 5.5, effort **medium**
- [ ] Replace the temporary pill with the chosen candidate; delete the other candidates from the live code (keep the gallery route as documentation).
- [ ] `recording-overlay.tsx`: Pause/End from the chosen family; timer `text-[3.25rem]` serif, `font-weight 400`, `ink` with `tabular`; "Recording" line stays `sage-ink`. Keep End as the obvious primary action without an ink fill (see Q3).
- [ ] Stretch: simulated amplitude. `capture-store` tracks `lastInterimAt`; `DuringView` sets `--bars-energy` (0–1, decaying over ~600ms) and `.bars[data-live]` scales its amplitude by it. Off under reduced motion.
- [ ] Shots before/after at both widths.

### W2 · Records: visuals and tone (Phase 2) — Sonnet 5.5, effort **high**
Files: new `components/records/visuals/{locator,scale,measure,markers,ranges,sequence,images,index}.tsx`, `record-screen.tsx`, `records-screen.tsx`, `fixtures/records/*.ts`, `fixtures/uploads.ts`, `components/styleguide/styleguide.tsx` (a "Figures" block).
- [ ] **Locator**: an SVG breast outline (front view, both breasts as two simple arcs with nipple marks, no anatomical detail beyond that), the affected side labelled "Left" from her point of view, a dashed clock ring with 12/3/6/9 ticks, a `sage` filled dot at the clock position scaled by distance, an optional size ring. Caption: "2 o'clock, about 6 cm from the nipple. A little over half an inch across." Clock numbers are small `ink-muted` captions. Must read correctly mirrored: left breast on the viewer's right? **No** — label it and keep it simple: show only the affected breast, large, labelled "Your left breast, as a doctor facing you sees it." Lead reviews.
- [ ] **Scale**: a horizontal hairline with tick marks and labels (BI-RADS 0–6; grade 1–3; Nottingham 3–9), the patient's value as a `sage` dot with its label above. No fills between ticks.
- [ ] **Measure**: 1.4 cm drawn to scale next to a hairline ruler (cm ticks) and one everyday comparison in words only ("about the size of a blueberry"). No clip art.
- [ ] **Markers**: a row of four tiles (ER, PR, HER2, Ki-67): label, value ("Positive · 95%"), a sage filled dot for present / hollow `line-strong` dot for absent / a small number for Ki-67, plain line under. Tappable term via `TermLink`.
- [ ] **Ranges**: each row a label, the value in `ink`, and a hairline range bar with low/high ticks and a `sage` dot where the value sits. Caption: "Every result is inside the reference range." Only the 7 key labs, not all 38.
- [ ] **Sequence**: a vertical hairline with numbered steps (biopsy: numb → sample → marker clip → mammogram → to the lab → results in 3–5 days).
- [ ] **Images** (only if Q1 provides files): a dark `ink`-tinted panel, the image, a `sage` ring at `mark`, caption and the honest note. Otherwise the component exists but no fixture uses it.
- [ ] **Record page**: new section `At a glance` directly under the header chips, before `In plain words`, rendering `explanation.visuals` in order inside one `Card`, figures separated by hairlines. Mobile: figures stack; desktop: locator + scale may sit side by side.
- [ ] **Fixtures**: screening (locator UOQ, BI-RADS scale at 0), diagnostic (locator 2 o'clock 6 cm 1.4 cm, measure, BI-RADS at 5), biopsy (sequence, locator), pathology (markers, grade scale, Nottingham scale), labs (ranges). Sample upload: BI-RADS at 1.
- [ ] **Records list**: `Add a record` → `variant="secondary"`; each row gets the sage type glyph (`FileText`/`Microscope`/`FlaskConical`/`Dna`/`File`, stroke 1.5) at the left like timeline rows.
- [ ] Styleguide "Figures" block showing each visual once.
- [ ] Shots: `/records`, all five `/record/*` at both widths, plus the sample-upload result.
Acceptance: axe clean (`role="img"` + `aria-label` on each figure, with the caption as visible text); no sideways scroll at 390; no color outside tokens; the design critic can't call any figure a chart.

### W3 · Arrange: data and the mock agent (Phase 2) — Sonnet 5.5, effort **high**
Files: `fixtures/places.ts`, `fixtures/arrange/*.ts`, `services/mock/scripted-scheduling.ts`, `tests/unit/arrange.test.ts`.
- [ ] **Tasks** from context: before the consult → `arrange-imaging-discs` (request; from `todo-imaging-discs`). After the consult → `arrange-mri` (book; `appt-breast-mri`; resolves `*-schedule-mri`), `arrange-genetics` (book; `appt-genetic-counseling`; resolves `*-book-genetics`), `arrange-bloodwork` (find; new appointment "Pre-op bloodwork"; `todoUpdate` on `*-preop-bloodwork`, which stays open until drawn), `arrange-follow-up` (book; new appointment "Follow-up with Dr. Ellery"; `waitsFor: arrange-mri`; resolves `*-book-follow-up`). A task disappears once its to-do is done or its arrangement exists.
- [ ] **Scripts** (steps are ~1.1–1.6 s apart; a `call` event sits where the call happens; an `options` event ends `plan`):
  - MRI: read consult notes → check the order → look at MRI locations (Westgate 3 mi, Riverside 8 mi) → call (617) 555-0168 → three openings. Options: Westgate `cal.day(13)` 8:15 AM (earliest), Westgate `cal.day(18)` 4:40 PM, Riverside `cal.day(15)` 10:00 AM. Confirm: hold → confirm → outcome with reference, prep ("Arrive 15 minutes early. No metal. Contrast dye goes through a vein in your arm; they'll ask about allergies and kidney health first."), appointment note updated, `Added to your journey.`
  - Genetics: call (617) 555-0175 → "your referral from Dr. Ellery arrived" → options in person `cal.day(9)` 2:00 PM, video `cal.day(11)` 11:30 AM, in person `cal.day(14)` 9:00 AM. Prep: what she knows about her mother's diagnosis; relatives on both sides.
  - Bloodwork: check the order (CBC + BMP, any Linden Health lab, within two weeks, no fasting) → labs and hours → options: Westgate walk-in the same morning as the MRI (coordination; only if the MRI is arranged, else Westgate any weekday), Elm Street walk-in, Suite 300 by appointment. Outcome: appointment + `todoUpdate`.
  - Follow-up: gated on the MRI; call (617) 555-0162 → "results usually reach Dr. Ellery within two business days" → options after the MRI and genetics (`cal.day(20)`, `cal.day(22)`, `cal.day(25)`). Prep: bring the booklet questions.
  - Imaging discs: read the results visit → call (617) 555-0147 → options: pick up at Westgate front desk after 2 PM tomorrow (`cal.day(1)`), or mail (3–5 days, with the agent's note that mail may not arrive before Monday's consult). Outcome: `todoUpdate` with pickup detail; to-do stays open.
- [ ] Every date via `cal.day()` nudged to a weekday (reuse `weekdayOnOrAfter` from `fixtures/notes/surgical-consult.ts`; move it to `lib/dates.ts` as `weekdayOnOrAfter(cal, offset)`).
- [ ] Call lines: 4–6 short exchanges, plain, no exclamation marks, the office never gives medical advice.
- [ ] Mock pacing via `delay()`; a consumer that stops iterating stops the script (check `return`).
- [ ] Unit tests: tasks before/after the consult; `plan` ends with `options` and dates are weekdays after today; `confirm` ends with `outcome` whose appointment is scheduled; the follow-up waits for the MRI; the bloodwork option coordinates with an arranged MRI; no text contains "!" or "AI".
Acceptance: typecheck, lint, unit tests green; voice review by the lead on all strings.

### W4 · Arrange: the screen (Phase 2, against the §4 contract) — Sonnet 5.5, effort **high**
Files: `components/arrange/{arrange-screen,task-card,agent-run,run-store,call-summary,option-list,outcome-view,arranged-list}.tsx`, `components/ui/todo-row.tsx` (an "Arranged" line), `app/(tabs)/arrange/page.tsx`.
- [ ] **Home**: serif title "Arrange", one line: "Sonoclear can call and book the things your care team asked for." Sections: **To arrange** (task cards: title, detail line, office, an `Arrange this` secondary pill; gated tasks show the `waitsFor.reason` instead of the button), **Arranged** (compact rows: title, when/where, reference; tap opens the replayed log), **Already booked** (upcoming scheduled appointments, read-only). Empty states are typographic and honest. At demo start the only task is the imaging discs, plus "After your surgical consult, anything Dr. Ellery asks for will show up here."
- [ ] **Run view**: a full-screen layer like Capture's `FullScreen` (so it reads as "Sonoclear is working"), eyebrow with the task title, then a vertical list of steps: live `Bars size="xs"` while working, a sage check when done, the one-line result in `ink-muted`. A `call` event renders as a collapsed `Disclosure` "What was said on the call" with the lines set like the transcript (speakers "Sonoclear" and the office). `aria-live="polite"` announces each step once.
- [ ] **Options**: serif prompt ("Which works for you?"), a radio list of 2–3 options (date, time, location, detail), `Book this one` primary action (the only ink-filled control on this screen), `Not now` quiet. Nothing is booked until she taps.
- [ ] **Confirming**: the same step list continues; then the **outcome**: a `Card` with the appointment (date, time, location, reference), "Added to your journey" with a link to Journey, prep lines as a short list, and `Done`. A quiet caption: "In this preview, calls and bookings are simulated. Nothing was sent to any office."
- [ ] **Run store** (`run-store.ts`, zustand, module level like Capture): phases `idle → planning → choosing → confirming → done | failed`; cancel at any time; a generation counter so a cancelled run can't write. On `outcome`, call `addArrangement` and show the outcome. Survives tab switches; Reset demo clears it.
- [ ] **Journey hooks**: `UpNextCard` already shows the scheduled MRI; `TodoRow` shows "Arranged · Thu, Oct 29 at Westgate" under a to-do an arrangement resolved; the timeline's appointment rows show the new location.
- [ ] Shots at both widths: home before and after the consult; each run phase via setup files; the outcome; Journey after arranging.
Acceptance: axe clean; keyboard reaches every control; the run never dead-ends (cancel always returns to home); zero console errors.

### W5 · Tests and the demo arc (Phase 3) — Sonnet 5.5, effort **medium**
- [ ] `tests/e2e/fixtures.ts`: `recordSurgicalConsult` asserts the visit chip text instead of the radio; add `arrangeMri(page)`.
- [ ] `demo-arc.spec.ts`: after the consult, go to Arrange → arrange the MRI → pick the first option → confirm → Journey's Up next shows "Breast MRI"; survives reload; Reset clears it.
- [ ] `flows.spec.ts`: the who-sheet changes the visit type and the honest note still appears for PCP; the follow-up task waits for the MRI; cancel mid-run returns home; the discs task exists before the consult.
- [ ] `a11y.spec.ts`: `/arrange`, `/styleguide/record`, a run in the options state, a record page's figures.
- [ ] Unit: W0 and W3 tests pass; `tests/unit/store.test.ts` covers arrangements restore/shift.
- [ ] `npm test` green at both widths; fix flakiness from timed scripts with `expect(...).toBeVisible({ timeout })`, never `waitForTimeout` beyond what the existing tests already use.

### W6 · Reviews (Phase 4) — three agents in parallel
- **Design critic** — Sonnet 5.5, effort **high**. Full-page shots of every route at 390 and 1280, judged against VISION §6 and the v2 rules in §3. Must name concrete fixes with file and line. Special attention: the record button family, the figures (are they charts?), the Arrange run (does it look like a chat or a terminal?), five-tab bar spacing.
- **Clinical voice and safety** — Sonnet 5.5, effort **medium**. Every new fixture string (arrange scripts, call lines, prep notes, figure captions). Checks: no advice, no reassurance theatre, no statistics, plain words first then the term, facts agree with `PLAN.md` §3, MRI/genetics/bloodwork logistics plausible, no exclamation marks. Flags for the oncologist's pass.
- **Code and architecture** — Sonnet 5.5, effort **high**. Contract adherence (§4), screens never import fixtures, dates only via `lib/dates.ts`, store validation and shifting, Activity-safe effects (timers cleaned on hide), run-store generation guards, no module-scope `Date`, bundle hygiene (no unused candidates in live code).
Lead triages the three reports into one fix list and dispatches fix agents (medium).

### W7 · Lead integration and verification (Phase 5)
- [ ] `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` all green.
- [ ] Walk the demo arc by hand in the browser at 390 and 1280; GIF of the arc for Matt.
- [ ] Update `README.md` (five tabs, the new arc, the gallery route) and append a v2 outcome section to this file.
- [ ] Commit on a `v2` branch at the end of Phase 3 and again after Phase 4, with Matt's okay.

---

## 6. Orchestration

| Phase | Who | Parallel | Gate |
|---|---|---|---|
| 0 | Lead | — | Matt answers Q1–Q6 (or accepts defaults) |
| 1 | W0 | 1 agent | typecheck/lint/unit green; `/arrange` placeholder at both widths |
| 2 | W1a · W2 · W3 · W4 | 4 agents | each agent's shots reviewed by the lead; W3 strings voice-checked |
| A | Matt | — | picks the record button from the gallery shots; Q1 images if any |
| 3 | W1b · W5 | 2 agents | `npm test` green at both widths |
| 4 | W6 (3 reviewers) → fix agents | 3 then 1–3 | all findings closed or consciously deferred |
| 5 | Lead | — | definition of done |

Context handling: each brief carries the relevant §4 contract and §5 checklist verbatim, the file list, the Next 16.4 rules, and the verify steps. Agents report back with: files touched, shots taken, what they could not do. The lead never merges a workstream without looking at its screenshots.

---

## 7. The demo arc, v2

Journey (Up next: surgical consult) → open the results visit → open the pathology report, now with **At a glance** figures → Ask the ER/HER2 question → Capture: one tap on the record button (the chip already says who) → End → the consult's notes and to-dos → **Arrange**: four things to arrange; arrange the MRI, watch Sonoclear check the order, look up locations and call scheduling, pick Thursday 8:15 at Westgate, confirm → Journey: Up next is the breast MRI, the "Schedule your MRI" to-do is done, the timeline shows it under Treatment planning.

---

## 8. Definition of done

- The v2 arc runs end to end as a Playwright test at 390 and 1280 with no dead ends, and survives a reload and a Reset.
- Build, lint, typecheck, unit and e2e all green; axe has zero serious/critical issues on every route and in the run states.
- Every new screen reviewed from screenshots at both widths against VISION §6 and §3 of this file.
- No fixture imports outside `services/mock`; no calendar dates outside `lib/dates.ts`; no color outside the tokens; the glass/aura CSS is gone.
- The three reviews' findings are closed or listed as deferred with a reason.

## 9. Risks and how they're handled

- **Imaging pictures (Q1)**: licensing and the "no generated images" rule. Default to diagrams; the image panel is ready for files Matt supplies.
- **Five tabs on 390px**: labels at 12px may crowd; the design critic checks; fallback is 11.5px with tighter tracking, never dropping labels.
- **Timed scripts in e2e**: Arrange runs take ~10 s; tests use generous `toBeVisible` timeouts and the `fast` replay setting where relevant.
- **Scope creep in the agent**: anything beyond logistics is refused in the brief; the clinical reviewer checks.
- **Activity/hidden routes**: the run store and timers follow the Capture pattern (module-level store, cleanup on hide) so a half-finished run never leaves the app inert.

---

## 10. Outcome (end of the v2 build session, Oct 16, 2026)

**Delivered.** Record-first Capture with an auto-filled visit chip ("Now/Next", clinician-held appointments only) and a Change sheet; the record button chosen from a five-candidate gallery (Matt picked 4, the Sage disc, with a darker pressed state) with matching Resume/End discs; a minimal recording screen with a quiet timer and bars that react to incoming words. Records gained typed figures (locator, scales, measure, markers, ranges, sequence, images) rendered in an "At a glance" section, with real de-identified mammogram views from the DMID dataset standing in for Claire's (`public/imaging/SOURCE.md`). A fifth tab, Arrange, with a `SchedulingAgent` interface, a scripted mock, five task scripts (imaging discs before the consult; MRI, genetic counseling, bloodwork and the surgeon follow-up after it), persistence with validation and date shifting, Journey integration, and a run view that asks before it books.

**Verification.** `npm run typecheck`, `npm run lint` clean. `npm run test:unit`: 101 tests (restore and shifting with garbage logs, care merge with arrangements, every Arrange script under a faked clock across weekdays and DST, Capture matching, the run store, figure edge inputs). `npm run test:e2e`: 110 tests at 390 and 1280 (the v2 demo arc through arranging the MRI, reload and Reset, the Change sheet, the follow-up gate on MRI and genetics, cancel mid-run, axe on every route and the run's choosing state).

**Reviews run and addressed.** Design critique (0 blockers; the navy image panel, options order, phone wrapping, to-do handoff into Arrange and the Capture chip fixed; BI-RADS and Nottingham number lines kept by Matt's decision), clinical voice and safety (0 must-fix; follow-up now waits for both the MRI and genetics, the Suite 300 draw has a call, prose carries no baked dates, "cancer cells", lab terms explained, identity check on every call), code and architecture (6 bugs fixed: log validation, dates out of persisted prose, chip/link agreement, completion ordering, Arranged list sourced from arrangements, image box reservation; abortable streams added).

**Decisions made in the build.**
- The dataset images are presented in-world as Claire's; attribution lives in `public/imaging/SOURCE.md` and the README, not in her record. The CC view was not flipped to match the story's quadrant, since the MLO cannot be flipped without putting the chest muscle at the bottom.
- `Arrangement.log` is a historical replay whose prose is never rewritten when the demo's dates shift; only its option dates move.
- The seed follow-up to-do's hint now reads "Once your MRI and genetic counseling dates are set".
- `(617) 555-0180` is the Linden Health Laboratory line (added to the fact sheet).
- Unchosen record-button candidates stay in the styleguide gallery as documentation.

**For the oncologist's pass** (from the clinical review): pre-op breast MRI as routine with contrast and cycle timing; same-site blood draw before contrast; "holds until end of day" realism; a video first genetics visit and a follow-up booked before genetic results; "results reach the surgeon within two business days"; HER2 1+ shown as negative without HER2-low nuance; the dataset mass sits lower than the story's 2 o'clock and the dataset report reads 4c against the story's 5; disc release rules; identity verification on third-party calls; a walk-in draw shown as a scheduled appointment.

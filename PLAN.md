# Sonoclear MVP — Build Plan

This plan turns `VISION.md` into a working MVP in a single session. `VISION.md` stays the source of truth; this file records *how* we build it, the decisions we made where the vision is silent, and the shared clinical fact sheet every fixture is written against.

---

## 0. Ground rules for everyone (humans and agents)

1. Read `VISION.md` sections 2, 5, 6 before writing UI. Section 6 ("zero AI feel") is a hard requirement.
2. **Screens never import `@/fixtures/*`.** Screens use hooks in `lib/care/*`, which call `services/index.ts`. ESLint enforces this.
3. **No calendar dates anywhere except `lib/dates.ts`.** Fixtures use `day(offset)` helpers relative to `DEMO_TODAY`.
4. Tailwind's default palette is **removed** (`--color-*: initial`). Only token colors exist, so pink/red/purple literally cannot be used.
5. No `alert`/`confirm`/`prompt`. Confirmations use our Sheet.
6. Every string is real and specific to Claire. No lorem, no "Lorem", no "TODO" visible in UI.
7. Every fixture file starts with `// CLINICAL REVIEW PENDING`.
8. Voice: calm friend, second person, short sentences, plain words first then the term. No exclamation marks, no "I'm sorry", no cheerleading, no survival statistics, no treatment recommendations.

## 1. Stack and decisions

| Area | Decision | Why |
|---|---|---|
| Framework | Next.js 16.4 App Router, React 19.3, TypeScript strict | Latest stable (vision §7) |
| Styling | Tailwind v4, CSS-first `@theme` tokens in `app/globals.css`, default palette and shadows reset | Tokens are the only colors that exist |
| Fonts | `next/font/google`: Newsreader (display serif), Instrument Sans (UI sans) | Vision §6 |
| Icons | `lucide-react`, `strokeWidth={1.5}`, outline only, used sparingly | One thin-stroke set |
| State | Zustand + `persist` to `localStorage` (deltas only; seed is recomputed from fixtures every load so dates never go stale) | Vision §7 |
| Rendering | Shell (nav) renders on the server; page content renders client-side after mount via a hydration gate, with a 200ms fade | Dates are relative to the viewer's "today" and state lives in localStorage; avoids hydration mismatch |
| Dialogs/sheets | Native `<dialog>` with `showModal()` (focus trap, Esc, inert background for free), styled as bottom sheet on mobile / centered panel on desktop | Accessible without a component library look |
| Testing | Playwright (system Chrome channel) for the demo-arc e2e at 390px and 1280px, `@axe-core/playwright` for WCAG checks, screenshot script for design gates | "No dead ends" is testable |
| PWA | `app/manifest.ts`, generated PNG icons (three-bar mark), `apple-icon`, theme color `#F8F7F3` | Installable to home screen |

### Decisions where VISION is silent

- **DEMO_TODAY** = local start-of-day of the viewer's current date. Fixture events are day offsets from it. Captured visits and uploads store absolute timestamps.
- **Journey stages at demo start:** Screening, Diagnostic imaging, Biopsy = done; **Diagnosis = current**; Treatment planning, Treatment, Follow-up = ahead. Recording the surgical consult sets **Treatment planning = current** (via `stageUpdate`).
- **Resolved to-dos:** the consult notes include `resolvedTodoIds` for pre-consult to-dos the visit covered (discs brought, questions asked, genetic counseling referral made). They show as done with "Covered at your surgical consult". The patient can uncheck them.
- **Capture pre-selects** the next scheduled appointment (Breast surgeon, Dr. Marcus Ellery). Choosing another visit type replays a short generic check-in fixture, and the summarizer honestly says full notes for that visit type aren't available in this preview. No dead ends.
- **Ending a scripted recording early** fast-forwards the fixture so the visit is complete (documented in the mock). The duration chip uses the fixture's length.
- **Replay speed** setting lives in Profile → "Preview settings" (Real time / Demo / Fast). Default: Demo.
- **Ask, question 2** adapts to state: before the consult it is "What happens between now and my surgery consult?"; after it, "What happens between now and my surgery?" with an updated, grounded answer. Still exactly three working questions.
- **Advice-seeking questions** ("should I…", "which surgery…", "what are my chances…", "second opinion…") get the boundary redirect from vision §5, not the generic fallback. Everything else gets the generic fallback.
- **Record uploads:** photo (downscaled to ≤1200px JPEG before storing), PDF (name and size stored; file itself not kept in this preview, said honestly), pasted text. A "Use a sample report" link fills the paste box with last year's screening report so the interpreted path is demoable. Unmatched uploads go to "Other" with the honest preview note.
- **Photography:** no licensed photos are available in this session, and generated images are banned. Empty states are typographic only. Logged under Open questions.
- **Chat history** lives in memory for the session (not persisted).

## 2. Architecture

```
app/
  layout.tsx                 fonts, metadata, viewport, <AppShell>
  page.tsx                   redirect → /journey
  (tabs)/journey|capture|records|ask/page.tsx
  visit/[id]/page.tsx  record/[id]/page.tsx  profile/page.tsx  styleguide/page.tsx
  manifest.ts  icon.png  apple-icon.png
components/
  ui/        primitives (Button, Chip, Card, Sheet, Eyebrow, BarsIndicator, TodoRow, TermLink, SourceChip, PageHeader, Contours, Logo …)
  shell/     AppShell, TabBar, Sidebar, HydrationGate
  journey/ capture/ visit/ records/ ask/ profile/
services/
  types.ts                   TranscriptionProvider, VisitSummarizer, RecordInterpreter, ChatProvider, PatientDataSource
  mock/                      ScriptedTranscriptionProvider, FixtureVisitSummarizer, FixtureRecordInterpreter, ScriptedChatProvider, FixturePatientDataSource
  index.ts                   the ONE place implementations are chosen
fixtures/                    typed TS, `// CLINICAL REVIEW PENDING`
  patient.ts clinicians.ts stages.ts appointments.ts glossary.ts
  records/{screening-mammogram,diagnostic-imaging,biopsy-procedure,pathology,baseline-labs,index}.ts  visits.ts
  transcripts/{diagnostic-imaging,biopsy,results,surgical-consult,generic-checkin}.ts
  notes/{surgical-consult,generic}.ts  chat.ts  uploads.ts
lib/
  types.ts dates.ts store.ts tokens.ts cn.ts
  care/                      hooks: useCare(), useJourney(), useVisit(id), useRecord(id), usePatientContext(); actions
tests/e2e/                   demo-arc.spec.ts, a11y.spec.ts
scripts/                     shoot.mjs (screenshots), make-icons.mjs, contours.mjs
```

**Data flow:** `services.patientData.loadSeed(DEMO_TODAY)` → seed (patient, clinicians, stages, visits, records, todos, appointments, currentStageId). The Zustand store persists only deltas (to-do overrides, captured visits, uploaded records, settings). `lib/care` merges seed + deltas into memoized views. Screens read views and call actions. Capture calls `services.transcription` and `services.summarizer`; Records calls `services.recordInterpreter`; Ask calls `services.chat`.

## 3. Clinical fact sheet (all fixtures must agree with this)

Fictional health system: **Linden Health**. Phone numbers use the fictional 555-01xx range.

**Patient.** Claire Donovan, 47 (DOB = DEMO_TODAY − 47 years − 143 days). Left breast. Mother diagnosed with breast cancer at 52 (treated, alive; Claire does not know the details of her mother's tumor type). No known genetic testing in the family. No prior breast problems; last screening mammogram one year earlier was normal (BI-RADS 1). Heterogeneously dense breasts.

**Care team**
| Clinician | Role | Practice | Phone |
|---|---|---|---|
| Dr. Priya Raman | Primary care physician | Linden Health Primary Care, Elm Street | (617) 555-0131 |
| Dr. Hannah Whitfield | Breast radiologist | Linden Health Breast Imaging, Westgate | (617) 555-0147 |
| Dr. Marcus Ellery | Breast surgeon | Linden Health Breast Surgery, Suite 300 | (617) 555-0162 |
| Linden Health Imaging scheduling | MRI scheduling | — | (617) 555-0168 |
| Linden Health Cancer Genetics | Genetic counseling | — | (617) 555-0175 |
| Linden Health Laboratory | Lab line (walk-in hours, orders) | Westgate, Elm Street, Suite 300 draw station | (617) 555-0180 |

**Events (offsets in days from DEMO_TODAY)**
| Offset | Event | Facts |
|---|---|---|
| −32 | Screening mammogram (Linden Health Imaging, Westgate). Record only. | Possible mass, left breast upper outer quadrant. Heterogeneously dense (category C). **BI-RADS 0** (incomplete, additional imaging needed). Called back next day. |
| −25 | Diagnostic mammogram + ultrasound, Dr. Hannah Whitfield. Recorded visit + imaging report. | Irregular mass with spiculated margins, **left breast 2 o'clock, 6 cm from the nipple**, ultrasound size **1.4 × 1.1 × 1.2 cm**, hypoechoic. Left axillary ultrasound: **no suspicious lymph nodes**. Right breast: no suspicious findings. **BI-RADS 5** (highly suggestive of malignancy). Recommendation: ultrasound-guided core needle biopsy. |
| −19 | Ultrasound-guided core needle biopsy, Dr. Whitfield. Short recorded visit (+ brief procedure note record). | 14-gauge needle, **3 core samples**, local anesthetic (lidocaine), **titanium marker clip** placed, post-procedure mammogram confirmed clip position. Aftercare: ice pack 15–20 min at a time, acetaminophen for soreness, no heavy lifting or strenuous exercise for 24 hours, bruising is common. Results in about 3–5 business days, sent to Dr. Raman. |
| −14 | Results visit, Dr. Priya Raman. Recorded visit + pathology report. | **Invasive ductal carcinoma** (also called invasive carcinoma of no special type), **Nottingham grade 2** (tubules 3, nuclei 2, mitoses 1; score 6 of 9). **ER positive, 95%, strong. PR positive, 80%, moderate to strong. HER2 negative (IHC 1+).** Ki-67 about 15%. Lymphovascular invasion not identified in the cores. Pathologist: Dr. Samuel Okafor, Linden Health Pathology. Dr. Raman referred her to Dr. Ellery; mentioned the surgeon may order an MRI and that genetic counseling is worth asking about given age at diagnosis (under 50) and her mother's history. Stage is not known yet: confirmed after surgery and further imaging. Also baseline labs drawn this day: CBC and comprehensive metabolic panel, all within normal range. |
| +3 | Surgical consult, Dr. Marcus Ellery, 10:30 AM, Linden Health Breast Surgery, Suite 300. **Scripted capture fixture.** | See below. |
| unscheduled | Breast MRI | Upcoming. |
| unscheduled | Genetic counseling | Upcoming. |

**Open to-dos at demo start** (all from the −14 results visit, stage Diagnosis)
1. Gather your imaging discs for Dr. Ellery — due before the surgical consult. Detail: Linden Health Breast Imaging can burn your mammogram and ultrasound images to a disc; call (617) 555-0147.
2. Write down your questions for the surgical consult — before the consult.
3. Ask about genetic counseling, given your mother's history — at the surgical consult.
4. ✅ Call Dr. Ellery's office to book a consult — **done**.

**Scripted surgical consult (~24 min)** covers, in order: greeting and recording consent ("Thanks for letting me know; that's fine"), thanks for bringing the discs, review of imaging and pathology in plain language, breast exam, **two surgical options he will discuss further: lumpectomy (breast-conserving surgery, usually followed by radiation) and mastectomy**; no decision today; the MRI and genetic results can shape the choice. **Sentinel lymph node biopsy** at the time of surgery (tracer and/or blue dye, usually 1–3 nodes removed, checked for cancer cells). **Breast MRI before surgery** (both breasts; dense tissue; check for anything else); imaging scheduling will call. **Genetic counseling referral** (age under 50 at diagnosis plus mother's history; results can affect surgical options). **Pre-op bloodwork** (CBC and basic metabolic panel, any Linden Health lab, within two weeks, no fasting). After surgery, the tissue is examined fully, which is when stage is confirmed, and she will likely meet a medical oncologist to talk about whether other treatments make sense (stated generally, no prediction). Follow-up visit with Dr. Ellery after the MRI and genetic counseling to settle the plan. He gives her a booklet on lumpectomy and mastectomy. Claire asks a couple of her written questions (recovery time in general terms; whether she needs to decide today).

**Consult output:** stageUpdate → Treatment planning. New to-dos (stage Treatment planning):
1. Schedule your breast MRI — "The imaging office should call within a few days. If you haven't heard by [+4 days], call (617) 555-0168."
2. Book your genetic counseling appointment — referral sent today; Linden Health Cancer Genetics, (617) 555-0175.
3. Get your pre-op bloodwork — any Linden Health lab, within two weeks, no fasting needed.
4. Read the booklet on lumpectomy and mastectomy — before your follow-up with Dr. Ellery.
5. Book a follow-up with Dr. Ellery after your MRI — once your MRI and genetic counseling dates are set.
Resolved: to-dos 1, 2, 3 above.

## 4. Milestones (all in this session)

| # | Milestone | Owner | Gate |
|---|---|---|---|
| M0 | Scaffold, plan, research Next 16.4 changes | lead + research agent | — |
| M1 | Foundation: tokens, fonts, shell (tabs + sidebar), hydration gate, lint rule | lead | screenshots 390/1280 |
| M2 | Primitives + `/styleguide` | lead | screenshots 390/1280, design self-critique |
| M3 | Types, service interfaces (lead); fixtures (2 parallel content agents); mock services + `lib/care` (lead) | lead + 2 agents | typecheck, fixture consistency check |
| M4–M8 | Screens, 4 parallel agents: **A** Journey + Visit page · **B** Capture · **C** Records · **D** Ask + Profile | 4 agents | each agent self-screenshots; lead reviews 390/1280 |
| M9 | Integration: manifest + icons, desktop refinement, contour texture, a11y pass, e2e demo arc at both viewports | lead | e2e + axe green |
| M10 | Independent review: design critic, clinical voice/safety reviewer, architecture/code reviewer → fixes | 3 agents + lead | build, lint, typecheck, tests green |

## 5. Definition of done

- Demo arc (vision §5) passes as a Playwright test at 390px and 1280px with no dead ends.
- `npm run build`, `npm run lint`, `npx tsc --noEmit`, `npm run test:e2e` all pass.
- axe: zero serious/critical violations on every route.
- No fixture imports outside `services/mock` (lint-enforced). No calendar dates outside `lib/dates.ts`.
- Screenshots of every screen at 390 and 1280 reviewed against §6.
- Reset demo returns to the starting state.

## 6. Open questions carried forward

Name (SonoClear conflict), clinical review of fixtures, photography licensing, native vs web for Phase 2, logo (three-bar lockup used provisionally).

## 7. Screen builder brief (read this before building any screen)

### How a screen is wired
- Route files in `app/` are thin **server** files owned by the lead. Each renders `<ClientOnly><XScreen /></ClientOnly>`. You build the client screen component (`"use client"`) in `components/<area>/`.
- Next 16.4 with `cacheComponents`: never call `new Date()`/`Date.now()`/`Math.random()` at module scope. Inside components/handlers is fine (everything is under `ClientOnly`). Dynamic params arrive as a Promise: `const { id } = use(params)`. `useSearchParams()` is fine inside screens (already under Suspense).
- Navigated-away routes are hidden with `<Activity>`, not unmounted: state persists, effects clean up and re-run on show. Stop timers/sessions in effect cleanup.
- Pages: Journey `/journey`, Capture `/capture`, Records `/records`, Ask `/ask` (optional `?focus=<visitId|recordId>`), Visit `/visit/[id]`, Record `/record/[id]`, Profile `/profile`, Styleguide `/styleguide`.

### Data (never import `@/fixtures/*` — lint fails)
- `import { useCare, useVisit, useRecord, useCareActions, getPatientContext, clinicianShortName, newId, useReplaySpeed } from "@/lib/care"`.
- `useCare()` → `CareView`: `patient, clinicians, stages, currentStageId, visits, records, todos, appointments, glossary, stageViews (each: status done|current|ahead, visits, records, todos, appointments), currentStage, openTodos, doneTodos, nextAppointment, upcomingAppointments, visitById, recordById, clinicianById, today`.
- Actions: `setTodoDone(id, done)`, `addCapturedVisit(visit)` (also applies `resolvedTodoIds`), `addUploadedRecord(record)`, `setReplaySpeed("realtime"|"demo"|"fast")`, `resetDemo()`.
- Services: `import { services } from "@/services"` → `transcription`, `summarizer`, `recordInterpreter`, `chat`. Pass `getPatientContext()` when a service needs the patient.
- Dates: only via `@/lib/dates` (`formatLongDate`, `formatShortDate`, `formatUpcoming`, `formatTime`, `formatRelativeDay`, `formatDuration`, `formatClock`, `formatFullDate`, `ageFrom`, `greetingFor`, `daysFromToday`). Labels: `@/lib/visit-types`.

### Primitives (`components/ui/*`) — use these; don't restyle them ad hoc
`Button`/`ButtonLink` (variant primary|secondary|quiet, size md|lg, icon, iconAfter) · `buttonStyles()` · `Chip` (metadata) · `ChoiceChip` (selectable; use role="radio" + aria-checked inside role="radiogroup") · `Page` (width note|default|wide; gutters + bottom padding for the tab bar) · `BackLink` · `PageTitle` (serif h1) · `Eyebrow` · `Section` (eyebrow h2 + content) · `Card` · `Hairline` · `Avatar` · `Sheet` (native dialog; bottom sheet on mobile) · `Prose` (paragraphs + "- " lists; phone numbers become tel: links) · `linkifyPhones` · `TermLink` (inline, dotted underline → definition sheet) · `TermChip` · `TodoRow` (self-contained: toggles, due, detail, link to source visit; `showSource={false}` on that visit's own page) · `SourceChip` · `Disclosure` (details/summary) · `TextField`/`TextArea` · `LoadingState` (three live bars + serif line, role=status) · `EmptyState` · `Note` (neutral|attention) · `Rows`/`Row` (labeled rows, optional term) · `Bars` (three-bar motif: size xs|sm|md|lg|xl, live) · `Contours` (texture: Journey header + Ask only) · `Logo`. See `/styleguide`.

### Design tokens (Tailwind classes; the default palette does not exist)
Colors: `paper surface sunken line line-strong ink ink-muted sage sage-ink sage-soft attention attention-ink attention-soft` (e.g. `bg-surface`, `text-ink-muted`, `border-line`). Use `sage-ink` / `attention-ink` for text; `sage` / `attention` for graphics only. Type: `font-display` + `text-display-xl|lg|md|sm` for serif; `text-body` (17px, default), `text-body-sm`, `text-caption`; `eyebrow` utility for tracked labels. Shape: `rounded-full` pills, `rounded-card` (22px), `rounded-sheet`. Depth: hairlines and background shifts; `shadow-soft` only on the Ask input and sheets. Motion: `ease-calm`, 200–300ms, `animate-fade-in`, `animate-rise-in`; nothing bounces. Icons: `lucide-react` (stroke 1.5 is set globally), outline only, sparingly, `aria-hidden` when decorative. No arbitrary hex colors, no gradients, no emoji, no sparkles, no "AI" labels, no chat bubbles, no dashboards/progress rings/percentages.

### Accessibility
44px minimum targets; real `<button>`/`<a>`; one `h1` per page and ordered headings; `aria-live="polite"` for streamed text and loading; full keyboard use; the global focus ring is sage — don't remove outlines; nothing depends on timing; respect reduced motion (global CSS already does).

### Voice
Calm, knowledgeable friend; short sentences; second person; plain words first, then the term. No exclamation marks, no "sorry", no cheerleading, no feelings check-ins, no statistics, never advise. Every string specific to Claire; no placeholders.

### Verify your work (the dev server is already running at http://localhost:3000 — do not start another, do not run `next build`)
1. `npx tsc --noEmit -p . 2>&1 | grep -E "<your paths>"` → nothing.
2. `npx eslint <your files>` → clean.
3. `node scripts/shoot.mjs /your/route [/more] --name <area>` → PNGs in `.shots/` at 390 and 1280 plus any console errors. Use `--viewport-only` for above-the-fold checks and `--setup <file.mjs>` (default export `async (page) => {}`) to click through states (e.g. open a sheet, start recording). Put setup files in the scratchpad dir, not the project. **Look at every screenshot** (Read the PNG) and iterate until it meets VISION §6. Zero console errors.

## 8. Outcome (end of build session)

**Delivered:** all five surfaces (Journey, Capture, Records, Ask, Profile), the visit and record pages, `/styleguide`, PWA manifest and icons. The demo arc runs end to end at 390px and 1280px.

**Verification:** `npm run typecheck`, `npm run lint`, `npm run build` clean; `npm run test:unit` (19 tests: dates, store restore, care merge, every service mock); `npm run test:e2e` (86 tests at both widths: the demo arc, flows, Reset, a corrupted save, recording survival, honest fallbacks, axe WCAG 2.2 AA scans of every route and of open sheets, recorded visits and Ask answers, no sideways scroll, and zero console errors in every test).

**Independent reviews run and addressed:** design critique (all screens, both widths), clinical voice and safety (≈20 fixture corrections), architecture and code (store hardening, real-engine readiness, Activity/route-eviction bugs).

**Decisions added during the build**
- Story dates are nudged per group so clinic days never fall on a weekend, whatever weekday the demo opens on (`calendar()` in `lib/dates.ts`).
- The store saves an `anchorDay`; on load, the patient's own items move with the story, so a visit recorded "today" stays in step. Saved data is validated on restore; anything malformed is dropped. `app/error.tsx` offers "Start the demo fresh" as a last resort.
- Preview-only service hooks, both optional so real implementations omit them: `RecordInterpreter.sampleText()` and `VisitSummarizer.previewNote()`.
- The mock record interpreter matches on document text only; file names never decide what a document says.
- A recording lives in a module-level store, so it survives navigating anywhere in the app. A full page reload ends it, as it would a real microphone.
- `TranscriptionSession` documents its segment id rules and has an optional `onError`. `RecordUpload` carries the file in memory (`file?: Blob`), never saved.

**For the oncologist's first pass** (flagged by the clinical reviewer, left as written): hormone therapy mentioned generally as "often part of treatment"; HER2 IHC 1+ described as negative without the "HER2-low" nuance; routine pre-op breast MRI; timing of pre-op labs; genetics referral wording (diagnosis under 50 alone meets criteria); the post-consult Ask answer assumes surgery comes first.

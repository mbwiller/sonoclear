# Sonoclear

A patient-side companion for people going through a breast cancer diagnosis. It captures a doctor's visit, turns it into to-dos and a plain-language summary, explains records with quiet figures and her own images, answers questions, and arranges the appointments her care team asked for, all hung on a journey timeline that answers "where am I, and what's next?"

This is the v2 preview: a high-fidelity front end running on one realistic mock patient, Claire Donovan. Every AI capability is mocked behind an interface that a real implementation will later replace. Read `VISION.md` first; `PLAN.md` records how v1 was built and holds the clinical fact sheet; `V2_PLAN.md` records the v2 changes (record-first Capture, visual Records, the Arrange tab) and the decisions behind them.

## Run it

```bash
npm install
npm run dev            # http://localhost:3000 (opens on Journey)
```

Other scripts:

| Script | What it does |
|---|---|
| `npm run build && npm start` | Production build and server |
| `npm run lint` | ESLint (includes the rule that screens never import fixtures) |
| `npm run typecheck` | TypeScript, strict |
| `npm test` | Unit tests, then the end-to-end suite |
| `npm run test:unit` | Node test runner: dates, saved-state restore, the care merge, every service mock |
| `npm run test:e2e` | Playwright at 390px and 1280px: the demo arc, key flows, and axe accessibility scans (uses Playwright's headless browser: `npx playwright install --only-shell chromium`) |
| `npm run shots -- /journey /ask` | Screenshots at 390px and 1280px into `.shots/` |
| `npm run icons` / `npm run contours` | Regenerate the app icons / the contour texture |

## The demo arc

Journey → read **Up next** → open the results visit → open the pathology report, now with an **At a glance** section (receptor tiles, grade and Nottingham scales) → ask "What does ER-positive, HER2-negative mean?" → Capture: the chip already says "Next · Surgical consult with Dr. Ellery", so one tap on the record button starts it (tap **End** whenever you like) → the new visit page with new to-dos → **Arrange**: four things Dr. Ellery asked for; arrange the MRI, watch Sonoclear check the order, look up locations and call scheduling, pick an opening, confirm → Journey, where Up next is now the breast MRI and the timeline has moved to Treatment planning.

Before the consult is recorded, Arrange offers one task: requesting the imaging discs. The imaging records (screening and diagnostic) show real de-identified mammogram views standing in for Claire's; see `public/imaging/SOURCE.md`.

Profile → **Preview settings** controls the replay speed of the scripted recording (**Fast** also speeds up Arrange runs) and has **Reset demo**. `/styleguide` shows the primitives, `/styleguide/record` the record-button candidates, and `/styleguide/arrange` the Arrange run states.

## How it fits together

```
app/          thin server routes; each renders a client screen under <ClientOnly>
components/   ui/ primitives · shell/ navigation · one folder per screen
services/     interfaces (types.ts), mock implementations (mock/), and index.ts — the one place implementations are chosen
fixtures/     Claire's account as typed TypeScript; every date is an offset from DEMO_TODAY; every file is marked CLINICAL REVIEW PENDING
lib/          dates (DEMO_TODAY), store (localStorage deltas), care (the merged view screens read), types
```

- **Screens never import fixtures.** They read `lib/care` and call `services`. ESLint enforces it.
- **Adding real transcription means one new class** implementing `TranscriptionProvider`, selected in `services/index.ts`. The same goes for `VisitSummarizer`, `RecordInterpreter`, `ChatProvider` and the Arrange tab's `SchedulingAgent` (today `ScriptedSchedulingAgent`, which replays `fixtures/arrange/*` and never contacts anyone).
- **Records carry typed figures.** `RecordExplanation.visuals` is a list of `RecordVisual` items (locator, scale, measure, markers, ranges, sequence, images) rendered by `components/records/visuals`; a real interpreter emits the same shapes.
- **Dates never go stale.** `DEMO_TODAY` is the viewer's local today; fixtures are offsets from it. Only `lib/dates.ts` creates dates.
- **State** is a small Zustand store persisted to `localStorage`. It holds only the patient's changes (checked to-dos, recorded visits, added records, settings); the starting account is rebuilt from the data service on each load.
- **Design tokens** live in `app/globals.css`. Tailwind's default palette is removed, so only the Sonoclear colors exist. See `/styleguide`.

## Not in this preview

No LLM or transcription calls, no microphone access, no real phone calls or bookings (Arrange is simulated end to end and says so), no accounts or backend. All fixture content is pending review by a breast oncologist before any real patient sees it; `V2_PLAN.md` and the review notes list the points for that pass.

`public/brand/sonoclear-logo.jpg` is the reference lockup; the app draws its own vector mark.

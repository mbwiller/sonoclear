# Sonoclear

A patient-side companion for people going through a breast cancer diagnosis. It captures a doctor's visit, turns it into to-dos and a plain-language summary, explains records, and answers questions, all hung on a journey timeline that answers "where am I, and what's next?"

This is the MVP: a high-fidelity front end running on one realistic mock patient, Claire Donovan. Every AI capability is mocked behind an interface that a real implementation will later replace. Read `VISION.md` first; `PLAN.md` records how it was built and the decisions made along the way.

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

Journey → read **Up next** → open the results visit → open the pathology report → ask "What does ER-positive, HER2-negative mean?" → Capture → record the surgical consult (Breast surgeon is pre-selected; tap **End** whenever you like) → the new visit page with new to-dos → back to Journey, where the timeline has moved to Treatment planning.

Profile → **Preview settings** controls the replay speed of the scripted recording and has **Reset demo**.

## How it fits together

```
app/          thin server routes; each renders a client screen under <ClientOnly>
components/   ui/ primitives · shell/ navigation · one folder per screen
services/     interfaces (types.ts), mock implementations (mock/), and index.ts — the one place implementations are chosen
fixtures/     Claire's account as typed TypeScript; every date is an offset from DEMO_TODAY; every file is marked CLINICAL REVIEW PENDING
lib/          dates (DEMO_TODAY), store (localStorage deltas), care (the merged view screens read), types
```

- **Screens never import fixtures.** They read `lib/care` and call `services`. ESLint enforces it.
- **Adding real transcription means one new class** implementing `TranscriptionProvider`, selected in `services/index.ts`. The same goes for `VisitSummarizer`, `RecordInterpreter` and `ChatProvider`.
- **Dates never go stale.** `DEMO_TODAY` is the viewer's local today; fixtures are offsets from it. Only `lib/dates.ts` creates dates.
- **State** is a small Zustand store persisted to `localStorage`. It holds only the patient's changes (checked to-dos, recorded visits, added records, settings); the starting account is rebuilt from the data service on each load.
- **Design tokens** live in `app/globals.css`. Tailwind's default palette is removed, so only the Sonoclear colors exist. See `/styleguide`.

## Not in this preview

No LLM or transcription calls, no microphone access, no accounts or backend. All fixture content is pending review by a breast oncologist before any real patient sees it.

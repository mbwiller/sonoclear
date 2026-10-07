import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPatientContext } from "@/lib/care";
import { services } from "@/services";
import { transcriptFixtureFor } from "@/services/mock/fixture-transcripts";
import { ScriptedTranscriptionProvider } from "@/services/mock/scripted-transcription";
import type { ChatChunk } from "@/services/types";
import type { TranscriptSegment } from "@/lib/types";

async function collect(question: string, focus?: string) {
  const chunks: ChatChunk[] = [];
  for await (const c of services.chat.ask({
    messages: [{ id: "q", role: "patient", text: question, createdAt: new Date().toISOString() }],
    patient: getPatientContext(),
    focus,
  })) {
    chunks.push(c);
  }
  const text = chunks.flatMap((c) => (c.type === "text" ? [c.text] : [])).join("");
  const kind = chunks.find((c) => c.type === "meta");
  const sources = chunks.flatMap((c) => (c.type === "sources" ? c.sources : []));
  return { text, kind: kind?.type === "meta" ? kind.kind : undefined, sources };
}

describe("Ask (scripted)", () => {
  it("answers each suggested question, grounded in a source", async () => {
    const prompts = services.chat.suggestedQuestions(getPatientContext());
    assert.equal(prompts.length, 3);
    for (const prompt of prompts) {
      const answer = await collect(prompt);
      assert.equal(answer.kind, "answer", prompt);
      assert.ok(answer.sources.length > 0, `no source for ${prompt}`);
      assert.ok(!answer.text.includes("!"), `exclamation in answer to ${prompt}`);
    }
  });

  it("redirects advice and prognosis to the care team", async () => {
    for (const q of ["Should I get a mastectomy?", "What are my chances?", "Will it come back?", "Should I get a second opinion?"]) {
      const answer = await collect(q);
      assert.equal(answer.kind, "redirect", q);
    }
  });

  it("is honest about everything else", async () => {
    const answer = await collect("What's the weather on Thursday?");
    assert.equal(answer.kind, "fallback");
    assert.match(answer.text, /can't answer that in this preview yet/);
  });

  it("offers the pathology question first when focused on the pathology report", () => {
    const [first] = services.chat.suggestedQuestions(getPatientContext(), "record-pathology");
    assert.match(first, /ER-positive/);
  });
});

describe("Transcription (scripted)", () => {
  it("streams interim then final segments, and stop() returns the whole visit", async () => {
    const provider = new ScriptedTranscriptionProvider({ fixtureFor: transcriptFixtureFor, getSpeed: () => 5000 });
    const session = provider.start({ visitType: "breast-surgeon" });
    const seen: TranscriptSegment[] = [];
    session.onSegment((s) => seen.push(s));
    await new Promise((r) => setTimeout(r, 400));
    const transcript = await session.stop();
    assert.ok(seen.some((s) => !s.isFinal), "expected interim results");
    assert.ok(seen.some((s) => s.isFinal), "expected final results");
    assert.ok(transcript.segments.length > 50);
    assert.ok(transcript.segments.every((s) => s.isFinal));
  });

  it("pauses: nothing arrives while paused", async () => {
    const provider = new ScriptedTranscriptionProvider({ fixtureFor: transcriptFixtureFor, getSpeed: () => 2000 });
    const session = provider.start({ visitType: "pcp" });
    let count = 0;
    session.onSegment(() => count++);
    session.pause();
    await new Promise((r) => setTimeout(r, 300));
    assert.equal(count, 0);
    session.resume();
    await new Promise((r) => setTimeout(r, 300));
    assert.ok(count > 0);
    await session.stop();
  });
});

describe("Records (fixture interpreter)", () => {
  it("explains the sample document and is honest about anything else", async () => {
    const sample = services.recordInterpreter.sampleText?.();
    assert.ok(sample);
    const known = await services.recordInterpreter.interpret({ kind: "text", text: sample }, getPatientContext());
    assert.equal(known.recognized, true);
    const unknown = await services.recordInterpreter.interpret({ kind: "text", text: "Parking validation, level 2" }, getPatientContext());
    assert.equal(unknown.recognized, false);
    assert.ok(unknown.note);
  });

  it("doesn't trust file names", async () => {
    const photo = await services.recordInterpreter.interpret({ kind: "photo", fileName: "mammogram.jpg" }, getPatientContext());
    assert.equal(photo.recognized, false);
    const camera = await services.recordInterpreter.interpret({ kind: "photo", fileName: "IMG_4021.jpg" }, getPatientContext());
    assert.equal(camera.suggestedTitle, "Photo of a document");
  });
});

describe("Summarizer (fixture)", () => {
  it("describes what the preview can do for each visit type", () => {
    const ctx = getPatientContext();
    assert.equal(services.summarizer.previewNote?.({ visitType: "breast-surgeon" }, ctx), null);
    assert.match(services.summarizer.previewNote?.({ visitType: "pcp" }, ctx) ?? "", /surgical consult/);
  });
});

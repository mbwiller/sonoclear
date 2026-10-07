import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getDemoToday } from "@/lib/dates";
import { restore } from "@/lib/store";
import { getPatientContext } from "@/lib/care";
import { services } from "@/services";
import type { Visit } from "@/lib/types";

async function consultVisit(): Promise<Visit> {
  const id = "visit-test";
  const startedAt = new Date().toISOString();
  const transcript = await services.transcription.start({ visitType: "breast-surgeon" }).stop();
  const notes = await services.summarizer.summarize({
    transcript,
    visit: { id, visitType: "breast-surgeon", startedAt, durationMs: transcript.durationMs, appointmentId: "appt-surgical-consult" },
    patient: getPatientContext(),
  });
  return {
    id,
    visitType: "breast-surgeon",
    clinicianId: "dr-ellery",
    date: startedAt,
    durationMs: transcript.durationMs,
    stageId: "treatment-planning",
    appointmentId: "appt-surgical-consult",
    transcript,
    notes,
    relatedRecordIds: [],
    origin: "captured",
  };
}

describe("restoring saved state", () => {
  it("drops entries that don't fit instead of breaking", () => {
    const restored = restore({
      todoOverrides: { ok: { done: true, at: new Date().toISOString() }, bad: { done: "yes" } },
      capturedVisits: [{ id: "broken-visit", notes: {} }],
      uploadedRecords: [null, 42],
      replaySpeed: "warp",
    });
    assert.deepEqual(Object.keys(restored.todoOverrides), ["ok"]);
    assert.equal(restored.capturedVisits.length, 0);
    assert.equal(restored.uploadedRecords.length, 0);
    assert.equal(restored.replaySpeed, "demo");
  });

  it("survives garbage", () => {
    for (const junk of [null, undefined, 3, "x", [], { capturedVisits: "nope" }]) {
      const r = restore(junk);
      assert.deepEqual(r.capturedVisits, []);
    }
  });

  it("moves the patient's own items forward with the story", async () => {
    const visit = await consultVisit();
    const anchor = new Date(getDemoToday());
    anchor.setDate(anchor.getDate() - 5);
    const restored = restore({ capturedVisits: [visit], anchorDay: anchor.toISOString() });
    const moved = restored.capturedVisits[0];
    const days = Math.round((Date.parse(moved.date) - Date.parse(visit.date)) / 86_400_000);
    assert.equal(days, 5);
    assert.equal(restored.anchorDay, getDemoToday().toISOString());
  });
});

describe("the care view after recording the consult", () => {
  it("advances the journey, completes the appointment, and covers earlier to-dos", async () => {
    const { deriveCare, getSeed } = await import("@/lib/care");
    const visit = await consultVisit();
    const at = new Date().toISOString();
    const overrides = Object.fromEntries((visit.notes.resolvedTodoIds ?? []).map((id) => [id, { done: true, at, resolvedByVisitId: visit.id }]));
    const before = deriveCare(getSeed(), { todoOverrides: {}, capturedVisits: [], uploadedRecords: [] });
    const after = deriveCare(getSeed(), { todoOverrides: overrides, capturedVisits: [visit], uploadedRecords: [] });

    assert.equal(before.currentStageId, "diagnosis");
    assert.equal(before.nextAppointment?.id, "appt-surgical-consult");
    assert.equal(after.currentStageId, "treatment-planning");
    assert.equal(after.nextAppointment, null);
    assert.equal(after.appointments.find((a) => a.id === "appt-surgical-consult")?.status, "completed");
    // The new visit's to-dos lead; the three earlier ones are covered.
    assert.equal(after.openTodos[0].sourceVisitId, visit.id);
    assert.equal(after.openTodos.length, 5);
    for (const id of ["todo-imaging-discs", "todo-consult-questions", "todo-ask-genetics"]) {
      assert.equal(after.todos.find((t) => t.id === id)?.resolvedByVisitId, visit.id);
    }
  });
});

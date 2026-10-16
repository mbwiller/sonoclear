import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getDemoToday } from "@/lib/dates";
import { restore, useDemoStore } from "@/lib/store";
import { shiftArrangement, shiftISO } from "@/lib/persisted";
import { getPatientContext } from "@/lib/care";
import { services } from "@/services";
import type { AgentEvent, Arrangement, Visit } from "@/lib/types";

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

/** A booked MRI, 13 days out at 8:15, that fulfils a seed to-do. */
function mriArrangement(): Arrangement {
  const date = getDemoToday();
  date.setDate(date.getDate() + 13);
  date.setHours(8, 15, 0, 0);
  return {
    id: "arr-test",
    taskId: "arrange-mri",
    taskTitle: "Schedule your breast MRI",
    optionId: "opt-1",
    outcome: {
      summary: ["Your breast MRI is booked."],
      appointment: {
        id: "appt-breast-mri",
        title: "Breast MRI",
        visitType: "other",
        stageId: "treatment-planning",
        status: "scheduled",
        date: date.toISOString(),
        location: "Linden Health Imaging, Westgate",
      },
      resolvedTodoIds: ["todo-imaging-discs"],
    },
    log: [],
    arrangedAt: new Date().toISOString(),
  };
}

describe("restoring saved arrangements", () => {
  it("drops malformed arrangements and keeps a valid one", () => {
    const valid = mriArrangement();
    const restored = restore({
      arrangements: [
        valid,
        null,
        { id: "a" },
        { ...valid, id: "no-summary", outcome: { summary: "nope" } },
        { ...valid, id: "bad-date", arrangedAt: "not a date" },
        { ...valid, id: "no-log", log: undefined },
      ],
    });
    assert.deepEqual(restored.arrangements.map((a) => a.id), ["arr-test"]);
  });

  it("moves arrangements forward with the story", () => {
    const valid = mriArrangement();
    valid.log = [
      { type: "options", prompt: "Pick one", options: [{ id: "opt-1", title: "Option", date: valid.arrangedAt, location: "Westgate" }] },
    ];
    const anchor = new Date(getDemoToday());
    anchor.setDate(anchor.getDate() - 4);
    const moved = restore({ arrangements: [valid], anchorDay: anchor.toISOString() }).arrangements[0];
    const days = (a: string | null | undefined, b: string | null | undefined) => Math.round((Date.parse(a!) - Date.parse(b!)) / 86_400_000);
    assert.equal(days(moved.arrangedAt, valid.arrangedAt), 4);
    assert.equal(days(moved.outcome.appointment?.date, valid.outcome.appointment?.date), 4);
    const event = moved.log[0];
    assert.equal(event.type === "options" ? days(event.options[0].date, valid.arrangedAt) : null, 4);
  });
});

describe("restoring a replay log", () => {
  const goodStep: AgentEvent = { type: "step", id: "s-1", text: "Reading your consult notes" };

  it("drops log entries that would break the Arranged view, and keeps the rest", () => {
    const valid = mriArrangement();
    const garbage: unknown[] = [
      null,
      5,
      "step",
      { type: "step", id: "s" },
      { type: "step-done" },
      { type: "options", prompt: "Pick", options: null },
      { type: "options", prompt: "Pick", options: [{ id: "a", title: "A", date: "nope", location: "X" }] },
      { type: "call", office: "Office", phone: "(617) 555-0100", lines: [{ speaker: "robot", text: "hi" }] },
      { type: "outcome", outcome: { summary: "nope" } },
      { type: "mystery" },
    ];
    const restored = restore({ arrangements: [{ ...valid, log: [goodStep, ...garbage] }] });
    assert.equal(restored.arrangements.length, 1);
    assert.deepEqual(restored.arrangements[0].log, [goodStep]);
  });

  it("drops an arrangement whose appointment or to-do update doesn't fit", () => {
    const valid = mriArrangement();
    const appt = valid.outcome.appointment!;
    const bad = [
      { ...valid, id: "visit-type", outcome: { ...valid.outcome, appointment: { ...appt, visitType: 12 } } },
      { ...valid, id: "visit-type-name", outcome: { ...valid.outcome, appointment: { ...appt, visitType: "wizard" } } },
      { ...valid, id: "stage", outcome: { ...valid.outcome, appointment: { ...appt, stageId: 7 } } },
      { ...valid, id: "update", outcome: { ...valid.outcome, todoUpdate: { id: "t", detail: 4 } } },
      { ...valid, id: "update-date", outcome: { ...valid.outcome, todoUpdate: { id: "t", detail: "d", dueDate: "later" } } },
      { ...valid, id: "prep", outcome: { ...valid.outcome, prep: [1, 2] } },
      { ...valid, id: "title", taskTitle: 3 },
    ];
    const good = { ...valid, id: "ok", outcome: { ...valid.outcome, todoUpdate: { id: "t", detail: "d", dueDate: valid.arrangedAt }, prep: ["Bring ID."] } };
    const restored = restore({ arrangements: [...bad, good] });
    assert.deepEqual(restored.arrangements.map((a) => a.id), ["ok"]);
  });

  it("gives a save from before task titles a title, instead of dropping it", () => {
    const old: Partial<Arrangement> = mriArrangement();
    delete old.taskTitle;
    const restored = restore({ arrangements: [old, { ...old, id: "no-appointment", outcome: { summary: ["Done."] } }] });
    assert.deepEqual(restored.arrangements.map((a) => a.taskTitle), ["Breast MRI", "Arranged"]);
  });
});

describe("shifting an arrangement", () => {
  const days = (a: string | null | undefined, b: string | null | undefined) => Math.round((Date.parse(a!) - Date.parse(b!)) / 86_400_000);

  it("moves the to-do's date and the outcome inside the log, not the prose", () => {
    const valid = mriArrangement();
    const date = valid.outcome.appointment!.date!;
    valid.outcome = { ...valid.outcome, todoUpdate: { id: "t", detail: "Planned. No need to fast.", dueDate: date } };
    valid.log = [{ type: "outcome", outcome: valid.outcome }];
    const moved = shiftArrangement(valid, 3);
    assert.equal(days(moved.outcome.todoUpdate?.dueDate, date), 3);
    assert.equal(moved.outcome.todoUpdate?.detail, "Planned. No need to fast.");
    const event = moved.log[0];
    assert.equal(event.type === "outcome" ? days(event.outcome.appointment?.date, date) : null, 3);
    assert.equal(event.type === "outcome" ? days(event.outcome.todoUpdate?.dueDate, date) : null, 3);
    assert.equal(event.type === "outcome" ? event.outcome.summary[0] : null, valid.outcome.summary[0]);
  });

  it("keeps the local time of day across the end of daylight saving", () => {
    const before = new Date(2026, 9, 28, 8, 15).toISOString(); // October 28, before clocks go back on November 1
    const after = new Date(shiftISO(before, 7));
    assert.equal(after.getDate(), 4);
    assert.equal(after.getHours(), 8);
    assert.equal(after.getMinutes(), 15);
  });

  it("restores an old save whose log still carries an outcome with dates", () => {
    const valid = mriArrangement();
    valid.log = [{ type: "outcome", outcome: valid.outcome }];
    const anchor = new Date(getDemoToday());
    anchor.setDate(anchor.getDate() - 2);
    const moved = restore({ arrangements: [valid], anchorDay: anchor.toISOString() }).arrangements[0];
    const event = moved.log[0];
    assert.equal(event.type === "outcome" ? days(event.outcome.appointment?.date, valid.outcome.appointment?.date) : null, 2);
  });
});

describe("the store's arrangements", () => {
  it("adds an arrangement once, applies its resolved to-dos, stamps the day, and clears on reset", () => {
    const store = useDemoStore;
    store.getState().resetDemo();
    const arrangement = mriArrangement();
    store.getState().addArrangement(arrangement);
    store.getState().addArrangement({ ...arrangement, optionId: "opt-2" });
    const state = store.getState();
    assert.equal(state.arrangements.length, 1);
    assert.equal(state.arrangements[0].optionId, "opt-2");
    assert.equal(state.todoOverrides["todo-imaging-discs"]?.arrangedById, "arr-test");
    assert.equal(state.todoOverrides["todo-imaging-discs"]?.done, true);
    assert.equal(state.anchorDay, getDemoToday().toISOString());

    state.resetDemo();
    assert.deepEqual(store.getState().arrangements, []);
    assert.deepEqual(store.getState().todoOverrides, {});
    assert.equal(store.getState().anchorDay, null);
  });

  it("shows up in the patient context as soon as it is added", () => {
    useDemoStore.getState().resetDemo();
    assert.equal(getPatientContext().arrangements.length, 0);
    useDemoStore.getState().addArrangement(mriArrangement());
    assert.equal(getPatientContext().arrangements.length, 1);
    assert.equal(getPatientContext().appointments.find((a) => a.id === "appt-breast-mri")?.status, "scheduled");
    useDemoStore.getState().resetDemo();
  });
});

describe("the care view after recording the consult", () => {
  it("advances the journey, completes the appointment, and covers earlier to-dos", async () => {
    const { deriveCare, getSeed } = await import("@/lib/care");
    const visit = await consultVisit();
    const at = new Date().toISOString();
    const overrides = Object.fromEntries((visit.notes.resolvedTodoIds ?? []).map((id) => [id, { done: true, at, resolvedByVisitId: visit.id }]));
    const before = deriveCare(getSeed(), { todoOverrides: {}, capturedVisits: [], uploadedRecords: [], arrangements: [] });
    const after = deriveCare(getSeed(), { todoOverrides: overrides, capturedVisits: [visit], uploadedRecords: [], arrangements: [] });

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

describe("the care view with an arrangement", () => {
  it("books the MRI in place, resolves its to-do and makes it up next", async () => {
    const { deriveCare, getSeed } = await import("@/lib/care");
    const visit = await consultVisit();
    const arrangement = mriArrangement();
    const base = deriveCare(getSeed(), { todoOverrides: {}, capturedVisits: [visit], uploadedRecords: [], arrangements: [] });
    const overrides = { "todo-imaging-discs": { done: true, at: new Date().toISOString(), arrangedById: arrangement.id } };
    const after = deriveCare(getSeed(), { todoOverrides: overrides, capturedVisits: [visit], uploadedRecords: [], arrangements: [arrangement] });

    assert.equal(base.nextAppointment, null);
    assert.equal(after.nextAppointment?.id, "appt-breast-mri");
    assert.equal(after.nextAppointment?.status, "scheduled");
    assert.equal(after.appointments.length, base.appointments.length);
    const todo = after.todos.find((t) => t.id === "todo-imaging-discs");
    assert.equal(todo?.done, true);
    assert.equal(todo?.arrangedById, arrangement.id);
    assert.equal(after.arrangementByTaskId.get("arrange-mri")?.id, arrangement.id);
  });
});

describe("the care view with arrangements, in detail", () => {
  const empty = { todoOverrides: {}, capturedVisits: [], uploadedRecords: [] };

  it("applies a to-do update, with its date, and leaves the to-do open", async () => {
    const { deriveCare, getSeed } = await import("@/lib/care");
    const visit = await consultVisit();
    const todoId = `${visit.id}-preop-bloodwork`;
    const when = getDemoToday();
    when.setDate(when.getDate() + 6);
    const arrangement: Arrangement = {
      ...mriArrangement(),
      id: "arr-blood",
      taskId: "arrange-bloodwork",
      outcome: {
        summary: ["Planned."],
        todoUpdate: { id: todoId, detail: "Planned: Elm Street. No need to fast.", dueHint: "Planned for the morning", dueDate: when.toISOString() },
      },
    };
    const care = deriveCare(getSeed(), { ...empty, capturedVisits: [visit], arrangements: [arrangement] });
    const todo = care.todos.find((t) => t.id === todoId);
    assert.equal(todo?.done, false);
    assert.equal(todo?.detail, "Planned: Elm Street. No need to fast.");
    assert.equal(todo?.dueHint, "Planned for the morning");
    assert.equal(todo?.dueDate, when.toISOString());
  });

  it("drops arrangedById when she unticks a to-do an arrangement fulfilled", async () => {
    const { deriveCare, getSeed } = await import("@/lib/care");
    const arrangement = mriArrangement();
    const at = new Date().toISOString();
    const ticked = deriveCare(getSeed(), { ...empty, todoOverrides: { "todo-imaging-discs": { done: true, at, arrangedById: arrangement.id } }, arrangements: [arrangement] });
    assert.equal(ticked.todos.find((t) => t.id === "todo-imaging-discs")?.arrangedById, arrangement.id);
    const unticked = deriveCare(getSeed(), { ...empty, todoOverrides: { "todo-imaging-discs": { done: false, at } }, arrangements: [arrangement] });
    assert.equal(unticked.todos.find((t) => t.id === "todo-imaging-discs")?.arrangedById, undefined);
  });

  it("uses the latest arrangement when a task was arranged twice", async () => {
    const { deriveCare, getSeed } = await import("@/lib/care");
    const first = mriArrangement();
    const second: Arrangement = { ...mriArrangement(), id: "arr-second", optionId: "opt-2" };
    const care = deriveCare(getSeed(), { ...empty, arrangements: [first, second] });
    assert.equal(care.arrangementByTaskId.get("arrange-mri")?.id, "arr-second");
  });

  it("completes an arranged appointment when a visit is linked to it, and one only Arrange created", async () => {
    const { deriveCare, getSeed } = await import("@/lib/care");
    const mri = mriArrangement();
    const draw: Arrangement = {
      ...mriArrangement(),
      id: "arr-draw",
      taskId: "arrange-bloodwork",
      outcome: { summary: ["Planned."], appointment: { ...mri.outcome.appointment!, id: "appt-preop-bloodwork", title: "Pre-op bloodwork" } },
    };
    const visit = await consultVisit();
    const linked = (appointmentId: string): Visit => ({ ...visit, id: `visit-${appointmentId}`, appointmentId });
    const care = deriveCare(getSeed(), {
      ...empty,
      capturedVisits: [linked("appt-breast-mri"), linked("appt-preop-bloodwork")],
      arrangements: [mri, draw],
    });
    for (const id of ["appt-breast-mri", "appt-preop-bloodwork"]) {
      const appointment = care.appointments.find((a) => a.id === id);
      assert.equal(appointment?.status, "completed", id);
      assert.equal(appointment?.completedVisitId, `visit-${id}`, id);
      assert.ok(!care.upcomingAppointments.some((a) => a.id === id), `${id} should not be upcoming`);
    }
  });
});

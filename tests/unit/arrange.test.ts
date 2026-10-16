import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSurgicalConsultNotes } from "@/fixtures/notes/surgical-consult";
import { deriveCare, getSeed } from "@/lib/care";
import { calendar, daysFromToday, getDemoToday } from "@/lib/dates";
import { options as discOptions, pickupDate } from "@/fixtures/arrange/imaging-discs";
import { delay } from "@/services/mock/delay";
import { ScriptedSchedulingAgent } from "@/services/mock/scripted-scheduling";
import type { AgentEvent, Arrangement, ArrangeOption, ArrangeTask, PatientContext, Visit } from "@/lib/types";

const cal = calendar(getDemoToday());
const agent = new ScriptedSchedulingAgent({ pace: () => 0 });

function consultVisit(): Visit {
  const id = "visit-arrange-test";
  const createdAt = cal.today.toISOString();
  return {
    id,
    visitType: "breast-surgeon",
    clinicianId: "dr-ellery",
    date: createdAt,
    durationMs: 24 * 60_000,
    stageId: "treatment-planning",
    appointmentId: "appt-surgical-consult",
    transcript: null,
    notes: buildSurgicalConsultNotes({ cal, visitId: id, createdAt }),
    relatedRecordIds: [],
    origin: "captured",
  };
}

/** The patient's context: before the consult is recorded, or after it with the given arrangements. */
function contextFor(opts: { consult?: boolean; arrangements?: Arrangement[]; tickedOff?: string[] } = {}): PatientContext {
  const { consult = true, arrangements = [], tickedOff = [] } = opts;
  const visit = consultVisit();
  const at = cal.today.toISOString();
  const todoOverrides: Record<string, { done: boolean; at: string; resolvedByVisitId?: string; arrangedById?: string }> = {};
  if (consult) for (const id of visit.notes.resolvedTodoIds ?? []) todoOverrides[id] = { done: true, at, resolvedByVisitId: visit.id };
  for (const a of arrangements) {
    for (const id of a.outcome.resolvedTodoIds ?? []) todoOverrides[id] = { done: true, at, arrangedById: a.id };
  }
  for (const id of tickedOff) todoOverrides[id] = { done: true, at };
  const care = deriveCare(getSeed(), {
    todoOverrides,
    capturedVisits: consult ? [visit] : [],
    uploadedRecords: [],
    arrangements,
  });
  return {
    today: care.today,
    patient: care.patient,
    clinicians: care.clinicians,
    stages: care.stages,
    currentStageId: care.currentStageId,
    visits: care.visits,
    records: care.records,
    todos: care.todos,
    appointments: care.appointments,
    arrangements: care.arrangements,
  };
}

async function collect(events: AsyncIterable<AgentEvent>): Promise<AgentEvent[]> {
  const out: AgentEvent[] = [];
  for await (const e of events) out.push(e);
  return out;
}

function taskOf(ctx: PatientContext, id: string): ArrangeTask {
  const task = agent.tasks(ctx).find((t) => t.id === id);
  assert.ok(task, `no task ${id}`);
  return task;
}

async function planOf(ctx: PatientContext, id: string) {
  const events = await collect(agent.plan({ task: taskOf(ctx, id), patient: ctx }));
  const last = events.at(-1);
  assert.equal(last?.type, "options", `${id} plan should end with options`);
  return { events, options: last.type === "options" ? last.options : [] };
}

async function confirmOf(ctx: PatientContext, id: string, optionId: string) {
  const events = await collect(agent.confirm({ task: taskOf(ctx, id), optionId, patient: ctx }));
  const last = events.at(-1);
  assert.equal(last?.type, "outcome", `${id}/${optionId} confirm should end with outcome`);
  if (last?.type !== "outcome") throw new Error("unreachable");
  return { events, outcome: last.outcome };
}

/** Plan, pick an option, confirm, and return what the store would hold. */
async function arrange(ctx: PatientContext, taskId: string, pick: (options: ArrangeOption[]) => ArrangeOption): Promise<Arrangement> {
  const { options } = await planOf(ctx, taskId);
  const chosen = pick(options);
  const { events, outcome } = await confirmOf(ctx, taskId, chosen.id);
  const title = taskOf(ctx, taskId).title;
  return { id: `arr-${taskId}`, taskId, taskTitle: title, optionId: chosen.id, outcome, log: events, arrangedAt: cal.today.toISOString() };
}

/** The MRI and genetic counseling arranged: the context the follow-up needs. */
async function afterMriAndGenetics() {
  const mri = await arrange(contextFor(), "arrange-mri", (o) => o[0]);
  const genetics = await arrange(contextFor({ arrangements: [mri] }), "arrange-genetics", (o) => o[0]);
  return { mri, genetics, ctx: contextFor({ arrangements: [mri, genetics] }) };
}

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

const isWeekday = (iso: string) => [1, 2, 3, 4, 5].includes(new Date(iso).getDay());

describe("Arrange tasks", () => {
  it("before the consult is recorded, offers only the imaging discs", () => {
    const tasks = agent.tasks(contextFor({ consult: false }));
    assert.deepEqual(tasks.map((t) => t.id), ["arrange-imaging-discs"]);
    assert.equal(tasks[0].kind, "request");
    assert.equal(tasks[0].todoId, "todo-imaging-discs");
    assert.equal(tasks[0].office.phone, "(617) 555-0147");
  });

  it("after the consult, offers the MRI, genetics, bloodwork and follow-up, with the follow-up waiting", () => {
    const ctx = contextFor();
    const tasks = agent.tasks(ctx);
    assert.deepEqual(tasks.map((t) => t.id), ["arrange-mri", "arrange-genetics", "arrange-bloodwork", "arrange-follow-up"]);
    assert.deepEqual(tasks.map((t) => t.kind), ["book", "book", "find", "book"]);
    assert.deepEqual(tasks.map((t) => t.office.phone), ["(617) 555-0168", "(617) 555-0175", "(617) 555-0180", "(617) 555-0162"]);
    assert.deepEqual(tasks.map((t) => t.appointmentId), ["appt-breast-mri", "appt-genetic-counseling", undefined, undefined]);
    for (const t of tasks) assert.ok(t.todoId?.startsWith("visit-arrange-test-"), t.id);
    assert.equal(tasks.filter((t) => t.waitsFor).length, 1);
    assert.equal(tasks[3].waitsFor?.taskId, "arrange-mri");
    assert.match(tasks[3].waitsFor?.reason ?? "", /Once your MRI and genetic counseling dates are set/);
  });

  it("hides a task whose to-do she ticked off herself", () => {
    const ctx = contextFor({ tickedOff: ["visit-arrange-test-book-genetics"] });
    assert.ok(!agent.tasks(ctx).some((t) => t.id === "arrange-genetics"));
  });

  it("keeps an arranged task listed, and the follow-up waits for the MRI, then genetics, then stops waiting", async () => {
    const mri = await arrange(contextFor(), "arrange-mri", (o) => o[0]);
    const withMri = contextFor({ arrangements: [mri] });
    const tasks = agent.tasks(withMri);
    assert.ok(tasks.some((t) => t.id === "arrange-mri"), "arranged MRI should still be listed");
    assert.equal(tasks.find((t) => t.id === "arrange-follow-up")?.waitsFor?.taskId, "arrange-genetics");

    const genetics = await arrange(withMri, "arrange-genetics", (o) => o[0]);
    const both = agent.tasks(contextFor({ arrangements: [mri, genetics] }));
    assert.equal(both.find((t) => t.id === "arrange-follow-up")?.waitsFor, undefined);
  });

  it("does not wait for genetic counseling she ticked off herself", async () => {
    const mri = await arrange(contextFor(), "arrange-mri", (o) => o[0]);
    const ctx = contextFor({ arrangements: [mri], tickedOff: ["visit-arrange-test-book-genetics"] });
    assert.equal(agent.tasks(ctx).find((t) => t.id === "arrange-follow-up")?.waitsFor, undefined);
  });
});

describe("Arrange plans", () => {
  it("end with options, all on weekdays after today", async () => {
    const before = contextFor({ consult: false });
    const after = contextFor();
    const { ctx: withBoth } = await afterMriAndGenetics();
    for (const [ctx, id] of [
      [before, "arrange-imaging-discs"],
      [after, "arrange-mri"],
      [after, "arrange-genetics"],
      [after, "arrange-bloodwork"],
      [withBoth, "arrange-follow-up"],
    ] as const) {
      const { options } = await planOf(ctx, id);
      // The discs offer mail alone when the front desk has closed for the day.
      assert.ok(options.length >= (id === "arrange-imaging-discs" ? 1 : 2), id);
      const times = options.map((o) => Date.parse(o.date));
      assert.deepEqual(times, [...times].sort((a, b) => a - b), `${id}: options are not in date order`);
      for (const o of options) {
        assert.ok(isWeekday(o.date), `${id}: ${o.title} is not a weekday`);
        assert.ok(Date.parse(o.date) > cal.today.getTime(), `${id}: ${o.title} is not after today`);
      }
      assert.equal(new Set(options.map((o) => o.id)).size, options.length, `${id}: option ids repeat`);
    }
  });

  it("offers the three MRI openings from the script", async () => {
    const { options } = await planOf(contextFor(), "arrange-mri");
    assert.deepEqual(options.map((o) => o.location), [
      "Linden Health Imaging, Westgate",
      "Linden Health Imaging, Riverside",
      "Linden Health Imaging, Westgate",
    ]);
    const clock = (iso: string) => new Date(iso).getHours() * 100 + new Date(iso).getMinutes();
    assert.deepEqual(options.map((o) => clock(o.date)), [815, 1000, 1640]);
  });

  it("call the right office, with short plain lines", async () => {
    const { events } = await planOf(contextFor(), "arrange-mri");
    const call = events.find((e) => e.type === "call");
    assert.equal(call?.type === "call" ? call.phone : null, "(617) 555-0168");
    const lines = call?.type === "call" ? call.lines : [];
    assert.ok(lines.length >= 4 && lines.length <= 9, `${lines.length} lines`);
    assert.ok(lines.some((l) => l.speaker === "sonoclear") && lines.some((l) => l.speaker === "office"));
  });

  it("don't make a call for the bloodwork", async () => {
    const { events } = await planOf(contextFor(), "arrange-bloodwork");
    assert.ok(!events.some((e) => e.type === "call"));
  });

  it("say plainly that mail would arrive after the consult", async () => {
    const { events } = await planOf(contextFor({ consult: false }), "arrange-imaging-discs");
    const last = events.at(-1);
    assert.match(last?.type === "options" ? (last.note ?? "") : "", /Mailing takes 3 to 5 business days, so it would arrive after your consult on \w+day\./);
  });

  it("say so, instead of guessing, when the follow-up has no MRI date yet", async () => {
    const ctx = contextFor();
    const events = await collect(agent.plan({ task: taskOf(ctx, "arrange-follow-up"), patient: ctx }));
    assert.deepEqual(events.map((e) => e.type), ["limit"]);
  });
});

describe("Arrange confirmations", () => {
  it("end with an outcome whose appointment is scheduled, for every option", async () => {
    const after = contextFor();
    const { ctx: withBoth } = await afterMriAndGenetics();
    for (const [ctx, id] of [
      [after, "arrange-mri"],
      [after, "arrange-genetics"],
      [after, "arrange-bloodwork"],
      [withBoth, "arrange-follow-up"],
    ] as const) {
      const { options } = await planOf(ctx, id);
      for (const o of options) {
        const { outcome } = await confirmOf(ctx, id, o.id);
        assert.equal(outcome.appointment?.status, "scheduled", `${id}/${o.id}`);
        assert.equal(outcome.appointment?.date, o.date, `${id}/${o.id}`);
        assert.equal(outcome.appointment?.location, o.location, `${id}/${o.id}`);
        assert.ok(outcome.reference, `${id}/${o.id}`);
        assert.ok(outcome.summary.length >= 1 && outcome.summary.length <= 2);
        assert.ok((outcome.prep?.length ?? 0) >= 2, `${id}/${o.id}`);
      }
    }
  });

  it("books the MRI into the existing unscheduled appointment and resolves its to-do", async () => {
    const { outcome } = await confirmOf(contextFor(), "arrange-mri", "mri-westgate-early");
    assert.equal(outcome.appointment?.id, "appt-breast-mri");
    assert.deepEqual(outcome.resolvedTodoIds, ["visit-arrange-test-schedule-mri"]);
    assert.equal(outcome.reference, "LH-MRI-20931");
  });

  it("keeps the bloodwork to-do open with a plan, and the discs to-do too", async () => {
    const blood = (await confirmOf(contextFor(), "arrange-bloodwork", "bloodwork-elm")).outcome;
    assert.equal(blood.appointment?.id, "appt-preop-bloodwork");
    assert.equal(blood.resolvedTodoIds, undefined);
    assert.equal(blood.todoUpdate?.id, "visit-arrange-test-preop-bloodwork");
    assert.equal(blood.todoUpdate?.detail, "Planned: Linden Health Laboratory, Elm Street. No need to fast.");
    assert.match(blood.todoUpdate?.dueHint ?? "", /morning$/);
    assert.ok(blood.todoUpdate?.dueDate, "the plan's date is structured, so it can move with the story");
    assert.equal(blood.todoUpdate?.dueDate, blood.appointment?.date);

    const before = contextFor({ consult: false });
    const { options } = await planOf(before, "arrange-imaging-discs");
    const discs = (await confirmOf(before, "arrange-imaging-discs", options[0].id)).outcome;
    assert.equal(discs.appointment, undefined);
    assert.equal(discs.todoUpdate?.id, "todo-imaging-discs");
    // The first option is the pickup, unless the front desk has closed on the last day before the consult.
    assert.match(discs.todoUpdate?.detail ?? "", options[0].id === "discs-pickup" ? /Bring a photo ID/ : /mailed/);
    assert.equal(discs.todoUpdate?.dueDate, options[0].date);
  });

  it("keeps dates, places and references out of the outcome paragraphs", async () => {
    const after = contextFor();
    const { ctx: withBoth } = await afterMriAndGenetics();
    const month = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/;
    const weekday = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/;
    for (const [ctx, id] of [
      [contextFor({ consult: false }), "arrange-imaging-discs"],
      [after, "arrange-mri"],
      [after, "arrange-genetics"],
      [after, "arrange-bloodwork"],
      [withBoth, "arrange-follow-up"],
    ] as const) {
      const { options } = await planOf(ctx, id);
      for (const o of options) {
        const { outcome } = await confirmOf(ctx, id, o.id);
        for (const paragraph of outcome.summary) {
          assert.doesNotMatch(paragraph, month, `${id}/${o.id}: ${paragraph}`);
          assert.doesNotMatch(paragraph, weekday, `${id}/${o.id}: ${paragraph}`);
          assert.doesNotMatch(paragraph, /\bLH-|\bCG-|\bBS-|\bLAB-|\bRQ-/, `${id}/${o.id}: ${paragraph}`);
          assert.doesNotMatch(paragraph, /"/, `${id}/${o.id}: straight quotes in ${paragraph}`);
        }
        assert.doesNotMatch(outcome.todoUpdate?.detail ?? "", month, `${id}/${o.id}`);
        assert.doesNotMatch(outcome.todoUpdate?.detail ?? "", weekday, `${id}/${o.id}`);
      }
    }
  });

  it("quotes the to-do name with curly quotes", async () => {
    const { outcome } = await confirmOf(contextFor(), "arrange-mri", "mri-westgate-early");
    assert.match(outcome.summary.join(" "), /“Schedule your breast MRI”/);
  });

  it("books the Suite 300 blood draw with a short call, and the walk-ins without one", async () => {
    const suite = await collect(agent.confirm({ task: taskOf(contextFor(), "arrange-bloodwork"), optionId: "bloodwork-suite-300", patient: contextFor() }));
    const call = suite.find((e) => e.type === "call");
    assert.equal(call?.type === "call" ? call.phone : null, "(617) 555-0180");
    const walkIn = await collect(agent.confirm({ task: taskOf(contextFor(), "arrange-bloodwork"), optionId: "bloodwork-elm", patient: contextFor() }));
    assert.ok(!walkIn.some((e) => e.type === "call"));
  });

  it("confirms her date of birth on every call", async () => {
    const after = contextFor();
    const { ctx: withBoth } = await afterMriAndGenetics();
    const dob = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(after.patient.dateOfBirth));
    for (const [ctx, id, option] of [
      [contextFor({ consult: false }), "arrange-imaging-discs", undefined],
      [after, "arrange-mri", undefined],
      [after, "arrange-genetics", undefined],
      [withBoth, "arrange-follow-up", undefined],
      [after, "arrange-bloodwork", "bloodwork-suite-300"],
    ] as const) {
      const task = taskOf(ctx, id);
      const events = await collect(option ? agent.confirm({ task, optionId: option, patient: ctx }) : agent.plan({ task, patient: ctx }));
      const call = events.find((e) => e.type === "call");
      assert.equal(call?.type, "call", id);
      const lines = call?.type === "call" ? call.lines : [];
      const at = lines.findIndex((l) => l.speaker === "office" && l.text === "Can you confirm her date of birth?");
      assert.ok(at > 0, `${id}: no identity check`);
      assert.deepEqual(lines[at + 1], { speaker: "sonoclear", text: `${dob}.` });
      assert.deepEqual(lines[at + 2], { speaker: "office", text: "Thank you." });
    }
  });

  it("gets the discs ready before the consult", async () => {
    const ctx = contextFor({ consult: false });
    const { options } = await planOf(ctx, "arrange-imaging-discs");
    const consult = ctx.appointments.find((a) => a.id === "appt-surgical-consult")?.date;
    assert.ok(consult);
    const pickup = options.find((o) => o.id === "discs-pickup");
    // Mail only when today is the last weekday before the consult and the front desk has closed.
    if (pickup) assert.ok(daysFromToday(pickup.date) < daysFromToday(consult), "the pickup should come before the consult");
    else assert.deepEqual(options.map((o) => o.id), ["discs-mail"]);
  });

  it("says so, and books nothing, for an option that isn't on the list", async () => {
    const ctx = contextFor();
    const events = await collect(agent.confirm({ task: taskOf(ctx, "arrange-mri"), optionId: "nope", patient: ctx }));
    assert.deepEqual(events.map((e) => e.type), ["limit"]);
  });
});

describe("Arrange with the MRI booked", () => {
  it("puts the first blood draw on the morning of a Westgate MRI", async () => {
    const mri = await arrange(contextFor(), "arrange-mri", (o) => o[0]);
    const ctx = contextFor({ arrangements: [mri] });
    const { options } = await planOf(ctx, "arrange-bloodwork");
    const mriDate = mri.outcome.appointment?.date;
    assert.ok(mriDate);
    const westgate = options.find((o) => o.id === "bloodwork-westgate");
    assert.ok(westgate);
    assert.equal(daysFromToday(westgate.date), daysFromToday(mriDate));
    assert.equal(new Date(westgate.date).getHours(), 7);
    assert.match(westgate.detail ?? "", /before your MRI/);
  });

  it("falls back to a Westgate walk-in when the MRI is at Riverside", async () => {
    const mri = await arrange(contextFor(), "arrange-mri", (o) => o.find((x) => x.location.includes("Riverside"))!);
    const { options } = await planOf(contextFor({ arrangements: [mri] }), "arrange-bloodwork");
    assert.doesNotMatch(options.find((o) => o.id === "bloodwork-westgate")?.detail ?? "", /MRI/);
  });

  it("offers follow-ups after both the MRI and genetic counseling, with no waiting", async () => {
    const { mri, genetics, ctx } = await afterMriAndGenetics();
    const { events, options } = await planOf(ctx, "arrange-follow-up");
    const later = Math.max(daysFromToday(mri.outcome.appointment!.date!), daysFromToday(genetics.outcome.appointment!.date!));
    assert.equal(options.length, 3);
    for (const o of options) assert.ok(daysFromToday(o.date) >= later + 5, o.title);
    const call = events.find((e) => e.type === "call");
    const text = call?.type === "call" ? call.lines.map((l) => l.text).join(" ") : "";
    assert.match(text, /genetic counseling is/);
    assert.match(text, /after both/);
    assert.match(text, /usually within two business days of the scan/);
    const { outcome } = await confirmOf(ctx, "arrange-follow-up", options[0].id);
    assert.equal(outcome.appointment?.id, "appt-surgeon-follow-up");
    assert.equal(outcome.appointment?.clinicianId, "dr-ellery");
    assert.deepEqual(outcome.resolvedTodoIds, ["visit-arrange-test-book-follow-up"]);
  });

  it("counts the follow-up from the later of the two dates, whichever comes last", async () => {
    const mri = await arrange(contextFor(), "arrange-mri", (o) => o[0]);
    const withMri = contextFor({ arrangements: [mri] });
    const genetics = await arrange(withMri, "arrange-genetics", (o) => o.at(-1)!);
    const { options } = await planOf(contextFor({ arrangements: [mri, genetics] }), "arrange-follow-up");
    const geneticsDay = daysFromToday(genetics.outcome.appointment!.date!);
    const mriDay = daysFromToday(mri.outcome.appointment!.date!);
    for (const o of options) assert.ok(daysFromToday(o.date) >= Math.max(geneticsDay, mriDay) + 5, o.title);
  });

  it("says so, instead of guessing, when only the MRI is arranged", async () => {
    const mri = await arrange(contextFor(), "arrange-mri", (o) => o[0]);
    const ctx = contextFor({ arrangements: [mri] });
    const events = await collect(agent.plan({ task: taskOf(ctx, "arrange-follow-up"), patient: ctx }));
    assert.deepEqual(events.map((e) => e.type), ["limit"]);
  });
});

describe("Arrange discs pickup", () => {
  const friday = new Date(2026, 9, 16); // the consult lands on Monday the 19th, so Saturday is the next "weekday" too
  const fridayCal = calendar(friday);
  const consultOn = (iso: string): PatientContext => {
    const base = contextFor({ consult: false });
    return { ...base, appointments: base.appointments.map((a) => (a.id === "appt-surgical-consult" ? { ...a, date: iso } : a)) };
  };

  it("offers the next weekday when it falls before the consult", () => {
    const ctx = consultOn(new Date(2026, 9, 20, 10, 30).toISOString());
    const pickup = pickupDate(fridayCal, ctx, new Date(2026, 9, 16, 9, 0));
    assert.ok(pickup);
    assert.ok(Date.parse(pickup) > friday.getTime());
  });

  it("falls back to today while the front desk is open", () => {
    // Today is the last weekday before a Monday consult.
    const ctx = consultOn(new Date(2026, 9, 19, 10, 30).toISOString());
    const early = pickupDate(fridayCal, ctx, new Date(2026, 9, 16, 9, 0));
    assert.equal(early, new Date(2026, 9, 16, 14, 0).toISOString());
    const afternoon = pickupDate(fridayCal, ctx, new Date(2026, 9, 16, 15, 20));
    assert.equal(afternoon, new Date(2026, 9, 16, 16, 0).toISOString());
  });

  it("offers mail only when the front desk is too close to closing", () => {
    const ctx = consultOn(new Date(2026, 9, 19, 10, 30).toISOString());
    assert.equal(pickupDate(fridayCal, ctx, new Date(2026, 9, 16, 18, 5)), null);
    assert.equal(pickupDate(fridayCal, ctx, new Date(2026, 9, 16, 17, 40)), null);
    const [only] = discOptions(fridayCal, ctx, new Date(2026, 9, 16, 19, 0));
    assert.equal(only.id, "discs-mail");
    assert.equal(discOptions(fridayCal, ctx, new Date(2026, 9, 16, 19, 0)).length, 1);
  });
});

describe("Arrange voice and structure", () => {
  it("never uses exclamation marks, apologies, or the words AI, agent, assistant or bot", async () => {
    const before = contextFor({ consult: false });
    const after = contextFor();
    const { ctx: withBoth } = await afterMriAndGenetics();
    const texts: string[] = [];
    for (const ctx of [before, after, withBoth]) {
      for (const task of agent.tasks(ctx).filter((t) => !t.waitsFor)) {
        texts.push(...strings({ title: task.title, detail: task.detail, waitsFor: task.waitsFor, office: task.office }));
        const { options } = await planOf(ctx, task.id);
        texts.push(...strings(await collect(agent.plan({ task, patient: ctx }))));
        for (const o of options) texts.push(...strings(await collect(agent.confirm({ task, optionId: o.id, patient: ctx }))));
      }
    }
    assert.ok(texts.length > 100);
    for (const text of texts) {
      assert.ok(!text.includes("!"), `exclamation mark in: ${text}`);
      assert.ok(!/\b(AI|agent|assistant|bot|sorry)\b/i.test(text), `forbidden word in: ${text}`);
    }
  });

  it("starts every step with a matching step-done, with ids that don't repeat", async () => {
    const before = contextFor({ consult: false });
    const after = contextFor();
    const { ctx: withBoth } = await afterMriAndGenetics();
    for (const ctx of [before, after, withBoth]) {
      for (const task of agent.tasks(ctx).filter((t) => !t.waitsFor)) {
        const { options } = await planOf(ctx, task.id);
        const runs = [await collect(agent.plan({ task, patient: ctx })), await collect(agent.confirm({ task, optionId: options[0].id, patient: ctx }))];
        for (const events of runs) {
          const open = new Set<string>();
          const seen = new Set<string>();
          for (const e of events) {
            if (e.type === "step") {
              assert.ok(!seen.has(e.id), `${task.id}: step id ${e.id} repeats`);
              seen.add(e.id);
              open.add(e.id);
            }
            if (e.type === "step-done") {
              assert.ok(open.delete(e.id), `${task.id}: step-done ${e.id} has no step`);
            }
          }
          assert.equal(open.size, 0, `${task.id}: steps never finished: ${[...open].join(", ")}`);
        }
      }
    }
  });

  it("stops when the consumer stops listening", async () => {
    const slow = new ScriptedSchedulingAgent({ pace: () => 1 });
    const ctx = contextFor();
    const seen: AgentEvent[] = [];
    const started = Date.now();
    for await (const e of slow.plan({ task: taskOf(ctx, "arrange-mri"), patient: ctx })) {
      seen.push(e);
      break;
    }
    assert.equal(seen.length, 1);
    assert.ok(Date.now() - started < 2000);
  });

  it("ends quietly, without an error, when the signal aborts mid-wait", async () => {
    const slow = new ScriptedSchedulingAgent({ pace: () => 1 });
    const ctx = contextFor();
    const controller = new AbortController();
    const seen: AgentEvent[] = [];
    const started = Date.now();
    setTimeout(() => controller.abort(), 100);
    for await (const e of slow.plan({ task: taskOf(ctx, "arrange-mri"), patient: ctx, signal: controller.signal })) seen.push(e);
    assert.equal(seen.length, 0);
    assert.ok(Date.now() - started < 400, "the pending wait should be cancelled, not waited out");
  });

  it("yields nothing for a signal that is already aborted", async () => {
    const ctx = contextFor();
    const controller = new AbortController();
    controller.abort();
    const events = await collect(agent.confirm({ task: taskOf(ctx, "arrange-mri"), optionId: "mri-westgate-early", patient: ctx, signal: controller.signal }));
    assert.deepEqual(events, []);
  });

  it("scales its waits with the pace", async () => {
    const quick = new ScriptedSchedulingAgent({ pace: () => 0.01 });
    const ctx = contextFor();
    const started = Date.now();
    const events = await collect(quick.plan({ task: taskOf(ctx, "arrange-mri"), patient: ctx }));
    assert.equal(events.at(-1)?.type, "options");
    assert.ok(Date.now() - started < 1500);
  });
});

describe("delay", () => {
  it("resolves after the wait, and rejects as soon as the signal aborts", async () => {
    await delay(5);
    const controller = new AbortController();
    const pending = delay(5_000, controller.signal);
    controller.abort();
    await assert.rejects(pending, { name: "AbortError" });
    await assert.rejects(delay(5, controller.signal), { name: "AbortError" });
  });
});

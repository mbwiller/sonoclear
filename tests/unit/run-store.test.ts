import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { useRunStore } from "@/components/arrange/run-store";
import { useDemoStore } from "@/lib/store";
import { services } from "@/services";
import type { SchedulingAgent } from "@/services/types";
import type { AgentEvent, Arrangement, ArrangeOutcome, ArrangeTask } from "@/lib/types";

const task: ArrangeTask = {
  id: "arrange-test",
  kind: "book",
  title: "Schedule your test",
  detail: "A task for the run store.",
  office: { label: "Test office", phone: "(617) 555-0100" },
};

const outcome: ArrangeOutcome = { summary: ["It is booked."], reference: "T-1" };

const step = (id: string): AgentEvent => ({ type: "step", id, text: `Step ${id}` });
const options: AgentEvent = {
  type: "options",
  prompt: "Which works for you?",
  options: [
    { id: "opt-1", title: "Option one", date: new Date().toISOString(), location: "Here" },
    { id: "opt-2", title: "Option two", date: new Date().toISOString(), location: "There" },
  ],
};

/** Lets the run store's promise chain settle. */
const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
};

function gate() {
  let open: () => void = () => undefined;
  const promise = new Promise<void>((resolve) => (open = resolve));
  return { promise, open };
}

const real = services.scheduling;
const realAdd = useDemoStore.getState().addArrangement;

function stub(parts: Partial<Pick<SchedulingAgent, "plan" | "confirm">>) {
  services.scheduling = {
    tasks: () => [task],
    plan: parts.plan ?? (async function* () {}),
    confirm: parts.confirm ?? (async function* () {}),
  };
}

const ids = () =>
  useRunStore
    .getState()
    .events.flatMap((e) => (e.type === "step" ? [e.id] : []));

describe("run store", () => {
  beforeEach(() => {
    useDemoStore.getState().resetDemo();
  });

  afterEach(() => {
    useRunStore.getState().finish();
    services.scheduling = real;
    useDemoStore.setState({ addArrangement: realAdd });
  });

  it("ignores a cancelled run's late events when a new run has started", async () => {
    const hold = gate();
    const signals: AbortSignal[] = [];
    let calls = 0;
    stub({
      async *plan({ signal }) {
        if (signal) signals.push(signal);
        calls += 1;
        if (calls === 1) {
          yield step("first");
          await hold.promise;
          yield step("late");
          yield options;
        } else {
          yield step("second");
          yield options;
        }
      },
    });

    useRunStore.getState().start(task);
    await settle();
    assert.deepEqual(ids(), ["first"]);

    useRunStore.getState().cancel();
    assert.equal(useRunStore.getState().phase, "idle");
    useRunStore.getState().start(task);
    await settle();
    hold.open();
    await settle();

    assert.deepEqual(ids(), ["second"]);
    assert.equal(useRunStore.getState().phase, "choosing");
    assert.equal(signals[0].aborted, true, "the first run is told to stop");
    assert.equal(signals[1].aborted, false);
  });

  it("does not show a cancelled run as failed, even when its stream throws on abort", async () => {
    const hold = gate();
    stub({
      async *plan() {
        yield step("a");
        await hold.promise;
        throw new Error("aborted");
      },
    });
    useRunStore.getState().start(task);
    await settle();
    useRunStore.getState().cancel();
    hold.open();
    await settle();
    assert.equal(useRunStore.getState().phase, "idle");
    assert.equal(useRunStore.getState().limit, null);
  });

  it("ends as failed when the stream throws", async () => {
    stub({
      async *plan() {
        yield step("a");
        throw new Error("the line dropped");
      },
    });
    useRunStore.getState().start(task);
    await settle();
    const s = useRunStore.getState();
    assert.equal(s.phase, "failed");
    assert.match(s.limit ?? "", /nothing was booked/i);
    assert.equal(useDemoStore.getState().arrangements.length, 0);
  });

  it("ends as failed when the stream stops without a result", async () => {
    stub({
      async *plan() {
        yield step("a");
      },
    });
    useRunStore.getState().start(task);
    await settle();
    assert.equal(useRunStore.getState().phase, "failed");
    assert.equal(useDemoStore.getState().arrangements.length, 0);
  });

  it("confirms once however many times she taps, and ignores an option it didn't offer", async () => {
    const hold = gate();
    let confirms = 0;
    const picked: string[] = [];
    stub({
      async *plan() {
        yield options;
      },
      async *confirm({ optionId, signal }) {
        confirms += 1;
        picked.push(optionId);
        assert.equal(signal?.aborted, false);
        await hold.promise;
        yield { type: "outcome", outcome };
      },
    });
    useRunStore.getState().start(task);
    await settle();
    assert.equal(useRunStore.getState().phase, "choosing");

    useRunStore.getState().choose("not-an-option");
    assert.equal(useRunStore.getState().phase, "choosing");

    useRunStore.getState().choose("opt-2");
    useRunStore.getState().choose("opt-2");
    useRunStore.getState().choose("opt-1");
    await settle();
    assert.equal(confirms, 1);
    assert.deepEqual(picked, ["opt-2"]);
    assert.equal(useRunStore.getState().phase, "confirming");

    hold.open();
    await settle();
    assert.equal(useRunStore.getState().phase, "done");
    assert.equal(useDemoStore.getState().arrangements.length, 1);
  });

  it("saves the arrangement once, with the task's title and without a second copy of the outcome", async () => {
    const saved: Arrangement[] = [];
    useDemoStore.setState({
      addArrangement: (a) => {
        saved.push(a);
        realAdd(a);
      },
    });
    stub({
      async *plan() {
        yield step("a");
        yield options;
      },
      async *confirm() {
        yield step("book");
        yield { type: "outcome", outcome };
      },
    });
    useRunStore.getState().start(task);
    await settle();
    useRunStore.getState().choose("opt-1");
    await settle();

    assert.equal(useRunStore.getState().phase, "done");
    assert.equal(saved.length, 1);
    const [arrangement] = saved;
    assert.equal(arrangement.taskId, task.id);
    assert.equal(arrangement.taskTitle, task.title);
    assert.equal(arrangement.optionId, "opt-1");
    assert.equal(arrangement.log.some((e) => e.type === "outcome"), false);
    assert.equal(arrangement.log.some((e) => e.type === "step"), true);
  });

  it("tells the service to stop when the run is finished", async () => {
    let seen: AbortSignal | undefined;
    stub({
      async *plan({ signal }) {
        seen = signal;
        yield { type: "outcome", outcome };
      },
    });
    useRunStore.getState().start(task);
    await settle();
    assert.equal(useRunStore.getState().phase, "done");
    assert.equal(seen?.aborted, false);
    useRunStore.getState().finish();
    assert.equal(seen?.aborted, true);
    assert.equal(useRunStore.getState().phase, "idle");
  });
});

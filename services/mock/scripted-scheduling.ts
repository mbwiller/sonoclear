import { ARRANGE_SCRIPTS, type TimedEvent } from "@/fixtures/arrange";
import { calendar, getDemoToday } from "@/lib/dates";
import type { AgentEvent, ArrangeTask, PatientContext } from "@/lib/types";
import type { SchedulingAgent } from "../types";
import { delay, isAbortError } from "./delay";

/**
 * Plays the scripts in `fixtures/arrange`: a simulated call to each office, steps that
 * start and finish at an unhurried pace, and a choice for the patient before anything is booked.
 * `pace()` scales every wait (1 is normal; the Fast preview setting and tests use less).
 */
export class ScriptedSchedulingAgent implements SchedulingAgent {
  constructor(private readonly options: { pace(): number } = { pace: () => 1 }) {}

  tasks(patient: PatientContext): ArrangeTask[] {
    return ARRANGE_SCRIPTS.flatMap((script) => script.task(patient) ?? []);
  }

  async *plan({
    task,
    patient,
    signal,
  }: {
    task: ArrangeTask;
    patient: PatientContext;
    signal?: AbortSignal;
  }): AsyncGenerator<AgentEvent> {
    const script = ARRANGE_SCRIPTS.find((s) => s.id === task.id);
    if (!script) return yield* this.play(unknownTask(), signal);
    yield* this.play(script.plan(calendar(getDemoToday()), patient), signal);
  }

  async *confirm({
    task,
    optionId,
    patient,
    signal,
  }: {
    task: ArrangeTask;
    optionId: string;
    patient: PatientContext;
    signal?: AbortSignal;
  }): AsyncGenerator<AgentEvent> {
    const script = ARRANGE_SCRIPTS.find((s) => s.id === task.id);
    if (!script) return yield* this.play(unknownTask(), signal);
    yield* this.play(script.confirm(calendar(getDemoToday()), patient, optionId), signal);
  }

  /**
   * Yields each event after its wait. If the consumer stops iterating, nothing else is scheduled.
   * If the signal aborts, the pending wait is cancelled and the stream simply ends.
   */
  private async *play(events: TimedEvent[], signal?: AbortSignal): AsyncGenerator<AgentEvent> {
    for (const { delayMs, event } of events) {
      if (signal?.aborted) return;
      const wait = Math.round(delayMs * this.options.pace());
      if (wait > 0) {
        try {
          await delay(wait, signal);
        } catch (error) {
          if (isAbortError(error)) return;
          throw error;
        }
      }
      yield event;
    }
  }
}

function unknownTask(): TimedEvent[] {
  return [{ delayMs: 300, event: { type: "limit", text: "Sonoclear can't arrange that one in this preview." } }];
}

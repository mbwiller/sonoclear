// CLINICAL REVIEW PENDING
/**
 * The Arrange scripts, in the order their tasks are offered. Each one knows its task (from the
 * patient's to-dos), what Sonoclear does while it plans, and what it does once she chooses.
 * `services/mock/scripted-scheduling.ts` plays them.
 */
import type { Calendar } from "@/lib/dates";
import type { ArrangeTask, ArrangeTaskId, PatientContext } from "@/lib/types";
import * as bloodwork from "./bloodwork";
import * as followUp from "./follow-up";
import * as genetics from "./genetics";
import * as imagingDiscs from "./imaging-discs";
import * as mri from "./mri";
import type { TimedEvent } from "./shared";

export type { TimedEvent } from "./shared";

export interface ArrangeScript {
  id: ArrangeTaskId;
  task(ctx: PatientContext): ArrangeTask | null;
  plan(cal: Calendar, ctx: PatientContext): TimedEvent[];
  confirm(cal: Calendar, ctx: PatientContext, optionId: string): TimedEvent[];
}

export const ARRANGE_SCRIPTS: ArrangeScript[] = [
  { id: imagingDiscs.TASK_ID, ...imagingDiscs },
  { id: mri.TASK_ID, ...mri },
  { id: genetics.TASK_ID, ...genetics },
  { id: bloodwork.TASK_ID, ...bloodwork },
  { id: followUp.TASK_ID, ...followUp },
];

import { useId } from "react";
import type { StageId } from "@/lib/types";

/**
 * Element ids for one Journey instance. Next keeps visited routes mounted but hidden,
 * so fixed ids could collide with another screen's; these are unique per instance
 * and still work as in-page anchors (e.g. Up next → the to-do list).
 */
export function useJourneyIds() {
  const base = `journey-${useId().replace(/[^A-Za-z0-9_-]/g, "")}`;
  return {
    upNextHeading: `${base}-up-next`,
    todos: `${base}-todos`,
    timeline: `${base}-timeline`,
    stage: (id: StageId) => `${base}-stage-${id}`,
  };
}

export type JourneyIds = ReturnType<typeof useJourneyIds>;

"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useCare, useCareActions, useResetCount } from "@/lib/care";
import { VISIT_TYPE_LABELS } from "@/lib/visit-types";
import { BeforeView } from "./before-view";
import { clinicianLabel, displayName, resolveVisit } from "./capture-state";
import { captureHidden, captureShown, useCaptureStore } from "./capture-store";
import { DuringView, FailedView, FullScreen, ProcessingView } from "./recording-overlay";

/**
 * Capture: choose who the visit is with, record it, and land on the new visit's notes.
 * The recording itself lives in `useCaptureStore`, so it survives leaving this screen.
 */
export function CaptureScreen() {
  const care = useCare();
  const { addCapturedVisit } = useCareActions();
  const resetCount = useResetCount();
  const router = useRouter();
  const state = useCaptureStore();

  // On screen or not (hidden tabs, or dropped from memory). Leaving pauses a live recording.
  useLayoutEffect(() => {
    captureShown((visitId) => router.replace(`/visit/${visitId}`));
    return captureHidden;
  }, [router]);

  // Reset demo clears any recording and brings back the starting pre-selection.
  useLayoutEffect(() => {
    useCaptureStore.getState().syncResetCount(resetCount);
  }, [resetCount]);

  const resolved = state.setup ? resolveVisit(state.setup, care) : null;
  const name = resolved ? displayName(resolved) : undefined;
  const typeLabel = state.setup ? VISIT_TYPE_LABELS[state.setup.visitType] : "";
  const visitLabel = [typeLabel, name].filter(Boolean).join(", ");

  return (
    <>
      <BeforeView key={`${state.generation}:${resetCount}`} onStart={state.start} />
      {state.phase !== "before" ? (
        <FullScreen
          label={
            state.phase === "recording"
              ? `Recording your visit: ${visitLabel}`
              : state.phase === "failed"
                ? "Your notes aren’t ready yet"
                : "Putting your notes together"
          }
          focusKey={state.phase === "landed" ? "processing" : state.phase}
        >
          {state.phase === "recording" ? (
            <DuringView
              typeLabel={typeLabel}
              name={name}
              clinicianLabel={resolved ? clinicianLabel(resolved) : "Clinician"}
              paused={state.status === "paused"}
              interrupted={state.interrupted}
              accumulatedMs={state.accumulatedMs}
              resumedAt={state.resumedAt}
              segments={state.segments}
              onPause={state.pause}
              onResume={state.resume}
              onEnd={() => void state.end({ care, save: addCapturedVisit })}
            />
          ) : state.phase === "failed" ? (
            <FailedView
              canRetry={(state.transcript?.segments.length ?? 0) > 0}
              onRetry={() => void state.retry(addCapturedVisit)}
              onDiscard={state.discard}
            />
          ) : (
            <ProcessingView typeLabel={typeLabel} name={name} />
          )}
        </FullScreen>
      ) : null}
    </>
  );
}

"use client";

import { Contours } from "@/components/ui/contours";
import { Page } from "@/components/ui/layout";
import { useCare } from "@/lib/care";
import { useJourneyIds } from "./ids";
import { JourneyHeader } from "./journey-header";
import { JourneyPath } from "./journey-path";
import { OpenTodos } from "./open-todos";
import { Timeline } from "./timeline";
import { UpNextCard } from "./up-next-card";

/**
 * Home. Answers "where am I, and what's next?"
 * Phones: header, Up next, open to-dos, timeline. Desktop: what's next on the left, the journey on the right.
 */
export function JourneyScreen() {
  const care = useCare();
  const ids = useJourneyIds();

  return (
    <div className="relative">
      <Contours />
      <Page width="wide" className="relative">
        <JourneyHeader patient={care.patient} today={care.today} />

        <JourneyPath stages={care.stageViews} className="mt-10 lg:mt-12" />

        <div className="mt-9 grid gap-12 lg:mt-14 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-x-14 xl:gap-x-20">
          <div className="flex min-w-0 flex-col gap-12">
            <UpNextCard care={care} ids={ids} />
            <OpenTodos care={care} ids={ids} />
          </div>
          <div className="min-w-0">
            <Timeline care={care} ids={ids} />
          </div>
        </div>
      </Page>
    </div>
  );
}

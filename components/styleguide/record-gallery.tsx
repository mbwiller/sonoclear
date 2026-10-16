"use client";

import type { ReactNode } from "react";
import { BackLink, Page, PageTitle } from "@/components/ui/layout";
import { RecordButton, RecordControls, type RecordVariant } from "./record-buttons";

const CANDIDATES: { variant: RecordVariant; name: string; why: string }[] = [
  {
    variant: "ink-disc",
    name: "Ink disc",
    why: "A solid ink circle with a small paper square: the plain, familiar record and stop language, nothing added.",
  },
  {
    variant: "hairline-ring",
    name: "Hairline ring",
    why: "A white disc in a thin ring with one sage dot. It lies flat on the page and fills softly when pressed.",
  },
  {
    variant: "pill",
    name: "Pill",
    why: "The same full-width pill as every other button in the app, with the thin three-bar mark. The least like a gadget.",
  },
  {
    variant: "sage-disc",
    name: "Sage disc",
    why: "A soft sage disc with the word Record in the serif, and a slow ring that breathes. Warm and a little editorial.",
  },
  {
    variant: "concentric",
    name: "Concentric",
    why: "An ink disc inside a quiet outer ring, with the thin three-bar mark. Firm and easy to find with one thumb.",
  },
];

/** A paper frame, to judge a control the way it sits on its screen. */
function Frame({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col rounded-card border border-line bg-paper px-5 py-8">
      <figcaption className="eyebrow mb-8 text-center">{caption}</figcaption>
      <div className="flex flex-1 flex-col items-center justify-center text-center">{children}</div>
    </figure>
  );
}

function Consent({ id }: { id: string }) {
  return (
    <p id={id} className="mt-4 text-body-sm text-ink-muted">
      Let your doctor know you&rsquo;re recording.
    </p>
  );
}

/** /styleguide/record: five record-button candidates, each with the matching Pause and End. */
export function RecordGallery() {
  return (
    <Page width="default">
      <BackLink href="/styleguide">Styleguide</BackLink>
      <PageTitle className="mt-4">Record button</PageTitle>
      <p className="mt-3 max-w-[36rem] text-body text-ink-muted text-pretty">
        Five ways to start a recording, each with the Pause and End that go with it. Name one by its number.
      </p>

      <div className="mt-12 flex flex-col gap-16 lg:mt-16 lg:gap-20">
        {CANDIDATES.map(({ variant, name, why }, i) => (
          <section key={variant} aria-labelledby={`candidate-${variant}`}>
            <div className="flex items-baseline gap-4">
              <span aria-hidden className="font-display text-display-lg text-ink-muted tabular">
                {i + 1}
              </span>
              <h2 id={`candidate-${variant}`} className="font-display text-display-md text-ink">
                <span className="sr-only">{i + 1}. </span>
                {name}
              </h2>
            </div>
            <p className="mt-2 max-w-[36rem] text-body-sm text-ink-muted text-pretty">{why}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Frame caption="Capture">
                <RecordButton variant={variant} describedBy={`consent-${variant}-idle`} />
                <Consent id={`consent-${variant}-idle`} />
              </Frame>
              <Frame caption="Pressed">
                <RecordButton variant={variant} pressed describedBy={`consent-${variant}-pressed`} />
                <Consent id={`consent-${variant}-pressed`} />
              </Frame>
              <div className="sm:col-span-2">
                <Frame caption="During the visit">
                  <RecordControls variant={variant} />
                </Frame>
              </div>
            </div>
          </section>
        ))}
      </div>
    </Page>
  );
}

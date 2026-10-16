"use client";

import { useState, type ReactNode } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { Bars } from "@/components/ui/bars";
import { Button, ButtonLink } from "@/components/ui/button";
import { Chip, ChoiceChip } from "@/components/ui/chip";
import { Contours } from "@/components/ui/contours";
import { Disclosure } from "@/components/ui/disclosure";
import { TextArea, TextField } from "@/components/ui/field";
import { Avatar, BackLink, Card, Eyebrow, Hairline, Page, PageTitle } from "@/components/ui/layout";
import { Logo } from "@/components/ui/logo";
import { Prose } from "@/components/ui/prose";
import { Row, Rows } from "@/components/ui/rows";
import { Sheet } from "@/components/ui/sheet";
import { SourceChip } from "@/components/ui/source-chip";
import { EmptyState, LoadingState, Note } from "@/components/ui/states";
import { TermChip, TermLink } from "@/components/ui/term";
import { TodoRow } from "@/components/ui/todo-row";
import { RecordFigure } from "@/components/records/visuals";
import { useCare } from "@/lib/care";
import { formatDuration, formatShortDate } from "@/lib/dates";
import { VISIT_TYPE_LABELS, VISIT_TYPES } from "@/lib/visit-types";
import type { VisitType } from "@/lib/types";

const SWATCHES = [
  { name: "paper", hex: "#F8F7F3", use: "App background" },
  { name: "surface", hex: "#FFFFFF", use: "Cards, inputs, sheets" },
  { name: "sunken", hex: "#F1EFE8", use: "Chips, quiet fills" },
  { name: "line", hex: "#E5E2D8", use: "1px hairlines" },
  { name: "line-strong", hex: "#8F8A7A", use: "Checkbox and input boundaries" },
  { name: "ink", hex: "#232F5C", use: "Text, primary buttons" },
  { name: "ink-muted", hex: "#5E6682", use: "Secondary text" },
  { name: "sage", hex: "#6B7A4C", use: "Accent: bars, checks, focus" },
  { name: "sage-ink", hex: "#58663C", use: "Sage as text" },
  { name: "sage-soft", hex: "#E3E8D6", use: "Selected chips, accent fills" },
  { name: "attention", hex: "#A9781F", use: "Rare: needs action" },
  { name: "attention-ink", hex: "#87601A", use: "Attention as text" },
];

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-10 first:border-t-0 first:pt-0">
      <Eyebrow className="mb-6">{title}</Eyebrow>
      {children}
    </section>
  );
}

export function Styleguide() {
  const care = useCare();
  const [visitType, setVisitType] = useState<VisitType>("breast-surgeon");
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathology = care.recordById.get("record-pathology");
  const results = care.visitById.get("visit-results");
  const erTerm = care.glossary.find((t) => t.id === "er-positive");
  const biradsTerm = care.glossary.find((t) => t.id === "bi-rads-5");
  const figures = [
    care.recordById.get("record-diagnostic-imaging")?.explanation.visuals?.find((v) => v.kind === "locator"),
    care.recordById.get("record-diagnostic-imaging")?.explanation.visuals?.find((v) => v.kind === "scale"),
    pathology?.explanation.visuals?.find((v) => v.kind === "markers"),
  ].filter((v) => v !== undefined);

  return (
    <Page width="default">
      <BackLink href="/journey">Journey</BackLink>
      <PageTitle className="mt-4">Styleguide</PageTitle>
      <p className="mt-3 max-w-xl text-body text-ink-muted">
        The primitives every Sonoclear screen is built from. One paper, one ink, one accent.
      </p>

      <div className="mt-12">
        <Block title="Logo">
          <div className="flex flex-wrap items-center gap-10">
            <Logo />
            <Logo size="sm" />
          </div>
        </Block>

        <Block title="Type">
          <div className="flex flex-col gap-6">
            <p className="font-display text-display-xl lg:text-[3rem]">Good afternoon, Claire</p>
            <p className="font-display text-display-lg">Surgical consult with Dr. Ellery</p>
            <p className="font-display text-display-md">
              What would you like to <em>understand</em>?
            </p>
            <p className="font-display text-display-sm">Treatment planning</p>
            {results ? <Prose text={results.notes.summary.slice(0, 2)} className="max-w-[62ch]" /> : null}
            <p className="text-body-sm text-ink-muted">Secondary text is 15px, in ink-muted.</p>
            <p className="text-caption text-ink-muted">Captions are 13px.</p>
            <div className="flex gap-6">
              <Eyebrow as="p">Up next</Eyebrow>
              <Eyebrow as="p">Open to-dos</Eyebrow>
              <Eyebrow as="p">Terms explained</Eyebrow>
            </div>
          </div>
        </Block>

        <Block title="Color">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SWATCHES.map((s) => (
              <li key={s.name} className="overflow-hidden rounded-[18px] border border-line bg-surface">
                <div className="h-16 border-b border-line" style={{ background: s.hex }} />
                <div className="px-4 py-3">
                  <p className="text-body-sm font-medium">{s.name}</p>
                  <p className="text-caption text-ink-muted">
                    {s.hex} · {s.use}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Save to records</Button>
            <Button variant="secondary" icon={<Plus size={18} aria-hidden />}>
              Add a record
            </Button>
            <Button variant="quiet">Show transcript</Button>
            <ButtonLink href="/ask" variant="secondary" iconAfter={<ArrowRight size={18} aria-hidden />}>
              Ask about this visit
            </ButtonLink>
            <Button disabled>Saving</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="lg">Start recording</Button>
            <Button size="lg" variant="secondary">
              End
            </Button>
          </div>
        </Block>

        <Block title="Chips">
          <div className="flex flex-wrap gap-2">
            {results ? (
              <>
                <Chip>{formatShortDate(results.date)}</Chip>
                <Chip>Primary care</Chip>
                <Chip>{formatDuration(results.durationMs)}</Chip>
              </>
            ) : null}
          </div>
          <div role="radiogroup" aria-label="Visit type" className="mt-5 flex flex-wrap gap-2">
            {VISIT_TYPES.map((t) => (
              <ChoiceChip
                key={t}
                role="radio"
                aria-checked={visitType === t}
                selected={visitType === t}
                onClick={() => setVisitType(t)}
              >
                {VISIT_TYPE_LABELS[t]}
              </ChoiceChip>
            ))}
          </div>
        </Block>

        <Block title="Cards">
          <Card className="p-6">
            <Eyebrow as="p">Up next</Eyebrow>
            <p className="mt-3 font-display text-display-sm">Surgical consult with Dr. Ellery</p>
            <p className="mt-1 text-body text-ink-muted">Linden Health Breast Surgery, Suite 300</p>
            <Hairline className="my-5" />
            <p className="text-body-sm text-ink-muted">{care.openTodos.length} open to-dos</p>
          </Card>
        </Block>

        <Block title="Three bars">
          <div className="flex flex-wrap items-end gap-10">
            <Bars size="xs" live />
            <Bars size="sm" live />
            <Bars size="md" live />
            <Bars size="lg" live />
            <Bars size="xl" live />
            <Bars size="md" />
          </div>
          <Card className="mt-6 py-12">
            <LoadingState title="Putting your notes together" detail="This takes a moment." />
          </Card>
        </Block>

        <Block title="Record button">
          <ButtonLink href="/styleguide/record" variant="secondary">
            See the record button gallery
          </ButtonLink>
        </Block>

        <Block title="To-do rows">
          <Card className="divide-y divide-line px-5">
            {care.todos
              .filter((t) => t.sourceVisitId === "visit-results")
              .map((t) => (
                <TodoRow key={t.id} todo={t} />
              ))}
          </Card>
        </Block>

        <Block title="Terms and sheets">
          {erTerm && biradsTerm ? (
            <>
              <p className="max-w-[62ch] text-body">
                Your cancer is <TermLink term={erTerm} />, which means its cells respond to estrogen. Your imaging was
                read as <TermLink term={biradsTerm} />.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <TermChip term={erTerm} />
                <TermChip term={biradsTerm} />
              </div>
            </>
          ) : null}
          <div className="mt-6">
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>
              Open a sheet
            </Button>
            <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} eyebrow="Live transcript" title="Surgical consult">
              <p className="text-body text-ink-muted">Sheets hold secondary detail and never cover data the patient needs.</p>
            </Sheet>
          </div>
        </Block>

        <Block title="Figures">
          <p className="-mt-2 mb-6 max-w-xl text-body-sm text-ink-muted">
            Quiet drawings in a record&rsquo;s &ldquo;At a glance&rdquo; section. Hairlines, one sage mark for your result, a
            caption in plain words. Never a chart.
          </p>
          <Card className="divide-y divide-line">
            {figures.map((visual, i) => (
              <div key={`${visual.kind}-${i}`} className="px-5 py-5 sm:px-6">
                <RecordFigure visual={visual} />
              </div>
            ))}
          </Card>
        </Block>

        <Block title="Sources">
          <div className="flex flex-wrap gap-2">
            <SourceChip source={{ kind: "record", id: "record-pathology", label: "From your pathology report" }} />
            <SourceChip source={{ kind: "visit", id: "visit-results", label: "From your visit with Dr. Raman" }} />
          </div>
        </Block>

        <Block title="Rows">
          {pathology ? (
            <Rows>
              {pathology.explanation.keyFindings.slice(0, 4).map((f) => (
                <Row key={f.label} label={f.label} value={f.value} plain={f.plain} term={f.term} />
              ))}
            </Rows>
          ) : null}
        </Block>

        <Block title="Disclosure">
          {results?.transcript ? (
            <Disclosure summary="Full transcript" meta={`${results.transcript.segments.length} passages`}>
              <p className="text-body text-ink">{results.transcript.segments[0]?.text}</p>
            </Disclosure>
          ) : null}
        </Block>

        <Block title="Fields">
          <div className="flex max-w-md flex-col gap-5">
            <TextField id="sg-clinician" label="Clinician" hint="(optional)" placeholder="Dr. Marcus Ellery" />
            <TextArea id="sg-paste" label="Paste the text of a report" />
          </div>
        </Block>

        <Block title="Notes and empty states">
          <div className="flex flex-col gap-4">
            <Note>Explanations aren&apos;t available for this document in this preview.</Note>
            <Note tone="attention">Your imaging office hasn&apos;t called yet. You can call them at (617) 555-0168.</Note>
            <EmptyState title="No genetics records yet">
              Genetic test results usually come after genetic counseling.
            </EmptyState>
          </div>
        </Block>

        <Block title="Texture and avatar">
          <div className="relative h-56 overflow-hidden rounded-card border border-line">
            <Contours />
            <div className="relative flex h-full items-end justify-between p-6">
              <p className="font-display text-display-md">Good afternoon, Claire</p>
              <Avatar initials="CD" />
            </div>
          </div>
        </Block>
      </div>
    </Page>
  );
}

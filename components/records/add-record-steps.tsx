"use client";

import type { ReactNode, Ref } from "react";
import { Camera, ChevronRight, ClipboardPaste, FileText, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/field";
import { LoadingState, Note } from "@/components/ui/states";
import { formatShortDate } from "@/lib/dates";
import type { RecordExplanation, RecordUpload } from "@/lib/types";
import { RECORD_TYPE_LABELS } from "@/lib/visit-types";
import { formatBytes } from "./format";

/** The body of each step in the add-a-record sheet. State and actions live in the sheet. */

export type PhotoState =
  | { status: "empty" }
  | { status: "preparing"; fileName: string }
  | { status: "ready"; upload: RecordUpload }
  | { status: "error"; message: string };

export type PdfState = { status: "empty" } | { status: "ready"; upload: RecordUpload } | { status: "error"; message: string };

/** "Sep 4, 2025 · Linden Health Imaging": a spaced separator that reads as a pause. */
function MetaLine({ parts, className }: { parts: string[]; className?: string }) {
  return (
    <p className={className}>
      {parts.map((part, i) => (
        <span key={part}>
          {i > 0 ? (
            <>
              <span aria-hidden className="mx-1.5">
                ·
              </span>
              <span className="sr-only">, </span>
            </>
          ) : null}
          {part}
        </span>
      ))}
    </p>
  );
}

/* ---------- Choose ---------- */

function MethodRow({ icon, title, detail, onClick }: { icon: ReactNode; title: string; detail: string; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group flex min-h-[5rem] w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-200 ease-calm hover:bg-paper focus-visible:outline-offset-[-2px]"
      >
        <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-paper text-ink">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-medium text-ink">{title}</span>
          <span className="block text-body-sm text-ink-muted text-pretty">{detail}</span>
        </span>
        <ChevronRight
          size={20}
          aria-hidden
          className="shrink-0 text-ink-muted transition-transform duration-200 ease-calm group-hover:translate-x-0.5"
        />
      </button>
    </li>
  );
}

export function ChooseStep({
  onPhoto,
  onPdf,
  onPaste,
}: {
  onPhoto: () => void;
  onPdf: () => void;
  onPaste: () => void;
}) {
  return (
    <>
      <p className="text-body text-ink-muted text-pretty">
        A report, result or letter from your care team. It&rsquo;s kept with your other records and explained in plain
        words where possible.
      </p>
      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        <MethodRow icon={<Camera size={20} />} title="Take a photo" detail="Of a printed report or letter" onClick={onPhoto} />
        <MethodRow
          icon={<FileUp size={20} />}
          title="Upload a PDF"
          detail="From your patient portal or an email"
          onClick={onPdf}
        />
        <MethodRow
          icon={<ClipboardPaste size={20} />}
          title="Paste text"
          detail="Copy the words of a report and paste them in"
          onClick={onPaste}
        />
      </ul>
      <p className="mt-5 text-caption text-ink-muted text-pretty">In this preview, what you add stays in this browser.</p>
    </>
  );
}

/* ---------- Input: paste, photo, PDF ---------- */

export function PasteStep({
  id,
  textAreaRef,
  text,
  onChange,
  onUseSample,
}: {
  id: string;
  textAreaRef: Ref<HTMLTextAreaElement>;
  text: string;
  onChange: (text: string) => void;
  /** Present only when the interpreter offers a sample document. */
  onUseSample?: () => void;
}) {
  return (
    <>
      <TextArea
        ref={textAreaRef}
        id={id}
        label="The text of your document"
        hint="From your patient portal, an email or a letter"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={9}
        spellCheck={false}
        className="[&_textarea]:min-h-56"
      />
      {onUseSample ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Button variant="quiet" className="-ml-3" onClick={onUseSample}>
            Use a sample report
          </Button>
          <span className="text-caption text-ink-muted">Last year&rsquo;s screening mammogram, to see how this works</span>
        </div>
      ) : null}
    </>
  );
}

export function PhotoStep({ photo, onChoose }: { photo: PhotoState; onChoose: () => void }) {
  switch (photo.status) {
    case "preparing":
      return <LoadingState title="Preparing your photo" className="py-10" />;
    case "ready":
      return (
        <>
          <p className="text-body text-ink-muted text-pretty">
            Check that the whole page is in the photo and the words are easy to read.
          </p>
          <figure className="mt-5 overflow-hidden rounded-card border border-line bg-paper">
            {/* A downscaled data URL; next/image adds nothing here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.upload.dataUrl}
              alt="The photo you chose"
              className="mx-auto block max-h-[42dvh] w-auto max-w-full object-contain"
            />
            <figcaption className="border-t border-line bg-surface px-5 py-3 text-caption text-ink-muted break-all">
              {photo.upload.fileName}
            </figcaption>
          </figure>
          <Button variant="quiet" className="-ml-3 mt-3" onClick={onChoose}>
            Choose a different photo
          </Button>
        </>
      );
    case "error":
      return (
        <>
          <Note>{photo.message}</Note>
          <Button variant="secondary" className="mt-5" onClick={onChoose}>
            Try another photo
          </Button>
        </>
      );
    case "empty":
      return (
        <Button variant="secondary" icon={<Camera size={18} aria-hidden />} onClick={onChoose}>
          Take a photo
        </Button>
      );
  }
}

export function PdfStep({ pdf, onChoose }: { pdf: PdfState; onChoose: () => void }) {
  switch (pdf.status) {
    case "ready":
      return (
        <>
          <div className="flex items-center gap-4 rounded-card border border-line bg-paper px-5 py-4">
            <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink">
              <FileText size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-body font-medium text-ink break-words">{pdf.upload.fileName}</p>
              <MetaLine
                className="text-body-sm text-ink-muted tabular"
                parts={["PDF", formatBytes(pdf.upload.sizeBytes ?? 0)]}
              />
            </div>
          </div>
          <p className="mt-4 text-body-sm text-ink-muted text-pretty">
            In this preview, only the file&rsquo;s name and size are saved, not the file itself.
          </p>
          <Button variant="quiet" className="-ml-3 mt-2" onClick={onChoose}>
            Choose a different file
          </Button>
        </>
      );
    case "error":
      return (
        <>
          <Note>{pdf.message}</Note>
          <Button variant="secondary" className="mt-5" onClick={onChoose}>
            Choose a PDF
          </Button>
        </>
      );
    case "empty":
      return (
        <Button variant="secondary" icon={<FileUp size={18} aria-hidden />} onClick={onChoose}>
          Choose a PDF
        </Button>
      );
  }
}

/* ---------- Reading, result, failed ---------- */

export function ReadingStep() {
  return <LoadingState title="Reading your document" detail="This takes a few seconds." className="py-12 lg:py-16" />;
}

/** What will be saved: type, title, date and source, set like a small document card. */
function SavePreview({ explanation, children }: { explanation: RecordExplanation; children?: ReactNode }) {
  const type = explanation.recognized ? explanation.suggestedType : "other";
  const meta = [
    explanation.documentDate ? formatShortDate(explanation.documentDate) : null,
    explanation.source ?? "Added by you",
  ].filter((m): m is string => Boolean(m));
  return (
    <div className="rounded-card border border-line bg-paper px-5 py-5 sm:px-6">
      <p className="eyebrow">{RECORD_TYPE_LABELS[type]}</p>
      <p className="mt-2 font-display text-display-sm text-ink text-balance">{explanation.suggestedTitle}</p>
      <MetaLine className="mt-1 text-body-sm text-ink-muted tabular" parts={meta} />
      {children ? <div className="mt-4 border-t border-line pt-4">{children}</div> : null}
    </div>
  );
}

export function ResultStep({ explanation }: { explanation: RecordExplanation }) {
  const recognized = explanation.recognized && explanation.summary.length > 0;
  if (recognized) {
    return (
      <>
        <SavePreview explanation={explanation}>
          <p className="text-body text-ink text-pretty">{explanation.summary[0]}</p>
        </SavePreview>
        <p className="mt-4 text-body-sm text-ink-muted text-pretty">
          Saving keeps it under {RECORD_TYPE_LABELS[explanation.suggestedType]}, with the full explanation, key findings
          and your original.
        </p>
      </>
    );
  }
  return (
    <>
      <Note>{explanation.note ?? "Explanations aren't available for this document in this preview."}</Note>
      <div className="mt-5">
        <SavePreview explanation={explanation} />
      </div>
      <p className="mt-4 text-body-sm text-ink-muted text-pretty">Saving keeps it under Other, with your original.</p>
    </>
  );
}

export function FailedStep() {
  return (
    <Note>
      Something went wrong while reading this document. Nothing was saved. You can try again, or go back and choose
      another way to add it.
    </Note>
  );
}

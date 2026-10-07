"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { getPatientContext, useCareActions } from "@/lib/care";
import { cn } from "@/lib/cn";
import type { RecordExplanation, RecordUpload } from "@/lib/types";
import { services } from "@/services";
import {
  ChooseStep,
  FailedStep,
  PasteStep,
  PdfStep,
  PhotoStep,
  ReadingStep,
  ResultStep,
  type PdfState,
  type PhotoState,
} from "./add-record-steps";
import { dataUrlBytes, downscalePhoto } from "./format";
import { buildUploadedRecord, isPdf } from "./uploaded-record";

type Method = "photo" | "pdf" | "text";

type Step =
  | { name: "choose" }
  | { name: "input"; method: Method }
  | { name: "reading"; method: Method; upload: RecordUpload }
  | { name: "result"; method: Method; upload: RecordUpload; explanation: RecordExplanation }
  | { name: "failed"; method: Method; upload: RecordUpload };

const INPUT_TITLES: Record<Method, string> = {
  photo: "Your photo",
  pdf: "Your PDF",
  text: "Paste the text",
};

function stepTitle(step: Step): string {
  switch (step.name) {
    case "choose":
    case "reading":
      return "Add a record";
    case "input":
      return INPUT_TITLES[step.method];
    case "result":
      return "Ready to save";
    case "failed":
      return "That didn't work";
  }
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="quiet" className="-ml-3" icon={<ChevronLeft size={18} aria-hidden />} onClick={onClick}>
      Back
    </Button>
  );
}

/**
 * Add a record: choose photo, PDF or pasted text, read it, review, save.
 * Nothing moves on without the patient except the reading step.
 */
export function AddRecordSheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const { addUploadedRecord } = useCareActions();
  const [step, setStep] = useState<Step>({ name: "choose" });
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<PhotoState>({ status: "empty" });
  const [pdf, setPdf] = useState<PdfState>({ status: "empty" });
  const [saving, setSaving] = useState(false);

  const photoInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const stepBody = useRef<HTMLDivElement>(null);
  const request = useRef(0);
  const textId = useId();

  const interpreter = services.recordInterpreter;
  const fillSample = interpreter.sampleText ? () => setText(interpreter.sampleText?.() ?? "") : undefined;

  // Move focus with the flow so keyboard and screen reader users land on the new step.
  const stepKey = step.name === "input" ? `input-${step.method}` : step.name;
  const lastStepKey = useRef(stepKey);
  useEffect(() => {
    if (lastStepKey.current === stepKey) return;
    lastStepKey.current = stepKey;
    if (!open) return;
    if (stepKey === "input-text") textArea.current?.focus();
    else stepBody.current?.focus();
  }, [stepKey, open]);

  // Stop listening for a reading that's still running when the sheet closes.
  useEffect(() => {
    if (!open) request.current++;
  }, [open]);

  const choosePhoto = () => photoInput.current?.click();
  const choosePdf = () => pdfInput.current?.click();

  const onPhotoPicked = async (file: File | undefined) => {
    if (!file) return;
    setStep({ name: "input", method: "photo" });
    setPhoto({ status: "preparing", fileName: file.name });
    try {
      const dataUrl = await downscalePhoto(file);
      setPhoto({
        status: "ready",
        upload: {
          kind: "photo",
          fileName: file.name,
          mimeType: "image/jpeg",
          sizeBytes: dataUrlBytes(dataUrl),
          dataUrl,
          // The full-resolution original, for an interpreter that reads it. Never saved.
          file,
        },
      });
    } catch {
      setPhoto({
        status: "error",
        message: "This photo couldn't be opened. Try taking it again, or choose a JPEG or PNG.",
      });
    }
  };

  const onPdfPicked = (file: File | undefined) => {
    if (!file) return;
    setStep({ name: "input", method: "pdf" });
    if (!isPdf(file)) {
      setPdf({ status: "error", message: "That file isn't a PDF. Choose a PDF, or take a photo of the document instead." });
      return;
    }
    setPdf({
      status: "ready",
      // The file travels with the upload for the interpreter; only its name and size are saved.
      upload: { kind: "pdf", fileName: file.name, mimeType: "application/pdf", sizeBytes: file.size, file },
    });
  };

  const currentUpload = (method: Method): RecordUpload | null => {
    if (method === "text") return text.trim() ? { kind: "text", text: text.trim() } : null;
    if (method === "photo") return photo.status === "ready" ? photo.upload : null;
    return pdf.status === "ready" ? pdf.upload : null;
  };

  const read = async (method: Method, upload: RecordUpload) => {
    const req = ++request.current;
    setStep({ name: "reading", method, upload });
    try {
      const explanation = await interpreter.interpret(upload, getPatientContext());
      if (request.current !== req) return;
      setStep({ name: "result", method, upload, explanation });
    } catch {
      if (request.current !== req) return;
      setStep({ name: "failed", method, upload });
    }
  };

  const save = (upload: RecordUpload, explanation: RecordExplanation) => {
    if (saving) return;
    setSaving(true);
    const record = buildUploadedRecord(upload, explanation, getPatientContext());
    addUploadedRecord(record);
    onSaved(record.id);
  };

  /* ---------- The current step ---------- */

  let body: ReactNode;
  let footer: ReactNode = null;

  switch (step.name) {
    case "choose":
      body = (
        <ChooseStep
          onPhoto={choosePhoto}
          onPdf={choosePdf}
          onPaste={() => setStep({ name: "input", method: "text" })}
        />
      );
      break;

    case "input": {
      const { method } = step;
      const upload = currentUpload(method);
      body =
        method === "text" ? (
          <PasteStep id={textId} textAreaRef={textArea} text={text} onChange={setText} onUseSample={fillSample} />
        ) : method === "photo" ? (
          <PhotoStep photo={photo} onChoose={choosePhoto} />
        ) : (
          <PdfStep pdf={pdf} onChoose={choosePdf} />
        );
      footer = (
        <div className="flex items-center justify-between gap-3">
          <BackButton onClick={() => setStep({ name: "choose" })} />
          <Button disabled={!upload} onClick={() => upload && read(method, upload)}>
            Read this document
          </Button>
        </div>
      );
      break;
    }

    case "reading": {
      const { method } = step;
      body = <ReadingStep />;
      footer = (
        <Button
          variant="quiet"
          className="-ml-3"
          onClick={() => {
            request.current++;
            setStep({ name: "input", method });
          }}
        >
          Cancel
        </Button>
      );
      break;
    }

    case "result": {
      const { explanation, upload, method } = step;
      body = <ResultStep explanation={explanation} />;
      footer = (
        <div className="flex items-center justify-between gap-2">
          <BackButton onClick={() => setStep({ name: "input", method })} />
          <div className="flex items-center gap-2">
            <Button variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={() => save(upload, explanation)}>
              Save to records
            </Button>
          </div>
        </div>
      );
      break;
    }

    case "failed": {
      const { upload, method } = step;
      body = <FailedStep />;
      footer = (
        <div className="flex items-center justify-between gap-3">
          <BackButton onClick={() => setStep({ name: "input", method })} />
          <Button onClick={() => read(method, upload)}>Try again</Button>
        </div>
      );
      break;
    }
  }

  const title = stepTitle(step);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      size="lg"
      eyebrow={step.name === "choose" || step.name === "reading" ? undefined : "Add a record"}
      title={title}
      footer={footer}
    >
      <div
        ref={stepBody}
        tabIndex={-1}
        role="group"
        aria-label={title}
        className={cn("outline-none", step.name !== "choose" && "animate-fade-in")}
        key={stepKey}
      >
        {body}
      </div>

      {/* File pickers live outside the steps so they keep working from any of them. */}
      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void onPhotoPicked(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={pdfInput}
        type="file"
        accept="application/pdf"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          onPdfPicked(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </Sheet>
  );
}

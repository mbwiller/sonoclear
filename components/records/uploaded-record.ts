import { newId } from "@/lib/care";
import { nowISO } from "@/lib/dates";
import type { MedicalRecord, PatientContext, RecordExplanation, RecordOriginal, RecordUpload, StageId } from "@/lib/types";

/**
 * What's kept of an upload. Copies only what the record page shows: never `upload.file`,
 * which stays in memory for the interpreter and is never saved.
 */
function originalFor(upload: RecordUpload): RecordOriginal {
  switch (upload.kind) {
    case "photo":
      return { kind: "image", fileName: upload.fileName ?? "Photo", dataUrl: upload.dataUrl ?? "" };
    case "pdf":
      return { kind: "pdf", fileName: upload.fileName ?? "Document.pdf", sizeBytes: upload.sizeBytes ?? 0 };
    case "text":
      return { kind: "text", text: upload.text ?? "" };
  }
}

/**
 * The record to save for an interpreted upload. A document dated before her first visit
 * belongs to Screening; anything else joins the stage she's in now.
 */
export function buildUploadedRecord(upload: RecordUpload, explanation: RecordExplanation, ctx: PatientContext): MedicalRecord {
  const now = nowISO();
  const documentDate = explanation.documentDate;
  const firstVisit = ctx.visits.reduce<string | null>(
    (earliest, v) => (earliest === null || v.date < earliest ? v.date : earliest),
    null,
  );
  const stageId: StageId =
    documentDate && firstVisit && new Date(documentDate).getTime() < new Date(firstVisit).getTime()
      ? "screening"
      : ctx.currentStageId;
  return {
    id: newId("record"),
    type: explanation.recognized ? explanation.suggestedType : "other",
    title: explanation.suggestedTitle,
    date: documentDate ?? now,
    source: explanation.source ?? "Added by you",
    stageId,
    original: originalFor(upload),
    explanation,
    origin: "upload",
    addedAt: now,
  };
}

export function isPdf(file: File) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

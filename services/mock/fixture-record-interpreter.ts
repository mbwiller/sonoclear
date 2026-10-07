import { calendar, getDemoToday } from "@/lib/dates";
import type { RecordExplanation, RecordUpload } from "@/lib/types";
import { sampleUploadText, UNRECOGNIZED_UPLOAD_NOTE, UPLOAD_FIXTURES } from "@/fixtures/uploads";
import type { RecordInterpreter } from "../types";
import { delay } from "./delay";

/** Camera and scanner names ("IMG_4021", "Scan 3", "Screenshot … at 4.12 PM") say nothing about the document. */
function isGenericFileName(base: string): boolean {
  const rest = base
    .replace(/^(img|pxl|dsc|dcim|photo|image|screenshot|screen shot|scan|document|file)\b/i, "")
    .replace(/\b(at|am|pm)\b/gi, "");
  return !/[a-z]/i.test(rest);
}

function titleFromFileName(name?: string): string | null {
  if (!name) return null;
  const base = name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim();
  if (!base || isGenericFileName(base)) return null;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/**
 * Matches an upload against known fixture documents. Anything else is saved
 * with an honest note that explanations aren't available in this preview.
 */
export class FixtureRecordInterpreter implements RecordInterpreter {
  sampleText(): string {
    return sampleUploadText(calendar(getDemoToday()));
  }

  async interpret(upload: RecordUpload): Promise<RecordExplanation> {
    await delay(2400);
    const text = (upload.text ?? "").toLowerCase();

    // Match on the document's words only. A file name like "mammogram.pdf" can't tell
    // a normal report from any other, and explaining the wrong one would mislead.
    const match = text.length > 0 ? UPLOAD_FIXTURES.find((f) => f.textKeywords.every((k) => text.includes(k))) : undefined;
    if (match) return match.build(calendar(getDemoToday()));

    const fallbackTitle =
      upload.kind === "text" ? "Pasted document" : upload.kind === "photo" ? "Photo of a document" : "PDF document";
    return {
      recognized: false,
      suggestedType: "other",
      suggestedTitle: titleFromFileName(upload.fileName) ?? fallbackTitle,
      summary: [],
      keyFindings: [],
      note: UNRECOGNIZED_UPLOAD_NOTE,
    };
  }
}

import type { MedicalRecord } from "@/lib/types";

const ABBREVIATIONS = new Set(["dr", "mr", "mrs", "ms", "st", "vs", "e.g", "i.e", "approx"]);

/** The first sentence of a paragraph, without tripping on "Dr." and the like. */
export function firstSentence(text: string): string {
  const trimmed = text.trim();
  const end = /[.?!](?=\s|$)/g;
  let match: RegExpExecArray | null;
  while ((match = end.exec(trimmed))) {
    const before = trimmed.slice(0, match.index);
    const word = before.split(/\s+/).pop()?.toLowerCase() ?? "";
    if (match[0] === "." && ABBREVIATIONS.has(word)) continue;
    return trimmed.slice(0, match.index + 1);
  }
  return trimmed;
}

/** One short, plain line describing a record in the list. */
export function recordBlurb(record: MedicalRecord): string {
  const { explanation } = record;
  if (!explanation.recognized || explanation.summary.length === 0) {
    return "Saved · Explanation not available in this preview";
  }
  // "This is the report from…" reads better in a list as "The report from…".
  return firstSentence(explanation.summary[0]).replace(/^This is (the|a|an|your) /i, (_, w: string) =>
    `${w.charAt(0).toUpperCase()}${w.slice(1)} `,
  );
}

/** "84 KB", "2.4 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

/**
 * Downscales a photo in the browser so it can be kept in local storage:
 * at most `maxSide` pixels on the long side, re-encoded as JPEG.
 */
export async function downscalePhoto(file: File, maxSide = 1200, quality = 0.75): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("This image could not be opened."));
      el.src = url;
    });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) throw new Error("This image is empty.");
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser can't prepare photos.");
    // JPEG has no transparency: give transparent images a white page.
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Approximate decoded size of a base64 data URL. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.round((base64.length * 3) / 4);
}

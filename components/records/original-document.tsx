import { FileText } from "lucide-react";
import { Card } from "@/components/ui/layout";
import type { RecordOriginal } from "@/lib/types";
import { formatBytes } from "./format";

const LABEL = /^[A-Z][A-Z0-9 ()/'&.-]*:\s+(?=\S)/;

/** Cells of a report line: text runs separated by two or more spaces. */
function cellsOf(line: string): string[] {
  const trimmed = line.trim();
  return trimmed ? trimmed.split(/\s{2,}/) : [];
}

/**
 * Where a wrapped line should continue, in characters: under the last aligned column,
 * after a list dash, or after a "LABEL: " prefix. Keeps long report lines readable when they wrap.
 */
function hangFor(line: string): number {
  const indent = line.length - line.trimStart().length;
  const rest = line.slice(indent);
  let hang = indent;
  let lastGap = -1;
  for (const m of rest.matchAll(/\s{2,}(?=\S)/g)) lastGap = m.index + m[0].length;
  if (lastGap > 0) hang = indent + lastGap;
  else if (rest.startsWith("- ")) hang = indent + 2;
  else {
    const label = rest.match(LABEL);
    if (label) hang = indent + label[0].length;
  }
  return Math.min(hang, 48);
}

/* ---------- Wider screens: exactly as written ---------- */

function WideLine({ line }: { line: string }) {
  if (!line.trim()) return <span className="block">{" "}</span>;
  const hang = hangFor(line);
  return (
    <span className="block" style={hang ? { paddingLeft: `${hang}ch`, textIndent: `-${hang}ch` } : undefined}>
      {line}
    </span>
  );
}

/* ---------- Phones: the same words, reflowed so nothing scrolls sideways ---------- */

type Block = { kind: "line"; line: string } | { kind: "table"; header: string; rows: string[] };

/**
 * A table is a header with three or more columns followed by at least two rows that
 * also have columns (like a lab panel). Everything else stays line by line.
 */
function toBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    if (cellsOf(lines[i]).length >= 3) {
      let j = i + 1;
      while (j < lines.length && cellsOf(lines[j]).length >= 2) j++;
      if (j - i >= 3) {
        blocks.push({ kind: "table", header: lines[i], rows: lines.slice(i + 1, j) });
        i = j;
        continue;
      }
    }
    blocks.push({ kind: "line", line: lines[i] });
    i++;
  }
  return blocks;
}

/** Where each column starts, from the header's text runs. */
function columnStarts(header: string): number[] {
  return [...header.matchAll(/\S+(?: \S+)*/g)].map((m) => m.index);
}

/** A row cut at the header's column positions, never splitting a word. */
function sliceRow(row: string, starts: number[]): string[] {
  const bounds = starts.map((start, k) => {
    if (k === 0) return 0;
    let b = start;
    while (b < row.length && row[b - 1] !== " " && row[b] !== " ") b++;
    return b;
  });
  return bounds.map((b, k) => row.slice(b, k + 1 < bounds.length ? bounds[k + 1] : undefined).trim());
}

/**
 * A lab-style table on a phone: the name on its own line, then the values in aligned columns
 * underneath. Same words and order as the original, readable at 390px.
 */
function NarrowTable({ header, rows }: { header: string; rows: string[] }) {
  const starts = columnStarts(header);
  const table = [header, ...rows].map((r) => sliceRow(r, starts));
  const valueColumns = starts.length - 1;
  const template = Array.from({ length: valueColumns }, (_, k) => {
    if (k === valueColumns - 1) return "minmax(0,1fr)";
    const width = Math.max(1, ...table.map((cells) => cells[k + 1]?.length ?? 0));
    return `minmax(0,${width}ch)`;
  }).join(" ");

  return (
    <div className="flex flex-col gap-1.5 py-0.5">
      {table.map((cells, r) => (
        <div key={r} className={r === 0 ? "text-ink-muted" : undefined}>
          <span className="block break-words">{cells[0] || " "}</span>
          <span className="grid gap-x-[1.5ch] pl-[2ch]" style={{ gridTemplateColumns: template }}>
            {cells.slice(1).map((cell, k) => (
              <span key={k} className="min-w-0 [overflow-wrap:anywhere]">
                {cell}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function NarrowLine({ line }: { line: string }) {
  if (!line.trim()) return <span aria-hidden className="block h-[1.1em]" />;
  const indent = Math.min(line.length - line.trimStart().length, 4);
  const cells = cellsOf(line);
  if (cells.length === 1) {
    return (
      <span className="block break-words" style={indent ? { paddingLeft: `${indent}ch` } : undefined}>
        {cells[0]}
      </span>
    );
  }
  // A label and its value: the value wraps two characters in, under the label.
  return (
    <span className="flex flex-wrap gap-x-[2ch]" style={{ paddingLeft: `${indent + 2}ch` }}>
      {cells.map((cell, i) => (
        <span key={i} className="min-w-0 max-w-full break-words" style={i === 0 ? { marginLeft: "-2ch" } : undefined}>
          {cell}
        </span>
      ))}
    </span>
  );
}

/* ---------- Sizing ---------- */

/** Longest line with aligned columns: the width a table needs to stay aligned. */
function tableWidth(lines: string[]): number {
  return lines.reduce((max, l) => (/\S\s{2,}\S/.test(l) ? Math.max(max, l.trimEnd().length) : max), 0);
}

let advanceCache: number | null = null;

/** Width of one character of the monospace font, as a fraction of the font size. Measured once. */
function monoAdvance(): number {
  if (advanceCache) return advanceCache;
  advanceCache = 0.63;
  try {
    const probe = document.createElement("span");
    probe.className = "font-mono";
    // Measured at reading size: small sizes can round each character's width up.
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre;font-size:12px;left:-9999px;top:0";
    probe.textContent = "0".repeat(100);
    document.body.appendChild(probe);
    const measured = (probe.getBoundingClientRect().width / 1200) * 1.02;
    probe.remove();
    if (measured > 0.4 && measured < 0.8) advanceCache = measured;
  } catch {
    // Keep the estimate.
  }
  return advanceCache;
}

/* ---------- Documents ---------- */

/** A text document set like the paper it came on. `bare` drops the card when something else frames it. */
export function PaperText({ text, bare = false }: { text: string; bare?: boolean }) {
  const lines = text.split("\n");
  // Tables a little wider than the column shrink slightly to stay aligned; anything wider wraps instead.
  const columns = tableWidth(lines);
  const fontSize =
    columns > 60 && columns <= 76
      ? `min(0.8125rem, calc(100cqw / ${(columns * monoAdvance() + 0.5).toFixed(2)}))`
      : undefined;
  const content = (
    <div className="@container">
      <div className="font-mono text-ink">
        <div
          className="hidden whitespace-pre-wrap break-words text-[0.8125rem] leading-[1.75] sm:block"
          style={fontSize ? { fontSize } : undefined}
        >
          {lines.map((line, i) => (
            <WideLine key={i} line={line} />
          ))}
        </div>
        <div className="text-[0.8125rem] leading-[1.65] sm:hidden">
          {toBlocks(lines).map((block, i) =>
            block.kind === "table" ? (
              <NarrowTable key={i} header={block.header} rows={block.rows} />
            ) : (
              <NarrowLine key={i} line={block.line} />
            ),
          )}
        </div>
      </div>
    </div>
  );
  if (bare) return content;
  return <Card className="px-5 py-6 sm:px-6 sm:py-8">{content}</Card>;
}

export function PhotoOriginal({ original, title, bare = false }: { original: Extract<RecordOriginal, { kind: "image" }>; title: string; bare?: boolean }) {
  return (
    <figure className={bare ? undefined : "overflow-hidden rounded-card border border-line bg-surface"}>
      {/* A downscaled photo kept in this browser; next/image adds nothing for a data URL. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={original.dataUrl}
        alt={`The photo you added: ${title}`}
        className={bare ? "block h-auto w-full rounded-[14px] bg-paper" : "block h-auto w-full bg-paper"}
      />
      <figcaption
        className={
          bare
            ? "mt-3 text-caption text-ink-muted break-all"
            : "border-t border-line px-5 py-3 text-caption text-ink-muted break-all"
        }
      >
        {original.fileName}
      </figcaption>
    </figure>
  );
}

export function PdfOriginal({ original }: { original: Extract<RecordOriginal, { kind: "pdf" }> }) {
  return (
    <div className="flex flex-col gap-3">
      <Card className="flex items-center gap-4 px-5 py-4">
        <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-sunken text-ink">
          <FileText size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-body font-medium text-ink break-words">{original.fileName}</p>
          <p className="text-body-sm text-ink-muted tabular">
            PDF
            <span aria-hidden className="mx-1.5">
              ·
            </span>
            <span className="sr-only">, </span>
            {formatBytes(original.sizeBytes)}
          </p>
        </div>
      </Card>
      <p className="px-1 text-body-sm text-ink-muted text-pretty">
        In this preview, only the file&rsquo;s name and size are saved. The PDF itself isn&rsquo;t kept, so hold on to
        your own copy.
      </p>
    </div>
  );
}

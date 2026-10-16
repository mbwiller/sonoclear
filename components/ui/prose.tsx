import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const PHONE = /(\(\d{3}\) \d{3}-\d{4})/g;
/** Hyphenated terms that read badly when split across lines: "PR-positive", "HER2-negative", "BI-RADS 5". */
const TERM = /(\b(?:ER|PR|HER2|BI|Ki)-[A-Za-z0-9+]+(?: \d\b)?)/g;

/** Keeps hyphenated medical terms on one line. */
export function keepTermsTogether(text: string): ReactNode {
  const parts = text.split(TERM);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** Turns phone numbers in plain text into tap-to-call links, and keeps medical terms whole. */
export function linkifyPhones(text: string): ReactNode {
  const parts = text.split(PHONE);
  if (parts.length === 1) return keepTermsTogether(text);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={`tel:+1${part.replace(/\D/g, "")}`}
        className="-my-3 inline-block whitespace-nowrap py-3 underline decoration-line-strong/60 underline-offset-[3px] hover:decoration-ink"
      >
        {part}
      </a>
    ) : (
      <Fragment key={i}>{keepTermsTogether(part)}</Fragment>
    ),
  );
}

type Block = { kind: "p"; text: string } | { kind: "ul"; items: string[] };

function parse(text: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of text.split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    let para: string[] = [];
    let list: string[] = [];
    const flush = () => {
      if (para.length) blocks.push({ kind: "p", text: para.join(" ") });
      if (list.length) blocks.push({ kind: "ul", items: list });
      para = [];
      list = [];
    };
    for (const line of lines) {
      if (line.startsWith("- ")) {
        if (para.length) {
          blocks.push({ kind: "p", text: para.join(" ") });
          para = [];
        }
        list.push(line.slice(2));
      } else {
        if (list.length) {
          blocks.push({ kind: "ul", items: list });
          list = [];
        }
        para.push(line);
      }
    }
    flush();
  }
  return blocks;
}

/**
 * Document-style text. Accepts paragraphs (array, or text separated by blank lines)
 * and "- " list lines. Reads like a note, not a chat.
 */
export function Prose({ text, className }: { text: string | string[]; className?: string }) {
  const blocks = parse(Array.isArray(text) ? text.join("\n\n") : text);
  return (
    <div className={cn("flex flex-col gap-4 text-body text-ink text-pretty", className)}>
      {blocks.map((b, i) =>
        b.kind === "p" ? (
          <p key={i}>{linkifyPhones(b.text)}</p>
        ) : (
          <ul key={i} className="flex flex-col gap-2 pl-1">
            {b.items.map((item, j) => (
              <li key={j} className="relative pl-5">
                <span aria-hidden className="absolute left-0 top-[0.72em] h-px w-2.5 bg-ink-muted" />
                {linkifyPhones(item)}
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

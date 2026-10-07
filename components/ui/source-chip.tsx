import Link from "next/link";
import { CalendarDays, FileText, NotebookText } from "lucide-react";
import type { SourceRef } from "@/lib/types";
import { cn } from "@/lib/cn";

function hrefFor(source: SourceRef): string {
  switch (source.kind) {
    case "visit":
      return `/visit/${source.id}`;
    case "record":
      return `/record/${source.id}`;
    case "appointment":
      return "/journey";
  }
}

/** "From your pathology report": where an explanation came from, linking to it. */
export function SourceChip({ source, className }: { source: SourceRef; className?: string }) {
  const Icon = source.kind === "record" ? FileText : source.kind === "visit" ? NotebookText : CalendarDays;
  return (
    <Link
      href={hrefFor(source)}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-3.5 pr-4 text-body-sm font-medium text-ink",
        "transition-[background-color,border-color] duration-200 hover:border-sage hover:bg-sage-soft/50",
        className,
      )}
    >
      <Icon size={16} className="shrink-0 text-sage" aria-hidden />
      {source.label}
    </Link>
  );
}

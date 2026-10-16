import { TermLink } from "@/components/ui/term";
import type { RecordVisual } from "@/lib/types";
import { cn } from "@/lib/cn";
import { FigureCaption, FigureTitle } from "./parts";

type Markers = Extract<RecordVisual, { kind: "markers" }>;

function Indicator({ present, percent }: { present: boolean | null; percent?: number }) {
  if (present === null) {
    return percent !== undefined ? (
      <span aria-hidden className="font-display text-[1.375rem] leading-none text-ink-muted tabular">
        {percent}%
      </span>
    ) : null;
  }
  return (
    <span
      aria-hidden
      className={cn("block size-3.5 rounded-full", present ? "bg-sage" : "border-[1.5px] border-line-strong bg-surface")}
    />
  );
}

/** Receptor and marker results as tiles: filled dot for present, hollow for absent, a number otherwise. */
export function MarkersFigure({ visual }: { visual: Markers }) {
  const { title, items, caption } = visual;
  return (
    <figure>
      <FigureTitle>{title}</FigureTitle>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <li key={item.label} className="relative flex flex-col rounded-2xl border border-line bg-paper px-3.5 py-3.5">
            <span className="text-caption text-ink-muted">{item.label}</span>
            <span className="mt-2.5 flex h-6 items-center">
              <Indicator present={item.present} percent={item.percent} />
            </span>
            <span className="mt-2 text-body-sm font-medium text-ink">
              {item.term ? (
                // The whole tile is the tap target: the button's own box is only the word.
                <TermLink
                  term={item.term}
                  className="focus-visible:outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-sage"
                >
                  {item.value}
                </TermLink>
              ) : (
                item.value
              )}
            </span>
            <span className="mt-1 text-caption text-ink-muted text-pretty">{item.plain}</span>
          </li>
        ))}
      </ul>
      {caption ? <FigureCaption>{caption}</FigureCaption> : null}
    </figure>
  );
}

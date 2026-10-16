import type { RecordVisual } from "@/lib/types";
import { FigureCaption, FigureTitle } from "./parts";

type Sequence = Extract<RecordVisual, { kind: "sequence" }>;

/** Numbered steps on a vertical hairline. */
export function SequenceFigure({ visual }: { visual: Sequence }) {
  const { title, steps, caption } = visual;
  return (
    <figure>
      <FigureTitle>{title}</FigureTitle>
      <ol>
        {steps.map((step, i) => (
          <li
            key={step.label}
            className="relative flex gap-4 pb-5 last:pb-0 after:absolute after:bottom-0 after:left-[0.875rem] after:top-8 after:w-px after:bg-line last:after:hidden"
          >
            <span
              aria-hidden
              className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full border border-line bg-surface font-display text-[1rem] leading-none text-ink-muted tabular"
            >
              {i + 1}
            </span>
            <span className="min-w-0 pt-0.5">
              <span className="block text-body-sm font-medium text-ink text-pretty">{step.label}</span>
              {step.detail ? <span className="mt-0.5 block text-body-sm text-ink-muted text-pretty">{step.detail}</span> : null}
            </span>
          </li>
        ))}
      </ol>
      {caption ? <FigureCaption>{caption}</FigureCaption> : null}
    </figure>
  );
}

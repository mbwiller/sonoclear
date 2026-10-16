import { Card, Section } from "@/components/ui/layout";
import type { RecordVisual } from "@/lib/types";
import { ImagesFigure } from "./images";
import { LocatorFigure } from "./locator";
import { MarkersFigure } from "./markers";
import { MeasureFigure } from "./measure";
import { RangesFigure } from "./ranges";
import { ScaleFigure } from "./scale";
import { SequenceFigure } from "./sequence";

/** One quiet figure, chosen by its kind. */
export function RecordFigure({ visual }: { visual: RecordVisual }) {
  switch (visual.kind) {
    case "locator":
      return <LocatorFigure visual={visual} />;
    case "scale":
      return <ScaleFigure visual={visual} />;
    case "measure":
      return <MeasureFigure visual={visual} />;
    case "markers":
      return <MarkersFigure visual={visual} />;
    case "ranges":
      return <RangesFigure visual={visual} />;
    case "sequence":
      return <SequenceFigure visual={visual} />;
    case "images":
      return <ImagesFigure visual={visual} />;
  }
}

/** The "At a glance" section of a record: its figures in one card, separated by hairlines. */
export function AtAGlance({ visuals, id, className }: { visuals: RecordVisual[]; id: string; className?: string }) {
  return (
    <Section id={id} title="At a glance" className={className}>
      <Card className="divide-y divide-line">
        {visuals.map((visual, i) => (
          <div key={`${visual.kind}-${i}`} className="px-5 py-5 sm:px-6">
            <RecordFigure visual={visual} />
          </div>
        ))}
      </Card>
    </Section>
  );
}

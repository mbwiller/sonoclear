import type { RecordVisual } from "@/lib/types";
import { FigureCaption, FigureTitle, fmt } from "./parts";

type Measure = Extract<RecordVisual, { kind: "measure" }>;

const CM = 80;
const X0 = 20;
const RULER_Y = 112;
const CM_MAX = 3;

/** A size drawn to scale on a hairline ruler, with an everyday comparison in words. */
export function MeasureFigure({ visual }: { visual: Measure }) {
  const { title, cm, compare, caption } = visual;
  const drawn = Math.min(Math.max(Number.isFinite(cm) ? cm : 0, 0), CM_MAX);
  const diameter = drawn * CM;
  const r = diameter / 2;
  const numberFits = diameter <= 130;
  const aria =
    cm > CM_MAX
      ? `A circle drawn at ${CM_MAX} centimeters, the full width of the ruler, for a size of ${fmt(cm)} centimeters.`
      : `A ${fmt(cm)} centimeter circle drawn to scale above a ruler marked from 0 to ${CM_MAX} centimeters.`;
  const ticks = Array.from({ length: CM_MAX * 2 + 1 }, (_, i) => i / 2);

  return (
    <figure>
      <FigureTitle>{title}</FigureTitle>
      <svg role="img" aria-label={aria} viewBox="0 0 280 146" className="block h-auto w-full max-w-[320px]">
        <g aria-hidden>
          <circle cx={X0 + r} cy={RULER_Y - r} r={r} className="fill-sage-soft stroke-sage" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          <text
            x={numberFits ? X0 + diameter + 16 : X0 + r}
            y={RULER_Y - r + 9}
            textAnchor={numberFits ? "start" : "middle"}
            className="fill-ink font-display text-[28px]"
          >
            {fmt(cm)} cm
          </text>
          <line x1={X0} x2={X0 + CM_MAX * CM} y1={RULER_Y} y2={RULER_Y} className="stroke-ink" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {ticks.map((t) => {
            const whole = Number.isInteger(t);
            return (
              <g key={t}>
                <line
                  x1={X0 + t * CM}
                  x2={X0 + t * CM}
                  y1={RULER_Y}
                  y2={RULER_Y + (whole ? 10 : 6)}
                  className="stroke-ink"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                {whole ? (
                  <text x={X0 + t * CM} y={RULER_Y + 26} textAnchor="middle" className="fill-ink-muted font-sans text-[12px]">
                    {t === CM_MAX ? `${t} cm` : t}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
      <p className="mt-3 text-body-sm font-medium text-ink first-letter:uppercase">{compare}.</p>
      <FigureCaption className="mt-1">{caption}</FigureCaption>
    </figure>
  );
}

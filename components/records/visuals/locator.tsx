import type { RecordVisual } from "@/lib/types";
import { FigureCaption, FigureTitle, r2 } from "./parts";

type Locator = Extract<RecordVisual, { kind: "locator" }>;

const SIZE = 300;
const CX = 150;
const CY = 150;
/** Drawing units per centimetre: 10 cm from the nipple reaches the clock ring. */
const UNIT = 10;
const RING = 10 * UNIT;
const OUTLINE = 140;
const CARDINALS = [
  { hour: 12, angle: 0 },
  { hour: 3, angle: 90 },
  { hour: 6, angle: 180 },
  { hour: 9, angle: 270 },
];

function polar(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: r2(CX + radius * Math.sin(a)), y: r2(CY - radius * Math.cos(a)) };
}

/** Where in the breast: the affected breast only, a clock ring, and the spot at its distance from the nipple. */
export function LocatorFigure({ visual }: { visual: Locator }) {
  const { side, clock, distanceCm, sizeCm, caption } = visual;
  const angle = (clock % 12) * 30;
  const radius = Math.min(Math.max(Number.isFinite(distanceCm) ? distanceCm : 0, 0) * UNIT, RING);
  const spot = polar(angle, radius);
  const mid = polar(angle, radius / 2);
  // Nudge the distance label off the line, toward the lower side.
  const a = (angle * Math.PI) / 180;
  const sign = Math.cos(a) > 0 ? 1 : -1;
  const label = { x: r2(mid.x + sign * Math.cos(a) * 13), y: r2(mid.y + sign * Math.sin(a) * 13 + 4) };
  const heading = `Your ${side} breast, as a doctor facing you sees it.`;
  const sizeText = sizeCm ? `, about ${sizeCm} centimeters across` : "";
  const aria = `Drawing of your ${side} breast like a clock face. The spot is at ${clock} o'clock, ${distanceCm} centimeters from the nipple${sizeText}.`;

  return (
    <figure className="sm:grid sm:grid-cols-[16.5rem_minmax(0,1fr)] sm:items-center sm:gap-x-8">
      <FigureTitle className="sm:col-span-2">Where it is</FigureTitle>
      <svg
        role="img"
        aria-label={aria}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto block h-auto w-full max-w-[15rem] sm:col-start-1 sm:row-start-2 sm:max-w-[300px]"
      >
        <circle cx={CX} cy={CY} r={OUTLINE} className="fill-paper stroke-line-strong" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <circle
          cx={CX}
          cy={CY}
          r={RING}
          fill="none"
          className="stroke-line-strong"
          strokeWidth={1}
          strokeDasharray="2 5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          aria-hidden
        />
        <g aria-hidden>
          {CARDINALS.map(({ hour, angle: deg }) => {
            const inner = polar(deg, RING - 4);
            const outer = polar(deg, RING + 6);
            const text = polar(deg, RING + 22);
            return (
              <g key={hour}>
                <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} className="stroke-line-strong" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                <text x={text.x} y={text.y} textAnchor="middle" dominantBaseline="central" className="fill-ink-muted font-sans text-[12px]">
                  {hour}
                </text>
              </g>
            );
          })}
          <line x1={CX} y1={CY} x2={spot.x} y2={spot.y} className="stroke-line-strong" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <text x={label.x} y={label.y} textAnchor="middle" className="fill-ink-muted font-sans text-[12px]">
            {distanceCm} cm
          </text>
          <circle cx={CX} cy={CY} r={4} className="fill-surface stroke-ink" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
          {sizeCm ? (
            <>
              <circle cx={spot.x} cy={spot.y} r={r2((sizeCm / 2) * UNIT)} fill="none" className="stroke-sage" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
              <circle cx={spot.x} cy={spot.y} r={3} className="fill-sage" />
            </>
          ) : (
            <circle cx={spot.x} cy={spot.y} r={5.5} className="fill-sage" />
          )}
        </g>
      </svg>
      <FigureCaption className="sm:col-start-2 sm:row-start-2">
        {caption}
        <span className="mt-2 block text-caption">{heading}</span>
      </FigureCaption>
    </figure>
  );
}

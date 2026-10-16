import type { RecordVisual } from "@/lib/types";
import { FigureCaption, FigureTitle } from "./parts";

type Scale = Extract<RecordVisual, { kind: "scale" }>;

/** A number line with ticks and the patient's value marked in sage. */
export function ScaleFigure({ visual }: { visual: Scale }) {
  const { title, min, max, value, valueLabel, marks, caption } = visual;
  // A flat or backwards scale still draws; a value off either end sits on that end.
  const span = Math.max(max - min, 1e-9);
  const at = (v: number) => (Number.isFinite(v) ? Math.min(100, Math.max(0, ((v - min) / span) * 100)) : 0);
  const pos = (v: number) => `${at(v)}%`;
  const share = at(value);
  const anchor = share < 14 ? "start" : share > 86 ? "end" : "middle";
  const aria = `${title}: your result is ${valueLabel}, on a scale from ${min} to ${max}.`;

  return (
    <figure>
      <FigureTitle>{title}</FigureTitle>
      <div className="px-2">
        <svg role="img" aria-label={aria} className="block h-[76px] w-full overflow-visible">
          <g aria-hidden>
            <line x1="0%" x2="100%" y1={46} y2={46} className="stroke-line-strong" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            {marks.map((m) => (
              <g key={m.value}>
                <line x1={pos(m.value)} x2={pos(m.value)} y1={40} y2={52} className="stroke-line-strong" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                <text
                  x={pos(m.value)}
                  y={72}
                  textAnchor="middle"
                  className={m.value === value ? "fill-ink font-sans text-[13px] font-medium" : "fill-ink-muted font-sans text-[13px]"}
                >
                  {m.label}
                </text>
              </g>
            ))}
            <circle cx={pos(value)} cy={46} r={7} className="fill-sage stroke-surface" strokeWidth={2} />
            <text x={pos(value)} y={22} textAnchor={anchor} className="fill-ink font-sans text-[15px] font-medium">
              {valueLabel}
            </text>
          </g>
        </svg>
      </div>
      <FigureCaption className="mt-2">{caption}</FigureCaption>
    </figure>
  );
}

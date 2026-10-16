import type { RecordVisual } from "@/lib/types";
import { FigureCaption, FigureTitle, fmt } from "./parts";

type Ranges = Extract<RecordVisual, { kind: "ranges" }>;
type Row = Ranges["rows"][number];

/** Shows both ends of a range with the same number of decimals: 0.57 and 1.00, 12.0 and 15.5. */
function tick(v: number, decimals: number): string {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v);
}

function decimalsOf(n: number): number {
  return (String(n).split(".")[1] ?? "").length;
}

function RangeBar({ row }: { row: Row }) {
  const { value, label, unit } = row;
  const low = Math.min(row.low, row.high);
  const high = Math.max(row.low, row.high);
  // A range with no width still draws, with some room either side.
  const span = high > low ? high - low : Math.max(Math.abs(high) * 0.1, 1);
  // The bar starts at the label's left edge. Room is added only when the result sits outside the range.
  const v = Number.isFinite(value) ? value : low;
  const dlo = low - (v < low ? low - v + span * 0.15 : 0);
  const dhi = high + (v > high ? v - high + span * 0.15 : 0) + (high > low ? 0 : span * 0.5);
  const share = (n: number) => (Number.isFinite(n) ? Math.min(100, Math.max(0, ((n - dlo) / (dhi - dlo)) * 100)) : 0);
  const anchor = (n: number) => (share(n) < 6 ? "start" : share(n) > 94 ? "end" : "middle");
  const decimals = Math.max(decimalsOf(low), decimalsOf(high));
  const inside = value >= low && value <= high;
  const aria = `${label}: ${fmt(value)} ${unit}. Reference range ${tick(low, decimals)} to ${tick(high, decimals)}. Your result is ${inside ? "inside" : "outside"} it.`;

  return (
    <div>
      <svg role="img" aria-label={aria} className="block h-[44px] w-full overflow-visible">
        <g aria-hidden>
          <rect
            x={`${share(low)}%`}
            y={9}
            width={`${share(high) - share(low)}%`}
            height={8}
            rx={4}
            className="fill-sunken stroke-line-strong"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {[low, high].map((v, i) => (
            <g key={i === 0 ? "low" : "high"}>
              <line x1={`${share(v)}%`} x2={`${share(v)}%`} y1={5} y2={21} className="stroke-line-strong" strokeWidth={1} vectorEffect="non-scaling-stroke" />
              <text x={`${share(v)}%`} y={39} textAnchor={anchor(v)} className="fill-ink-muted font-sans text-[13px]">
                {tick(v, decimals)}
              </text>
            </g>
          ))}
          <circle cx={`${share(value)}%`} cy={13} r={6} className="fill-sage stroke-surface" strokeWidth={2} />
        </g>
      </svg>
    </div>
  );
}

/** Lab values placed on their reference ranges. */
export function RangesFigure({ visual }: { visual: Ranges }) {
  const { title, rows, caption } = visual;
  return (
    <figure>
      <FigureTitle>{title}</FigureTitle>
      <ul className="divide-y divide-line border-y border-line">
        {rows.map((row, i) => (
          <li key={`${row.label}-${i}`} className="py-3.5 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:items-center sm:gap-6">
            <div className="flex items-baseline justify-between gap-3 sm:block">
              <span className="text-body-sm text-ink-muted">{row.label}</span>
              <span className="text-body-sm font-medium text-ink tabular sm:mt-0.5 sm:block">
                {fmt(row.value)} <span className="font-normal text-ink-muted">{row.unit}</span>
              </span>
            </div>
            <div className="mt-1 sm:mt-0">
              <RangeBar row={row} />
              {row.plain ? <p className="mt-1 text-caption text-ink-muted text-pretty">{row.plain}</p> : null}
            </div>
          </li>
        ))}
      </ul>
      {caption ? <FigureCaption>{caption}</FigureCaption> : null}
    </figure>
  );
}

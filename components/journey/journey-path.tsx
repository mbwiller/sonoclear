"use client";

import type { StageView } from "@/lib/care";
import { cn } from "@/lib/cn";

/** Height of the drawing in px; the viewBox uses the same units so y maps one-to-one. */
const HEIGHT = 64;
const WIDTH = 700;
/** A gentle climb with a few bends: a route, not a chart. One y per stage. */
const RISE = [52, 36, 44, 26, 34, 18, 24];

interface Point {
  x: number;
  y: number;
}

/** Cubic segments through every point (Catmull-Rom), so the line bends smoothly between stages. */
function segments(points: Point[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    out.push(`C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`);
  }
  return out;
}

const pathFrom = (start: Point, segs: string[]) => (segs.length ? `M ${start.x} ${start.y} ${segs.join(" ")}` : "");

/**
 * The whole journey at a glance: one line from the first stage to the last, with the part
 * she has travelled drawn in sage and the stages ahead left as a hairline.
 * Stage names sit under their marks on wider screens; phones get a single caption.
 */
export function JourneyPath({ stages, className }: { stages: StageView[]; className?: string }) {
  const n = stages.length;
  if (n < 2) return null;
  const current = Math.max(
    0,
    stages.findIndex((s) => s.status === "current"),
  );
  const points: Point[] = stages.map((_, i) => ({
    x: ((i + 0.5) / n) * WIDTH,
    y: RISE[i % RISE.length],
  }));
  const segs = segments(points);
  const travelled = pathFrom(points[0], segs.slice(0, current));
  const ahead = pathFrom(points[current], segs.slice(current));
  const columns = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };

  const done = stages.filter((s) => s.status === "done").map((s) => s.title);
  const label =
    `Your journey: stage ${current + 1} of ${n}, ${stages[current].title}.` +
    (done.length ? ` Done: ${done.join(", ")}.` : "");

  return (
    <div role="img" aria-label={label} className={cn("select-none", className)}>
      <div aria-hidden className="relative" style={{ height: HEIGHT }}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          {ahead ? (
            <path
              d={ahead}
              fill="none"
              className="stroke-line-strong/45"
              strokeWidth={1.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          {travelled ? (
            <path
              d={travelled}
              fill="none"
              pathLength={1}
              className="journey-path-draw stroke-sage"
              strokeWidth={1.75}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
        <ol className="absolute inset-0 grid" style={columns}>
          {stages.map((stage, i) => (
            <li key={stage.id} className="relative">
              <span
                className="absolute left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center"
                style={{ top: points[i].y }}
              >
                {stage.status === "done" ? (
                  <span className="size-2.5 rounded-full bg-sage" />
                ) : stage.status === "current" ? (
                  <span className="grid size-7 place-items-center rounded-full bg-sage-soft">
                    <span className="size-3.5 rounded-full border-2 border-sage bg-surface" />
                  </span>
                ) : (
                  <span className="size-2.5 rounded-full border-[1.5px] border-line-strong/60 bg-paper" />
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <ol aria-hidden className="mt-1 hidden sm:grid" style={columns}>
        {stages.map((stage) => (
          <li
            key={stage.id}
            className={cn(
              "px-1 text-center text-caption text-balance",
              stage.status === "current"
                ? "font-medium text-ink"
                : stage.status === "done"
                  ? "text-ink-muted"
                  : "text-ink-muted/70",
            )}
          >
            {stage.title}
          </li>
        ))}
      </ol>
      <p aria-hidden className="mt-2 text-center text-caption text-ink-muted sm:hidden">
        <span className="font-medium text-ink">{stages[current].title}</span>
        <span className="mx-1.5">·</span>
        stage {current + 1} of {n}
      </p>
    </div>
  );
}

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RecordFigure } from "@/components/records/visuals";
import type { RecordVisual } from "@/lib/types";

const render = (visual: RecordVisual) => renderToStaticMarkup(createElement(RecordFigure, { visual }));

/** The figures' SVG must stay finite whatever numbers they're handed. */
function assertClean(html: string) {
  assert.ok(html.length > 0);
  assert.doesNotMatch(html, /NaN|Infinity|undefined/, html.slice(0, 200));
}

const range = (label: string, low: number, high: number, value: number) => ({ label, unit: "u", low, high, value });

describe("record figures with unusual numbers", () => {
  it("scale: a flat scale, a value past either end, a missing value", () => {
    const base = { kind: "scale", title: "T", valueLabel: "5", marks: [{ value: 0, label: "0" }, { value: 6, label: "6" }], caption: "c" } as const;
    const cases: [number, number, number][] = [
      [3, 3, 3],
      [0, 6, 9],
      [0, 6, -4],
      [6, 0, 3],
      [0, 6, Number.NaN],
    ];
    for (const [min, max, value] of cases) {
      assertClean(render({ ...base, marks: [...base.marks], min, max, value }));
    }
  });

  it("ranges: a range with no width, a backwards range, a value off the bar, repeated labels", () => {
    const html = render({
      kind: "ranges",
      title: "T",
      rows: [range("Same", 5, 5, 5), range("Zero", 0, 0, 0), range("Backwards", 10, 2, 6), range("Off", 1, 2, 90), range("Same", 1, 2, 1.5)],
    });
    assertClean(html);
  });

  it("ranges: ordinary rows keep their ticks at 13px", () => {
    const html = render({ kind: "ranges", title: "T", rows: [range("Creatinine", 0.57, 1, 0.8)] });
    assertClean(html);
    assert.match(html, /0\.57/);
    assert.match(html, /text-\[13px\]/);
  });

  it("measure: a size past the ruler says what is drawn, and a negative or zero size draws nothing odd", () => {
    const base = { kind: "measure", title: "T", compare: "about a grape", caption: "c" } as const;
    const wide = render({ ...base, cm: 4 });
    assertClean(wide);
    assert.match(wide, /drawn at 3 centimeters, the full width of the ruler, for a size of 4 centimeters/);
    assert.doesNotMatch(wide, /A 4 centimeter circle drawn to scale/);

    assertClean(render({ ...base, cm: -1 }));
    assertClean(render({ ...base, cm: 0 }));

    const normal = render({ ...base, cm: 1.4 });
    assertClean(normal);
    assert.match(normal, /A 1\.4 centimeter circle drawn to scale/);
  });

  it("locator: a distance of zero, past the ring, negative, and no size", () => {
    const base = { kind: "locator", side: "left", clock: 2, caption: "c" } as const;
    for (const distanceCm of [0, 6, 14, -3]) {
      assertClean(render({ ...base, distanceCm }));
      assertClean(render({ ...base, distanceCm, sizeCm: 1.4 }));
    }
    assertClean(render({ ...base, clock: 12, distanceCm: 4 }));
    assert.match(render({ ...base, distanceCm: 6 }), /Where it is/);
  });

  it("markers: filled, hollow, and a bare number", () => {
    assertClean(
      render({
        kind: "markers",
        title: "T",
        items: [
          { label: "ER", present: true, value: "Positive", plain: "p" },
          { label: "HER2", present: false, value: "Negative", plain: "p" },
          { label: "Ki-67", present: null, percent: 15, value: "About 15%", plain: "p" },
        ],
      }),
    );
  });

  it("sequence: runs", () => {
    assertClean(render({ kind: "sequence", title: "T", steps: [{ label: "One", detail: "d" }, { label: "Two", detail: "d" }] }));
  });

  it("images: the box is reserved from the image's own size", () => {
    const html = render({
      kind: "images",
      title: "T",
      note: "n",
      images: [
        { src: "/a.jpg", alt: "a", caption: "c", width: 520, height: 800, mark: { x: 0.4, y: 0.6, r: 0.1, label: "The mass" } },
        { src: "/b.jpg", alt: "b", caption: "c", width: 700, height: 880 },
      ],
    });
    assertClean(html);
    assert.match(html, /width="520"/);
    assert.match(html, /height="800"/);
    assert.match(html, /aspect-ratio:\s*520 \/ 800/);
    assert.doesNotMatch(html, /bg-ink/);
  });
});

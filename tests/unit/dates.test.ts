import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calendar, daysFromToday, formatClock, formatDuration, formatRelativeDay } from "@/lib/dates";

describe("calendar", () => {
  // Every day of a week, so each weekday the demo might be opened on is covered.
  const bases = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 4 + i));

  it("keeps the story's clinic days on weekdays, whatever today is", () => {
    for (const base of bases) {
      const cal = calendar(base);
      for (const offset of [-32, -25, -19, -14, 3]) {
        const dow = new Date(cal.day(offset)).getDay();
        assert.ok(dow >= 1 && dow <= 5, `offset ${offset} from ${base.toDateString()} fell on day ${dow}`);
      }
    }
  });

  it("keeps the story in order and the consult in the future", () => {
    for (const base of bases) {
      const cal = calendar(base);
      const times = [-32, -25, -19, -14, -13].map((o) => Date.parse(cal.day(o)));
      for (let i = 1; i < times.length; i++) assert.ok(times[i] > times[i - 1]);
      assert.ok(Date.parse(cal.day(-13)) < base.getTime());
      assert.ok(Date.parse(cal.day(3)) > base.getTime() + 24 * 3600_000);
    }
  });

  it("never moves today", () => {
    const base = new Date(2026, 9, 10); // a Saturday
    assert.equal(new Date(calendar(base).day(0, 12)).getDate(), 10);
  });
});

describe("formatting", () => {
  it("formats durations without impossible values", () => {
    assert.equal(formatDuration(42_000), "0:42");
    assert.equal(formatDuration(59_600), "1 min");
    assert.equal(formatDuration(1_440_000), "24 min");
    assert.equal(formatDuration(3_900_000), "1 hr 5 min");
  });

  it("formats a running clock", () => {
    assert.equal(formatClock(247_000), "04:07");
    assert.equal(formatClock(3_729_000), "1:02:09");
  });

  it("counts calendar days and phrases them plainly", () => {
    const base = new Date(2026, 9, 6);
    const inThree = new Date(2026, 9, 9, 10, 30).toISOString();
    assert.equal(daysFromToday(inThree, base), 3);
    assert.equal(formatRelativeDay(new Date(Date.now() + 86_400_000).toISOString()), "Tomorrow");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  atTime,
  calendar,
  daysFromToday,
  formatClock,
  formatDuration,
  formatRelativeDay,
  isWeekdayDate,
  startOfDay,
  weekdayAfterDate,
  weekdayOnOrAfterAt,
} from "@/lib/dates";

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

describe("weekday helpers", () => {
  // Every weekday of a week, plus a base on each side of the US clocks-back change on November 1, 2026.
  const week = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 4 + i));

  it("tells weekdays from weekends in local time", () => {
    assert.equal(isWeekdayDate(new Date(2026, 9, 9, 23, 30).toISOString()), true); // Friday
    assert.equal(isWeekdayDate(new Date(2026, 9, 10, 0, 30).toISOString()), false); // Saturday
    assert.equal(isWeekdayDate(new Date(2026, 9, 11, 12).toISOString()), false); // Sunday
    assert.equal(isWeekdayDate(new Date(2026, 9, 12, 12).toISOString()), true); // Monday
  });

  it("finds the start of a day", () => {
    const start = startOfDay(new Date(2026, 9, 9, 17, 45, 12));
    assert.deepEqual([start.getDate(), start.getHours(), start.getMinutes(), start.getSeconds()], [9, 0, 0, 0]);
  });

  it("sets a time on the same local day, and keeps it across the end of daylight saving", () => {
    const nov1 = new Date(2026, 10, 1, 3, 0).toISOString(); // the day clocks go back
    const at = new Date(atTime(nov1, 7, 30));
    assert.deepEqual([at.getDate(), at.getHours(), at.getMinutes()], [1, 7, 30]);
    const oct31 = new Date(atTime(new Date(2026, 9, 31, 22, 0).toISOString(), 7, 30));
    assert.deepEqual([oct31.getDate(), oct31.getHours(), oct31.getMinutes()], [31, 7, 30]);
  });

  it("lands on the first weekday on or after an offset, from any day of the week", () => {
    for (const base of week) {
      const cal = calendar(base);
      for (const offset of [0, 1, 2, 3, 4, 7]) {
        const iso = weekdayOnOrAfterAt(cal, offset, 14, 0);
        assert.ok(isWeekdayDate(iso), `${base.toDateString()} + ${offset}`);
        const d = new Date(iso);
        assert.deepEqual([d.getHours(), d.getMinutes()], [14, 0]);
        assert.ok(daysFromToday(iso, base) >= daysFromToday(cal.day(offset), base), "never before the offset");
        // And it is the first one: the day before is a weekend, or before the offset.
        const before = new Date(d);
        before.setDate(before.getDate() - 1);
        assert.ok(!isWeekdayDate(before.toISOString()) || daysFromToday(before.toISOString(), base) < daysFromToday(cal.day(offset), base));
      }
    }
  });

  it("keeps later offsets after the consult, which the calendar may have nudged", () => {
    // From a Friday the consult at +3 would be a Monday; the nudge keeps it there, and +4 follows it.
    const cal = calendar(new Date(2026, 9, 9));
    const consult = new Date(cal.day(3));
    assert.equal(consult.getDay(), 1);
    assert.ok(Date.parse(weekdayOnOrAfterAt(cal, 4)) >= consult.getTime());
  });

  it("moves forward past a weekend after a date, and keeps the hour across daylight saving", () => {
    const friday = new Date(2026, 9, 9, 9, 0).toISOString();
    const next = new Date(weekdayAfterDate(friday, 1, 9, 30)); // Saturday becomes Monday
    assert.deepEqual([next.getDay(), next.getDate(), next.getHours(), next.getMinutes()], [1, 12, 9, 30]);
    const thursday = new Date(2026, 9, 29, 8, 15).toISOString();
    const across = new Date(weekdayAfterDate(thursday, 5, 9, 30)); // Tuesday, November 3, after clocks go back
    assert.deepEqual([across.getMonth(), across.getDate(), across.getHours(), across.getMinutes()], [10, 3, 9, 30]);
    const sameDay = new Date(weekdayAfterDate(thursday, 0, 14, 0));
    assert.deepEqual([sameDay.getDate(), sameDay.getHours()], [29, 14]);
  });
});

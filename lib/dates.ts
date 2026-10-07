/**
 * The only place calendar dates come from.
 *
 * Every fixture date is an offset from DEMO_TODAY (see `getDemoToday`), so the demo never goes stale.
 * DEMO_TODAY is the start of the viewer's current local day.
 */
import type { ISODate } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

let demoTodayCache: Date | null = null;

/**
 * DEMO_TODAY: the single "today" every fixture date is offset from.
 * Lazy (not a module-level constant) because Next prerenders client modules and
 * rejects `new Date()` during prerender. Evaluated once per page load, in the browser.
 */
export function getDemoToday(): Date {
  if (!demoTodayCache) demoTodayCache = startOfDay(new Date());
  return new Date(demoTodayCache);
}

/**
 * A date `offset` days from DEMO_TODAY at the given local time.
 * `day(-14, 9, 30)` is two weeks ago at 9:30 AM.
 */
export function day(offset: number, hours = 9, minutes = 0, base: Date = getDemoToday()): ISODate {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

/** A birth date `years` and `extraDays` before DEMO_TODAY. */
export function yearsAgo(years: number, extraDays = 0, base: Date = getDemoToday()): ISODate {
  const d = new Date(base);
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() - extraDays);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

export function nowISO(): ISODate {
  return new Date().toISOString();
}

/** Whole calendar days from DEMO_TODAY to the given date (negative = past). */
export function daysFromToday(iso: ISODate, base: Date = getDemoToday()): number {
  return Math.round((startOfDay(new Date(iso)).getTime() - base.getTime()) / DAY_MS);
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", opts);

/** "Thursday, October 9" */
export function formatLongDate(iso: ISODate): string {
  return fmt({ weekday: "long", month: "long", day: "numeric" }).format(new Date(iso));
}

/** "Oct 9" or "Oct 9, 2025" when not in the current year. */
export function formatShortDate(iso: ISODate): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === getDemoToday().getFullYear();
  return fmt(sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" }).format(d);
}

/** "May 16, 1979" */
export function formatFullDate(iso: ISODate): string {
  return fmt({ month: "long", day: "numeric", year: "numeric" }).format(new Date(iso));
}

/** "Thursday" */
export function formatWeekday(iso: ISODate): string {
  return fmt({ weekday: "long" }).format(new Date(iso));
}

/** "10:30 AM" */
export function formatTime(iso: ISODate): string {
  return fmt({ hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

/** "Today", "Tomorrow", "Yesterday", "In 3 days", "2 weeks ago", … */
export function formatRelativeDay(iso: ISODate): string {
  const n = daysFromToday(iso);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  const abs = Math.abs(n);
  let phrase: string;
  if (abs < 7) phrase = `${abs} days`;
  else if (abs < 14) phrase = "1 week";
  else if (abs < 60) phrase = `${Math.round(abs / 7)} weeks`;
  else phrase = `${Math.round(abs / 30)} months`;
  return n > 0 ? `In ${phrase}` : `${phrase} ago`;
}

/** "This Thursday", "Next Monday", or a short date when further out. */
export function formatUpcoming(iso: ISODate): string {
  const n = daysFromToday(iso);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n > 1 && n < 7) return formatWeekday(iso);
  return formatShortDate(iso);
}

/** "24 min", "1 hr 5 min", "0:42" for under a minute. */
export function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (ms < 59_500) {
    const s = Math.round(ms / 1000);
    return `0:${String(s).padStart(2, "0")}`;
  }
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

/** A running clock: "04:07" or "1:02:09". */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Age in whole years on DEMO_TODAY. */
export function ageFrom(dobIso: ISODate): number {
  const dob = new Date(dobIso);
  const today = getDemoToday();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

/** Greeting by local time of day. */
export function greetingFor(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * The story's clinic days, as offsets from today: screening (−32), diagnostic imaging (−25),
 * biopsy (−19), results (−14), and the surgical consult (+3). Clinics are closed at weekends,
 * so the calendar nudges past and future events, each group as a whole, until these land on
 * weekdays. Shifting a group together keeps every gap inside it, so the story still holds.
 */
const PAST_ANCHORS = [-32, -25, -19, -14];
const FUTURE_ANCHORS = [3];

function isWeekday(base: Date, offset: number): boolean {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  const dow = d.getDay();
  return dow >= 1 && dow <= 5;
}

function weekdayShift(base: Date, anchors: number[], candidates: number[]): number {
  return candidates.find((s) => anchors.every((a) => isWeekday(base, a + s))) ?? 0;
}

/** Date builders bound to a base "today". Fixtures receive one of these so they stay pure. */
export function calendar(base: Date) {
  const past = weekdayShift(base, PAST_ANCHORS, [0, -1, 1, -2, 2, -3, 3]);
  const future = weekdayShift(base, FUTURE_ANCHORS, [0, 1, -1, 2]);
  const shift = (offset: number) => (offset < 0 ? offset + past : offset > 0 ? offset + future : 0);
  return {
    today: base,
    day: (offset: number, hours = 9, minutes = 0) => day(shift(offset), hours, minutes, base),
    yearsAgo: (years: number, extraDays = 0) => yearsAgo(years, extraDays, base),
  };
}
export type Calendar = ReturnType<typeof calendar>;

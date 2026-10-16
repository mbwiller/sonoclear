import { formatLongDate } from "@/lib/dates";
import type { ArrangeOutcome } from "@/lib/types";

/** Said once on the home screen and once after a booking: calls in this preview are simulated. */
export const PREVIEW_CAPTION = "In this preview, calls and bookings are simulated. Nothing is sent to any office.";

/** What the choose button says, and how the run reads while it works, for each kind of task. */
export const CHOICE_VERBS: Record<"book" | "request" | "find", { action: string; doing: string }> = {
  book: { action: "Book this one", doing: "Booking" },
  request: { action: "Request this one", doing: "Requesting" },
  find: { action: "Plan this one", doing: "Noting" },
};

/** What a to-do that stays open now says: its plan, and the day when it has one that the plan's words don't already name. */
export function todoPlanText(update: NonNullable<ArrangeOutcome["todoUpdate"]>): string {
  const day = update.dueDate ? formatLongDate(update.dueDate) : "";
  return day && !update.detail.includes(day) ? `${update.detail} · ${day}` : update.detail;
}

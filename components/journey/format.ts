import type { CareView } from "@/lib/care";
import { formatLongDate, formatTime } from "@/lib/dates";
import type { Appointment, Todo } from "@/lib/types";

/** "Surgical consult with Dr. Ellery", or just "Breast MRI" when no clinician is set. */
export function appointmentTitle(appointment: Appointment, care: CareView): string {
  const who = appointment.clinicianId ? care.clinicianById.get(appointment.clinicianId)?.shortName : undefined;
  return who ? `${appointment.title} with ${who}` : appointment.title;
}

/** "Friday, October 9 at 10:30 AM", or "Not scheduled yet". */
export function appointmentWhen(appointment: Appointment): string {
  if (!appointment.date) return "Not scheduled yet";
  return `${formatLongDate(appointment.date)} at ${formatTime(appointment.date)}`;
}

/** "1 open to-do", "3 open to-dos". */
export function openTodoCount(n: number): string {
  return `${n} open to-do${n === 1 ? "" : "s"}`;
}

/**
 * The same order `lib/care` uses for open to-dos: newest visit first, then as written.
 * Used when the list also keeps to-dos she has just checked off.
 */
export function sortLikeOpenTodos(todos: Todo[], all: Todo[]): Todo[] {
  const index = new Map(all.map((t, i) => [t.id, i]));
  return [...todos].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt) || (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0),
  );
}

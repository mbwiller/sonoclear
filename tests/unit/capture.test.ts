import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { captureDefaults, matchAppointment, resolveVisit, type CaptureSetup } from "@/components/capture/capture-state";
import { deriveCare, getSeed, type CareView } from "@/lib/care";
import type { Appointment, Arrangement, Visit, VisitType } from "@/lib/types";

/** A time on a given day offset from the real today, in local time. */
function at(dayOffset: number, hours: number, minutes = 0): Date {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return d;
}

function arranged(id: string, title: string, visitType: VisitType, when: Date, clinicianId?: string): Arrangement {
  const appointment: Appointment = {
    id,
    title,
    visitType,
    ...(clinicianId ? { clinicianId } : {}),
    stageId: "treatment-planning",
    status: "scheduled",
    date: when.toISOString(),
  };
  return {
    id: `arr-${id}`,
    taskId: `task-${id}`,
    taskTitle: title,
    outcome: { summary: ["Done."], appointment },
    log: [],
    arrangedAt: new Date().toISOString(),
  };
}

/** The starting account, with the surgical consult moved to `consultAt` (null: not scheduled). */
function careWith(opts: { consultAt?: Date | null; arrangements?: Arrangement[]; visits?: Visit[] } = {}): CareView {
  const seed = getSeed();
  const { consultAt } = opts;
  const appointments = seed.appointments.map((a): Appointment => {
    if (a.id !== "appt-surgical-consult" || consultAt === undefined) return a;
    return consultAt ? { ...a, date: consultAt.toISOString() } : { ...a, status: "unscheduled", date: null };
  });
  return deriveCare(
    { ...seed, appointments },
    { todoOverrides: {}, capturedVisits: opts.visits ?? [], uploadedRecords: [], arrangements: opts.arrangements ?? [] },
  );
}

describe("matching a recording to an appointment", () => {
  it("is 'now' from 90 minutes before the start until 4 hours after, and 'next' outside that", () => {
    const care = careWith({ consultAt: at(0, 10, 30) });
    const status = (now: Date) => matchAppointment(care, now)?.status;
    assert.equal(status(at(0, 9, 0)), "now");
    assert.equal(status(at(0, 8, 59)), "next");
    assert.equal(status(at(0, 14, 30)), "now");
    assert.equal(status(at(0, 14, 31)), "next");
  });

  it("looks ahead from the start of today, and ignores appointments before it", () => {
    assert.equal(matchAppointment(careWith({ consultAt: at(3, 10, 30) }), at(0, 7, 0))?.status, "next");
    assert.equal(matchAppointment(careWith({ consultAt: at(-1, 10, 30) }), at(0, 7, 0)), null);
  });

  it("finds nothing when nothing is scheduled", () => {
    assert.equal(matchAppointment(careWith({ consultAt: null }), at(0, 12, 0)), null);
  });

  it("prefers the nearest start when two visits are close together", () => {
    const care = careWith({
      consultAt: at(0, 10, 30),
      arrangements: [arranged("appt-genetic-counseling", "Genetic counseling", "genetic-counselor", at(0, 14, 0))],
    });
    assert.equal(matchAppointment(care, at(0, 12, 30))?.appointment.id, "appt-genetic-counseling");
    assert.equal(matchAppointment(care, at(0, 11, 0))?.appointment.id, "appt-surgical-consult");
  });

  it("only offers visits someone holds, never the MRI or a blood draw", () => {
    const logistics = [
      arranged("appt-breast-mri", "Breast MRI", "other", at(0, 8, 15)),
      arranged("appt-preop-bloodwork", "Pre-op bloodwork", "other", at(0, 7, 30)),
    ];
    const withConsult = careWith({ consultAt: at(3, 10, 30), arrangements: logistics });
    // At 8:00 the MRI is "now" in time; the chip still points to the consult, as the next visit.
    const match = matchAppointment(withConsult, at(0, 8, 0));
    assert.equal(match?.appointment.id, "appt-surgical-consult");
    assert.equal(match?.status, "next");
    assert.equal(matchAppointment(careWith({ consultAt: null, arrangements: logistics }), at(0, 8, 0)), null);
  });

  it("starts from nothing selected when there is no match, and from the visit when there is", () => {
    const none = captureDefaults(careWith({ consultAt: null }), at(0, 12, 0));
    assert.deepEqual({ type: none.visitType, name: none.clinicianName, match: none.match }, { type: "other", name: "", match: null });
    const some = captureDefaults(careWith({ consultAt: at(0, 10, 30) }), at(0, 10, 0));
    assert.equal(some.visitType, "breast-surgeon");
    assert.equal(some.clinicianName, "Dr. Marcus Ellery");
    assert.equal(some.match?.status, "now");
  });
});

describe("linking a recording to the appointment she saw", () => {
  /** An arranged blood draw at 7:30 and the consult at 10:30, the same day; she presses record at 10:00. */
  const draw = arranged("appt-preop-bloodwork", "Pre-op bloodwork", "other", at(0, 7, 30));
  const care = careWith({ consultAt: at(0, 10, 30), arrangements: [draw] });
  const now = at(0, 10, 0);

  const setupFrom = (care: CareView): CaptureSetup => {
    const defaults = captureDefaults(care, now);
    return { visitType: defaults.visitType, clinicianName: defaults.clinicianName, appointmentId: defaults.match?.appointment.id };
  };

  it("sees the earlier blood draw as the care view's next appointment, which is why the chip's match is kept", () => {
    assert.equal(care.nextAppointment?.id, "appt-preop-bloodwork");
    assert.equal(setupFrom(care).appointmentId, "appt-surgical-consult");
  });

  it("links the consult and its clinician, whatever else is scheduled that day", () => {
    const resolved = resolveVisit(setupFrom(care), care);
    assert.equal(resolved.appointmentId, "appt-surgical-consult");
    assert.equal(resolved.clinician?.id, "dr-ellery");
    const unnamed = resolveVisit({ ...setupFrom(care), clinicianName: "" }, care);
    assert.equal(unnamed.appointmentId, "appt-surgical-consult");
    assert.equal(unnamed.clinician?.id, "dr-ellery");
  });

  it("doesn't link when she changed the visit type, or the match was never shown", () => {
    assert.equal(resolveVisit({ ...setupFrom(care), visitType: "pcp", clinicianName: "" }, care).appointmentId, undefined);
    assert.equal(resolveVisit({ visitType: "breast-surgeon", clinicianName: "" }, care).appointmentId, undefined);
    assert.equal(resolveVisit({ visitType: "other", clinicianName: "" }, care).appointmentId, undefined);
  });

  it("doesn't link an appointment that was completed in the meantime", () => {
    const setup = setupFrom(care);
    const visit = {
      id: "visit-done",
      date: at(0, 10, 45).toISOString(),
      appointmentId: "appt-surgical-consult",
      notes: { todos: [] },
    } as unknown as Visit;
    const later = careWith({ consultAt: at(0, 10, 30), arrangements: [draw], visits: [visit] });
    assert.equal(resolveVisit(setup, later).appointmentId, undefined);
  });

  it("finds the clinician by the last name she typed", () => {
    const resolved = resolveVisit({ visitType: "breast-surgeon", clinicianName: "dr ellery", appointmentId: undefined }, care);
    assert.equal(resolved.clinician?.id, "dr-ellery");
    assert.equal(resolved.appointmentId, undefined);
  });
});

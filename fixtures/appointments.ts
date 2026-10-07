// CLINICAL REVIEW PENDING
/**
 * Upcoming appointments at demo start. Dates are offsets from the calendar's "today".
 * Notes must stay true after the surgical consult is recorded (MRI ordered, genetics referral sent),
 * because the Up next card shows them then.
 */
import type { Calendar } from "@/lib/dates";
import type { Appointment } from "@/lib/types";

export function buildAppointments(cal: Calendar): Appointment[] {
  return [
    {
      id: "appt-surgical-consult",
      title: "Surgical consult",
      visitType: "breast-surgeon",
      clinicianId: "dr-ellery",
      stageId: "treatment-planning",
      status: "scheduled",
      date: cal.day(3, 10, 30),
      location: "Linden Health Breast Surgery, Suite 300",
      note: "Bring your imaging discs and your questions.",
    },
    {
      id: "appt-breast-mri",
      title: "Breast MRI",
      visitType: "other",
      stageId: "treatment-planning",
      status: "unscheduled",
      date: null,
      note: "A detailed scan of both breasts, often done before surgery. Once it's ordered, Linden Health Imaging scheduling calls you to set it up.",
    },
    {
      id: "appt-genetic-counseling",
      title: "Genetic counseling",
      visitType: "genetic-counselor",
      stageId: "treatment-planning",
      status: "unscheduled",
      date: null,
      note: "This starts with a referral from your care team. Once it's sent, you can call Linden Health Cancer Genetics to book.",
    },
  ];
}

import { clinicianShortName, type CareView } from "@/lib/care";
import { formatShortDate } from "@/lib/dates";
import { VISIT_TYPE_LONG_LABELS } from "@/lib/visit-types";

/** A visit or record a question is about. */
export interface AskFocus {
  id: string;
  /** "About your visit with Dr. Raman", "About your pathology report". */
  label: string;
  /** Where the visit or record lives, so she can go back to it. */
  href: string;
}

/** "Screening mammogram" → "screening mammogram", but "MRI report" stays as is. */
function lowerFirst(title: string): string {
  return /^[A-Z][a-z]/.test(title) ? title[0].toLowerCase() + title.slice(1) : title;
}

/** The visit or record behind `?focus=`, in words. Null when the id matches nothing she has. */
export function focusFor(id: string, care: CareView): AskFocus | null {
  const visit = care.visitById.get(id);
  if (visit) {
    const who = clinicianShortName(visit, care);
    const label = who
      ? `About your visit with ${who}`
      : visit.visitType !== "other"
        ? `About your ${VISIT_TYPE_LONG_LABELS[visit.visitType].toLowerCase()} visit`
        : `About your visit on ${formatShortDate(visit.date)}`;
    return { id, label, href: `/visit/${id}` };
  }
  const record = care.recordById.get(id);
  if (record) {
    const label = record.type === "pathology" ? "About your pathology report" : `About your ${lowerFirst(record.title)}`;
    return { id, label, href: `/record/${id}` };
  }
  return null;
}

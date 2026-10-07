// CLINICAL REVIEW PENDING
/**
 * Claire's care team and the offices she may need to call.
 * Names, practices and phone numbers follow PLAN.md §3 (clinical fact sheet).
 */
import type { Clinician } from "@/lib/types";

export const CLINICIANS: Clinician[] = [
  {
    id: "dr-raman",
    name: "Dr. Priya Raman",
    shortName: "Dr. Raman",
    role: "pcp",
    roleLabel: "Primary care physician",
    practice: "Linden Health Primary Care, Elm Street",
    phone: "(617) 555-0131",
  },
  {
    id: "dr-whitfield",
    name: "Dr. Hannah Whitfield",
    shortName: "Dr. Whitfield",
    role: "radiologist",
    roleLabel: "Breast radiologist",
    practice: "Linden Health Breast Imaging, Westgate",
    phone: "(617) 555-0147",
  },
  {
    id: "dr-ellery",
    name: "Dr. Marcus Ellery",
    shortName: "Dr. Ellery",
    role: "breast-surgeon",
    roleLabel: "Breast surgeon",
    practice: "Linden Health Breast Surgery, Suite 300",
    phone: "(617) 555-0162",
  },
];

export const OFFICE_CONTACTS: { label: string; phone: string }[] = [
  { label: "Linden Health Imaging scheduling", phone: "(617) 555-0168" },
  { label: "Linden Health Cancer Genetics", phone: "(617) 555-0175" },
];

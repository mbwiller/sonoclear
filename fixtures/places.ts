// CLINICAL REVIEW PENDING
/**
 * Linden Health locations Sonoclear looks at when it arranges things for Claire.
 * Everything here is fictional: the system, the addresses and the distances from her home.
 * Names and phone numbers follow PLAN.md §3. The lab line, (617) 555-0180, is an addition
 * for the Arrange tab; the fact sheet has no lab number.
 */

export interface Place {
  id: string;
  /** How the location is named in a booking, e.g. "Linden Health Imaging, Westgate". */
  name: string;
  /** What it's called inside a sentence, e.g. "Westgate". */
  short: string;
  address: string;
  /** Miles from Claire's home. */
  miles: number;
  /** One phrase, plain words, e.g. "walk in 7 AM to 5 PM". */
  hours: string;
  does: string[];
}

export const PLACES = {
  westgateImaging: {
    id: "westgate-imaging",
    name: "Linden Health Imaging, Westgate",
    short: "Westgate",
    address: "410 Westgate Drive, Building A",
    miles: 3,
    hours: "Monday to Friday, 7 AM to 6 PM",
    does: ["Breast MRI", "Mammogram", "Ultrasound"],
  },
  riversideImaging: {
    id: "riverside-imaging",
    name: "Linden Health Imaging, Riverside",
    short: "Riverside",
    address: "88 Riverside Avenue",
    miles: 8,
    hours: "Monday to Friday, 7 AM to 5 PM",
    does: ["Breast MRI", "Mammogram"],
  },
  westgateBreastImaging: {
    id: "westgate-breast-imaging",
    name: "Linden Health Breast Imaging, Westgate",
    short: "Westgate",
    address: "410 Westgate Drive, Building A, front desk",
    miles: 3,
    hours: "Front desk open 7 AM to 6 PM",
    does: ["Copies of mammogram and ultrasound images on disc"],
  },
  westgateLab: {
    id: "westgate-lab",
    name: "Linden Health Laboratory, Westgate",
    short: "Westgate",
    address: "410 Westgate Drive, Building A, ground floor",
    miles: 3,
    hours: "walk in 7 AM to 5 PM",
    does: ["Blood draws, no appointment needed"],
  },
  elmStreetLab: {
    id: "elm-street-lab",
    name: "Linden Health Laboratory, Elm Street",
    short: "Elm Street",
    address: "27 Elm Street, ground floor",
    miles: 2,
    hours: "walk in 7 AM to 6 PM, Saturdays 8 to noon",
    does: ["Blood draws, no appointment needed"],
  },
  suite300Draw: {
    id: "suite-300-draw",
    name: "Linden Health draw station, Suite 300",
    short: "Suite 300",
    address: "512 Medical Park Road, Suite 300",
    miles: 4,
    hours: "by appointment",
    does: ["Blood draws, by appointment only"],
  },
  elmStreetGenetics: {
    id: "elm-street-genetics",
    name: "Linden Health Cancer Genetics, Elm Street",
    short: "Elm Street",
    address: "27 Elm Street, second floor",
    miles: 2,
    hours: "Monday to Friday, 8 AM to 5 PM",
    does: ["Genetic counseling, in person or by video"],
  },
  breastSurgery: {
    id: "breast-surgery-suite-300",
    name: "Linden Health Breast Surgery, Suite 300",
    short: "Suite 300",
    address: "512 Medical Park Road, Suite 300",
    miles: 4,
    hours: "Monday to Friday, 8 AM to 5 PM",
    does: ["Surgical consults and follow-up visits"],
  },
} satisfies Record<string, Place>;

/** Office lines Sonoclear calls. */
export const OFFICES = {
  breastImaging: { label: "Linden Health Breast Imaging", phone: "(617) 555-0147" },
  imagingScheduling: { label: "Linden Health Imaging scheduling", phone: "(617) 555-0168" },
  cancerGenetics: { label: "Linden Health Cancer Genetics", phone: "(617) 555-0175" },
  laboratory: { label: "Linden Health Laboratory", phone: "(617) 555-0180" },
  drEllery: { label: "Dr. Ellery's office", phone: "(617) 555-0162" },
} as const;

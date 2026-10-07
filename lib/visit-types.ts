import type { RecordType, VisitType } from "./types";

/** Display labels for visit types, in the order the Capture chips show them. */
export const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  pcp: "PCP",
  radiologist: "Radiologist",
  "breast-surgeon": "Breast surgeon",
  "medical-oncologist": "Medical oncologist",
  "radiation-oncologist": "Radiation oncologist",
  "genetic-counselor": "Genetic counselor",
  other: "Other",
};

/** Longer labels for prose and chips on visit pages. */
export const VISIT_TYPE_LONG_LABELS: Record<VisitType, string> = {
  pcp: "Primary care",
  radiologist: "Radiology",
  "breast-surgeon": "Breast surgery",
  "medical-oncologist": "Medical oncology",
  "radiation-oncologist": "Radiation oncology",
  "genetic-counselor": "Genetic counseling",
  other: "Other visit",
};

export const VISIT_TYPES = Object.keys(VISIT_TYPE_LABELS) as VisitType[];

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  imaging: "Imaging",
  pathology: "Pathology",
  labs: "Labs",
  genetics: "Genetics",
  other: "Other",
};

export const RECORD_TYPES = Object.keys(RECORD_TYPE_LABELS) as RecordType[];

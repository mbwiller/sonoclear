// CLINICAL REVIEW PENDING
/**
 * The seven journey stages. Descriptions are general and never predict Claire's own treatment.
 */
import type { Stage, StageId } from "@/lib/types";

export const STAGES: Stage[] = [
  {
    id: "screening",
    order: 1,
    title: "Screening",
    description:
      "A routine mammogram for people with no symptoms. It looks for small changes early. If an area needs a closer look, you're asked back for more pictures.",
  },
  {
    id: "diagnostic-imaging",
    order: 2,
    title: "Diagnostic imaging",
    description:
      "More detailed pictures of one area, usually a diagnostic mammogram and an ultrasound. A radiologist often reviews them while you're there and tells you whether a biopsy is needed.",
  },
  {
    id: "biopsy",
    order: 3,
    title: "Biopsy",
    description:
      "A doctor takes a few small samples of tissue with a needle, guided by imaging. A pathologist looks at them under a microscope. Results usually take a few days.",
  },
  {
    id: "diagnosis",
    order: 4,
    title: "Diagnosis",
    description:
      "The pathology report explains what the cells are and describes their features. Your doctor goes over the results with you and refers you to the specialists you'll see next.",
  },
  {
    id: "treatment-planning",
    order: 5,
    title: "Treatment planning",
    description:
      "You meet the specialists who will help plan your care, often starting with a breast surgeon. More tests, such as imaging, bloodwork or genetic counseling, may be arranged. You usually have time to think through the options before deciding.",
  },
  {
    id: "treatment",
    order: 6,
    title: "Treatment",
    description:
      "The plan you and your care team agreed on begins. For breast cancer this can include surgery, radiation, medicines or a mix, and the order differs from person to person. Your team explains each step before it starts.",
  },
  {
    id: "follow-up",
    order: 7,
    title: "Follow-up",
    description:
      "After treatment, you have regular check-ups and imaging. These visits keep an eye on your health and help with any side effects. Over time, they usually become less frequent.",
  },
];

export const INITIAL_STAGE_ID: StageId = "diagnosis";

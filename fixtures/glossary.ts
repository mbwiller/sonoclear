// CLINICAL REVIEW PENDING
/**
 * Shared glossary. Every term the patient can tap resolves here, so a definition
 * reads the same on a visit page and on a record page.
 */
import type { Term } from "@/lib/types";

export type GlossaryTermId =
  | "bi-rads"
  | "bi-rads-0"
  | "bi-rads-5"
  | "screening-mammogram"
  | "diagnostic-mammogram"
  | "breast-ultrasound"
  | "dense-breast-tissue"
  | "mass"
  | "spiculated"
  | "hypoechoic"
  | "clock-position"
  | "upper-outer-quadrant"
  | "axillary-lymph-nodes"
  | "core-needle-biopsy"
  | "marker-clip"
  | "pathology-report"
  | "invasive-ductal-carcinoma"
  | "tumor-grade"
  | "hormone-receptor"
  | "er-positive"
  | "pr-positive"
  | "her2-negative"
  | "her2-ihc-score"
  | "ki-67"
  | "lymphovascular-invasion"
  | "staging"
  | "lumpectomy"
  | "mastectomy"
  | "margins"
  | "radiation-therapy"
  | "sentinel-lymph-node-biopsy"
  | "breast-mri"
  | "genetic-counseling"
  | "brca"
  | "medical-oncologist"
  | "hormone-therapy"
  | "pre-op-bloodwork"
  | "cbc"
  | "metabolic-panel";

const TERMS: Record<GlossaryTermId, Omit<Term, "id">> = {
  "bi-rads": {
    term: "BI-RADS",
    definition:
      "A standard scale radiologists use to sum up what a breast imaging exam showed and what should happen next. The categories run from 0 to 6.",
    alsoCalled: ["Breast Imaging Reporting and Data System", "BI-RADS category"],
  },
  "bi-rads-0": {
    term: "BI-RADS 0",
    definition:
      "The exam isn't finished yet. The radiologist needs more pictures, such as a diagnostic mammogram or an ultrasound, before giving a result. Doctors call this incomplete.",
    alsoCalled: ["incomplete, needs additional imaging"],
  },
  "bi-rads-5": {
    term: "BI-RADS 5",
    definition:
      "The images show an area that looks very much like cancer. Doctors call this highly suggestive of malignancy. A biopsy is the step that tells for certain.",
    alsoCalled: ["highly suggestive of malignancy"],
  },
  "screening-mammogram": {
    term: "Screening mammogram",
    definition:
      "A routine breast X-ray for people who have no symptoms. It looks for changes early, often before anything can be felt.",
  },
  "diagnostic-mammogram": {
    term: "Diagnostic mammogram",
    definition:
      "A more detailed breast X-ray, done to look closely at one area. It often includes extra angles or magnified views, and a radiologist usually reviews it while you're there.",
  },
  "breast-ultrasound": {
    term: "Breast ultrasound",
    definition:
      "A scan that uses sound waves, not radiation, to make pictures of the inside of the breast. It helps show whether an area is solid or filled with fluid.",
    alsoCalled: ["sonogram"],
  },
  "dense-breast-tissue": {
    term: "Dense breast tissue",
    definition:
      "Your breasts have more gland and support tissue than fat, which is common and normal. Density is graded from A, mostly fat, to D, extremely dense; heterogeneously dense is category C. Dense tissue can make a mammogram harder to read.",
    alsoCalled: ["breast density", "heterogeneously dense"],
  },
  mass: {
    term: "Mass",
    definition:
      "An area that looks like a lump on imaging and keeps its shape when seen from more than one angle. A mass is not a diagnosis on its own. Its shape and edges help the radiologist decide what to do next.",
  },
  spiculated: {
    term: "Spiculated",
    definition:
      "The edges of a mass have thin lines reaching out from it, a bit like spokes. Radiologists see this pattern more often with cancer, so it usually leads to a biopsy.",
    alsoCalled: ["spiculated margins"],
  },
  hypoechoic: {
    term: "Hypoechoic",
    definition:
      "Darker than the tissue around it on an ultrasound, because it sends back fewer sound waves. On its own, it doesn't say what the area is.",
  },
  "clock-position": {
    term: "Clock position",
    definition:
      "A way to say where something is in the breast, as if the breast were a clock face seen by someone facing you. In the left breast, 2 o'clock is above the nipple and toward the armpit. The distance from the nipple is often added, such as 6 cm.",
  },
  "upper-outer-quadrant": {
    term: "Upper outer quadrant",
    definition:
      "The part of the breast above the nipple and toward the armpit. It holds the most breast tissue, so it's where changes are most often found.",
    alsoCalled: ["UOQ"],
  },
  "axillary-lymph-nodes": {
    term: "Axillary lymph nodes",
    definition:
      "Small, bean-shaped glands in your armpit that are part of the immune system. Fluid from the breast drains to them first, so doctors check them when they look at the breast.",
    alsoCalled: ["underarm lymph nodes", "axilla"],
  },
  "core-needle-biopsy": {
    term: "Core needle biopsy",
    definition:
      "A hollow needle takes a few thin strips of tissue from the area, guided by ultrasound or mammogram images. The skin is numbed first. A pathologist then looks at the samples under a microscope.",
    alsoCalled: ["ultrasound-guided biopsy", "needle biopsy"],
  },
  "marker-clip": {
    term: "Marker clip",
    definition:
      "A tiny metal marker, about the size of a sesame seed, placed where the biopsy was taken. It lets doctors find the exact spot later on imaging or during surgery. Most people can't feel it.",
    alsoCalled: ["biopsy clip", "tissue marker"],
  },
  "pathology-report": {
    term: "Pathology report",
    definition:
      "The written results from the pathologist, the doctor who looks at tissue under a microscope. It says what kind of cells were found and describes their features. Your care team uses it to plan next steps.",
  },
  "invasive-ductal-carcinoma": {
    term: "Invasive ductal carcinoma",
    definition:
      "The cancer started in a milk duct and has grown into nearby breast tissue. Doctors call this invasive ductal carcinoma. It is the most common type of breast cancer.",
    alsoCalled: ["IDC", "invasive carcinoma of no special type", "invasive breast carcinoma, NST"],
  },
  "tumor-grade": {
    term: "Tumor grade",
    definition:
      "How different the cancer cells look from normal cells under a microscope. Grade 1 cells look the most like normal cells and grade 3 the least. The Nottingham system adds up three scores, from 3 to 9, to reach the grade.",
    alsoCalled: ["Nottingham grade", "histologic grade"],
  },
  "hormone-receptor": {
    term: "Hormone receptor",
    definition:
      "A protein inside some breast cancer cells that lets them use the hormones estrogen or progesterone to grow. The pathologist tests for two: the estrogen receptor (ER) and the progesterone receptor (PR).",
    alsoCalled: ["hormone receptor status", "HR status"],
  },
  "er-positive": {
    term: "ER-positive",
    definition:
      "The cancer cells have receptors for estrogen, so estrogen can help them grow. Doctors call this estrogen receptor positive. The report gives the share of cells that tested positive, as a percentage.",
    alsoCalled: ["estrogen receptor positive", "ER+"],
  },
  "pr-positive": {
    term: "PR-positive",
    definition:
      "The cancer cells have receptors for progesterone. Doctors call this progesterone receptor positive. It is reported alongside the estrogen receptor result.",
    alsoCalled: ["progesterone receptor positive", "PR+"],
  },
  "her2-negative": {
    term: "HER2-negative",
    definition:
      "HER2 is a protein that can help cells grow. The cancer cells don't have extra amounts of it. Doctors call this HER2-negative.",
    alsoCalled: ["HER2-"],
  },
  "her2-ihc-score": {
    term: "HER2 IHC score",
    definition:
      "A lab test that stains the tissue to show how much HER2 protein the cells have, scored 0, 1+, 2+ or 3+. A score of 0 or 1+ counts as negative and 3+ as positive. A 2+ result needs a second test to decide.",
    alsoCalled: ["immunohistochemistry", "IHC"],
  },
  "ki-67": {
    term: "Ki-67",
    definition:
      "A measure of how many cancer cells were dividing when the sample was taken, given as a percentage. Doctors look at it together with the other results.",
    alsoCalled: ["proliferation index"],
  },
  "lymphovascular-invasion": {
    term: "Lymphovascular invasion",
    definition:
      "Whether cancer cells were seen inside tiny blood vessels or lymph channels in the tissue sample. Reports say it was either seen or not identified.",
    alsoCalled: ["LVI"],
  },
  staging: {
    term: "Stage",
    definition:
      "A way to describe the cancer's size, whether it has reached lymph nodes or other parts of the body, and some features of the cells. Stage is often confirmed after surgery, when the tissue and lymph nodes can be looked at fully.",
    alsoCalled: ["staging", "cancer stage"],
  },
  lumpectomy: {
    term: "Lumpectomy",
    definition:
      "Surgery that removes the cancer and a rim of normal tissue around it, and keeps the rest of the breast. Doctors call this breast-conserving surgery. It is usually followed by radiation therapy.",
    alsoCalled: ["breast-conserving surgery", "partial mastectomy"],
  },
  mastectomy: {
    term: "Mastectomy",
    definition:
      "Surgery that removes the whole breast. There are several kinds. Breast reconstruction can be done at the same time or later, for those who want it.",
  },
  margins: {
    term: "Margins",
    definition:
      "The outer edge of the tissue removed during surgery. The pathologist checks whether any cancer cells reach that edge. Clear, or negative, margins mean none were found there.",
    alsoCalled: ["surgical margins"],
  },
  "radiation-therapy": {
    term: "Radiation therapy",
    definition:
      "Treatment that uses focused, high-energy beams to destroy cancer cells in one area of the body. It is given in short sessions, usually on weekdays over a number of days or weeks.",
    alsoCalled: ["radiotherapy", "radiation"],
  },
  "sentinel-lymph-node-biopsy": {
    term: "Sentinel lymph node biopsy",
    definition:
      "The sentinel nodes are the first lymph nodes in the armpit that fluid from the breast drains to. During surgery, a tracer or blue dye helps find them, and usually one to three are removed. They are then checked for cancer cells.",
    alsoCalled: ["sentinel node biopsy", "SLNB"],
  },
  "breast-mri": {
    term: "Breast MRI",
    definition:
      "A scan that uses a strong magnet and radio waves, not X-rays, to make detailed pictures of both breasts. You lie face down, and a contrast dye is given through a vein. It can be useful when breast tissue is dense.",
    alsoCalled: ["magnetic resonance imaging"],
  },
  "genetic-counseling": {
    term: "Genetic counseling",
    definition:
      "A meeting with a genetic counselor to talk through your family history and whether genetic testing fits your situation. If you have testing, they explain what the results mean for you and your family.",
  },
  brca: {
    term: "BRCA1 and BRCA2",
    definition:
      "Genes everyone has that help repair damaged DNA. Some people inherit a change in one of them that raises the chance of breast and ovarian cancer. A blood or saliva test can check for these changes.",
    alsoCalled: ["BRCA", "BRCA genes"],
  },
  "medical-oncologist": {
    term: "Medical oncologist",
    definition:
      "A doctor who treats cancer with medicines, such as hormone therapy or chemotherapy. After surgery, many people with breast cancer meet one to talk about whether other treatments make sense for them.",
  },
  "hormone-therapy": {
    term: "Hormone therapy",
    definition:
      "Medicines that block estrogen from reaching cancer cells or lower the amount of estrogen in the body. Doctors call this endocrine therapy. It is different from hormone replacement therapy used for menopause.",
    alsoCalled: ["endocrine therapy", "anti-estrogen therapy"],
  },
  "pre-op-bloodwork": {
    term: "Pre-op bloodwork",
    definition:
      "Blood tests done before surgery to check that your body is ready for it. They often include a CBC and a metabolic panel.",
    alsoCalled: ["pre-operative labs", "pre-surgery blood tests"],
  },
  cbc: {
    term: "CBC",
    definition:
      "A blood test that counts your red cells, white cells and platelets. It can show things like anemia or infection. Doctors call it a complete blood count.",
    alsoCalled: ["complete blood count"],
  },
  "metabolic-panel": {
    term: "Metabolic panel",
    definition:
      "A blood test that checks your blood sugar, body salts and how well your kidneys are working. The comprehensive version also checks your liver.",
    alsoCalled: ["basic metabolic panel (BMP)", "comprehensive metabolic panel (CMP)"],
  },
};

export const GLOSSARY: Term[] = (Object.keys(TERMS) as GlossaryTermId[]).map((id) => ({ id, ...TERMS[id] }));

export function term(id: GlossaryTermId): Term {
  const t = TERMS[id];
  if (!t) throw new Error(`Glossary term missing: ${id}`);
  return { id, ...t };
}

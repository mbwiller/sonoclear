import { arrangeGenetics, arrangeMri, endRecording, expect, nav, recordSurgicalConsult, startRecording, test } from "./fixtures";

test("Ask's second question follows the journey once the consult is recorded", async ({ page }) => {
  await page.goto("/ask");
  await expect(page.getByRole("button", { name: "What happens between now and my surgery consult?" })).toBeVisible();
  await recordSurgicalConsult(page);
  await nav(page, "Ask").click();
  const next = page.getByRole("button", { name: "What happens between now and my surgery?" });
  await expect(next).toBeVisible();
  await next.click();
  await expect(page.getByRole("link", { name: "From your surgical consult" })).toBeVisible({ timeout: 20_000 });
});

test("after Reset demo, the demo runs again from the start", async ({ page }) => {
  await page.goto("/journey");
  await recordSurgicalConsult(page);
  await page.goto("/profile");
  await page.getByRole("button", { name: "Reset demo" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Reset demo" }).click();
  await expect(page).toHaveURL(/\/journey$/);
  await expect(page.getByText("Surgical consult with Dr. Ellery").first()).toBeVisible();
  // Capture pre-selects the consult again, and recording it works a second time.
  await recordSurgicalConsult(page);
  await expect(page.getByText("Schedule your breast MRI", { exact: true })).toBeVisible();
});

test("a recording survives leaving Capture and visiting other screens", async ({ page }) => {
  await page.goto("/journey");
  await nav(page, "Capture").click();
  await startRecording(page);
  await page.waitForTimeout(800);
  // In-app navigation only (a full page load ends any recording, as it would a real microphone).
  // Visiting several screens pushes Capture out of the routes Next keeps alive.
  await page.goBack();
  // Hidden routes stay in the DOM, so wait for each screen and click only visible links.
  await nav(page, "Records").click();
  await expect(page.getByRole("heading", { level: 1, name: "Records" })).toBeVisible();
  await page.getByRole("link", { name: /Breast biopsy pathology report/ }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/\/record\/record-pathology$/);
  await nav(page, "Ask").click();
  await expect(page).toHaveURL(/\/ask/);
  await nav(page, "Journey").click();
  await expect(page.getByRole("heading", { level: 1, name: /Claire$/ })).toBeVisible();
  await page.getByRole("link", { name: /Biopsy results with Dr\. Raman/ }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/\/visit\/visit-results$/);
  await nav(page, "Capture").click();
  await expect(page.getByRole("dialog", { name: /Recording your visit/ })).toBeVisible();
  await expect(page.getByRole("dialog", { name: /Recording your visit/ }).getByText("Paused", { exact: true }).first()).toBeVisible();
  await endRecording(page);
  await expect(page.getByRole("heading", { level: 1, name: "Surgical consult with Dr. Ellery" })).toBeVisible();
});

test("recording another kind of visit is honest about the preview", async ({ page }) => {
  await page.goto("/capture");
  await page.getByRole("button", { name: /Change who you.re seeing/ }).click();
  const sheet = page.getByRole("dialog", { name: "Who are you seeing?" });
  await sheet.getByRole("radio", { name: "PCP" }).click();
  await expect(sheet.getByText(/In this preview, full notes are available for the surgical consult/)).toBeVisible();
  await sheet.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("dialog", { name: "Who are you seeing?" })).toHaveCount(0);
  // The chip no longer reads as the scheduled consult.
  await expect(page.locator("#main").getByText("PCP visit")).toBeVisible();
  await startRecording(page);
  await page.waitForTimeout(800);
  await endRecording(page);
  await expect(page.locator("#main").getByText(/aren.t available in this preview/)).toBeVisible();
  // The journey doesn't move for a visit the preview can't summarize.
  await nav(page, "Journey").click();
  await expect(page.getByRole("button", { name: /Diagnosis\s*,\s*current stage/ })).toBeVisible();
});

test("Arrange before the consult: discs to request, the consult already booked", async ({ page }) => {
  await page.goto("/arrange");
  const main = page.locator("#main");
  await expect(main.getByRole("heading", { level: 1, name: "Arrange" })).toBeVisible();
  await expect(main.getByText("Request your imaging discs", { exact: true })).toBeVisible();
  await expect(main.getByText("Schedule your breast MRI")).toHaveCount(0);
  await expect(main.getByRole("heading", { name: "Already booked" })).toBeVisible();
  await expect(main.getByText("Surgical consult with Dr. Ellery")).toBeVisible();
  await expect(main.getByText(/calls and bookings are simulated/)).toBeVisible();
});

test("the follow-up waits for the MRI and genetic counseling, then can be arranged", async ({ page }) => {
  await page.goto("/journey");
  await recordSurgicalConsult(page);
  await nav(page, "Arrange").click();
  const followUp = () => page.locator("li").filter({ hasText: "Book your follow-up with Dr. Ellery" }).filter({ visible: true });
  await expect(followUp()).toBeVisible();
  await expect(followUp().getByText(/Once your MRI and genetic counseling dates are set/)).toBeVisible();
  await expect(followUp().getByRole("button")).toHaveCount(0);
  await arrangeMri(page);
  // Still waiting: genetic counseling isn't arranged yet.
  await expect(followUp().getByRole("button")).toHaveCount(0);
  await arrangeGenetics(page);
  await expect(followUp().getByRole("button", { name: /Arrange this/ })).toBeVisible();
  await expect(page.locator("#main").getByRole("heading", { name: "Arranged" })).toBeVisible();
});

test("cancelling an arrangement leaves nothing arranged", async ({ page }) => {
  await page.goto("/journey");
  await recordSurgicalConsult(page);
  await nav(page, "Arrange").click();
  const card = page.locator("li").filter({ hasText: "Schedule your breast MRI" }).filter({ visible: true });
  await card.getByRole("button", { name: /Arrange this/ }).click();
  const run = page.getByRole("dialog", { name: "Arranging: Schedule your breast MRI" });
  await expect(run).toBeVisible();
  await run.getByRole("button", { name: "Cancel" }).click();
  await expect(run).toHaveCount(0);
  const main = page.locator("#main");
  await expect(main.getByRole("heading", { name: "Arranged" })).toHaveCount(0);
  await expect(main.getByText("See what happened")).toHaveCount(0);
  await expect(card.getByRole("button", { name: /Arrange this/ })).toBeVisible();
});

test("a corrupted save never locks the patient out", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.setItem(
      "sonoclear-demo",
      JSON.stringify({
        state: { capturedVisits: [{ id: "broken" }], uploadedRecords: "nope", todoOverrides: { x: 1 }, replaySpeed: "warp" },
        version: 1,
      }),
    );
  });
  await page.goto("/journey");
  await expect(page.getByRole("heading", { level: 1, name: /Claire$/ })).toBeVisible();
  await nav(page, "Records").click();
  await expect(page.getByRole("heading", { level: 1, name: "Records" })).toBeVisible();
});

test("Profile: one sheet can hand off to another", async ({ page }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: /Delete/ }).first().click();
  const handoff = page.getByRole("dialog").getByRole("button", { name: /Reset demo instead/ });
  await expect(handoff).toBeVisible();
  await handoff.click();
  await expect(page.getByRole("dialog", { name: /Reset the demo/ })).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.getByRole("dialog", { name: /Reset the demo/ })).toBeVisible();
});

test("the live transcript opens during a recording", async ({ page }) => {
  await page.goto("/capture");
  await startRecording(page);
  await page.getByRole("button", { name: "Show transcript" }).click();
  await expect(page.getByRole("log")).toBeVisible();
  await expect(page.getByRole("log").getByText(/record/i).first()).toBeVisible({ timeout: 15_000 });
});

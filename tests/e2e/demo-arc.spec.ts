import { expect, nav, recordSurgicalConsult, test } from "./fixtures";

test("the demo arc works end to end with no dead ends", async ({ page }) => {
  // Journey: greeting and Up next.
  await page.goto("/");
  await expect(page).toHaveURL(/\/journey$/);
  await expect(page.getByRole("heading", { level: 1, name: /^Good (morning|afternoon|evening), Claire$/ })).toBeVisible();
  await expect(page.getByText("Surgical consult with Dr. Ellery").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Diagnosis\s*,\s*current stage/ })).toBeVisible();

  // The results visit.
  await page.getByRole("link", { name: /Biopsy results with Dr\. Raman/ }).first().click();
  await expect(page).toHaveURL(/\/visit\/visit-results$/);
  await expect(page.getByRole("heading", { level: 1, name: "Biopsy results with Dr. Raman" })).toBeVisible();

  // The pathology record.
  await page.getByRole("link", { name: /Breast biopsy pathology report/ }).first().click();
  await expect(page).toHaveURL(/\/record\/record-pathology$/);
  await expect(page.getByRole("heading", { level: 1, name: /pathology report/i })).toBeVisible();

  // Ask the ER/HER2 question about it.
  await page.getByRole("link", { name: "Ask about this record" }).click();
  await expect(page).toHaveURL(/\/ask\?focus=record-pathology/);
  await page.getByRole("button", { name: "What does ER-positive, HER2-negative mean?" }).click();
  await expect(page.getByRole("link", { name: "From your pathology report" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("article").getByText(/Doctors call this ER-positive/)).toBeVisible();

  // Capture the surgical consult and land on the new visit with new to-dos.
  await recordSurgicalConsult(page);
  await expect(page.getByText("Schedule your breast MRI")).toBeVisible();
  await expect(page.getByText("Get your pre-op bloodwork")).toBeVisible();

  // Back on Journey, the timeline has advanced and the new to-dos lead.
  await nav(page, "Journey").click();
  await expect(page.getByRole("button", { name: /Treatment planning\s*,\s*current stage/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Diagnosis\s*,\s*done/ })).toBeVisible();
  await expect(page.getByText("Schedule your breast MRI").first()).toBeVisible();

  // It survives a refresh.
  await page.reload();
  await expect(page.getByRole("button", { name: /Treatment planning\s*,\s*current stage/ })).toBeVisible();
});

test("a checked to-do survives a refresh", async ({ page }) => {
  await page.goto("/journey");
  const todo = page.getByRole("checkbox", { name: "Gather your imaging discs for Dr. Ellery" });
  await expect(todo).not.toBeChecked();
  await todo.check();
  await page.reload();
  // It now lives under the collapsed Done list.
  await expect(page.getByRole("checkbox", { name: "Gather your imaging discs for Dr. Ellery" })).toHaveCount(0);
  await page.getByRole("button", { name: /^Done/ }).click();
  await expect(page.getByRole("checkbox", { name: "Gather your imaging discs for Dr. Ellery" })).toBeChecked();
});

test("Ask explains, redirects advice, and is honest about its limits", async ({ page }) => {
  await page.goto("/ask");
  await expect(page.getByRole("heading", { level: 1, name: /What would you like to understand/ })).toBeVisible();
  await expect(page.getByText("Sonoclear explains. Your care team decides.")).toBeVisible();

  const input = page.getByLabel("Your question");
  await input.fill("Should I get a mastectomy?");
  await input.press("Enter");
  await expect(page.getByText(/That's a decision for you and Dr\. Ellery\./)).toBeVisible({ timeout: 20_000 });

  await expect(input).toBeEditable({ timeout: 20_000 });
  await input.fill("What's the weather like on Thursday?");
  await input.press("Enter");
  await expect(page.locator("#main").getByText("I can't answer that in this preview yet. Here are a few things I can help with.", { exact: true }).first()).toBeVisible({
    timeout: 20_000,
  });

  await page.getByRole("button", { name: "What did my radiologist mean by BI-RADS 5?" }).last().click();
  await expect(page.getByRole("link", { name: "From your imaging report" })).toBeVisible({ timeout: 20_000 });
});

test("adding a record: a sample is explained, an unknown document is saved honestly", async ({ page }) => {
  await page.goto("/records");
  await page.getByRole("button", { name: /Add a record/ }).first().click();
  await page.getByRole("button", { name: /Paste text/ }).click();
  await page.getByRole("button", { name: /Use a sample report/ }).click();
  await page.getByRole("button", { name: "Read this document" }).click();
  await page.getByRole("button", { name: "Save to records" }).click();
  await expect(page).toHaveURL(/\/record\/record-/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Screening mammogram from last year" })).toBeVisible();

  await nav(page, "Records").click();
  await page.getByRole("button", { name: /Add a record/ }).first().click();
  await page.getByRole("button", { name: /Paste text/ }).click();
  await page.getByLabel(/The text of your document/).fill("Parking validation for the Linden Health garage, level 2.");
  await page.getByRole("button", { name: "Read this document" }).click();
  await expect(page.getByRole("dialog").getByText(/aren't available for this document in this preview/)).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Save to records" }).click();
  await expect(page).toHaveURL(/\/record\/record-/, { timeout: 20_000 });
  await expect(page.locator("#main").getByText(/aren't available for this document in this preview/)).toBeVisible();
});

test("Reset demo returns to the starting state", async ({ page }) => {
  await page.goto("/journey");
  await recordSurgicalConsult(page);
  await page.goto("/profile");
  await page.getByRole("button", { name: "Reset demo" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Reset demo" }).click();
  await expect(page).toHaveURL(/\/journey$/);
  await expect(page.getByRole("button", { name: /Diagnosis\s*,\s*current stage/ })).toBeVisible();
  await expect(page.getByText("Schedule your breast MRI")).toHaveCount(0);
});

test("leaving a page with a sheet open never blocks the app", async ({ page }) => {
  await page.goto("/journey");
  await page.goto("/visit/visit-results");
  await page.getByRole("button", { name: "ER-positive" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/journey$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await nav(page, "Records").click();
  await expect(page.getByRole("heading", { level: 1, name: "Records" })).toBeVisible();
});

test("unknown visit and record ids get a calm way back", async ({ page }) => {
  await page.goto("/visit/nope");
  await expect(page.getByRole("link", { name: /Journey/ }).first()).toBeVisible();
  await page.goto("/record/nope");
  await expect(page.getByRole("link", { name: /Records/ }).first()).toBeVisible();
});

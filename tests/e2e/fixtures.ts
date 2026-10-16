import { test as base, expect, type Page } from "@playwright/test";

/** Every test fails on any console error or uncaught exception. */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await use(errors);
      expect(errors, errors.join("\n")).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** The visible main navigation: bottom tabs on mobile, sidebar on desktop. */
export const nav = (page: Page, label: string) =>
  page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: label, exact: true });

export async function startRecording(page: Page) {
  await page.getByRole("button", { name: /Start recording/ }).click();
  await expect(page.getByRole("dialog", { name: /Recording your visit/ })).toBeVisible();
}

export async function endRecording(page: Page) {
  await page.getByRole("button", { name: "End", exact: true }).click();
  await expect(page).toHaveURL(/\/visit\/visit-/, { timeout: 20_000 });
}

/** Records the surgical consult from wherever the page is, landing on the new visit. */
export async function recordSurgicalConsult(page: Page) {
  await nav(page, "Capture").click();
  await expect(page.getByRole("heading", { level: 1, name: "Record a visit" })).toBeVisible();
  // The next appointment fills the visit chip.
  await expect(page.locator("#main").getByText("Surgical consult with Dr. Ellery").first()).toBeVisible();
  await expect(page.getByText(/Let your doctor know you.re recording\./)).toBeVisible();
  await startRecording(page);
  await page.waitForTimeout(1500);
  await endRecording(page);
  await expect(page.getByRole("heading", { level: 1, name: "Surgical consult with Dr. Ellery" })).toBeVisible();
}

/** Arranges the breast MRI through the simulated scheduling agent, ending back on the Arrange home. */
/** Arranges a "book" task from the Arrange tab, choosing the first opening. */
export async function arrangeTask(page: Page, title: string) {
  await nav(page, "Arrange").click();
  await expect(page.getByRole("heading", { level: 1, name: "Arrange" })).toBeVisible();
  const card = page.locator("li").filter({ hasText: title }).filter({ visible: true });
  await card.getByRole("button", { name: /Arrange this/ }).click();
  const run = page.getByRole("dialog", { name: `Arranging: ${title}` });
  await run.getByRole("radio").first().waitFor({ timeout: 30_000 });
  await run.getByRole("radio").first().check();
  await run.getByRole("button", { name: "Book this one" }).click();
  await expect(run.getByText("Booked", { exact: true })).toBeVisible({ timeout: 30_000 });
  await run.getByRole("button", { name: "Done", exact: true }).click();
  await expect(run).toHaveCount(0);
}

export async function arrangeMri(page: Page) {
  await arrangeTask(page, "Schedule your breast MRI");
}

export async function arrangeGenetics(page: Page) {
  await arrangeTask(page, "Book genetic counseling");
}

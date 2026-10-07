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
  // The next appointment is pre-selected.
  await expect(page.getByRole("radio", { name: "Breast surgeon" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText(/Let your doctor know you.re recording\./)).toBeVisible();
  await startRecording(page);
  await page.waitForTimeout(1500);
  await endRecording(page);
  await expect(page.getByRole("heading", { level: 1, name: "Surgical consult with Dr. Ellery" })).toBeVisible();
}

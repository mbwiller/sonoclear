import AxeBuilder from "@axe-core/playwright";
import { expect, recordSurgicalConsult, startRecording, test } from "./fixtures";

// Scan settled pages: with reduced motion the fade-ins finish instantly.
test.use({ reducedMotion: "reduce" });

const ROUTES = [
  "/journey",
  "/visit/visit-results",
  "/visit/visit-diagnostic-imaging",
  "/capture",
  "/records",
  "/record/record-pathology",
  "/record/record-baseline-labs",
  "/ask",
  "/ask?focus=visit-results",
  "/profile",
  "/styleguide",
];

for (const route of ROUTES) {
  test(`no serious accessibility violations on ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.locator("h1").first().waitFor();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      serious,
      serious.map((v) => `${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(" ")).join("\n  ")}`).join("\n"),
    ).toEqual([]);
  });

  test(`no sideways scrolling on ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.locator("h1").first().waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("the recording screen is accessible", async ({ page }) => {
  await page.goto("/capture");
  await page.getByRole("button", { name: /Start recording/ }).click();
  await expect(page.getByRole("dialog", { name: /Recording your visit/ })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => v.id)).toEqual([]);
});

test("keyboard: skip link and visible focus", async ({ page }) => {
  await page.goto("/journey");
  await page.locator("h1").first().waitFor();
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  const outline = await skip.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe("none");
});

test.describe("accessibility in deeper states", () => {
  const scan = async (page: import("@playwright/test").Page) => {
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  };

  test("a term definition sheet", async ({ page }) => {
    await page.goto("/visit/visit-results");
    await page.getByRole("button", { name: "ER-positive" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });

  test("the add-record sheet", async ({ page }) => {
    await page.goto("/records");
    await page.getByRole("button", { name: /Add a record/ }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });

  test("the live transcript sheet", async ({ page }) => {
    await page.goto("/capture");
    await startRecording(page);
    await page.getByRole("button", { name: "Show transcript" }).click();
    await expect(page.getByRole("log")).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });

  test("a recorded visit and the journey after it", async ({ page }) => {
    await page.goto("/journey");
    await recordSurgicalConsult(page);
    expect(await scan(page)).toEqual([]);
    await page.goto("/journey");
    await page.locator("h1").first().waitFor();
    expect(await scan(page)).toEqual([]);
  });

  test("Ask with an answer", async ({ page }) => {
    await page.goto("/ask");
    await page.getByRole("button", { name: "What did my radiologist mean by BI-RADS 5?" }).click();
    await expect(page.getByRole("link", { name: "From your imaging report" })).toBeVisible({ timeout: 20_000 });
    expect(await scan(page)).toEqual([]);
  });
});

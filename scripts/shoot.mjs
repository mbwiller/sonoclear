// Screenshots routes at mobile (390) and desktop (1280) widths for design review.
// Usage: node scripts/shoot.mjs /journey /ask [--widths 390,1280] [--out .shots] [--name prefix]
//        [--viewport-only] [--setup ./file.mjs]  (setup default-exports async (page) => {} run before each shot)
//        [--base http://localhost:3000] [--dpr 1]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);
const paths = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--") && !["--viewport-only"].includes(args[i - 1])));
const widths = opt("widths", "390,1280").split(",").map(Number);
const out = resolve(opt("out", ".shots"));
const base = opt("base", "http://localhost:3000");
const prefix = opt("name", "");
const dpr = Number(opt("dpr", "1"));
const setupPath = opt("setup", null);
const setup = setupPath ? (await import(resolve(setupPath))).default : null;

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const width of widths) {
  const height = width < 800 ? 844 : 860;
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") console.log(`[console.${m.type()}] ${m.text().slice(0, 400)}`);
  });
  page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));
  for (const p of paths) {
    await page.goto(base + p, { waitUntil: "networkidle" });
    if (setup) await setup(page, { path: p, width });
    await page.waitForTimeout(400);
    const slug = (prefix ? prefix + "-" : "") + (p.replace(/^\//, "").replace(/[/?=&]+/g, "_") || "root");
    const file = `${out}/${slug}-${width}.png`;
    await page.screenshot({ path: file, fullPage: !flag("viewport-only") });
    console.log(file);
  }
  await context.close();
}
await browser.close();

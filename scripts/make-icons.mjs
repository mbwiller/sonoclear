// Generates the app icons from the three-bar mark. Run with `node scripts/make-icons.mjs`.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const PAPER = "#F8F7F3", SAGE = "#6B7A4C";

function mark(size, { scale = 1, radius = 0 } = {}) {
  const u = (size / 512) * scale;
  const w = 46 * u, gap = 38 * u, max = 230 * u;
  const heights = [0.45, 1, 0.64].map((h) => h * max);
  const total = 3 * w + 2 * gap;
  const x0 = (size - total) / 2;
  const bars = heights
    .map((h, i) => `<rect x="${x0 + i * (w + gap)}" y="${(size - h) / 2}" width="${w}" height="${h}" rx="${w / 2}" fill="${SAGE}"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${PAPER}"/>${bars}</svg>`;
}

mkdirSync("public/icons", { recursive: true });
await sharp(Buffer.from(mark(192))).png().toFile("public/icons/icon-192.png");
await sharp(Buffer.from(mark(512))).png().toFile("public/icons/icon-512.png");
// Maskable: keep the mark inside the safe zone.
await sharp(Buffer.from(mark(512, { scale: 0.78 }))).png().toFile("public/icons/maskable-512.png");
await sharp(Buffer.from(mark(180))).png().toFile("app/apple-icon.png");
// Favicon as SVG with rounded corners, plus a PNG fallback.
writeFileSync("app/icon.svg", mark(64, { scale: 1.15, radius: 14 }));
console.log("icons written");

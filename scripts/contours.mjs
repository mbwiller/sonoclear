// Generates public/contours.svg: a faint topographic line texture (VISION §6).
// Deterministic: same output every run. Run with `node scripts/contours.mjs`.
import { writeFileSync } from "node:fs";

const W = 1400, H = 720, CELL = 12;
const cols = Math.ceil(W / CELL) + 1, rows = Math.ceil(H / CELL) + 1;

// Seeded PRNG so the texture never changes between builds.
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const hills = Array.from({ length: 9 }, () => ({
  x: rand() * W, y: rand() * H * 1.1 - H * 0.1,
  r: 160 + rand() * 300, a: (rand() > 0.35 ? 1 : -1) * (0.6 + rand() * 0.8),
}));

function field(x, y) {
  let v = 0;
  for (const h of hills) {
    const dx = (x - h.x) / h.r, dy = (y - h.y) / (h.r * 0.8);
    v += h.a * Math.exp(-(dx * dx + dy * dy));
  }
  v += 0.18 * Math.sin(x / 210 + y / 340) + 0.12 * Math.cos(y / 160 - x / 520);
  return v;
}

const grid = [];
for (let j = 0; j < rows; j++) {
  grid.push([]);
  for (let i = 0; i < cols; i++) grid[j].push(field(i * CELL, j * CELL));
}

const flat = grid.flat();
const min = Math.min(...flat), max = Math.max(...flat);
const LEVELS = 22;

const key = (p) => `${p[0].toFixed(0)},${p[1].toFixed(0)}`;
const lerp = (a, b, va, vb, t) => a + ((t - va) / (vb - va)) * (b - a);

const paths = [];
for (let l = 1; l < LEVELS; l++) {
  const t = min + ((max - min) * l) / LEVELS;
  const segs = [];
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const x = i * CELL, y = j * CELL;
      const a = grid[j][i], b = grid[j][i + 1], c = grid[j + 1][i + 1], d = grid[j + 1][i];
      const pts = [];
      if ((a < t) !== (b < t)) pts.push([lerp(x, x + CELL, a, b, t), y]);
      if ((b < t) !== (c < t)) pts.push([x + CELL, lerp(y, y + CELL, b, c, t)]);
      if ((c < t) !== (d < t)) pts.push([lerp(x, x + CELL, d, c, t), y + CELL]);
      if ((d < t) !== (a < t)) pts.push([x, lerp(y, y + CELL, a, d, t)]);
      if (pts.length === 2) segs.push(pts);
      else if (pts.length === 4) { segs.push([pts[0], pts[1]]); segs.push([pts[2], pts[3]]); }
    }
  }
  // Join segments into polylines.
  const ends = new Map();
  segs.forEach((s, idx) => {
    for (const p of s) {
      const k = key(p);
      if (!ends.has(k)) ends.set(k, []);
      ends.get(k).push(idx);
    }
  });
  const used = new Set();
  for (let s = 0; s < segs.length; s++) {
    if (used.has(s)) continue;
    used.add(s);
    const line = [segs[s][0], segs[s][1]];
    for (const dir of [1, -1]) {
      for (;;) {
        const tip = dir === 1 ? line[line.length - 1] : line[0];
        const next = (ends.get(key(tip)) ?? []).find((n) => !used.has(n));
        if (next === undefined) break;
        used.add(next);
        const [p, q] = segs[next];
        const other = key(p) === key(tip) ? q : p;
        if (dir === 1) line.push(other); else line.unshift(other);
      }
    }
    if (line.length < 6) continue;
    // Smooth with quadratic curves through midpoints.
    let d = `M${line[0][0].toFixed(0)} ${line[0][1].toFixed(0)}`;
    for (let k = 1; k < line.length - 1; k++) {
      const mx = (line[k][0] + line[k + 1][0]) / 2, my = (line[k][1] + line[k + 1][1]) / 2;
      d += `Q${line[k][0].toFixed(0)} ${line[k][1].toFixed(0)} ${mx.toFixed(0)} ${my.toFixed(0)}`;
    }
    paths.push(d);
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><g fill="none" stroke="#232F5C" stroke-opacity="0.085" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">${paths.map((d) => `<path d="${d}"/>`).join("")}</g></svg>`;
writeFileSync(new URL("../public/contours.svg", import.meta.url), svg);
console.log(`contours.svg: ${paths.length} lines, ${(svg.length / 1024).toFixed(0)} KB`);

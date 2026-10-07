import { defineConfig } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: false } },
    { name: "desktop-1280", use: { viewport: { width: 1280, height: 860 } } },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 240_000,
  },
});

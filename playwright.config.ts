import { defineConfig, devices } from "@playwright/test";

const baseURL =
  process.env.E2E_BASE_URL || process.env.VITE_APP_BASE_URL || "https://aqardot.com";

export default defineConfig({
  testDir: "./playwright/e2e",
  timeout: 120 * 1000,
  expect: {
    timeout: 15 * 1000,
  },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["html", { outputFolder: "playwright-report" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    headless: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

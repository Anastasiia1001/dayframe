import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  timeout: 30000,
  retries: 0,
  workers: process.env.CI ? 2 : 3,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4317",
    browserName: "chromium",
    timezoneId: "Europe/Kyiv",
    viewport: { width: 1440, height: 1000 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm start",
    url: "http://localhost:4317/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});

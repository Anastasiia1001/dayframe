import { defineConfig } from "@playwright/test";
const port = Number(process.env.DAYFRAME_TEST_PORT || 4317);
const baseURL = `http://localhost:${port}`;
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  timeout: 30000,
  retries: 0,
  workers: process.env.CI ? 2 : 3,
  reporter: process.env.CI
    ? [["list"], ["github"], ["html", { open: "never" }]]
    : "list",
  use: {
    baseURL,
    browserName: "chromium",
    timezoneId: "Europe/Kyiv",
    locale: "uk-UA",
    viewport: { width: 1440, height: 1000 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm start",
    url: `${baseURL}/api/health`,
    env: { PORT: String(port), DAYFRAME_PUBLIC_URL: baseURL },
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});

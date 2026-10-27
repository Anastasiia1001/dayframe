import { test, expect } from "@playwright/test";
test("weather and a larger companion share the calendar header; details reuse the same request and persist the city", async ({
  page,
}) => {
  let requests = 0;
  await page.route("https://api.open-meteo.com/**", (r) => {
    requests++;
    return r.fulfill({
      json: {
        current: {
          temperature_2m: 8,
          apparent_temperature: 6,
          weather_code: 61,
          is_day: 1,
        },
      },
    });
  });
  await page.route("https://geocoding-api.open-meteo.com/**", (r) =>
    r.fulfill({
      json: {
        results: [
          {
            name: "Львів",
            country: "Україна",
            latitude: 49.84,
            longitude: 24.03,
          },
        ],
      },
    }),
  );
  await page.goto("/");
  const buddy = page.getByRole("region", { name: "Погода й помічник" });
  await expect(buddy).toContainText("8°");
  await expect(buddy).toContainText("Дощ");
  expect(
    (await buddy.locator(".mascot-art").boundingBox())!.width,
  ).toBeGreaterThanOrEqual(72);
  expect(requests).toBe(1);
  await buddy
    .getByRole("button", { name: "Відкрити погоду", exact: true })
    .click();
  const details = page.getByRole("dialog", { name: "Погода і місто" });
  await expect(details).toBeVisible();
  expect(requests).toBe(1);
  await details.getByRole("button", { name: "Київ", exact: true }).click();
  await details.getByLabel("Місто", { exact: true }).fill("Львів");
  await details
    .getByRole("button", { name: "Знайти місто", exact: true })
    .click();
  await details
    .getByRole("button", { name: "Львів, Україна", exact: true })
    .click();
  await expect(details.locator(".weather-temp")).toHaveText("8°");
  await page.keyboard.press("Escape");
  await expect(
    buddy.getByRole("button", { name: "Відкрити погоду", exact: true }),
  ).toBeFocused();
  await expect(buddy).toContainText("Львів, Україна");
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Погода й помічник" }),
  ).toContainText("Львів, Україна");
});
test("Today has one combined weather companion and unavailable weather is never invented", async ({
  page,
}) => {
  await page.route("https://api.open-meteo.com/**", (r) =>
    r.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Сьогодні", exact: true })
    .click();
  const buddy = page.getByRole("region", { name: "Погода й помічник" });
  await expect(buddy).toHaveCount(1);
  await expect(buddy).toContainText("Погода недоступна");
  await expect(buddy).not.toContainText("Сонячно");
  await expect(
    page.locator(".page-heading .mascot-art,.cozy-note .mascot-art"),
  ).toHaveCount(1);
  await expect(page.locator(".today-grid .weather-card")).toHaveCount(0);
});

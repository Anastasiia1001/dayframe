import { test, expect } from "@playwright/test";
const weather = {
  current: {
    temperature_2m: 3,
    apparent_temperature: 1,
    weather_code: 73,
    is_day: 1,
  },
};
test.beforeEach(async ({ page }) => {
  await page.route("https://api.open-meteo.com/**", (route) =>
    route.fulfill({ json: weather }),
  );
});
test("Today shows sport, editable daily priorities, real weather and period navigation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const date = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Kyiv",
    }).format(new Date());
    localStorage.setItem(
      "dayframe-fitness",
      JSON.stringify({
        goal: 8000,
        days: {
          [date]: {
            steps: 4500,
            exercises: [
              {
                id: "one",
                name: "Прогулянка",
                kind: "cardio",
                sets: 1,
                reps: 0,
                weight: 0,
                minutes: 30,
                done: false,
              },
            ],
          },
        },
      }),
    );
  });
  await page.addInitScript(() => {
    const date = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Kyiv",
    }).format(new Date());
    if (!localStorage.getItem("dayframe-tasks"))
      localStorage.setItem(
        "dayframe-tasks",
        JSON.stringify([
          {
            id: "daily-focus",
            title: "Важлива справа",
            date,
            category: "Day",
            recurrence: "once",
            priority: "Normal",
            notes: "",
            completed: false,
            disabled: false,
          },
        ]),
      );
  });
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Сьогодні", exact: true })
    .click();
  await expect(
    page.getByRole("article", { name: "Спорт на сьогодні" }),
  ).toContainText("4 500");
  await page
    .getByRole("button", { name: "Прогулянка 30 хв", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Прогулянка 30 хв", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Обрати головні справи", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Головне: Важлива справа", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Виконано: Важлива справа", exact: true })
    .check();
  await expect(page.getByRole("article", { name: "Погода" })).toContainText(
    "Сніг",
  );
  await expect(page.locator(".weather-scene")).toHaveAttribute(
    "data-weather",
    "snow",
  );
  const periods = page.getByRole("navigation", { name: "Період огляду" });
  for (const name of ["Тиждень", "Місяць", "Квартал", "Рік"]) {
    await periods.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("region", { name: "Плани на обраний період" }),
    ).toBeVisible();
    await expect(
      periods.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await periods.getByRole("button", { name: "Сьогодні", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Головне: Важлива справа", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Сьогодні", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Головне: Важлива справа", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("inspiration rotates at the chosen frequency, supports manual mode and persists preferences on mobile", async ({
  page,
}) => {
  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .locator(".mobile-nav")
    .getByRole("button", { name: "Сьогодні", exact: true })
    .click();
  const card = page.getByRole("article", { name: "Цікавинки", exact: true });
  await expect(
    page.getByRole("article", { name: "Афірмації", exact: true }),
  ).toBeVisible();
  await card
    .getByLabel("Частота зміни цікавинок", { exact: true })
    .selectOption("1");
  const first = await card.locator(".inspiration-text").innerText();
  await page.clock.fastForward(60001);
  await expect(card.locator(".inspiration-text")).not.toHaveText(first);
  await card
    .getByLabel("Частота зміни цікавинок", { exact: true })
    .selectOption("0");
  const manual = await card.locator(".inspiration-text").innerText();
  await page.clock.fastForward(120001);
  await expect(card.locator(".inspiration-text")).toHaveText(manual);
  await card.getByRole("button", { name: "Наступна цікавинка" }).click();
  await expect(card.locator(".inspiration-text")).not.toHaveText(manual);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "/tmp/dayframe-today-mobile.png",
    fullPage: true,
  });
  await page.reload();
  await page
    .locator(".mobile-nav")
    .getByRole("button", { name: "Сьогодні", exact: true })
    .click();
  await expect(
    card.getByLabel("Частота зміни цікавинок", { exact: true }),
  ).toHaveValue("0");
});
test("weather location changes from search and errors do not show invented weather", async ({
  page,
}) => {
  await page.route("https://geocoding-api.open-meteo.com/**", (route) =>
    route.fulfill({
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
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Сьогодні", exact: true })
    .click();
  const card = page.getByRole("article", { name: "Погода" });
  await card.getByRole("button", { name: "Київ", exact: true }).click();
  await card.getByLabel("Місто", { exact: true }).fill("Львів");
  await card.getByRole("button", { name: "Знайти місто", exact: true }).click();
  await card
    .getByRole("button", { name: "Львів, Україна", exact: true })
    .click();
  await expect(
    card.getByRole("button", { name: "Львів, Україна", exact: true }),
  ).toBeVisible();
  await expect(card.locator(".weather-temp")).toHaveText("3°");
  await page.route("https://api.open-meteo.com/**", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await card
    .getByRole("button", { name: "Оновити погоду", exact: true })
    .click();
  await expect(card).toContainText("попередні дані");
  await expect(card.locator(".weather-temp")).toHaveText("3°");
});

test("year overview reads connected calendars beyond the current month in bounded requests", async ({
  page,
}) => {
  const year = new Date().getFullYear();
  const target = `${year}-12-20`;
  const windows: { start: number; end: number }[] = [];
  await page.route("**/api/status", (route) =>
    route.fulfill({
      json: {
        providers: [
          {
            id: "google",
            name: "Календар Google",
            configured: true,
            connected: true,
          },
        ],
        disabled: [],
        sessionStorage: "memory",
        sessionHours: 8,
      },
    }),
  );
  await page.route("**/api/calendar/google?*", (route) => {
    const url = new URL(route.request().url());
    const start = Date.parse(url.searchParams.get("start")!);
    const end = Date.parse(url.searchParams.get("end")!);
    windows.push({ start, end });
    const at = Date.parse(target + "T12:00:00Z");
    return route.fulfill({
      json: {
        events:
          at >= start && at < end
            ? [
                {
                  id: "year-event",
                  title: "Зустріч наприкінці року",
                  source: "Google",
                  date: target,
                  start: "14:00",
                  end: "15:00",
                  location: "",
                  participants: [],
                  reminder: false,
                },
              ]
            : [],
      },
    });
  });
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Сьогодні", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Період огляду" })
    .getByRole("button", { name: "Рік", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Плани на обраний період" })
      .getByRole("button", { name: "Зустріч наприкінці року", exact: false }),
  ).toBeVisible();
  expect(
    windows.every((w) => w.end > w.start && w.end - w.start <= 62 * 86400000),
  ).toBeTruthy();
  expect(
    windows.some(
      (w) =>
        new Date(w.start).toLocaleDateString("sv-SE", {
          timeZone: "Europe/Kyiv",
        }) === `${year}-01-01`,
    ),
  ).toBeTruthy();
});

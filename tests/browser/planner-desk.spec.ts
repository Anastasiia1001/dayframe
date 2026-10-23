import { test, expect } from "@playwright/test";
const today = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Kyiv",
}).format(new Date());
test.beforeEach(async ({ page }) => {
  await page.route("https://api.open-meteo.com/**", (r) =>
    r.fulfill({
      json: {
        current: {
          temperature_2m: 5,
          apparent_temperature: 2,
          weather_code: 73,
          is_day: 1,
        },
      },
    }),
  );
});
async function open(page: any) {
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Сьогодні", exact: true })
    .click();
}
test("tracker records daily weekly monthly quarterly and yearly habits and restores after reload", async ({
  page,
}) => {
  await open(page);
  const tracker = page.getByRole("region", { name: "Трекер звичок" });
  await tracker.getByLabel("Нова звичка", { exact: true }).fill("Читати");
  await tracker
    .getByRole("button", { name: "Додати звичку", exact: true })
    .click();
  const daily = tracker.getByRole("region", { name: "Щодня: відмітки" });
  await daily.locator("input[type=checkbox]").first().check();
  await tracker.getByLabel("Нова звичка", { exact: true }).fill("Прогулянка");
  await tracker.getByLabel("Як часто", { exact: true }).selectOption("monthly");
  await tracker
    .getByRole("button", { name: "Додати звичку", exact: true })
    .click();
  await tracker
    .getByLabel("Прогулянка: Січ " + today.slice(0, 4), { exact: true })
    .check();
  await page.reload();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Сьогодні", exact: true })
    .click();
  await expect(daily.locator("input[type=checkbox]").first()).toBeChecked();
  await expect(
    tracker.getByLabel("Прогулянка: Січ " + today.slice(0, 4), { exact: true }),
  ).toBeChecked();
  await tracker
    .getByRole("button", { name: "Наступний тиждень трекера" })
    .click();
  await expect(daily.locator("input[type=checkbox]").first()).not.toBeChecked();
  await tracker
    .getByRole("button", { name: "Попередній тиждень трекера" })
    .click();
  await expect(daily.locator("input[type=checkbox]").first()).toBeChecked();
});
test("real pointer drag schedules a backlog task for Today and completion retains its contents", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "dayframe-tasks",
      JSON.stringify([
        {
          id: "drag-plan",
          title: "Місячна справа",
          category: "Month",
          date: "",
          inBacklog: true,
          planningHorizon: "month",
          recurrence: "once",
          priority: "Normal",
          notes: "Нотатки лишаються",
          completed: false,
          disabled: false,
        },
      ]),
    ),
  );
  await open(page);
  const board = page.getByRole("region", { name: "Дошка завдань на сьогодні" });
  await board.scrollIntoViewIfNeeded();
  const handle = board.getByRole("button", {
    name: "Перетягнути: Місячна справа",
  });
  const a = await handle.boundingBox();
  const target = board.locator("[data-planner-column=today]");
  const b = await target.boundingBox();
  await page.mouse.move(a!.x + a!.width / 2, a!.y + a!.height / 2);
  await page.mouse.down();
  await page.mouse.move(b!.x + b!.width / 2, b!.y + 70, { steps: 15 });
  await page.mouse.up();
  await expect(
    target.getByText("Місячна справа", { exact: true }),
  ).toBeVisible();
  await board
    .getByLabel("Перемістити: Місячна справа", { exact: true })
    .selectOption("done");
  await expect(
    board
      .locator("[data-planner-column=done]")
      .getByText("Місячна справа", { exact: true }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("dayframe-tasks")!).find(
      (t: any) => t.id === "drag-plan",
    ),
  );
  expect(saved.completed).toBe(true);
  expect(saved.date).toBe(today);
  expect(saved.notes).toBe("Нотатки лишаються");
});
test("care check-in and independent inspiration persist while ChatGPT only receives the typed question", async ({
  page,
}) => {
  await open(page);
  const care = page.getByRole("region", { name: "Турбота про себе" });
  await care.getByRole("button", { name: "Втомлено", exact: true }).click();
  await care
    .getByLabel("Місце для думок", { exact: true })
    .fill("Приватний запис");
  await expect(care).toContainText("Не обов’язково зараз бути продуктивною");
  await expect(
    page.getByRole("article", { name: "Афірмації", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Цікавинки", exact: true }),
  ).toBeVisible();
  let requestBody = "",
    authorization = "";
  await page.route("https://api.openai.com/v1/responses", (route) => {
    requestBody = route.request().postData() || "";
    authorization = route.request().headers()["authorization"];
    return route.fulfill({
      json: {
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: "Можемо почати з однієї важливої справи.",
              },
            ],
          },
        ],
      },
    });
  });
  const chat = page.getByRole("region", { name: "Запитати ChatGPT" });
  await chat
    .getByLabel("API-ключ OpenAI", { exact: true })
    .fill("sk-personal-test-only");
  await chat
    .getByLabel("Питання для ChatGPT", { exact: true })
    .fill("Як спланувати день?");
  await chat
    .getByRole("button", { name: "Надіслати помічнику", exact: true })
    .click();
  await expect(chat.getByRole("log")).toContainText(
    "Можемо почати з однієї важливої справи.",
  );
  expect(authorization).toBe("Bearer sk-personal-test-only");
  expect(requestBody).toContain("Як спланувати день?");
  expect(requestBody).not.toContain("Приватний запис");
  expect(JSON.parse(requestBody).store).toBe(false);
  expect(
    await page.evaluate(() => JSON.stringify({ ...localStorage })),
  ).not.toContain("sk-personal-test-only");
  await page.reload();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Сьогодні", exact: true })
    .click();
  await expect(
    care.getByRole("button", { name: "Втомлено", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(chat.getByLabel("API-ключ OpenAI", { exact: true })).toHaveValue(
    "",
  );
  await expect(care.getByLabel("Місце для думок")).toHaveValue(
    "Приватний запис",
  );
});

test("mascot reminds about an actual task and snoozes it for fifteen minutes", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-23T07:00:00Z") });
  await page.addInitScript(() =>
    localStorage.setItem(
      "dayframe-tasks",
      JSON.stringify([
        {
          id: "remind-one",
          title: "Моя найближча справа",
          category: "Day",
          date: "2026-10-23",
          scheduledStart: "10:20",
          reminderMinutes: 30,
          scheduledDuration: 30,
          recurrence: "once",
          priority: "Normal",
          notes: "",
          completed: false,
          disabled: false,
        },
      ]),
    ),
  );
  await open(page);
  const companion = page.locator(".cozy-note");
  await expect(companion).toContainText("Моя найближча справа");
  await companion.getByRole("button", { name: "Нагадати за 15 хв" }).click();
  await expect(companion).not.toContainText("Моя найближча справа");
  await page.clock.fastForward(15 * 60000 + 1);
  await expect(companion).toContainText("Моя найближча справа");
  await companion.getByRole("button", { name: "Відкрити справу" }).click();
  await expect(
    page.getByRole("dialog", { name: "Особисте завдання", exact: true }),
  ).toBeVisible();
});

test("month rail changes the real calendar month without breaking the selected theme", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Календар", exact: true })
    .click();
  const rail = page.getByRole("navigation", { name: /Місяці планера/ });
  const january = rail.getByRole("button", { name: /Перейти: січень/ });
  await january.click();
  await expect(january).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".studio-month-grid")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Місяць", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("touch dragging moves a plan into Today on a phone", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    timezoneId: "Europe/Kyiv",
  });
  const page = await context.newPage();
  await page.addInitScript(() =>
    localStorage.setItem(
      "dayframe-tasks",
      JSON.stringify([
        {
          id: "touch-plan",
          title: "План для пальчика",
          category: "Month",
          date: "",
          inBacklog: true,
          planningHorizon: "month",
          recurrence: "once",
          priority: "Normal",
          notes: "",
          completed: false,
          disabled: false,
        },
      ]),
    ),
  );
  await page.route("https://api.open-meteo.com/**", (r) =>
    r.fulfill({
      json: {
        current: {
          temperature_2m: 8,
          apparent_temperature: 6,
          weather_code: 61,
          is_day: 1,
        },
      },
    }),
  );
  await page.goto(baseURL!);
  await page
    .locator(".mobile-nav")
    .getByRole("button", { name: "Сьогодні", exact: true })
    .click();
  const board = page.getByRole("region", { name: "Дошка завдань на сьогодні" });
  await board.evaluate((el) => el.scrollIntoView({ block: "start" }));
  const a = await board
    .getByRole("button", { name: "Перетягнути: План для пальчика" })
    .boundingBox();
  const target = board.locator("[data-planner-column=today]");
  const b = await target.boundingBox();
  if (!a || !b) throw Error("Missing touch targets");
  const cdp = await context.newCDPSession(page);
  const x = a.x + a.width / 2,
    y = a.y + a.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let i = 1; i <= 15; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: x + ((b.x + 50 - x) * i) / 15, y: y + ((b.y + 65 - y) * i) / 15 },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(
    target.getByText("План для пальчика", { exact: true }),
  ).toBeVisible();
  await context.close();
});

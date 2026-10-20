import { uk } from "../../src/locale";
import { test, expect, type Page } from "@playwright/test";
const date = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Kyiv",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const status = {
  providers: [
    {
      id: "outlook-work",
      name: "Outlook · Робочий",
      configured: true,
      connected: true,
    },
    {
      id: "outlook-personal",
      name: "Outlook · Особистий",
      configured: true,
      connected: false,
    },
    {
      id: "google",
      name: "Календар Google",
      configured: true,
      connected: true,
    },
    { id: "slack", name: "Slack", configured: true, connected: true },
  ],
  disabled: ["Jira", "Confluence"],
  sessionStorage: "memory",
  sessionHours: 8,
};
const calendarEvent = (
  id: string,
  title: string,
  source: string,
  externalUid?: string,
) => ({
  id,
  title,
  source,
  date,
  start: "11:00",
  end: "12:00",
  location: "Team call",
  participants: ["Maya"],
  reminder: true,
  externalUid,
});
async function go(page: Page, name: string) {
  const nav =
    page.viewportSize()!.width <= 700
      ? page.locator(".mobile-nav")
      : page.locator(".sidebar");
  await nav
    .getByRole("button", {
      name: new RegExp("^" + uk(name) + "(?:\\s*\\d+)?$"),
    })
    .click();
}
async function demo(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem("dayframe-data-mode", JSON.stringify("demo")),
  );
  await page.goto("/");
  await expect(
    page.getByText("Щоденна зустріч команди", { exact: true }),
  ).toBeVisible();
}
test("live defaults never imply fake connections; unsupported work sources stay disabled", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Власні дані", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Події на сьогодні не завантажено.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("GAME-89322", { exact: false })).toHaveCount(0);
  await go(page, "Settings");
  await expect(
    page.locator(".connection-state").filter({ hasText: "Не підключено" }),
  ).toHaveCount(4);
  await expect(page.locator(".connection-card a")).toHaveCount(0);
  await expect(
    page.getByText("Вимкнено · немає доступу", { exact: true }),
  ).toHaveCount(2);
  await go(page, "Work");
  await expect(
    page.getByText("Дані Slack не завантажено.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".period-tabs")).toHaveCount(0);
});
test("task CRUD, completion and preferences persist across reloads", async ({
  page,
}) => {
  await demo(page);
  await page.locator(".quick-add").click();
  await page
    .getByLabel("Назва", { exact: true })
    .fill("Записатися до стоматолога");
  await page.getByLabel("Повторення", { exact: true }).selectOption("Щороку");
  await page.getByRole("button", { name: "Зберегти завдання" }).click();
  await page
    .getByLabel("Виконати Записатися до стоматолога", { exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Маленька перемога" }),
  ).toBeVisible();
  await page.reload();
  await go(page, "Personal");
  await expect(
    page.getByLabel("Позначити невиконаним Записатися до стоматолога", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Редагувати Записатися до стоматолога", { exact: true })
    .click();
  await page
    .getByLabel("Назва", { exact: true })
    .fill("Записатися до стоматолога на огляд");
  await page.getByRole("button", { name: "Зберегти завдання" }).click();
  await page
    .getByLabel("Перенести Записатися до стоматолога на огляд", { exact: true })
    .click();
  await page
    .getByLabel("Видалити Записатися до стоматолога на огляд", { exact: true })
    .click();
  await expect(
    page.getByText("Записатися до стоматолога на огляд", { exact: true }),
  ).toHaveCount(0);
  await go(page, "Settings");
  await page.getByRole("button", { name: "Цвітіння", exact: true }).click();
  await page
    .getByLabel("Показувати маленького помічника", { exact: false })
    .uncheck();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "Blossom");
  await expect(page.getByLabel("Трохи підтримки")).toHaveCount(0);
});
test("connected live accounts use actual adapters, deduplicate events, and isolate provider failure", async ({
  page,
}) => {
  let failGoogle = false;
  await page.route("**/api/status", (r) => r.fulfill({ json: status }));
  await page.route("**/api/calendar/outlook-work?*", (r) => {
    expect(["Europe/Kiev", "Europe/Kyiv"]).toContain(
      new URL(r.request().url()).searchParams.get("timeZone"),
    );
    return r.fulfill({
      json: {
        events: [
          calendarEvent(
            "o1",
            "Shared design review",
            "Outlook",
            "shared-event",
          ),
        ],
      },
    });
  });
  await page.route("**/api/calendar/google?*", (r) =>
    r.fulfill(
      failGoogle
        ? { status: 503, json: { error: "Календар тимчасово недоступний" } }
        : {
            json: {
              events: [
                calendarEvent(
                  "g1",
                  "Shared design review",
                  "Google",
                  "shared-event",
                ),
                calendarEvent("g2", "Piano lesson", "Google"),
              ],
            },
          },
    ),
  );
  await page.route("**/api/slack?*", (r) =>
    r.fulfill({
      json: {
        items: [
          {
            id: "s1",
            group: "Direct mentions",
            channel: "product",
            author: "Maya",
            summary: "Please review the new navigation",
            why: "Тебе згадали особисто.",
            time: new Date().toISOString(),
          },
        ],
        truncated: false,
      },
    }),
  );
  await page.goto("/");
  await expect(page.locator(".event-info strong")).toHaveCount(2);
  await expect(
    page
      .locator(".event-info strong")
      .filter({ hasText: "Shared design review" }),
  ).toHaveCount(1);
  await expect(
    page
      .locator(".digest-toggle")
      .getByText("Please review the new navigation", { exact: true }),
  ).toBeVisible();
  failGoogle = true;
  await page
    .locator(".workspace-toolbar")
    .getByRole("button", { name: "Оновити", exact: true })
    .click();
  await expect(page.locator(".workspace-alert")).toContainText(
    "Календар Google: Календар тимчасово недоступний",
  );
  await expect(page.locator(".event-info strong")).toHaveCount(1);
  await expect(page.locator(".event-info strong")).toHaveText(
    "Shared design review",
  );
});
test("static site explains its limitation and can enter clearly labelled demo", async ({
  page,
}) => {
  await page.route("**/api/status", (r) =>
    r.fulfill({
      status: 404,
      contentType: "text/html",
      body: "<h1>Not found</h1>",
    }),
  );
  await page.goto("/");
  await expect(page.locator(".workspace-alert")).toContainText(
    "Для реальних підключень потрібен сервер Dayframe",
  );
  await go(page, "Settings");
  await page
    .getByRole("button", { name: "Спробувати деморежим", exact: true })
    .click();
  await go(page, "Today");
  await expect(
    page.getByText("Демонстраційні дані", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Щоденна зустріч команди", { exact: true }),
  ).toBeVisible();
});
for (const width of [320, 390, 768])
  test(`readable layouts and navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await demo(page);
    for (const name of ["Today", "Calendar", "Work", "Personal", "Settings"]) {
      await go(page, name);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    }
    await go(page, "Today");
    expect(
      await page
        .locator(".event-info strong")
        .first()
        .evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
    ).toBeGreaterThanOrEqual(15);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await page
        .locator(".bunny-eyes")
        .evaluate((e) => getComputedStyle(e).animationName),
    ).toBe("none");
  });
test("search, calendar filters and keyboard dismissal work", async ({
  page,
}) => {
  await demo(page);
  await page.locator(".search-trigger").click();
  await page
    .getByPlaceholder("Пошук серед подій, повідомлень і завдань…")
    .fill("Щоденна зустріч команди");
  await expect(
    page
      .locator(".search-results")
      .getByText("Щоденна зустріч команди", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await go(page, "Calendar");
  await page.getByRole("button", { name: "Місяць", exact: true }).click();
  await expect(page.locator(".calendar-cell")).toHaveCount(42);
  await page.getByLabel("Outlook", { exact: true }).uncheck();
  await expect(
    page.locator(".calendar-event").filter({ hasText: "Outlook" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Наступний період" }).click();
  await expect(page.locator(".calendar-event")).toHaveCount(0);
});

test("switching from demo to live never presents demo events as account data", async ({
  page,
}) => {
  await demo(page);
  let release;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/status", async (r) => {
    await gate;
    await r.fulfill({
      json: {
        ...status,
        providers: status.providers.map((p) => ({ ...p, connected: false })),
      },
    });
  });
  await go(page, "Settings");
  await page
    .getByRole("button", { name: "Використовувати власні дані", exact: true })
    .click();
  await go(page, "Today");
  await expect(page.getByText("Власні дані", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Щоденна зустріч команди", { exact: true }),
  ).toHaveCount(0);
  release();
  await expect(
    page.getByText("Події на сьогодні не завантажено.", { exact: false }),
  ).toBeVisible();
});

test("Ukrainian labels preserve saved task keys and user-written content", async ({
  page,
}) => {
  await page.addInitScript(
    ({ date }) => {
      localStorage.setItem("dayframe-data-mode", JSON.stringify("demo"));
      localStorage.setItem(
        "dayframe-tasks",
        JSON.stringify([
          {
            id: "Day-0",
            title: "Water the plants",
            category: "Day",
            date,
            recurrence: "daily",
            priority: "Normal",
            notes: "My personal note",
            completed: true,
            completedOn: date,
            disabled: false,
          },
          {
            id: "my-own-task",
            title: "My own English title",
            category: "Day",
            date,
            recurrence: "once",
            priority: "High",
            notes: "",
            completed: false,
            disabled: false,
          },
        ]),
      );
    },
    { date },
  );
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "uk");
  await expect(
    page.getByRole("button", {
      name: "Позначити невиконаним Полити рослини",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("My own English title", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".date-eyebrow")).toContainText(/[А-Яа-яІіЇїЄє]/);
  const tasks = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("dayframe-tasks")!),
  );
  expect(tasks[0]).toMatchObject({
    id: "Day-0",
    title: "Полити рослини",
    category: "Day",
    recurrence: "daily",
    priority: "Normal",
    notes: "My personal note",
    completed: true,
  });
  await page.locator(".quick-add").click();
  await page.getByLabel("Назва", { exact: true }).fill("Завдання українською");
  await page.getByLabel("Повторення", { exact: true }).selectOption("custom");
  await page.getByLabel("Повторювати кожні (днів)", { exact: true }).fill("3");
  await page
    .getByRole("button", { name: "Зберегти завдання", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("dayframe-tasks")!).find(
        (t) => t.title === "Завдання українською",
      ),
    ),
  ).toMatchObject({ recurrence: "custom", customDays: 3, category: "Day" });
  await page
    .getByLabel("Категорія огляду", { exact: true })
    .selectOption("My team");
  await expect(page.locator(".digest-meta strong")).toHaveText("Моя команда");
  await go(page, "Settings");
  await page
    .getByLabel("Типове повторення", { exact: false })
    .selectOption("monthly");
  await page.reload();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("dayframe-prefs")!).defaultRecurrence,
    ),
  ).toBe("monthly");
});

test("new palettes and all companions can be selected, persisted and celebrated", async ({
  page,
}) => {
  await demo(page);
  await go(page, "Settings");
  for (const [name, id] of [
    ["Полуничне молочко", "Strawberry"],
    ["Фісташкове печиво", "Pistachio"],
    ["Персиковий зефір", "Peach"],
    ["Чорнична хмаринка", "Blueberry"],
    ["М’ятна лагуна", "Lagoon"],
    ["Місячна казка", "Moonlight"],
  ]) {
    const button = page.getByRole("button", { name, exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", id);
  }
  for (const [name, id] of [
    ["Зайчик Пух", "bunny"],
    ["Киця Мур", "cat"],
    ["Лисичка Іскра", "fox"],
    ["Ведмедик Медок", "bear"],
    ["Жабка М’ята", "frog"],
    ["Зірочка Сяйка", "star"],
  ]) {
    const button = page.getByRole("button", { name: new RegExp("^" + name) });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".cozy-note .mascot-" + id)).toBeVisible();
  }
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "Moonlight");
  await expect(page.locator(".cozy-note .mascot-star")).toBeVisible();
  await go(page, "Today");
  await page
    .getByRole("button", { name: "Виконати Полити рослини", exact: true })
    .click();
  await expect(page.locator(".companion-celebrating")).toBeVisible();
  await expect(page.locator(".happy-petals>span")).toHaveCount(14);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".cozy-note .mascot-body")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await page.setViewportSize({ width: 320, height: 844 });
  await go(page, "Settings");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

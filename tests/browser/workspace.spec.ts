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
    page.getByText("Додай календар — решта вже під рукою", { exact: true }),
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
  await page.locator(".completed-group summary").filter({hasText:"Показати виконані"}).click();
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
    .getByLabel("Позначити невиконаним Записатися до стоматолога на огляд", {
      exact: true,
    })
    .click();
  await page.locator(".planning-card").filter({hasText:"Записатися до стоматолога на огляд"}).getByRole("button", {name:"На завтра",exact:true}).click();

  const postponed = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("dayframe-tasks")!).find(
      (t) => t.title === "Записатися до стоматолога на огляд",
    ),
  );
  expect(postponed.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  const expectedDate = new Date(date + "T12:00:00");
  expectedDate.setDate(expectedDate.getDate() + 1);
  expect(postponed.date).toBe(
    `${expectedDate.getFullYear()}-${String(expectedDate.getMonth() + 1).padStart(2, "0")}-${String(expectedDate.getDate()).padStart(2, "0")}`,
  );
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
      .locator(".attention-item")
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
  await expect(page.locator(".connect-strip")).toBeVisible();
  await go(page, "Settings");
  await expect(page.locator(".workspace-alert")).toContainText(
    "Для реальних підключень потрібен сервер Dayframe",
  );
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
    page.getByText("Додай календар — решта вже під рукою", { exact: true }),
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
  await page.locator(".today-completed summary").click();
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
  await go(page, "Work");
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
    await expect(
      page.locator(".mascot-choice[aria-pressed=true] .mascot-" + id),
    ).toBeVisible();
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

test("household templates stay outside active tasks and are scheduled explicitly", async ({
  page,
}) => {
  await demo(page);
  await go(page, "Personal");
  await expect(page.getByRole("tab")).toHaveCount(0);
  const backlog = page.getByRole("region", {name:"Місяць",exact:true});
  const tomorrowColumn = page.getByRole("region", {name:"День",exact:true});
  const card = backlog.locator(".planning-card").filter({hasText:"Помити холодильник"});
  await card.getByRole("button", {name:"На завтра",exact:true}).click();
  await expect(card).toBeVisible();
  await expect(tomorrowColumn.getByRole("button", {name:"Помити холодильник",exact:true})).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("dayframe-tasks")!).filter((t: {title:string}) => t.title === "Помити холодильник"));
  expect(saved).toHaveLength(2);
  expect(saved.find((t: {isTemplate?:boolean}) => !t.isTemplate)).toMatchObject({recurrence:"monthly",isTemplate:false,inBacklog:false});
  await page.reload();
  await go(page,"Personal");
  await expect(page.getByRole("region", {name:"День",exact:true}).getByRole("button", {name:"Помити холодильник",exact:true})).toBeVisible();
});

test("calendar supports timed overlaps, date navigation, month overflow and event details", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("dayframe-data-mode", JSON.stringify("live")),
  );
  await page.route("**/api/status", (r) => r.fulfill({ json: status }));
  await page.route("**/api/slack?*", (r) =>
    r.fulfill({ json: { items: [], truncated: false } }),
  );
  await page.route("**/api/calendar/google?*", (r) =>
    r.fulfill({ json: { events: [] } }),
  );
  await page.route("**/api/calendar/outlook-work?*", (r) =>
    r.fulfill({
      json: {
        events: [
          calendarEvent("a", "Планування", "Outlook"),
          {
            ...calendarEvent("b", "Дизайн-рев’ю", "Outlook"),
            start: "11:30",
            end: "12:30",
          },
          {
            ...calendarEvent("c", "Особиста зустріч", "Outlook"),
            start: "14:00",
            end: "14:30",
          },
        ],
      },
    }),
  );
  await page.goto("/");
  await go(page, "Calendar");
  await expect(page.locator(".timed-event")).toHaveCount(3);
  const rectangles = await page.locator(".timed-event").evaluateAll((nodes) =>
    nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return { x: r.x, width: r.width, y: r.y };
    }),
  );
  expect(rectangles[1].x).toBeGreaterThan(rectangles[0].x);
  expect(rectangles[1].y).toBeGreaterThan(rectangles[0].y);
  await page
    .locator(".timed-event")
    .filter({ hasText: "Дизайн-рев’ю" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("11:30–12:30");
  await expect(page.getByRole("link", { name: "Приєднатися" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Місяць", exact: true }).click();
  await expect(page.locator(".calendar-cell")).toHaveCount(42);
  await page.locator(".calendar-cell.is-today .month-more").click();
  await expect(
    page.getByRole("button", { name: "День", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".timed-event")).toHaveCount(3);
  await page.getByLabel("Перейти до дати").fill("2026-01-31");
  await page.getByRole("button", { name: "Місяць", exact: true }).click();
  await page.getByRole("button", { name: "Наступний період" }).click();
  await expect(page.getByLabel("Перейти до дати")).toHaveValue("2026-02-28");
});

test("Slack suggestions become concrete tasks only after the user supplies a title", async ({
  page,
}) => {
  await demo(page);
  await go(page, "Work");
  await page.locator(".digest-toggle").first().click();
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem("dayframe-tasks")!).length,
  );
  await page
    .getByRole("button", { name: "Додати до завдань", exact: true })
    .click();
  await expect(page.getByLabel("Назва", { exact: true })).toHaveValue("");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("dayframe-tasks")!).length,
    ),
  ).toBe(before);
  await page
    .getByLabel("Назва", { exact: true })
    .fill("Перевірити екран нагород перед зустріччю");
  await page
    .getByRole("button", { name: "Зберегти завдання", exact: true })
    .click();
  await go(page, "Personal");
  const task = page
    .locator(".planning-card")
    .filter({ hasText: "Перевірити екран нагород перед зустріччю" });
  await expect(task).toContainText("Додано зі Slack");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("dayframe-tasks")!).length,
    ),
  ).toBe(before + 1);
});

// These regression scenarios exercise the retained classic planner and dashboard.
test.beforeEach(async ({page}) => { await page.addInitScript(() => {
  localStorage.setItem("dayframe-classic-planner", "true");
  if (!localStorage.getItem("dayframe-calendar-view")) localStorage.setItem("dayframe-calendar-view", JSON.stringify("Day"));
}); });

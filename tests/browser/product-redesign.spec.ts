import { test, expect } from "@playwright/test";
const date = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Kyiv" }).format(
    new Date(),
  );
const base = {
  category: "Day",
  recurrence: "once",
  priority: "Normal",
  notes: "",
  completed: false,
  disabled: false,
  sectionId: "personal",
};
const seeds = () => [
  ...Array.from({ length: 4 }, (_, i) => ({
    ...base,
    id: "focus-" + i,
    title: "Посильна справа " + i,
    date: date(),
  })),
  {
    ...base,
    id: "hidden",
    title: "Прихована робоча справа",
    sectionId: "work",
    date: date(),
  },
  {
    ...base,
    id: "plan",
    title: "План на місяць",
    date: "",
    inBacklog: true,
    planningHorizon: "month",
  },
  {
    ...base,
    id: "template",
    title: "Річний шаблон",
    date: "",
    isTemplate: true,
    planningHorizon: "year",
    category: "Year",
  },
];
test.beforeEach(async ({ page }) => {
  await page.addInitScript((tasks) => {
    if (!localStorage.getItem("dayframe-tasks")) {
      localStorage.setItem("dayframe-tasks", JSON.stringify(tasks));
      localStorage.setItem("dayframe-calendar-view", JSON.stringify("Week"));
      localStorage.setItem("dayframe-calendar-right", "true");
      localStorage.setItem(
        "dayframe-sections",
        JSON.stringify([
          { id: "personal", name: "Особисте", color: "#af653e", visible: true },
          { id: "work", name: "Робота", color: "#795875", visible: false },
        ]),
      );
    }
  }, seeds());
});
test("calendar starts within the top quarter with one navigation and preserves focused and hidden records", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/");
  const box = await page.locator(".studio-week").boundingBox();
  expect(box!.y).toBeLessThanOrEqual(225);
  expect(box!.width).toBeGreaterThanOrEqual(780);
  await expect(page.locator(".studio-navigation")).toHaveCount(0);
  await expect(page.locator(".planner-month-rail")).toHaveCount(0);
  const context = page.getByRole("region", { name: "Контекст дня" });
  await context
    .getByRole("button", { name: "Головне: Посильна справа 0", exact: true })
    .click();
  await context.getByRole("button", { name: "Обрати головні справи" }).click();
  for (const i of [1, 2])
    await context
      .getByRole("button", {
        name: `Головне: Посильна справа ${i}`,
        exact: true,
      })
      .click();
  await context
    .getByRole("button", { name: "Головне: Посильна справа 3", exact: true })
    .click();
  await expect(context.getByRole("status")).toContainText("трьох");
  await context
    .getByRole("checkbox", { name: "Виконано: Посильна справа 0", exact: true })
    .check();
  await page.reload();
  const tasks = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("dayframe-tasks")!),
  );
  expect(tasks).toHaveLength(7);
  expect(tasks.find((t: any) => t.id === "hidden")).toBeTruthy();
  expect(tasks.find((t: any) => t.id === "template").isTemplate).toBe(true);
  expect(tasks.filter((t: any) => t.focusDates?.length)).toHaveLength(3);
  expect(tasks.find((t: any) => t.id === "focus-0").completed).toBe(true);
  const sport = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("dayframe-sections")!).filter(
      (s: any) => s.id === "sport",
    ),
  );
  expect(sport).toHaveLength(1);
});
test("plans use explicit scheduling without unexpected copies and theme gallery returns focus", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Плани", exact: true })
    .click();
  await expect(page.locator(".studio-scope-group[open]")).toHaveCount(1);
  const group = page
    .locator(".studio-scope-group")
    .filter({ has: page.locator("summary").filter({ hasText: "Місяць" }) });
  await group.locator("summary").click();
  await page
    .getByRole("button", { name: "Запланувати План на місяць", exact: true })
    .click();
  const editor = page.getByRole("dialog", { name: "Редактор запису" });
  await editor.getByLabel("Початок події").fill("09:00");
  await editor.getByLabel("Початок події").fill("10:00");
  await editor.getByRole("button", { name: "Зберегти", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("dayframe-tasks")!).find(
            (t: any) => t.id === "plan",
          ).inBacklog,
      ),
    )
    .toBe(false);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("dayframe-tasks")!).length,
    ),
  ).toBe(7);
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Календар", exact: true })
    .click();
  await expect(page.locator(".studio-event-main")).toContainText(
    "План на місяць",
  );
  const trigger = page.getByRole("button", {
    name: "Оформлення планера",
    exact: true,
  });
  await trigger.click();
  const gallery = page.getByRole("dialog", { name: "Теми оформлення" });
  await gallery.locator("[data-theme-id=Moonlight]").click();
  await expect(gallery).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
test("mobile week stays readable, quick creation preserves notes and global search opens the day", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".studio-time-day")).toHaveCount(1);
  await expect(
    page.getByRole("navigation", { name: "Дні тижня" }).getByRole("button"),
  ).toHaveCount(7);
  await page.getByLabel("Показати або сховати панель дня").click();
  await page
    .getByLabel("Нотатки дня", { exact: true })
    .fill("Мій затишний референс");
  await page.getByLabel("Згорнути панель дня").click();
  await page.locator(".search-trigger").click();
  await page
    .getByPlaceholder("Пошук серед подій, повідомлень і завдань…")
    .fill("Мій затишний референс");
  await page.locator(".search-results").getByRole("button").click();
  await expect(page.getByLabel("Нотатки дня", { exact: true })).toHaveValue(
    "Мій затишний референс",
  );
  await page.getByLabel("Згорнути панель дня").click();
  await page.getByRole("button", { name: "Додати", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Редактор запису" });
  await editor
    .getByLabel("Назва", { exact: true })
    .fill("Довга українська справа для перевірки збереження");
  await editor.getByRole("button", { name: "Зберегти", exact: true }).click();
  await page.reload();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("dayframe-tasks")!).some((t: any) =>
        t.title.includes("Довга українська"),
      ),
    ),
  ).toBe(true);
});
test("fresh installs have no automatic obligations, global quick editor closes and restores focus", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const p = await context.newPage();
  await p.goto("http://localhost:" + (process.env.DAYFRAME_TEST_PORT || 4317));
  expect(
    await p.evaluate(() => JSON.parse(localStorage.getItem("dayframe-tasks")!)),
  ).toEqual([]);
  await p
    .locator(".sidebar")
    .getByRole("button", { name: "Сьогодні", exact: true })
    .click();
  const trigger = p.getByRole("button", { name: "Швидко додати справу" });
  await trigger.click();
  await p.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  const editor = p.getByRole("dialog", { name: "Особисте завдання" });
  await editor
    .getByLabel("Назва", { exact: true })
    .fill("Пити чай без поспіху");
  await editor.getByRole("button", { name: "Зберегти", exact: true }).click();
  await p.reload();
  expect(
    await p.evaluate(
      () => JSON.parse(localStorage.getItem("dayframe-tasks")!).length,
    ),
  ).toBe(1);
  await context.close();
});

test("failed local save keeps the draft and retry creates only one record", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Сьогодні", exact: true })
    .click();
  await page.getByRole("button", { name: "Швидко додати справу" }).click();
  const editor = page.getByRole("dialog", { name: "Особисте завдання" });
  await editor
    .getByLabel("Назва", { exact: true })
    .fill("Чернетка не губиться");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    (window as any).restoreStorage = () => {
      Storage.prototype.setItem = original;
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === "dayframe-tasks")
        throw new DOMException("Full", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await editor.getByRole("button", { name: "Зберегти", exact: true }).click();
  await expect(editor).toBeVisible();
  await expect(editor.getByRole("alert")).toBeVisible();
  await expect(editor.getByLabel("Назва", { exact: true })).toHaveValue(
    "Чернетка не губиться",
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("dayframe-tasks")!).length,
    ),
  ).toBe(7);
  await page.evaluate(() => (window as any).restoreStorage());
  await editor.getByRole("button", { name: "Зберегти", exact: true }).click();
  await expect(editor).not.toBeVisible();
  await page.reload();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("dayframe-tasks")!).filter(
          (t: any) => t.title === "Чернетка не губиться",
        ).length,
    ),
  ).toBe(1);
});

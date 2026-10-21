import { test, expect } from "@playwright/test";
test("daily priorities notes reminders and tasks persist per date and can be edited", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Календар", exact: true })
    .click();
  await page.getByRole("button", { name: "День", exact: true }).click();
  const date = await page.getByLabel("Перейти до дати").inputValue();
  await page
    .getByLabel("Пріоритет 1", { exact: true })
    .fill("Завершити презентацію");
  await page
    .getByRole("button", { name: "Виконати пріоритет 1", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Нотатки дня", exact: true })
    .fill("Думки саме для цього дня");
  await page.getByLabel("Нове нагадування", { exact: true }).fill("Лікар");
  await page.getByLabel("Час нагадування", { exact: true }).fill("14:30");
  await page
    .locator(".reminder-form")
    .getByRole("button", { name: "Додати", exact: true })
    .click();
  await page
    .getByLabel("Текст нагадування Лікар", { exact: true })
    .fill("Зателефонувати лікарю");
  await page
    .getByLabel("Час для Зателефонувати лікарю", { exact: true })
    .fill("15:00");
  await page
    .getByRole("button", { name: "Наступний період", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Нотатки дня", exact: true }),
  ).toHaveValue("");
  await expect(page.getByLabel("Пріоритет 1", { exact: true })).toHaveValue("");
  await page
    .getByRole("button", { name: "Попередній період", exact: true })
    .click();
  await expect(page.getByLabel("Пріоритет 1", { exact: true })).toHaveValue(
    "Завершити презентацію",
  );
  await page.reload();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Календар", exact: true })
    .click();
  await page.getByLabel("Перейти до дати").fill(date);
  await expect(
    page.getByRole("textbox", { name: "Нотатки дня", exact: true }),
  ).toHaveValue("Думки саме для цього дня");
  await expect(
    page.getByLabel("Час для Зателефонувати лікарю", { exact: true }),
  ).toHaveValue("15:00");
  await expect(
    page.getByRole("button", { name: "Повернути пріоритет 1", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("checkbox", {
      name: "Виконати нагадування Зателефонувати лікарю",
      exact: true,
    })
    .check();
  await page
    .getByRole("button", {
      name: "Видалити нагадування Зателефонувати лікарю",
      exact: true,
    })
    .click();
  await expect(page.locator(".daily-reminders li")).toHaveCount(0);
});
for (const width of [320, 390, 1440])
  test(`planner composition and generated assets at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await page
      .locator(width <= 700 ? ".mobile-nav" : ".sidebar")
      .getByRole("button", { name: "Календар", exact: true })
      .click();
    await page.getByRole("button", { name: "День", exact: true }).click();
    expect(
      await page
        .locator(".planner-hero-art")
        .evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0),
    ).toBe(true);
    const boxes = await page.locator(".day-planner-layout").evaluate((el) =>
      Object.fromEntries(
        ["priorities", "schedule", "tasks", "notes", "reminders"].map(
          (name) => {
            const r = el
              .querySelector(`.${name}-sheet`)!
              .getBoundingClientRect();
            return [name, { x: r.x, y: r.y, width: r.width }];
          },
        ),
      ),
    );
    if (width <= 700) {
      expect(boxes.priorities.y).toBeLessThan(boxes.schedule.y);
      expect(boxes.schedule.y).toBeLessThan(boxes.tasks.y);
      expect(boxes.tasks.y).toBeLessThan(boxes.notes.y);
      expect(boxes.notes.y).toBeLessThan(boxes.reminders.y);
    } else {
      expect(boxes.priorities.x).toBeLessThan(boxes.schedule.x);
      expect(boxes.schedule.x).toBeLessThan(boxes.notes.x);
      expect(boxes.schedule.width).toBeGreaterThan(boxes.priorities.width);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

// These regression scenarios exercise the retained classic planner and dashboard.
test.beforeEach(async ({page}) => { await page.addInitScript(() => {
  localStorage.setItem("dayframe-classic-planner", "true");
  if (!localStorage.getItem("dayframe-calendar-view")) localStorage.setItem("dayframe-calendar-view", JSON.stringify("Day"));
}); });

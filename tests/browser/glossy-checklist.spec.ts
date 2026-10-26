import { test, expect } from "@playwright/test";
test("personal checklist and hidden Today blocks persist after reload", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("dayframe-tasks")) {
      localStorage.setItem("dayframe-classic-planner", "true");
      localStorage.setItem(
        "dayframe-tasks",
        JSON.stringify([
          {
            id: "list",
            title: "Домашні справи",
            date: "",
            inBacklog: true,
            category: "Day",
            recurrence: "once",
            priority: "Normal",
            notes: "",
            completed: false,
            disabled: false,
          },
        ]),
      );
    }
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Додати завдання", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: "Особисте завдання" });
  await dialog.getByLabel("Назва", { exact: true }).fill("Перевірка чекліста");
  await dialog.getByRole("button", { name: "+ Додати пункт" }).click();
  await dialog
    .getByLabel("Пункт чекліста", { exact: true })
    .fill("Полити квіти");
  await dialog
    .getByRole("checkbox", { name: "Виконано: Полити квіти" })
    .check();
  await dialog.getByRole("button", { name: "Зберегти завдання" }).click();
  await page.reload();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("dayframe-tasks")!).find(
      (x: { title: string }) => x.title === "Перевірка чекліста",
    ),
  );
  expect(saved.checklist).toEqual([
    { id: expect.any(String), title: "Полити квіти", done: true },
  ]);
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Налаштування/ })
    .click();
  await page.getByRole("switch", { name: "Погода", exact: true }).uncheck();
  await page.reload();
  await expect(page.locator(".weather-card")).toHaveCount(0);
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Налаштування/ })
    .click();
  await expect(
    page.getByRole("switch", { name: "Погода", exact: true }),
  ).not.toBeChecked();
});

test("hover has no spotlight, preserves form positions and theme fonts load locally", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("dayframe-classic-planner", "true"),
  );
  await page.goto("/");
  const card = page.locator(".today-plan");
  await card.scrollIntoViewIfNeeded();
  const before = await card.boundingBox();
  await page.mouse.move(before!.x + before!.width / 2, before!.y - 15);
  await expect(card).not.toHaveAttribute("data-glass-near", "true");
  expect(
    await card.evaluate((el) => getComputedStyle(el).backgroundImage),
  ).not.toContain("radial-gradient");
  const after = await card.boundingBox();
  expect(after).toEqual(before);
  await card
    .getByLabel("Пріоритет дня 1", { exact: true })
    .fill("М’який початок");
  await expect(card.getByLabel("Пріоритет дня 1", { exact: true })).toHaveValue(
    "М’який початок",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.mouse.move(before!.x + 30, before!.y + 30);
  await expect(card).not.toHaveAttribute("data-glass-near", "true");
  const families = [];
  for (const theme of ["Pastel", "Vintage", "NeonAzure"]) {
    await page.evaluate(
      (theme) => localStorage.setItem("dayframe-theme", JSON.stringify(theme)),
      theme,
    );
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    families.push(
      await page
        .locator(".today-plan input:not([type=checkbox])")
        .first()
        .evaluate((el) => getComputedStyle(el).fontFamily),
    );
  }
  expect(new Set(families).size).toBe(3);
  const failedFonts = await page.evaluate(
    () => Array.from(document.fonts).filter((f) => f.status === "error").length,
  );
  expect(failedFonts).toBe(0);
});

test("font size changes real text, persists and remains usable on mobile", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("dayframe-classic-planner", "true"),
  );
  await page.goto("/");
  const field = page.getByLabel("Пріоритет дня 1", { exact: true });
  const base = await field.evaluate((el) =>
    parseFloat(getComputedStyle(el).fontSize),
  );
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Налаштування/ })
    .click();
  await page.getByRole("slider", { name: "Розмір шрифтів" }).focus();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("slider", { name: "Розмір шрифтів" }),
  ).toHaveValue("125");
  await page.reload();
  expect(
    await field.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeCloseTo(base * 1.25, 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await field.fill("Текст має бути зручним");
  await expect(field).toHaveValue("Текст має бути зручним");
});

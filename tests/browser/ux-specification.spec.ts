import { test, expect, type Page } from "@playwright/test";
const today = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Kyiv",
}).format(new Date());
const task = (id: string, extra = {}) => ({
  id,
  title: `Справа ${id}`,
  date: today,
  category: "Day",
  recurrence: "once",
  priority: "Normal",
  notes: "",
  completed: false,
  disabled: false,
  ...extra,
});
async function seed(page: Page, tasks: unknown[] = []) {
  await page.addInitScript(
    ({ tasks }) => {
      if (!localStorage.getItem("ux-seeded")) {
        localStorage.setItem("dayframe-tasks", JSON.stringify(tasks));
        localStorage.setItem("ux-seeded", "1");
      }
    },
    { tasks },
  );
  await page.route("https://api.open-meteo.com/**", (r) =>
    r.fulfill({
      json: { current: { temperature_2m: 15, weather_code: 0, is_day: 1 } },
    }),
  );
  await page.goto("/");
}
async function nav(page: Page, name: string) {
  await page
    .locator(page.viewportSize()!.width < 760 ? ".mobile-nav" : ".sidebar")
    .getByRole("button", { name, exact: true })
    .click();
}
async function save(page: Page) {
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Зберегти", exact: true })
    .click();
}
test("UX01 three day tasks fit the first 1366×900 viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await seed(page, [task("1"), task("2"), task("3")]);
  await nav(page, "Сьогодні");
  const rows = page.locator("[data-planner-column=today] [data-planner-task]");
  await expect(rows).toHaveCount(3);
  expect(
    (await rows.last().boundingBox())!.y +
      (await rows.last().boundingBox())!.height,
  ).toBeLessThanOrEqual(900);
  expect(
    (await page.locator("#planner-tasks h2").boundingBox())!.y,
  ).toBeLessThan(600);
});
test("UX04 and UX05 same editor creates equivalent records and timed reminders are visible before save", async ({
  page,
}) => {
  await seed(page);
  await nav(page, "Сьогодні");
  await page
    .getByRole("button", { name: "Швидко додати справу", exact: true })
    .click();
  let d = page.getByRole("dialog");
  await d.getByLabel("Назва", { exact: true }).fill("Купити корм");
  await d.getByLabel("Категорія", { exact: true }).selectOption("personal");
  await save(page);
  await nav(page, "Календар");
  await page
    .locator(".studio-tools")
    .getByRole("button", { name: "Додати", exact: true })
    .click();
  d = page.getByRole("dialog");
  await d.getByLabel("Назва", { exact: true }).fill("Купити корм");
  await d.getByLabel("Категорія", { exact: true }).selectOption("personal");
  await save(page);
  const records = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("dayframe-tasks")!),
  );
  expect(records).toHaveLength(2);
  for (const field of [
    "title",
    "date",
    "sectionId",
    "recurrence",
    "priority",
    "inBacklog",
  ])
    expect(records[0][field] || false).toEqual(records[1][field] || false);
  await page
    .locator(".studio-tools")
    .getByRole("button", { name: "Додати", exact: true })
    .click();
  d = page.getByRole("dialog");
  await d.getByLabel("Назва", { exact: true }).fill("Зустріч");
  await expect(d.getByLabel("Нагадування запису")).toHaveCount(0);
  await d.getByLabel("Початок події").fill("23:30");
  await d.getByLabel("Завершення події").fill("00:30");
  await expect(d.getByLabel("Нагадування запису")).toBeVisible();
  await expect(d).toContainText("При закритій вкладці доставка не працює");
  await d.getByLabel("Нагадування запису").selectOption("15");
  await save(page);
  expect(
    (
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("dayframe-tasks")!).at(-1),
      )
    ).scheduledDuration,
  ).toBe(60);
});
test("UX06 and UX07 honest empty context and exact priority denominator", async ({
  page,
}) => {
  await seed(page, [task("1"), task("2"), task("3")]);
  await nav(page, "Сьогодні");
  const focus = page.locator(".today-focus");
  await expect(focus).toContainText("У Dayframe немає подій на цей час");
  await expect(focus).not.toContainText("Вікно без зустрічей");
  await expect(focus).toContainText("Обери головне на сьогодні");
  await focus.getByLabel("Обрати головні справи").click();
  await focus.getByLabel("Головне: Справа 1", { exact: true }).click();
  await focus.getByLabel("Головне: Справа 2", { exact: true }).click();
  await expect(focus).toContainText("Виконано 0 із 2");
  await focus.getByLabel("Виконано: Справа 1", { exact: true }).check();
  await expect(focus).toContainText("Виконано 1 із 2");
  await focus.getByLabel("Головне: Справа 2", { exact: true }).click();
  await expect(focus).toContainText("Виконано 1 із 1");
});
test("UX02 hiding and reordering modules preserves data and reload preferences", async ({
  page,
}) => {
  await seed(page);
  await nav(page, "Сьогодні");
  await page
    .getByRole("button", { name: "Налаштувати екран", exact: true })
    .click();
  const config = page.getByRole("region", { name: "Налаштувати екран" });
  await config.getByLabel("Спорт і кроки", { exact: true }).uncheck();
  await expect(page.locator(".today-fitness")).toHaveCount(0);
  await config.getByLabel("Нижче: fitness", { exact: true }).click();
  await page.reload();
  await nav(page, "Сьогодні");
  await expect(page.locator(".today-fitness")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Налаштувати екран", exact: true })
    .click();
  await config.getByLabel("Спорт і кроки", { exact: true }).check();
  await expect(page.locator(".today-fitness")).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("dayframe-widget-order")!)[1],
    ),
  ).toBe("fitness");
});
test("UX04 draft survives Escape and can be recovered after reload without creating a task", async ({
  page,
}) => {
  await seed(page);
  await nav(page, "Сьогодні");
  await page
    .getByRole("button", { name: "Швидко додати справу", exact: true })
    .click();
  let d = page.getByRole("dialog", { name: "Особисте завдання" });
  await d.getByLabel("Назва", { exact: true }).fill("Не загубити");
  await d.locator(".studio-advanced > summary").click();
  await d.getByLabel("Нотатки запису").fill("Рядок один\nРядок два");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Продовжити редагування" }).click();
  await expect(d.getByLabel("Назва", { exact: true })).toHaveValue(
    "Не загубити",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Закрити зі збереженням чернетки" })
    .click();
  await page.reload();
  await nav(page, "Сьогодні");
  await page.getByRole("button", { name: "Відновити чернетку" }).click();
  d = page.getByRole("dialog", { name: "Особисте завдання" });
  await expect(d.getByLabel("Назва", { exact: true })).toHaveValue(
    "Не загубити",
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("dayframe-tasks")!).length,
    ),
  ).toBe(0);
});
for (const width of [1440, 1366, 1024, 768, 390])
  test(`responsive calendar ${width} with dense, overlapping and midnight records`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await seed(page, [
      ...Array.from({ length: 10 }, (_, i) =>
        task(String(i), {
          title:
            "Довга українська назва справи для перевірки адаптивного календаря " +
            i,
        }),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        task("event" + i, { scheduledStart: "10:00", scheduledDuration: 60 }),
      ),
      task("night", { scheduledStart: "23:30", scheduledDuration: 60 }),
    ]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    await page.getByRole("button", { name: "День", exact: true }).click();
    await expect(page.locator(".studio-timed-event")).toHaveCount(4);
    await page
      .locator(".studio-tools")
      .getByRole("button", { name: "Додати", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(
      (await page.getByRole("dialog").boundingBox())!.width,
    ).toBeLessThanOrEqual(width);
  });
test("UX08 next-week plan stays in its selected period and the shared plan tray retains identity", async ({
  page,
}) => {
  await seed(page);
  await nav(page, "Плани");
  await page.getByLabel("Додати план: Тиждень", { exact: true }).click();
  const d = page.getByRole("dialog", { name: "Редактор запису" });
  await d.getByLabel("Назва", { exact: true }).fill("Наступний тиждень");
  const next = new Date(today + "T12:00:00");
  next.setDate(next.getDate() + 7);
  const anchor = next.toISOString().slice(0, 10);
  await d.getByLabel("Період плану").fill(anchor);
  await save(page);
  await expect(
    page.locator(".studio-task-title").filter({ hasText: "Наступний тиждень" }),
  ).toHaveCount(0);
  await page.getByLabel("Показати також плани інших періодів").check();
  await expect(
    page.locator(".studio-task-title").filter({ hasText: "Наступний тиждень" }),
  ).toHaveCount(1);
  const ids = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("dayframe-tasks")!).map((t: any) => t.id),
  );
  await nav(page, "Календар");
  await page.getByLabel("Плани для календаря", { exact: true }).click();
  await expect(
    page
      .locator(".studio-day-panel .studio-task-title")
      .filter({ hasText: "Наступний тиждень" }),
  ).toHaveCount(1);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("dayframe-tasks")!).map((t: any) => t.id),
    ),
  ).toEqual(ids);
});
test('mobile task actions keep 44 pixel touch targets',async({page})=>{
 await page.setViewportSize({width:390,height:844});await seed(page,[task('1')]);await nav(page,'Сьогодні');const target=page.getByRole('button',{name:'Виконати Справа 1',exact:true});const box=await target.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);
});

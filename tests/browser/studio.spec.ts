import { filters, more, openPlanTray, advanced } from "./helpers/product";
import { chooseTheme } from "./helpers/product";
import { test, expect } from "@playwright/test";
const seed = {
  id: "reference",
  title: "Розібрати референси для шейдера та перевірити довгу українську назву",
  category: "Day",
  date: "",
  inBacklog: true,
  recurrence: "once",
  priority: "Normal",
  notes: "Перевірити roughness",
  completed: false,
  disabled: false,
  sectionId: "creative",
  deadline: "2026-12-01",
};
test.beforeEach(async ({ page }) => {
  await page.addInitScript((task) => {
    if (localStorage.getItem("dayframe-tasks")) return;
    localStorage.setItem("dayframe-tasks", JSON.stringify([task]));
    localStorage.setItem("dayframe-calendar-view", JSON.stringify("Week"));
    localStorage.setItem("dayframe-calendar-right", "false");
    localStorage.setItem("dayframe-calendar-left", "true");
  }, seed);
});
test("create edit overlap resize move delete and undo a scheduled task, preserving it after reload", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".studio-day-head>button")).toHaveCount(7);
  await page.getByRole("button", { name: "Додати", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Редактор запису" });
  await dialog.getByText("Додати фразою", { exact: true }).click();
  await dialog
    .getByLabel("Швидке введення фразою")
    .fill("Завтра о 15:00 перевірити префаби, година");
  await dialog.getByRole("button", { name: "Розпізнати" }).click();
  await expect(dialog.getByLabel("Початок події")).toHaveValue("15:00");
  await expect(dialog.getByLabel("Тривалість події")).toHaveValue("60");
  await dialog.getByRole("button", { name: "Зберегти", exact: true }).click();
  await page.reload();
  await expect(page.locator(".studio-event-main")).toContainText(
    "перевірити префаби",
  );
  await page.locator(".studio-event-main").click();
  await dialog.getByLabel("Назва", { exact: true }).fill("Перевірити шейдери");
  await advanced(dialog);
  await dialog.getByLabel("Дедлайн", { exact: true }).fill("2026-12-02");
  await dialog.getByRole("button", { name: "Зберегти", exact: true }).click();
  const event = page.locator(".studio-timed-event");
  // Leave room below the event for the full drag, rather than scrolling it only to the viewport edge.
  await event.evaluate((el) =>
    el.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "instant",
    }),
  );
  await event.scrollIntoViewIfNeeded();
  const box = await event.boundingBox();
  if (!box) throw Error();
  await page.mouse.move(box.x + 20, box.y + 15);
  await page.mouse.down();
  await page.mouse.move(box.x + 20, box.y + 75, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("dayframe-tasks")!).find(
            (t: any) => t.title === "Перевірити шейдери",
          ).scheduledStart,
      ),
    )
    .toBe("16:00");
  await page
    .locator(".studio-resize")
    .evaluate((el) =>
      el.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: "instant",
      }),
    );
  await page.locator(".studio-resize").scrollIntoViewIfNeeded();
  const handle = await page.locator(".studio-resize").boundingBox();
  if (!handle) throw Error();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 3);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 63, {
    steps: 8,
  });
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("dayframe-tasks")!).find(
            (t: any) => t.title === "Перевірити шейдери",
          ).scheduledDuration,
      ),
    )
    .toBe(120);
  await page.keyboard.press("Escape");
  await page.locator(".studio-event-main").click();
  await dialog.getByRole("button", { name: "Видалити", exact: true }).click();
  await expect(page.locator(".studio-event-main")).toHaveCount(0);
  await page.getByRole("button", { name: "Скасувати дію" }).click();
  await expect(page.locator(".studio-event-main")).toHaveCount(1);
});
test("backlog drag schedules work without changing the separate deadline; category filter and notes persist", async ({
  page,
}) => {
  await page.goto("/");
  const task = page.locator(".studio-day-panel .studio-task-row");
  const day = page.locator(".studio-time-day").nth(2);
  const box = await day.boundingBox();
  if (!box) throw Error();
  const data = await page.evaluateHandle(() => new DataTransfer());
  await data.evaluate((d: DataTransfer) =>
    d.setData("text/dayframe-task", "reference"),
  );
  await day.dispatchEvent("drop", { dataTransfer: data, clientY: box.y + 600 });
  await expect(page.locator(".studio-event-main")).toContainText(seed.title);
  await expect(task).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("dayframe-tasks")!)[0].deadline,
      ),
    )
    .toBe("2026-12-01");
  await filters(page);
  await page.getByLabel("Показати розділ Творчість", { exact: true }).uncheck();
  await expect(page.locator(".studio-event-main")).toHaveCount(0);
  await page.getByLabel("Показати розділ Творчість", { exact: true }).check();
  await page.getByLabel("Згорнути навігацію", { exact: true }).click();
  await page.getByLabel("Показати або сховати панель дня").click();
  await page
    .getByLabel("Нотатки дня", { exact: true })
    .fill("Ідея: прозоре скло для Unity");
  await page.reload();
  await expect(page.getByLabel("Нотатки дня", { exact: true })).toHaveValue(
    "Ідея: прозоре скло для Unity",
  );
  await page.locator(".search-trigger").click();
  await page
    .getByPlaceholder("Пошук серед подій, повідомлень і завдань…")
    .fill("прозоре скло");
  await expect(page.locator(".search-results")).toContainText(
    "Ідея: прозоре скло для Unity",
  );
});
test("recurring occurrence can be edited separately and overlapping events get distinct lanes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Додати", exact: true }).click();
  const d = page.getByRole("dialog", { name: "Редактор запису" });
  await d.getByLabel("Назва", { exact: true }).fill("Фокус Unity");
  await d.getByLabel("Тип запису").selectOption("event");
  await d.getByLabel("Початок події").fill("10:00");
  await advanced(d);
  await d.getByLabel("Повторення запису").selectOption("daily");
  await d.getByRole("button", { name: "Зберегти", exact: true }).click();
  await expect
    .poll(() => page.locator(".studio-timed-event").count())
    .toBeGreaterThan(1);
  await page.locator(".studio-event-main").first().click();
  await d.getByLabel("Назва", { exact: true }).fill("Окремий фокус");
  await d.getByRole("button", { name: "Зберегти", exact: true }).click();
  await expect(
    page.locator(".studio-event-main").filter({ hasText: "Окремий фокус" }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Додати", exact: true }).click();
  await d.getByLabel("Назва", { exact: true }).fill("Перетин");
  await d.getByLabel("Тип запису").selectOption("event");
  await d.getByLabel("Початок події").fill("10:00");
  await d.getByRole("button", { name: "Зберегти", exact: true }).click();
  const widths = await page
    .locator(".studio-timed-event")
    .evaluateAll((els) => els.map((el) => (el as HTMLElement).style.width));
  expect(widths.some((w) => w.includes("50%"))).toBeTruthy();
});
test("mobile day, keyboard creation, offline persistence and backup export work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("dayframe-calendar-left", "false");
    localStorage.setItem("dayframe-calendar-right", "false");
  });
  await page.goto("/");
  await expect(page.locator(".studio-day-head>button")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.context().setOffline(true);
  await expect(page.locator(".studio-status")).toContainText("Без інтернету");
  await page.getByRole("button", { name: "Додати", exact: true }).focus();
  await page.keyboard.press("Enter");
  const d = page.getByRole("dialog", { name: "Редактор запису" });
  await d.getByLabel("Назва", { exact: true }).fill("Мобільна справа");
  await d.getByRole("button", { name: "Зберегти", exact: true }).click();
  await page.context().setOffline(false);
  await page.reload();
  await page.getByLabel("Показати або сховати панель дня").click();
  await expect(page.locator(".studio-day-panel")).toContainText(
    "Мобільна справа",
  );
  await page.getByLabel("Згорнути панель дня").click();
  await more(page);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Резервна копія", exact: true })
    .click();
  expect((await download).suggestedFilename()).toMatch(/dayframe-.*json/);
});

test("range selection, bulk planning and backup merge remain editable and reversible", async ({
  page,
}) => {
  await page.goto("/");
  const slot = page
    .getByRole("button", { name: /Створити подію .* о 09:00/ })
    .first();
  await slot.scrollIntoViewIfNeeded();
  const box = await slot.boundingBox();
  if (!box) throw Error();
  await page.mouse.move(box.x + 10, box.y + 15);
  await page.mouse.down();
  await page.mouse.move(box.x + 10, box.y + 105, { steps: 8 });
  await page.mouse.up();
  const d = page.getByRole("dialog", { name: "Редактор запису" });
  await expect(d).toBeVisible();
  await expect(d.getByLabel("Тривалість події")).toHaveValue("90");
  await d.getByLabel("Назва", { exact: true }).fill("Тривалий фокус");
  await d.getByRole("button", { name: "Зберегти", exact: true }).click();
  await openPlanTray(page);
  await more(page);
  await page
    .getByRole("button", { name: "Вибрати кілька справ", exact: true })
    .click();
  await page.locator(".studio-more>summary").click();
  await page.getByLabel(`Вибрати ${seed.title}`, { exact: true }).check();
  await page.getByLabel("Дата перенесення вибраних справ").fill("2026-12-01");
  await page.getByRole("button", { name: "Перенести", exact: true }).click();
  await expect(page.locator(".studio-day-panel .studio-task-row")).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Скасувати дію" }).click();
  await expect(page.locator(".studio-day-panel .studio-task-row")).toHaveCount(
    1,
  );
  const incoming = {
    ...seed,
    id: "from-backup",
    title: "Ідея із резервної копії",
  };
  const payload = JSON.stringify({
    format: "dayframe-backup",
    version: 1,
    data: { "dayframe-tasks": [incoming, incoming] },
  });
  await page.locator(".studio-more-menu>input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(payload),
  });
  await expect(page.locator(".studio-day-panel")).toContainText(
    "Ідея із резервної копії",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("dayframe-tasks")!).filter(
            (t: any) => t.id === "from-backup",
          ).length,
      ),
    )
    .toBe(1);
  await page.locator(".studio-more-menu>input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"bad"}'),
  });
  await expect(page.locator(".studio-message")).toContainText(
    "Не вдалося імпортувати",
  );
  await expect(page.locator(".studio-event-main")).toContainText(
    "Тривалий фокус",
  );
});
test("mobile drawers support Escape and the week and month support long task names", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("dayframe-calendar-left", "false");
    localStorage.setItem("dayframe-calendar-right", "false");
  });
  await page.goto("/");
  await page.getByLabel("Показати або сховати навігацію календаря").click();
  await expect(
    page.getByRole("dialog", { name: "Навігація календаря" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Навігація календаря" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Місяць", exact: true }).click();
  await expect(page.locator(".studio-month-grid>div")).toHaveCount(42);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .getByRole("button", { name: "Наступний період", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Попередній період", exact: true })
    .click();
  await page.getByRole("button", { name: "День", exact: true }).click();
  await expect(page.locator(".studio-day-head>button")).toHaveCount(1);
});

test("storage failure stays visible and export includes unsaved in-memory records", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "dayframe-tasks")
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.getByRole("button", { name: "Додати", exact: true }).click();
  const d = page.getByRole("dialog", { name: "Редактор запису" });
  await d.getByLabel("Назва", { exact: true }).fill("Незбережена творча ідея");
  await d.getByRole("button", { name: "Зберегти", exact: true }).click();
  await expect(page.locator(".studio-status")).toContainText(
    "Не вдалося записати",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Експорт незбережених змін", exact: true })
    .click();
  const path = await (await download).path();
  if (!path) throw Error();
  const { readFile } = await import("node:fs/promises");
  const backup = JSON.parse(await readFile(path, "utf8"));
  expect(
    backup.data["dayframe-tasks"].some(
      (t: any) => t.title === "Незбережена творча ідея",
    ),
  ).toBeTruthy();
});

test("sections and rich event details persist including checklist, reference cover and reminder preferences", async ({
  page,
}) => {
  await page.goto("/");
  await filters(page);
  await page.getByLabel("Редагувати розділи").click();
  await page
    .getByLabel("Назва розділу Творчість", { exact: true })
    .fill("Фото та мистецтво");
  await page.getByLabel("Колір розділу Фото та мистецтво").fill("#426957");
  await page.getByLabel("Редагувати розділи").click();
  await page.getByLabel("Згорнути навігацію", { exact: true }).click();
  await page.getByRole("button", { name: "Додати", exact: true }).click();
  const d = page.getByRole("dialog", { name: "Редактор запису" });
  await d.getByLabel("Назва", { exact: true }).fill("Маленький творчий проєкт");
  await d.getByLabel("Розділ", { exact: true }).selectOption("creative");
  await d.getByLabel("Тип запису").selectOption("event");
  await advanced(d);
  await d.getByLabel("Нотатки запису").fill("Перевірити палітру");
  await d.getByLabel("Новий пункт чекліста").fill("Зібрати референси");
  await d.getByRole("button", { name: "Додати пункт", exact: true }).click();
  await d
    .getByText("Посилання, вкладення та нагадування", { exact: true })
    .click();
  await d.getByLabel("Посилання запису").fill("https://example.com/reference");
  await d.getByLabel("Нагадування запису").selectOption("15");
  await d.getByLabel("Додати вкладення").setInputFiles({
    name: "reference.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aB3sAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await d.getByRole("button", { name: "На обкладинку", exact: true }).click();
  await d.getByRole("button", { name: "Зберегти", exact: true }).click();
  await page.reload();
  await filters(page);
  await expect(page.locator(".studio-navigation")).toContainText(
    "Фото та мистецтво",
  );
  await expect(page.locator(".studio-event-main img")).toHaveCount(1);
  await page.getByLabel("Згорнути навігацію", { exact: true }).click();
  await page.locator(".studio-event-main").click();
  await d
    .getByText("Посилання, вкладення та нагадування", { exact: true })
    .click();
  await expect(d.getByLabel("Нагадування запису")).toHaveValue("15");
  await expect(d.getByLabel("Нотатки запису")).toHaveValue(
    "Перевірити палітру",
  );
  await d.getByLabel("Готово: Зібрати референси").check();
  await d.getByLabel("Нагадування запису").selectOption("off");
  await d.getByRole("button", { name: "Зберегти", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const t = JSON.parse(localStorage.getItem("dayframe-tasks")!).find(
          (t: any) => t.title === "Маленький творчий проєкт",
        );
        return [
          t.checklist[0].done,
          t.reminderMinutes ?? "off",
          t.attachments.length,
          t.sectionId,
        ];
      }),
    )
    .toEqual([true, "off", 1, "creative"]);
});

test("studio stays within mobile bounds across illustrated and dark themes", async ({
  page,
}) => {
  await page.goto("/");
  for (const theme of ["Pastel", "Vintage", "Dark", "Moonlight"]) {
    await chooseTheme(page, theme);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBeTruthy();
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
});

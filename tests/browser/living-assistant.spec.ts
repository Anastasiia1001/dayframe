import { test, expect } from "@playwright/test";
import { mascots } from "../../src/appearance";
const date = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Kyiv",
}).format(new Date());
const base = {
  category: "Day",
  date,
  recurrence: "once",
  priority: "Normal",
  notes: "",
  completed: false,
  disabled: false,
};
const tasks = [
  {
    ...base,
    id: "short",
    title: "Купити корм для собаки",
    scheduledStart: "09:30",
    scheduledDuration: 15,
  },
  ...["year", "quarter", "month", "week"].map((scope) => ({
    ...base,
    id: scope,
    title: `План: ${scope}`,
    date: "",
    inBacklog: true,
    planningHorizon: scope === "quarter" ? "year" : scope,
    category: scope === "quarter" ? "Quarter" : "Day",
    isTemplate: scope === "year",
  })),
];
test.beforeEach(async ({ page }) => {
  await page.addInitScript((tasks) => {
    if (localStorage.getItem("dayframe-tasks")) return;
    localStorage.setItem("dayframe-tasks", JSON.stringify(tasks));
    localStorage.setItem("dayframe-calendar-view", JSON.stringify("Day"));
    localStorage.setItem("dayframe-calendar-right", "true");
    localStorage.setItem("dayframe-calendar-left", "false");
  }, tasks);
});
test("short events keep a complete title line and first visible hour is not cropped", async ({
  page,
}) => {
  await page.goto("/");
  const event = page.locator(".studio-timed-event");
  await expect(event).toHaveAttribute("data-density", "compact");
  const boxes = await event.evaluate((el) => {
    const text = el.querySelector("strong")!.getBoundingClientRect(),
      resize = el.querySelector(".studio-resize")!.getBoundingClientRect(),
      bounds = el.getBoundingClientRect();
    return {
      top: text.top,
      bottom: text.bottom,
      right: text.right,
      left: text.left,
      eventTop: bounds.top,
      eventBottom: bounds.bottom,
      resizeLeft: resize.left,
    };
  });
  expect(boxes.top).toBeGreaterThanOrEqual(boxes.eventTop);
  expect(boxes.bottom).toBeLessThanOrEqual(boxes.eventBottom);
  expect(boxes.right).toBeLessThanOrEqual(boxes.resizeLeft);
  const axis = await page
    .locator(".studio-hours span")
    .filter({ hasText: "08:00" })
    .boundingBox();
  const scroll = await page.locator(".studio-time-scroll").boundingBox();
  expect(axis!.y).toBeGreaterThanOrEqual(scroll!.y);
  await event.locator(".studio-event-main").click();
  await expect(page.getByLabel("Назва", { exact: true })).toHaveValue(
    "Купити корм для собаки",
  );
});
test("every mascot breathes, smiles on greeting and keeps the reply below its head on mobile", async ({
  page,
}) => {
  test.slow();
  await page.goto("/");
  for (const mascot of mascots) {
    await page.evaluate(
      (id) => localStorage.setItem("dayframe-mascot", JSON.stringify(id)),
      mascot.id,
    );
    await page.reload();
    const art = page.locator(".calendar-companion .mascot-art");
    await expect(art).toHaveCount(1);
    await expect(art.locator(".mascot-smile")).toHaveCount(1);
    expect(
      await art
        .locator(".mascot-body")
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("soft-breathe");
    await page.getByLabel("Привітатися з помічником").click();
    await expect(art.locator(".mascot-smile")).toHaveCSS("opacity", "1");
    await expect(art.locator(".mascot-mouth-rest")).toHaveCSS("opacity", "0");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Привітатися з помічником").click();
  const reply = await page.locator(".companion-reply").boundingBox(),
    pet = await page.locator(".calendar-companion").boundingBox(),
    tools = await page.locator(".studio-tools").boundingBox();
  expect(reply!.y).toBeGreaterThanOrEqual(pet!.y + pet!.height - 1);
  expect(reply!.y + reply!.height).toBeLessThanOrEqual(tools!.y);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".calendar-companion .mascot-body")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});
test("right-hand scope blocks schedule plans and clone yearly templates without losing the original", async ({
  page,
}) => {
  await page.goto("/");
  const pool = page.getByRole("region", { name: "Плани для календаря" });
  for (const name of ["Рік", "Квартал", "Місяць", "Тиждень"])
    await expect(pool.locator("summary").filter({ hasText: name })).toHaveCount(
      1,
    );
  const handle = pool.getByLabel("Перетягнути План: quarter", { exact: true });
  await handle.scrollIntoViewIfNeeded();
  const slot = page.getByRole("button", { name: /Створити подію .* о 10:00$/ });
  await slot.scrollIntoViewIfNeeded();
  const a = await handle.boundingBox(),
    b = await slot.boundingBox();
  await page.mouse.move(a!.x + a!.width / 2, a!.y + a!.height / 2);
  await page.mouse.down();
  await page.mouse.move(b!.x + 40, b!.y + 2, { steps: 12 });
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("dayframe-tasks")!).find(
            (t: any) => t.id === "quarter",
          ).scheduledStart,
      ),
    )
    .toBe("10:00");
  const year = pool.getByLabel("Перетягнути План: year", { exact: true });
  await year.scrollIntoViewIfNeeded();
  const c = await year.boundingBox(),
    d = await slot.boundingBox();
  await page.mouse.move(c!.x + c!.width / 2, c!.y + c!.height / 2);
  await page.mouse.down();
  await page.mouse.move(d!.x + 90, d!.y + 2, { steps: 12 });
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("dayframe-tasks")!).filter(
            (t: any) => t.title === "План: year",
          ).length,
      ),
    )
    .toBe(2);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("dayframe-tasks")!).find(
          (t: any) => t.id === "year",
        ).isTemplate,
    ),
  ).toBeTruthy();
  await pool
    .getByRole("button", { name: "Додати план: Місяць", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Редактор запису" });
  await expect(dialog.getByLabel("Рівень плану")).toHaveValue("month");
  await dialog.getByLabel("Назва", { exact: true }).fill("Обробити фотосесію");
  await dialog.getByRole("button", { name: "Зберегти", exact: true }).click();
  await expect(pool).toContainText("Обробити фотосесію");
});
test("manual helper prepares actual Google and ChatGPT links and persists a configurable reminder", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Відкрити ручного помічника").click();
  const dialog = page.getByRole("dialog", { name: "Ручний помічник" });
  await dialog.getByLabel("Запит помічнику").fill("Unity вода шейдер");
  const google = dialog.getByRole("link", { name: "Пошукати в Google" });
  expect(
    new URL((await google.getAttribute("href"))!).searchParams.get("q"),
  ).toBe("Unity вода шейдер");
  await dialog.getByRole("button", { name: "ChatGPT", exact: true }).click();
  expect(
    new URL(
      (await dialog
        .getByRole("link", { name: "Відкрити в ChatGPT" })
        .getAttribute("href"))!,
    ).searchParams.get("q"),
  ).toContain("Unity вода шейдер");
  await dialog.getByRole("button", { name: "Нагадати", exact: true }).click();
  await dialog.getByLabel("Дата нагадування помічника").fill("2027-01-25");
  await dialog.getByLabel("Час нагадування помічника").fill("15:00");
  await dialog
    .getByRole("button", { name: "Створити нагадування", exact: true })
    .click();
  await expect(dialog.getByRole("status")).toContainText("Нагадування додано");
  await expect(
    dialog.getByRole("button", { name: "Додано в календар", exact: true }),
  ).toBeDisabled();
  await dialog.getByLabel("Закрити ручного помічника").click();
  await page.reload();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("dayframe-tasks")!).find(
      (t: any) => t.title === "Unity вода шейдер",
    ),
  );
  expect(saved).toMatchObject({
    date: "2027-01-25",
    scheduledStart: "15:00",
    reminderMinutes: 0,
  });
});

test("reminders remain available outside the calendar and do not repeat after dismissal and reload", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-21T06:30:00Z") });
  await page.addInitScript(() => {
    localStorage.setItem(
      "dayframe-tasks",
      JSON.stringify([
        {
          id: "due",
          title: "Не забути про зустріч",
          date: "2026-10-21",
          scheduledStart: "09:30",
          scheduledDuration: 30,
          reminderMinutes: 0,
          recurrence: "once",
          category: "Day",
          priority: "Normal",
          notes: "",
          completed: false,
          disabled: false,
        },
      ]),
    );
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("Не забути про зустріч");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Сьогодні", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("Закрити нагадування Не забути про зустріч").click();
  await page.reload();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

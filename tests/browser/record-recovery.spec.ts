import { test, expect } from "@playwright/test";
test("calendar draft can be recovered immediately through the global action", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".studio-tools")
    .getByRole("button", { name: "Додати", exact: true })
    .click();
  const editor = page.getByRole("dialog", { name: "Редактор запису" });
  await editor
    .getByLabel("Назва", { exact: true })
    .fill("Зберегти чернетку календаря");
  await page.keyboard.press("Escape");
  await editor
    .getByRole("button", { name: "Закрити зі збереженням чернетки" })
    .click();
  await page
    .getByRole("button", { name: "Відновити чернетку", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "Особисте завдання" })
      .getByLabel("Назва", { exact: true }),
  ).toHaveValue("Зберегти чернетку календаря");
});
test("a midnight event remains on the following day and opens with a positive duration", async ({
  page,
}) => {
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Kyiv",
  }).format(new Date());
  await page.addInitScript(
    (today) =>
      localStorage.setItem(
        "dayframe-tasks",
        JSON.stringify([
          {
            id: "midnight",
            title: "Подія через північ",
            date: today,
            category: "Day",
            recurrence: "once",
            priority: "Normal",
            notes: "",
            completed: false,
            disabled: false,
            scheduledStart: "23:30",
            scheduledDuration: 60,
          },
        ]),
      ),
    today,
  );
  await page.goto("/");
  await page.getByRole("button", { name: "День", exact: true }).click();
  await page.getByLabel("Наступний період", { exact: true }).click();
  await expect(page.locator(".studio-event-main")).toHaveCount(1);
  await page.locator(".studio-event-main").click();
  const editor = page.getByRole("dialog", { name: "Редактор запису" });
  await editor.locator(".studio-advanced > summary").click();
  await expect(editor.getByLabel("Тривалість події")).toHaveValue("60");
});
test("full storage cannot silently close an unsaved record", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Швидко додати справу", exact: true })
    .click();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "dayframe-record-draft")
        throw new DOMException("Full", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  const editor = page.getByRole("dialog", { name: "Особисте завдання" });
  await editor
    .getByLabel("Назва", { exact: true })
    .fill("Текст лишається в редакторі");
  await page.keyboard.press("Escape");
  await expect(editor.getByRole("alert")).toContainText(
    "Не вдалося зберегти чернетку",
  );
  await expect(
    editor.getByRole("button", { name: "Закрити зі збереженням чернетки" }),
  ).toBeDisabled();
  await editor.getByRole("button", { name: "Продовжити редагування" }).click();
  await expect(editor.getByLabel("Назва", { exact: true })).toHaveValue(
    "Текст лишається в редакторі",
  );
});
test("recovering a moved recurring draft keeps the original occurrence identity", async ({
  page,
}) => {
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Kyiv",
  }).format(new Date());
  const next = new Date(today + "T12:00:00");
  next.setDate(next.getDate() + 1);
  const tomorrow = next.toISOString().slice(0, 10);
  await page.addInitScript(
    (today) =>
      localStorage.setItem(
        "dayframe-tasks",
        JSON.stringify([
          {
            id: "series",
            title: "Повторювана справа",
            date: today,
            category: "Day",
            recurrence: "daily",
            priority: "Normal",
            notes: "",
            completed: false,
            disabled: false,
            scheduledStart: "10:00",
            scheduledDuration: 60,
          },
        ]),
      ),
    today,
  );
  await page.goto("/");
  await page.getByRole("button", { name: "День", exact: true }).click();
  await page.locator(".studio-event-main").click();
  const editor = page.getByRole("dialog", { name: "Редактор запису" });
  await editor.getByLabel("Дата запису").fill(tomorrow);
  await editor.getByRole("button", {name:"Закрити редактор",exact:true}).click();
  await editor
    .getByRole("button", { name: "Закрити зі збереженням чернетки" })
    .click();
  await page
    .getByRole("button", { name: "Відновити чернетку", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Особисте завдання" })
    .getByRole("button", { name: "Зберегти", exact: true })
    .click();
  const tasks = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("dayframe-tasks")!),
  );
  expect(
    tasks.find((t: any) => t.id === "series").seriesExceptions[today].cancelled,
  ).toBe(true);
  expect(tasks.find((t: any) => t.id !== "series").date).toBe(tomorrow);
});

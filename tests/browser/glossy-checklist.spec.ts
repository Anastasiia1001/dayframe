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

import { openFitness } from "./helpers/product";
import { test, expect } from "@playwright/test";
test("sport tracks exercises and daily steps, edits, persists and separates days", async ({
  page,
}) => {
  await page.goto("/");
  await openFitness(page);
  const tracker = page.getByRole("region", { name: "Трекер спорту" });
  await tracker.getByLabel("Кроки за день", { exact: true }).fill("4500");
  await tracker
    .getByRole("button", { name: "+500 кроків", exact: true })
    .click();
  await tracker.getByLabel("Щоденна ціль кроків").fill("6000");
  await tracker
    .getByRole("button", { name: "Зберегти ціль", exact: true })
    .click();
  await tracker.getByLabel("Назва вправи").fill("Присідання");
  await tracker.getByLabel("Підходи", { exact: true }).fill("4");
  await tracker.getByLabel("Вага, кг").fill("12.5");
  await tracker
    .getByRole("button", { name: "Додати вправу", exact: true })
    .click();
  await tracker
    .getByRole("button", { name: "Виконано: Присідання", exact: true })
    .click();
  await expect(
    tracker.getByRole("button", { name: "Виконано: Присідання", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await tracker
    .getByRole("button", { name: "Редагувати: Присідання", exact: true })
    .click();
  await tracker.getByLabel("Назва вправи").fill("Присідання з вагою");
  await tracker
    .getByRole("button", { name: "Зберегти вправу", exact: true })
    .click();
  await expect(
    tracker.getByText("4 підх. × 10 повт. · 12.5 кг", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await openFitness(page);
  await expect(
    tracker.getByLabel("Кроки за день", { exact: true }),
  ).toHaveValue("5000");
  await expect(
    tracker.getByRole("button", {
      name: "Виконано: Присідання з вагою",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await tracker.getByRole("button", { name: "Попередній день спорту" }).click();
  await expect(
    tracker.getByLabel("Кроки за день", { exact: true }),
  ).toHaveValue("0");
  await expect(tracker.getByLabel("Щоденна ціль кроків")).toHaveValue("6000");
  await expect(
    tracker.getByRole("button", {
      name: "Редагувати: Присідання з вагою",
      exact: true,
    }),
  ).toHaveCount(0);
  await tracker.getByRole("button", { name: "Наступний день спорту" }).click();
  await tracker
    .getByRole("button", { name: "Видалити: Присідання з вагою", exact: true })
    .click();
  await expect(
    tracker.getByText("Сьогодні все починається", { exact: false }),
  ).toBeVisible();
});
test("sport is usable on mobile and in a neon theme", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await openFitness(page);
  await page.evaluate(
    () => (document.documentElement.dataset.theme = "NeonAzure"),
  );
  await expect(
    page.getByRole("heading", { name: "Кроки за день" }),
  ).toBeVisible();
  await page.getByLabel("Назва вправи").fill("Прогулянка");
  await page.getByLabel("Тип вправи").selectOption("cardio");
  await page.getByLabel("Тривалість, хв").fill("30");
  await page
    .getByRole("button", { name: "Додати вправу", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Виконано: Прогулянка", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "/tmp/dayframe-fitness-mobile.png",
    fullPage: true,
  });
});

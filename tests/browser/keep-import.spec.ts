import { test, expect } from "@playwright/test";
const note = {
  title: "Матеріал для шейдера",
  textContent: "Перевірити roughness і зберегти референси",
  createdTimestampUsec: 123456,
  labels: [{ name: "Нові ідеї" }],
  listContent: [
    { text: "Зібрати референси", isChecked: true },
    { text: "Зробити матеріал", isChecked: false },
  ],
};
test("Keep preview creates missing sections, preserves checklists, schedules chosen dates and deduplicates reloads", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Імпорт Google Keep", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Google Keep → Dayframe",
    exact: true,
  });
  await dialog
    .getByLabel("Файли експорту Keep")
    .setInputFiles({
      name: "note.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(note)),
    });
  await expect(dialog).toContainText("Нові ідеї");
  await expect(
    dialog.getByLabel(`Дата: ${note.title}`, { exact: true }),
  ).toHaveValue("");
  await dialog
    .getByLabel(`Дата: ${note.title}`, { exact: true })
    .fill("2026-11-12");
  await dialog.getByLabel(`Час: ${note.title}`, { exact: true }).fill("14:30");
  await dialog
    .getByRole("button", { name: "Перенести вибрані (1)", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  const result = await page.evaluate(() => ({
    tasks: JSON.parse(localStorage.getItem("dayframe-tasks")!),
    sections: JSON.parse(localStorage.getItem("dayframe-sections")!),
  }));
  const imported = result.tasks.find(
    (t: any) => t.origin?.source === "GoogleKeep",
  );
  expect(imported.date).toBe("2026-11-12");
  expect(imported.scheduledStart).toBe("14:30");
  expect(imported.checklist.map((i: any) => i.done)).toEqual([true, false]);
  expect(
    result.sections.find((s: any) => s.id === imported.sectionId).name,
  ).toBe("Нові ідеї");
  await page.reload();
  await page
    .getByRole("button", { name: "Імпорт Google Keep", exact: true })
    .click();
  await dialog
    .getByLabel("Файли експорту Keep")
    .setInputFiles({
      name: "note.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(note)),
    });
  await expect(dialog).toContainText("Уже імпортовано");
  await expect(
    dialog.getByRole("button", { name: "Перенести вибрані (0)", exact: true }),
  ).toBeDisabled();
});
test("Keep import cancels without writes and mobile preview stays within viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Імпорт Google Keep", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Google Keep → Dayframe",
    exact: true,
  });
  await dialog
    .getByLabel("Файли експорту Keep")
    .setInputFiles({
      name: "note.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(note)),
    });
  const before = await page.evaluate(() =>
    localStorage.getItem("dayframe-tasks"),
  );
  expect(
    await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBeTruthy();
  await dialog.getByRole("button", { name: "Скасувати", exact: true }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("dayframe-tasks")),
  ).toBe(before);
});

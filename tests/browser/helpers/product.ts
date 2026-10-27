import { expect, type Page } from "@playwright/test";
export async function chooseTheme(page: Page, id: string) {
  const trigger = page.getByLabel("Оформлення планера", { exact: true });
  if (await trigger.evaluate((el) => el.tagName === "SELECT")) {
    await trigger.selectOption(id);
    return;
  }
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Теми оформлення" }),
    choice = dialog.locator(`[data-theme-id="${id}"]`);
  if (!(await choice.isVisible())) await dialog.locator("summary").click();
  await choice.click();
  await expect(dialog).not.toBeVisible();
}
export async function openPlanTray(page: Page, scope = "Колись / без дати") {
  await page.getByLabel("Плани для календаря", { exact: true }).click();
  const group = page
    .locator(".studio-day-panel .studio-scope-group")
    .filter({ has: page.locator("summary").filter({ hasText: scope }) });
  if (
    (await group.count()) &&
    !(await group.evaluate((el) => (el as HTMLDetailsElement).open))
  )
    await group.locator("summary").click();
}
export async function filters(page: Page) {
  const button = page.getByLabel("Показати або сховати навігацію календаря", {
    exact: true,
  });
  if ((await button.getAttribute("aria-expanded")) !== "true")
    await button.click();
}
export async function more(page: Page) {
  const menu = page.locator(".studio-more");
  if (!(await menu.evaluate((el) => (el as HTMLDetailsElement).open)))
    await menu.locator("summary").click();
}
export async function advanced(dialog: ReturnType<Page["getByRole"]>) {
  const details = dialog.locator(".studio-advanced");
  if (!(await details.evaluate((el) => (el as HTMLDetailsElement).open)))
    await details.locator(":scope>summary").click();
}
export async function openFitness(page: Page) {
  const nav =
    page.viewportSize()!.width < 760
      ? page.locator(".mobile-nav")
      : page.locator(".sidebar");
  const old = nav.getByRole("button", { name: "Спорт", exact: true });
  if (await old.count()) {
    await old.click();
    return;
  }
  await nav.getByRole("button", { name: "Сьогодні", exact: true }).click();
  await page
    .getByRole("button", { name: "Відкрити трекер", exact: true })
    .click();
}

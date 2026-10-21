import { test, expect } from "@playwright/test";
test("touch feedback matches every theme, is bounded, and never intercepts controls", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Календар", exact: true })
    .click();
  for (const [theme, motif] of [
    ["Pastel", "heart"],
    ["Dark", "star"],
    ["Lagoon", "leaf"],
    ["Blue", "cloud"],
    ["Blossom", "flower"],
  ]) {
    await page
      .getByLabel("Оформлення планера", { exact: true })
      .selectOption(theme);
    const button = page.getByRole("button", {
      name: "Наступний період",
      exact: true,
    });
    await button.click();
    await expect(page.locator(".touch-pulse").last()).toHaveAttribute(
      "data-motif",
      motif,
    );
    expect(
      await page
        .locator(".touch-feedback")
        .evaluate((el) => getComputedStyle(el).pointerEvents),
    ).toBe("none");
  }
  await page
    .getByRole("button", { name: "Попередній період", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".touch-pulse").last()).toHaveAttribute(
    "data-motif",
    "flower",
  );
  expect(await page.locator(".touch-pulse").count()).toBeLessThanOrEqual(5);
  await expect(page.locator(".touch-pulse")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: "Наступний період", exact: true })
    .click();
  await expect(page.locator(".touch-pulse")).toHaveCount(0);
});
test("press state releases on cancellation and calendar companion greets on touch", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Календар", exact: true })
    .click();
  const helper = page.getByRole("button", {
    name: "Привітатися з помічником",
    exact: true,
  });
  const box = await helper.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await expect(helper).toHaveAttribute("data-touch-pressed", "true");
  await page.mouse.up();
  await expect(helper).not.toHaveAttribute("data-touch-pressed");
  await expect(page.locator(".companion-reply")).toBeVisible();
  await expect(page.locator(".companion-reply")).toHaveCount(1);
  await helper.dispatchEvent("pointerdown", {
    button: 0,
    isPrimary: true,
    clientX: 100,
    clientY: 100,
  });
  await expect(helper).toHaveAttribute("data-touch-pressed", "true");
  await helper.dispatchEvent("pointercancel");
  await expect(helper).not.toHaveAttribute("data-touch-pressed");
});

// These regression scenarios exercise the retained classic planner and dashboard.
test.beforeEach(async ({page}) => { await page.addInitScript(() => {
  localStorage.setItem("dayframe-classic-planner", "true");
  if (!localStorage.getItem("dayframe-calendar-view")) localStorage.setItem("dayframe-calendar-view", JSON.stringify("Day"));
}); });

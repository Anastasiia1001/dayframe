import { test, expect } from "@playwright/test";
import { chooseTheme } from "./helpers/product";
test("seasonal themes persist without changing tasks; accessories preserve artwork and ordinary blinking", async ({
  page,
}) => {
  await page.goto("/");
  const before = await page.evaluate(() =>
    localStorage.getItem("dayframe-tasks"),
  );
  for (const theme of ["Autumn", "Halloween"]) {
    await chooseTheme(page, theme);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const art = page.locator(".calendar-companion .mascot-art");
    await expect(art.locator(".seasonal-outfit")).toBeVisible();
    await expect(
      art.locator(
        theme === "Autumn" ? ".seasonal-autumn" : ".seasonal-halloween",
      ),
    ).toBeVisible();
    await expect(art.locator("rect.mascot-eye-left")).toHaveCount(1);
    await expect(art.locator("rect.mascot-eye-right")).toHaveCount(1);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    expect(
      await page.evaluate(() => localStorage.getItem("dayframe-tasks")),
    ).toBe(before);
  }
  await chooseTheme(page, "Pastel");
  await expect(
    page.locator(".calendar-companion .seasonal-outfit"),
  ).not.toBeVisible();
});
test("rest home is a centred light composition and writing privacy opens without losing drafts", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Перепочинок", exact: true })
    .click();
  const home = page.locator(".rest-welcome");
  expect(await home.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(
    "rgba(0, 0, 0, 0)",
  );
  expect((await home.boundingBox())!.width).toBeLessThanOrEqual(960);
  await page.getByRole("button", { name: "Вивантажити думки" }).click();
  await expect(
    page.getByText("Чернетка не зберігається автоматично.", { exact: true }),
  ).toBeVisible();
  const details = page.locator(".thoughts-privacy");
  await expect(details).not.toHaveAttribute("open", "");
  await details.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("open", "");
  await expect(details).toContainText("загальну резервну копію");
  await page.getByLabel("Твої думки").fill("Тимчасова осіння думка");
  await details.locator("summary").click();
  await expect(page.getByLabel("Твої думки")).toHaveValue(
    "Тимчасова осіння думка",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("dayframe-private-rest")),
  ).toBeNull();
});
test("lightweight cards respect reduced transparency and mobile breathing controls stay visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await chooseTheme(page, "Halloween");
  await page
    .locator(".mobile-nav")
    .getByRole("button", { name: "Налаштування", exact: true })
    .click();
  await page
    .getByRole("switch", { name: "Зменшити прозорість", exact: true })
    .check();
  await page
    .locator(".mobile-nav")
    .getByRole("button", { name: "Перепочинок", exact: true })
    .click();
  for (const button of await page.locator(".rest-options>button").all())
    expect(
      await button.evaluate((e) => getComputedStyle(e).backdropFilter),
    ).toBe("none");
  await page.getByRole("button", { name: "Видихнути" }).click();
  await expect(
    page.getByRole("button", { name: "Почати", exact: true }),
  ).toBeInViewport();
  await expect(page.getByLabel("Тривалість перепочинку")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Почати", exact: true }).click();
  expect(
    await page
      .locator(".breath-orb")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
});

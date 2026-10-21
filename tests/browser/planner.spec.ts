import { test, expect, type Page } from "@playwright/test";
async function openCalendar(page: Page) {
  await page.addInitScript(() => localStorage.setItem("dayframe-data-mode", JSON.stringify("demo")));
  await page.goto("/");
  const nav = page.viewportSize()!.width <= 700 ? page.locator(".mobile-nav") : page.locator(".sidebar");
  await nav.getByRole("button", {name:"Календар", exact:true}).click();
}
for (const theme of ["Pastel", "CutePlanner", "Vintage", "Parchment"]) {
  test(`${theme} styles every calendar mode, task editor and saved preference`, async ({page}) => {
    await openCalendar(page);
    await page.getByLabel("Оформлення планера", {exact:true}).selectOption(theme);
    await expect(page.locator("html")).toHaveAttribute("data-planner",theme);
    await expect(page.locator(".planner-decoration, .planner-hero-art")).toHaveAttribute("data-decoration",theme);
    expect(await page.locator(".planner-decoration, .planner-hero-art").evaluate(e => getComputedStyle(e).pointerEvents)).toBe("none");
    await expect(page.locator(".theme-atmosphere")).toHaveCount(0);
    const ink: Record<string,string> = { Pastel:"rgb(64, 51, 38)", CutePlanner:"rgb(101, 71, 54)", Vintage:"rgb(255, 246, 229)", Parchment:"rgb(255, 241, 209)" };
    await expect(page.locator(".calendar-top .primary")).toHaveCSS("color",ink[theme]);
    for (const mode of ["Місяць", "День", "Список", "Тиждень"]) {
      await page.getByRole("button", {name:mode,exact:true}).click();
      await expect(page.getByRole("button", {name:mode,exact:true})).toHaveAttribute("aria-pressed","true");
      if (mode === "Місяць") {
        await expect(page.locator(".calendar-cell")).toHaveCount(42);
        const widths = await page.locator(".calendar-cell").evaluateAll(cells => cells.slice(0,7).map(c => c.getBoundingClientRect().width));
        expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1);
      }
      if (mode === "День" || mode === "Тиждень") await expect(page.locator(".time-canvas")).toBeVisible();
    }
    await page.locator(".calendar-top .primary").click();
    await page.getByLabel("Назва",{exact:true}).fill(`Планер ${theme}`);
    const modalBackground = await page.getByRole("dialog").evaluate(el => getComputedStyle(el).backgroundColor);
    expect(modalBackground).not.toBe("rgb(255, 255, 255)");
    await page.getByRole("button", {name:"Зберегти завдання",exact:true}).click();
    await page.getByRole("button", {name:/^Усі завдання ·/}).click();
    await page.locator(".calendar-task").filter({hasText:`Планер ${theme}`}).getByRole("button",{name:`Планер ${theme}`,exact:true}).click();
    await page.getByLabel("Назва",{exact:true}).fill(`Оновлений планер ${theme}`);
    await page.getByRole("button", {name:"Зберегти завдання",exact:true}).click();
    await page.reload();
    const saved = await page.evaluate(() => ({theme:JSON.parse(localStorage.getItem("dayframe-theme")!),tasks:JSON.parse(localStorage.getItem("dayframe-tasks")!)}));
    expect(saved.theme).toBe(theme);
    expect(saved.tasks.some((t: {title:string}) => t.title === `Оновлений планер ${theme}`)).toBe(true);
  });
}
for (const width of [320,390,768]) {
  test(`planner stays usable at ${width}px and mobile month opens the selected day below`, async ({page}) => {
    await page.setViewportSize({width,height:900});
    await openCalendar(page);
    for (const theme of ["Pastel","CutePlanner","Vintage","Parchment"]) {
      await page.getByLabel("Оформлення планера", {exact:true}).selectOption(theme);
      await page.getByRole("button",{name:"Місяць",exact:true}).click();
      if (width <= 600) {
        await page.locator(".calendar-cell:not(.outside-month)").nth(5).locator(".month-day").click();
        await expect(page.locator(".month-mobile-preview .agenda-day")).toHaveCount(1);
        await expect(page.getByRole("button",{name:"Місяць",exact:true})).toHaveAttribute("aria-pressed","true");
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole("button",{name:"День",exact:true}).click();
      await expect(page.locator(".time-canvas")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.emulateMedia({reducedMotion:"reduce"});
    expect(await page.locator(".planner-decoration, .planner-hero-art").evaluate(e => getComputedStyle(e).animationName)).toBe("none");
  });
}

// These regression scenarios exercise the retained classic planner and dashboard.
test.beforeEach(async ({page}) => { await page.addInitScript(() => {
  localStorage.setItem("dayframe-classic-planner", "true");
  if (!localStorage.getItem("dayframe-calendar-view")) localStorage.setItem("dayframe-calendar-view", JSON.stringify("Day"));
}); });

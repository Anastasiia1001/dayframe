import { test, expect } from "@playwright/test";
test("mascot palette is stable across dark themes and ambience respects preferences", async ({ page }) => {
  await page.goto("/");
  const palette = async () => page.locator(".mascot-art").first().evaluate(el => [...el.querySelectorAll("[fill], [stroke]")].map(node => [getComputedStyle(node).fill, getComputedStyle(node).stroke]));
  const original = await palette();
  for (const theme of ["Dark", "Moonlight"]) {
    await page.evaluate(t => localStorage.setItem("dayframe-theme", JSON.stringify(t)), theme);
    await page.reload();
    expect(await palette()).toEqual(original);
    await expect(page.locator(".theme-atmosphere")).toHaveAttribute("data-motif", "star");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".theme-atmosphere")).toBeHidden();
  await page.evaluate(() => localStorage.setItem("dayframe-ambient", "false"));
  await page.reload();
  await expect(page.locator(".theme-atmosphere")).toHaveCount(0);
});
test("weekly and yearly tasks carry separate readable cadence badges", async ({ page }) => {
  await page.addInitScript(() => {
    const date = new Date().toLocaleDateString("en-CA");
    localStorage.setItem("dayframe-tasks", JSON.stringify(["weekly", "yearly"].map((recurrence,i) => ({ id:`cadence-${i}`, title:`Цикл ${i}`, category:"Day", date, recurrence, priority:"Medium", notes:"", completed:false, disabled:false }))));
  });
  await page.goto("/");
  const weekly = page.locator('.task-row[data-cadence="weekly"]');
  const yearly = page.locator('.task-row[data-cadence="yearly"]');
  await expect(weekly.locator(".cadence-badge")).toHaveText("Щотижня");
  await expect(yearly.locator(".cadence-badge")).toHaveText("Щороку");
  expect(await weekly.evaluate(el => getComputedStyle(el).backgroundColor)).not.toEqual(await yearly.evaluate(el => getComputedStyle(el).backgroundColor));
});

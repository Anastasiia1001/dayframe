import { test, expect } from "@playwright/test";
test("wordmark fits the compact sidebar across planner themes", async ({ page }) => {
  await page.setViewportSize({width:1000,height:900});
  await page.goto("/");
  for (const theme of ["Pastel", "NeonAzure", "Dark"]) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    const bounds = await page.locator('.brand').evaluate(el => {
      const sidebar=el.closest('.sidebar')!.getBoundingClientRect();
      const word=el.querySelector('.brand-word')!.getBoundingClientRect();
      return {right:word.right,limit:sidebar.right,left:word.left,start:sidebar.left};
    });
    expect(bounds.right).toBeLessThan(bounds.limit - 4);
    expect(bounds.left).toBeGreaterThan(bounds.start);
  }
});

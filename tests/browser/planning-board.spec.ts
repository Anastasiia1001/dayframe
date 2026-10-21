import { test, expect } from "@playwright/test";
test("planning board copies recurring templates and moves tasks without changing cadence", async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("dayframe-tasks")) localStorage.setItem("dayframe-tasks", JSON.stringify([
      { id:"weekly", title:"Тижневий огляд", category:"Day", date:"2026-01-01", recurrence:"weekly", priority:"Normal", notes:"", completed:false, disabled:false },
      { id:"yearly", title:"Річна перевірка", category:"Year", date:"2026-01-01", recurrence:"yearly", priority:"Normal", notes:"", completed:false, disabled:false, isTemplate:true },
    ]));
  });
  await page.goto("/");
  await page.locator(".sidebar").getByRole("button", { name:"Особисте", exact:true }).click();
  await expect(page.getByRole("tab")).toHaveCount(0);
  const today = page.getByRole("region", { name:"Сьогодні", exact:true });
  const tomorrow = page.getByRole("region", { name:"Завтра", exact:true });
  const library = page.getByRole("region", { name:"Беклог", exact:true });
  await today.locator(".drag-grip").dragTo(tomorrow);
  await expect(tomorrow.getByRole("button", { name:"Тижневий огляд", exact:true })).toBeVisible();
  await library.getByRole("button", { name:"На завтра", exact:true }).click();
  await expect(library.getByRole("button", { name:"Річна перевірка", exact:true })).toBeVisible();
  await expect(tomorrow.getByRole("button", { name:"Річна перевірка", exact:true })).toBeVisible();
  await expect(tomorrow.locator('[data-cadence="yearly"]')).toHaveCount(1);
  await tomorrow.locator('[data-cadence="weekly"] .drag-grip').dragTo(library);
  await expect(library.getByRole("button", { name:"Тижневий огляд", exact:true })).toBeVisible();
  await page.locator(".sidebar").getByRole("button", { name:"Сьогодні", exact:true }).click();
  await expect(page.getByText("Тижневий огляд", {exact:true})).toHaveCount(0);
  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("dayframe-tasks")!));
  expect(saved).toHaveLength(3);
  expect(saved.find((t: {id:string}) => t.id === "weekly").recurrence).toBe("weekly");
});
test("manual Jira copy creates a local task with safe external link and persists", async ({ page }) => {
  await page.goto("/");
  await page.locator(".sidebar").getByRole("button", { name:"Особисте", exact:true }).click();
  await page.getByRole("button", { name:"Додати з Jira вручну" }).click();
  await page.getByLabel("Назва тікета", {exact:true}).fill("TEAM-42 Полагодити пошук");
  await page.getByLabel("Посилання на тікет (необов’язково)").fill("https://example.atlassian.net/browse/TEAM-42");
  await page.getByRole("button", { name:"Додати у беклог", exact:true }).click();
  await expect(page.getByRole("link", { name:"Тікет Jira ↗" })).toHaveAttribute("rel", "noopener noreferrer");
  await page.reload();
  const task = await page.evaluate(() => JSON.parse(localStorage.getItem("dayframe-tasks")!).find((t: { title:string }) => t.title.startsWith("TEAM-42")));
  expect(task.recurrence).toBe("once");
  expect(task.inBacklog).toBe(true);
  expect(task.jiraUrl).toBe("https://example.atlassian.net/browse/TEAM-42");
});

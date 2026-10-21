import { test, expect } from "@playwright/test";
test("year plans move through month and week to a day without changing recurrence", async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("dayframe-tasks")) localStorage.setItem("dayframe-tasks", JSON.stringify([
      { id:"yearly", title:"Річна перевірка", category:"Year", date:"2026-01-01", recurrence:"yearly", priority:"Normal", notes:"", completed:false, disabled:false, isTemplate:true },
    ]));
  });
  await page.goto("/");
  await page.locator(".sidebar").getByRole("button", { name:"Особисте", exact:true }).click();
  await expect(page.getByRole("tab")).toHaveCount(0);
  const year = page.getByRole("region", {name:"Рік",exact:true});
  const month = page.getByRole("region", {name:"Місяць",exact:true});
  const week = page.getByRole("region", {name:"Тиждень",exact:true});
  const day = page.getByRole("region", {name:"День",exact:true});
  await year.locator(".drag-grip").dragTo(month);
  await expect(year.locator(".planning-card")).toHaveCount(1);
  await expect(month.locator(".planning-card")).toHaveCount(1);
  await expect(month.locator(".cadence-badge")).toContainText("Щороку");
  await month.locator(".drag-grip").dragTo(week);
  await expect(month.locator(".planning-card")).toHaveCount(0);
  await expect(week.locator(".planning-card")).toHaveCount(1);
  await page.reload();
  await page.locator(".sidebar").getByRole("button", {name:"Особисте",exact:true}).click();
  await week.getByLabel("Блок для Річна перевірка").selectOption("day");
  await expect(day.locator(".planning-card")).toHaveCount(1);
  await day.getByLabel("Блок для Річна перевірка").selectOption("backlog");
  await expect(page.getByRole("region", {name:"Беклог",exact:true}).locator(".planning-card")).toHaveCount(1);
  await page.locator(".sidebar").getByRole("button", {name:"Сьогодні",exact:true}).click();
  await expect(page.getByText("Річна перевірка", {exact:true})).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("dayframe-tasks")!));
  expect(saved).toHaveLength(2);
  expect(saved.find((t: {isTemplate?:boolean}) => !t.isTemplate)).toMatchObject({recurrence:"yearly",planningHorizon:"backlog",inBacklog:true});
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

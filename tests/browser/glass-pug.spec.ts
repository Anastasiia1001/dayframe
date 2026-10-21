import { test, expect } from "@playwright/test";
test("pug mascot keeps its palette in dark themes and has layered idles", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Налаштування", exact: true })
    .click();
  await page.getByRole("button", { name: /Мопс Бублик/ }).click();
  await expect(
    page.locator(".mascot-choice[aria-pressed=true] .mascot-pug"),
  ).toHaveCount(1);
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Календар", exact: true })
    .click();
  const pug = page.locator(".calendar-companion .mascot-pug");
  await expect(pug).toBeVisible();
  const colors = await pug.evaluate((el) =>
    [...el.querySelectorAll("[fill],[stroke]")].map((e) => [
      e.getAttribute("fill"),
      e.getAttribute("stroke"),
    ]),
  );
  for (const theme of ["Dark", "Moonlight"]) {
    await page
      .getByLabel("Оформлення планера", { exact: true })
      .selectOption(theme);
    expect(
      await pug.evaluate((el) =>
        [...el.querySelectorAll("[fill],[stroke]")].map((e) => [
          e.getAttribute("fill"),
          e.getAttribute("stroke"),
        ]),
      ),
    ).toEqual(colors);
  }
  expect(
    await pug
      .locator(".mascot-body")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("companion-idle");
  expect(
    await pug
      .locator(".mascot-tongue")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("pug-pant");
  await page.reload();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Календар", exact: true })
    .click();
  await expect(pug).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await pug
      .locator(".mascot-body")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});
test("calendar pockets share notes and reminders with the day and date picker navigates", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Календар", exact: true })
    .click();
  await page.getByRole("button", { name: "День", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Відкрити: Нотатки вибраного дня",
      exact: true,
    })
    .click();
  const popup = page.getByRole("dialog");
  await expect(popup).toBeVisible();
  await popup
    .getByLabel("Нотатки у віконці", { exact: true })
    .fill("Запис зі скляного віконця");
  await page.keyboard.press("Escape");
  await expect(popup).toBeHidden();
  await expect(
    page.getByRole("textbox", { name: "Нотатки дня", exact: true }),
  ).toHaveValue("Запис зі скляного віконця");
  await page
    .getByRole("button", {
      name: "Відкрити: Нагадування вибраного дня",
      exact: true,
    })
    .click();
  await popup
    .getByLabel("Нове нагадування", { exact: true })
    .fill("Відправити документ");
  await popup.getByRole("button", { name: "Додати", exact: true }).click();
  await popup
    .getByRole("button", { name: "Закрити віконце", exact: true })
    .click();
  await expect(
    page
      .locator(".reminders-sheet")
      .getByLabel("Текст нагадування Відправити документ", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Відкрити мінікалендар", exact: true })
    .click();
  await expect(popup.locator(".mini-date-grid button")).toHaveCount(42);
  await popup
    .getByLabel("Точна дата у віконці", { exact: true })
    .fill("2026-12-15");
  await expect(page.getByLabel("Перейти до дати", { exact: true })).toHaveValue(
    "2026-12-15",
  );
  await expect(
    page.getByRole("textbox", { name: "Нотатки дня", exact: true }),
  ).toHaveValue("");
});
for (const width of [320, 390, 1440])
  test(`pocket sizing and glass at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page
      .locator(width <= 700 ? ".mobile-nav" : ".sidebar")
      .getByRole("button", { name: "Календар", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Відкрити мінікалендар", exact: true })
      .click();
    const popup = page.getByRole("dialog");
    await expect(popup).toBeVisible();
    const rect = await popup.boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(width);
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(900);
    expect(
      await popup.evaluate((el) => getComputedStyle(el).backdropFilter),
    ).toContain("blur");
    await page.keyboard.press("Escape");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("task pocket creates and edits a real task and outside click dismisses it",async({page})=>{
  await page.goto("/");await page.locator(".sidebar").getByRole("button",{name:"Календар",exact:true}).click();
  const trigger=page.getByRole("button",{name:"Відкрити: Справи вибраного дня",exact:true});
  await trigger.click();let popup=page.getByRole("dialog");
  await popup.getByRole("button",{name:"Додати справу на цю дату",exact:true}).click();
  await page.getByRole("dialog").getByLabel("Назва",{exact:true}).fill("Справжня справа з віконця");
  await page.getByRole("button",{name:"Зберегти завдання",exact:true}).click();
  await trigger.click();popup=page.getByRole("dialog");
  await popup.getByRole("button",{name:"Редагувати Справжня справа з віконця",exact:true}).click();
  await page.getByRole("dialog").getByLabel("Назва",{exact:true}).fill("Оновлена справа з віконця");
  await page.getByRole("button",{name:"Зберегти завдання",exact:true}).click();
  await trigger.click();popup=page.getByRole("dialog");await expect(popup.getByText("Оновлена справа з віконця",{exact:true})).toBeVisible();
  await page.locator(".planner-kicker").click();await expect(popup).toBeHidden();await expect(trigger).toHaveAttribute("aria-expanded","false");
});

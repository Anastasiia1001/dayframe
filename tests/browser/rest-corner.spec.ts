import { test, expect } from "@playwright/test";
import { themes } from "../../src/appearance";
import { chooseTheme, more } from "./helpers/product";
const date = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Kyiv" }).format(
    new Date(),
  );
const seed = async (page: any) =>
  page.addInitScript(() => {
    if (localStorage.getItem("dayframe-tasks")) return;
    const day = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Kyiv",
    }).format(new Date());
    localStorage.setItem(
      "dayframe-tasks",
      JSON.stringify(
        [
          "Обрати головне",
          "Відкласти ескіз",
          "Ще одна справа",
          "Щотижнева справа",
        ].map((title, i) => ({
          id: "rest-" + i,
          title,
          date: day,
          recurrence: i === 3 ? "weekly" : "once",
          category: "Day",
          priority: "Normal",
          notes: "Збережені деталі",
          completed: false,
          disabled: false,
        })),
      ),
    );
  });
const openRest = async (page: any) =>
  page
    .locator(".sidebar")
    .getByRole("button", { name: "Перепочинок", exact: true })
    .click();
test("all themes have themed glass, working navigation icons and a persistent dense-surface setting", async ({
  page,
}) => {
  test.setTimeout(60000); // 23 full UI theme transitions, then settings and reload.
  await page.goto("/");
  for (const name of ["Сьогодні", "Календар", "Плани", "Перепочинок"])
    await expect(
      page
        .locator(".sidebar")
        .getByRole("button", { name, exact: true })
        .locator("svg"),
    ).toBeVisible();
  for (const theme of themes) {
    await chooseTheme(page, theme.id);
    const materials = await page.evaluate(() => {
      const nav = getComputedStyle(document.querySelector(".sidebar")!),
        grid = getComputedStyle(document.querySelector(".studio-week")!),
        app = getComputedStyle(document.querySelector(".product-layout")!);
      return {
        nav: nav.backgroundColor,
        blur: nav.backdropFilter,
        grid: grid.backdropFilter,
        token: app.getPropertyValue("--surface-glass"),
      };
    });
    expect(materials.blur).toContain("blur");
    expect(materials.grid).toBe("none");
    expect(materials.token).toContain("color");
  }
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Джерела", exact: true })
    .click();
  await expect(page.locator(".connections")).not.toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Налаштування", exact: true })
    .click();
  await page
    .getByRole("switch", { name: "Зменшити прозорість", exact: true })
    .check();
  await page.reload();
  expect(await page.locator("html").getAttribute("data-theme")).toBe(
    themes.at(-1)!.id,
  );
  expect(
    await page
      .locator(".sidebar")
      .evaluate((e) => getComputedStyle(e).backdropFilter),
  ).toBe("none");
  await expect(page.locator(".connections")).not.toBeVisible();
});
test("private thoughts require explicit saving, guard navigation and stay out of global search and backup", async ({
  page,
}) => {
  await page.goto("/");
  await openRest(page);
  await page.getByRole("button", { name: "Вивантажити думки" }).click();
  const field = page.getByLabel("Твої думки");
  await field.fill("Це мій особистий запис про тишу");
  expect(
    await page.evaluate(() => localStorage.getItem("dayframe-private-rest")),
  ).toBeNull();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Календар", exact: true })
    .click();
  const guard = page.getByRole("dialog", { name: "Незбережена чернетка" });
  await expect(guard).toBeVisible();
  await guard.getByRole("button", { name: "Залишитися", exact: true }).click();
  await expect(field).toHaveValue("Це мій особистий запис про тишу");
  await expect(
    page.getByRole("button", { name: "Календар", exact: true }).first(),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Зберегти на цьому пристрої", exact: true })
    .click();
  await page.reload();
  await openRest(page);
  await page.getByRole("button", { name: "Вивантажити думки" }).click();
  await expect(page.locator(".rest-saved")).toContainText(
    "Це мій особистий запис про тишу",
  );
  await page.locator(".search-trigger").click();
  await page
    .getByPlaceholder("Пошук серед подій, повідомлень і завдань…")
    .fill("Це мій особистий запис про тишу");
  await expect(page.locator(".search-results")).toContainText(
    "Нічого не знайдено",
  );
  await expect(page.locator(".search-results").getByRole("button")).toHaveCount(
    0,
  );
  await page.keyboard.press("Escape");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Календар", exact: true })
    .click();
  await more(page);
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Резервна копія", exact: true })
    .click();
  const download = await downloadPromise;
  const fs = await import("node:fs/promises");
  const backup = await fs.readFile((await download.path())!, "utf8");
  expect(backup).not.toContain("Це мій особистий запис про тишу");
  expect(backup).not.toContain("dayframe-private-rest");
  await openRest(page);
  await page.getByRole("button", { name: "Вивантажити думки" }).click();
  await page.getByRole("button", { name: /Видалити запис від/ }).click();
  const deletion = page.getByRole("dialog", {
    name: "Видалити особистий запис",
  });
  await deletion
    .getByRole("button", { name: "Залишити запис", exact: true })
    .click();
  await expect(page.locator(".rest-saved")).toBeVisible();
  await page.getByRole("button", { name: /Видалити запис від/ }).click();
  await deletion
    .getByRole("button", { name: "Видалити назавжди", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("dayframe-private-rest")!).length,
    ),
  ).toBe(0);
});
test("discard and save-on-exit are explicit, failed note writes retain the draft", async ({
  page,
}) => {
  await page.goto("/");
  await openRest(page);
  await page.getByRole("button", { name: "Вивантажити думки" }).click();
  await page.getByLabel("Твої думки").fill("Не загуби мене");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    (window as any).restoreStorage = () => {
      Storage.prototype.setItem = original;
    };
    Storage.prototype.setItem = function (k, v) {
      if (k === "dayframe-private-rest") throw Error("quota");
      original.call(this, k, v);
    };
  });
  await page
    .getByRole("button", { name: "Зберегти на цьому пристрої", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Не вдалося зберегти");
  await expect(page.getByLabel("Твої думки")).toHaveValue("Не загуби мене");
  await page.evaluate(() => (window as any).restoreStorage());
  await page.getByRole("button", { name: "Інший спосіб перепочити" }).click();
  await page
    .getByRole("dialog", { name: "Незбережена чернетка" })
    .getByRole("button", { name: "Зберегти й перейти" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Що тобі зараз потрібно?" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("dayframe-private-rest")!)[0].text,
    ),
  ).toBe("Не загуби мене");
  await page.getByRole("button", { name: "Вивантажити думки" }).click();
  await page.getByLabel("Твої думки").fill("Тимчасове");
  await page.getByRole("button", { name: "Інший спосіб перепочити" }).click();
  await page
    .getByRole("dialog", { name: "Незбережена чернетка" })
    .getByRole("button", { name: "Відкинути й перейти" })
    .click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("dayframe-private-rest")!).length,
    ),
  ).toBe(1);
});
test("breathing starts manually, pauses, hides time, completes and cleans up on exit with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  await openRest(page);
  await page.getByRole("button", { name: "Видихнути" }).click();
  await page.clock.runFor(5000);
  await expect(page.locator(".breath-clock")).toHaveText("1:00");
  await page.getByRole("button", { name: "Почати", exact: true }).click();
  expect(
    await page
      .locator(".breath-orb")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await page.clock.runFor(10000);
  await expect(page.locator(".breath-clock")).toHaveText("0:50");
  await page.getByRole("button", { name: "Пауза", exact: true }).click();
  await page.clock.runFor(5000);
  await expect(page.locator(".breath-clock")).toHaveText("0:50");
  await page.getByRole("checkbox", { name: "Показувати таймер" }).uncheck();
  await expect(page.locator(".breath-clock")).toHaveText("");
  await page.getByRole("button", { name: "Продовжити", exact: true }).click();
  await page.clock.runFor(50000);
  await expect(page.locator(".breath-instruction")).toContainText(
    "Пауза завершена",
  );
  await page.getByRole("button", { name: "Інший спосіб перепочити" }).click();
  await page.clock.runFor(120000);
  await page.getByRole("button", { name: "Видихнути" }).click();
  await expect(page.locator(".breath-clock")).toHaveText("1:00");
});
test("lighten previews, applies and undoes actual task changes without unexpected copies", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/");
  const original = await page.evaluate(() =>
    localStorage.getItem("dayframe-tasks"),
  );
  await openRest(page);
  await page.getByRole("button", { name: "Полегшити день" }).click();
  await page
    .getByRole("button", { name: "Головне: Обрати головне", exact: true })
    .click();
  await page
    .getByLabel("Дія: Відкласти ескіз", { exact: true })
    .selectOption("backlog");
  await page
    .getByLabel("Дія: Щотижнева справа", { exact: true })
    .selectOption("date");
  await page
    .getByLabel("Дата: Щотижнева справа", { exact: true })
    .fill("2026-12-01");
  await page
    .getByRole("button", { name: "Переглянути зміни", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Попередній перегляд змін" }),
  ).toContainText("лише це виконання");
  expect(
    await page.evaluate(() => localStorage.getItem("dayframe-tasks")),
  ).toBe(original);
  await page
    .getByRole("button", { name: "Застосувати зміни", exact: true })
    .click();
  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("dayframe-tasks")!),
  );
  expect(after).toHaveLength(5);
  expect(after[0].focusDates).toEqual([date()]);
  expect(after[1].inBacklog).toBe(true);
  expect(after[3].seriesExceptions[date()].cancelled).toBe(true);
  expect(after[4].recurrence).toBe("once");
  await page
    .getByRole("button", { name: "Скасувати зміни", exact: true })
    .click();
  expect(
    await page.evaluate(() => localStorage.getItem("dayframe-tasks")),
  ).toBe(original);
});
test("mobile rest flows fit, choose at most three priorities and add rest only after confirmation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto("/");
  await page
    .locator(".mobile-nav")
    .getByRole("button", { name: "Перепочинок", exact: true })
    .click();
  await page.getByRole("button", { name: "Полегшити день" }).click();
  for (const title of [
    "Обрати головне",
    "Відкласти ескіз",
    "Ще одна справа",
    "Щотижнева справа",
  ])
    await page
      .getByRole("button", { name: `Головне: ${title}`, exact: true })
      .click();
  await expect(page.getByRole("alert")).toContainText("трьох");
  await page
    .getByRole("checkbox", { name: "Додати блок відпочинку в календар" })
    .check();
  await page
    .getByRole("button", { name: "Переглянути зміни", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Попередній перегляд змін" }),
  ).toContainText("Додати блок відпочинку");
  await page
    .getByRole("button", { name: "Застосувати зміни", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("dayframe-tasks")!).filter(
          (t: any) => t.title === "Перепочинок",
        ).length,
    ),
  ).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});

test("saving a thought preserves notes written in another tab", async ({
  page,
}) => {
  await page.goto("/");
  await openRest(page);
  await page.getByRole("button", { name: "Вивантажити думки" }).click();
  await page.getByLabel("Твої думки").fill("Чернетка у цій вкладці");
  await page.evaluate(() =>
    localStorage.setItem(
      "dayframe-private-rest",
      JSON.stringify([
        {
          id: "other-tab",
          text: "Запис з іншої вкладки",
          updated: new Date().toISOString(),
        },
      ]),
    ),
  );
  await page
    .getByRole("button", { name: "Зберегти на цьому пристрої", exact: true })
    .click();
  await expect(page.locator(".rest-saved")).toContainText(
    "Запис з іншої вкладки",
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("dayframe-private-rest")!).length,
    ),
  ).toBe(2);
});

test("postponing one untimed recurring execution removes it from today without deleting its series", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("dayframe-tasks")) return;
    const d = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Kyiv",
    }).format(new Date());
    localStorage.setItem(
      "dayframe-tasks",
      JSON.stringify([
        {
          id: "series",
          title: "Одне щотижневе виконання",
          date: d,
          recurrence: "weekly",
          category: "Day",
          priority: "Normal",
          notes: "",
          completed: false,
          disabled: false,
        },
      ]),
    );
  });
  await page.goto("/");
  await expect(page.locator(".studio-untimed")).toContainText(
    "Одне щотижневе виконання",
  );
  await openRest(page);
  await page.getByRole("button", { name: "Полегшити день" }).click();
  await page
    .getByLabel("Дія: Одне щотижневе виконання", { exact: true })
    .selectOption("backlog");
  await page
    .getByRole("button", { name: "Переглянути зміни", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Застосувати зміни", exact: true })
    .click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Календар", exact: true })
    .click();
  await expect(page.locator(".studio-untimed")).not.toContainText(
    "Одне щотижневе виконання",
  );
  await expect(
    page.getByRole("region", { name: "Контекст дня" }),
  ).not.toContainText("Одне щотижневе виконання");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("dayframe-tasks")!).find(
          (t: any) => t.id === "series",
        ).recurrence,
    ),
  ).toBe("weekly");
});

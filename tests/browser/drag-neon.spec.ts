import { openPlanTray } from "./helpers/product";
import { chooseTheme } from "./helpers/product";
import { test, expect } from "@playwright/test";
const today = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Kyiv" }).format(
    new Date(),
  );
const seed = (date: string) => [
  {
    id: "loose",
    title: "Справжнє перетягування",
    date,
    inBacklog: false,
    category: "Day",
    recurrence: "once",
    priority: "Normal",
    notes: "",
    completed: false,
    disabled: false,
    deadline: "2027-01-15",
  },
  {
    id: "backlog",
    title: "Ідея без дати",
    date: "",
    inBacklog: true,
    category: "Day",
    recurrence: "once",
    priority: "Normal",
    notes: "",
    completed: false,
    disabled: false,
  },
];
async function drag(page: any, from: any, to: any) {
  await from.scrollIntoViewIfNeeded();
  await to.scrollIntoViewIfNeeded();
  const a = await from.boundingBox(),
    b = await to.boundingBox();
  if (!a || !b) throw Error("Missing drag target");
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + 2, { steps: 16 });
  await page.mouse.up();
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript((tasks) => {
    if (localStorage.getItem("dayframe-tasks")) return;
    localStorage.setItem("dayframe-tasks", JSON.stringify(tasks));
    localStorage.setItem("dayframe-calendar-left", "true");
    localStorage.setItem("dayframe-calendar-right", "false");
  }, seed(today()));
});
test("real pointer drags untimed and backlog tasks into hours and moves an event across days", async ({
  page,
}) => {
  await page.goto("/");
  const loose = page
    .locator(".studio-untimed button")
    .filter({ hasText: "Справжнє перетягування" });
  const day = page.locator(`.studio-time-day[data-studio-day="${today()}"]`);
  const slot = day.getByRole("button", { name: new RegExp("о 09:00$") });
  await drag(page, loose, slot);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("dayframe-tasks")!)[0].scheduledStart,
      ),
    )
    .toBe("09:00");
  await expect(
    page.getByRole("dialog", { name: "Редактор запису" }),
  ).not.toBeVisible();
  const next = page.locator(".studio-time-day").first();
  const targetDate = await next.getAttribute("data-studio-day");
  const secondSlot = next.getByRole("button", { name: new RegExp("о 10:00$") });
  await drag(page, page.locator(".studio-event-main"), secondSlot);
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("dayframe-tasks")!)[0].date,
      ),
    )
    .toBe(targetDate);
  await openPlanTray(page);
  await drag(
    page,
    page.getByLabel("Перетягнути Ідея без дати", { exact: true }),
    day.getByRole("button", { name: new RegExp("о 11:00$") }),
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("dayframe-tasks")!)[1].scheduledStart,
      ),
    )
    .toBe("11:00");
  await page.reload();
  await expect(page.locator(".studio-event-main")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("dayframe-tasks")!)[0].deadline,
    ),
  ).toBe("2027-01-15");
});
test("monthly tasks move to another date without acquiring an arbitrary time", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Місяць", exact: true }).click();
  const target = page.locator(".studio-month-grid>div").nth(3);
  const targetDate = await target.getAttribute("data-studio-day");
  await drag(
    page,
    page
      .locator(".studio-month-event")
      .filter({ hasText: "Справжнє перетягування" }),
    target,
  );
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("dayframe-tasks")!)[0].date,
      ),
    )
    .toBe(targetDate);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("dayframe-tasks")!)[0].scheduledStart,
    ),
  ).toBeUndefined();
});
test("touch drags an untimed task into the mobile schedule", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    timezoneId: "Europe/Kyiv",
  });
  const page = await context.newPage();
  await page.addInitScript(
    (tasks) => localStorage.setItem("dayframe-tasks", JSON.stringify(tasks)),
    seed(today()),
  );
  await page.goto(baseURL!);
  const task = page
    .locator(".studio-untimed button")
    .filter({ hasText: "Справжнє перетягування" });
  const slot = page.getByRole("button", { name: /Створити подію .* о 09:00$/ });
  await slot.scrollIntoViewIfNeeded();
  const a = await task.boundingBox(),
    b = await slot.boundingBox();
  if (!a || !b) throw Error();
  const cdp = await context.newCDPSession(page);
  const x = a.x + a.width / 2,
    y = a.y + a.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let i = 1; i <= 12; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: x + ((b.x + 40 - x) * i) / 12, y: y + ((b.y + 2 - y) * i) / 12 },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("dayframe-tasks")!)[0].scheduledStart,
      ),
    )
    .toBe("09:00");
  await openPlanTray(page);
  const handle = page.getByLabel("Перетягнути Ідея без дати", { exact: true });
  await handle.scrollIntoViewIfNeeded();
  const source = await handle.boundingBox(),
    dest = await page
      .getByRole("button", { name: /Створити подію .* о 10:00$/ })
      .boundingBox();
  if (!source || !dest) throw Error();
  const sx = source.x + source.width / 2,
    sy = source.y + source.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: sx, y: sy }],
  });
  for (let i = 1; i <= 16; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: sx + ((dest.x + 70 - sx) * i) / 16,
          y: sy + ((dest.y + 2 - sy) * i) / 16,
        },
      ],
    });
    await page.waitForTimeout(15);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("dayframe-tasks")!)[1].scheduledStart,
      ),
    )
    .toBe("10:00");
  await context.close();
});
test("five neon themes and four new mascots are selectable, readable and persistent", async ({
  page,
}) => {
  await page.goto("/");
  for (const theme of [
    "NeonAzure",
    "NeonOcean",
    "NeonCobalt",
    "NeonAurora",
    "NeonIce",
  ]) {
    await chooseTheme(page, theme);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBeTruthy();
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Налаштування", exact: true })
    .click();
  for (const name of [
    "Аксолотль Булька",
    "Пінгвін Пломбір",
    "Дракончик Люм",
    "Видра Крихта",
  ]) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await expect(
      page.locator(".mascot-choice[aria-pressed=true] .mascot-eye-right"),
    ).toHaveCount(1);
  }
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "NeonIce");
  await expect(page.locator(".calendar-companion .mascot-otter")).toBeVisible();
});

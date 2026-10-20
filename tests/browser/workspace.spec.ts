import { test, expect, type Page } from "@playwright/test";
const date = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Kyiv",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const status = {
  providers: [
    {
      id: "outlook-work",
      name: "Outlook · Work",
      configured: true,
      connected: true,
    },
    {
      id: "outlook-personal",
      name: "Outlook · Personal",
      configured: true,
      connected: false,
    },
    {
      id: "google",
      name: "Google Calendar",
      configured: true,
      connected: true,
    },
    { id: "slack", name: "Slack", configured: true, connected: true },
  ],
  disabled: ["Jira", "Confluence"],
  sessionStorage: "memory",
  sessionHours: 8,
};
const calendarEvent = (
  id: string,
  title: string,
  source: string,
  externalUid?: string,
) => ({
  id,
  title,
  source,
  date,
  start: "11:00",
  end: "12:00",
  location: "Team call",
  participants: ["Maya"],
  reminder: true,
  externalUid,
});
async function go(page: Page, name: string) {
  const nav =
    page.viewportSize()!.width <= 700
      ? page.locator(".mobile-nav")
      : page.locator(".sidebar");
  await nav
    .getByRole("button", { name: new RegExp("^" + name + "(?:\\s*\\d+)?$") })
    .click();
}
async function demo(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem("dayframe-data-mode", JSON.stringify("demo")),
  );
  await page.goto("/");
  await expect(page.getByText("Daily standup", { exact: true })).toBeVisible();
}
test("live defaults never imply fake connections; unsupported work sources stay disabled", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Live workspace", { exact: true })).toBeVisible();
  await expect(
    page.getByText("No calendar events loaded for today.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("GAME-89322", { exact: false })).toHaveCount(0);
  await go(page, "Settings");
  await expect(
    page.locator(".connection-state").filter({ hasText: "Not connected" }),
  ).toHaveCount(4);
  await expect(page.locator(".connection-card a")).toHaveCount(0);
  await expect(
    page.getByText("Disabled · no access", { exact: true }),
  ).toHaveCount(2);
  await go(page, "Work");
  await expect(
    page.getByText("No Slack activity loaded.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".period-tabs")).toHaveCount(0);
});
test("task CRUD, completion and preferences persist across reloads", async ({
  page,
}) => {
  await demo(page);
  await page.locator(".quick-add").click();
  await page.getByLabel("Title", { exact: true }).fill("Book dental checkup");
  await page.getByLabel("Recurrence", { exact: true }).selectOption("yearly");
  await page.getByRole("button", { name: "Save task" }).click();
  await page
    .getByLabel("Complete Book dental checkup", { exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "A tiny win" }),
  ).toBeVisible();
  await page.reload();
  await go(page, "Personal");
  await expect(
    page.getByLabel("Uncomplete Book dental checkup", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Edit Book dental checkup", { exact: true }).click();
  await page
    .getByLabel("Title", { exact: true })
    .fill("Book dentist appointment");
  await page.getByRole("button", { name: "Save task" }).click();
  await page
    .getByLabel("Postpone Book dentist appointment", { exact: true })
    .click();
  await page
    .getByLabel("Delete Book dentist appointment", { exact: true })
    .click();
  await expect(
    page.getByText("Book dentist appointment", { exact: true }),
  ).toHaveCount(0);
  await go(page, "Settings");
  await page.getByRole("button", { name: "Blossom", exact: true }).click();
  await page
    .getByLabel("Show the little companion", { exact: false })
    .uncheck();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "Blossom");
  await expect(page.getByLabel("A little encouragement")).toHaveCount(0);
});
test("connected live accounts use actual adapters, deduplicate events, and isolate provider failure", async ({
  page,
}) => {
  let failGoogle = false;
  await page.route("**/api/status", (r) => r.fulfill({ json: status }));
  await page.route("**/api/calendar/outlook-work?*", (r) => {
    expect(["Europe/Kiev", "Europe/Kyiv"]).toContain(
      new URL(r.request().url()).searchParams.get("timeZone"),
    );
    return r.fulfill({
      json: {
        events: [
          calendarEvent(
            "o1",
            "Shared design review",
            "Outlook",
            "shared-event",
          ),
        ],
      },
    });
  });
  await page.route("**/api/calendar/google?*", (r) =>
    r.fulfill(
      failGoogle
        ? { status: 503, json: { error: "Calendar temporarily unavailable" } }
        : {
            json: {
              events: [
                calendarEvent(
                  "g1",
                  "Shared design review",
                  "Google",
                  "shared-event",
                ),
                calendarEvent("g2", "Piano lesson", "Google"),
              ],
            },
          },
    ),
  );
  await page.route("**/api/slack?*", (r) =>
    r.fulfill({
      json: {
        items: [
          {
            id: "s1",
            group: "Direct mentions",
            channel: "product",
            author: "Maya",
            summary: "Please review the new navigation",
            why: "You were directly mentioned.",
            time: new Date().toISOString(),
          },
        ],
        truncated: false,
      },
    }),
  );
  await page.goto("/");
  await expect(page.locator(".event-info strong")).toHaveCount(2);
  await expect(
    page
      .locator(".event-info strong")
      .filter({ hasText: "Shared design review" }),
  ).toHaveCount(1);
  await expect(
    page
      .locator(".digest-toggle")
      .getByText("Please review the new navigation", { exact: true }),
  ).toBeVisible();
  failGoogle = true;
  await page
    .locator(".workspace-toolbar")
    .getByRole("button", { name: "Refresh", exact: true })
    .click();
  await expect(page.locator(".workspace-alert")).toContainText(
    "Google Calendar: Calendar temporarily unavailable",
  );
  await expect(page.locator(".event-info strong")).toHaveCount(1);
  await expect(page.locator(".event-info strong")).toHaveText(
    "Shared design review",
  );
});
test("static site explains its limitation and can enter clearly labelled demo", async ({
  page,
}) => {
  await page.route("**/api/status", (r) =>
    r.fulfill({
      status: 404,
      contentType: "text/html",
      body: "<h1>Not found</h1>",
    }),
  );
  await page.goto("/");
  await expect(page.locator(".workspace-alert")).toContainText(
    "Live connections need a hosted Dayframe server",
  );
  await go(page, "Settings");
  await page.getByRole("button", { name: "Try demo", exact: true }).click();
  await go(page, "Today");
  await expect(page.getByText("Demo data", { exact: true })).toBeVisible();
  await expect(page.getByText("Daily standup", { exact: true })).toBeVisible();
});
for (const width of [320, 390, 768])
  test(`readable layouts and navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await demo(page);
    for (const name of ["Today", "Calendar", "Work", "Personal", "Settings"]) {
      await go(page, name);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    }
    await go(page, "Today");
    expect(
      await page
        .locator(".event-info strong")
        .first()
        .evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
    ).toBeGreaterThanOrEqual(15);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await page
        .locator(".bunny-eyes")
        .evaluate((e) => getComputedStyle(e).animationName),
    ).toBe("none");
  });
test("search, calendar filters and keyboard dismissal work", async ({
  page,
}) => {
  await demo(page);
  await page.locator(".search-trigger").click();
  await page
    .getByPlaceholder("Search your day, work, and life...")
    .fill("Daily standup");
  await expect(
    page.locator(".search-results").getByText("Daily standup", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await go(page, "Calendar");
  await page.getByRole("button", { name: "Month", exact: true }).click();
  await expect(page.locator(".calendar-cell")).toHaveCount(42);
  await page.getByLabel("Outlook", { exact: true }).uncheck();
  await expect(
    page.locator(".calendar-event").filter({ hasText: "Outlook" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Next period" }).click();
  await expect(page.locator(".calendar-event")).toHaveCount(0);
});

test("switching from demo to live never presents demo events as account data", async ({
  page,
}) => {
  await demo(page);
  let release;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/status", async (r) => {
    await gate;
    await r.fulfill({
      json: {
        ...status,
        providers: status.providers.map((p) => ({ ...p, connected: false })),
      },
    });
  });
  await go(page, "Settings");
  await page
    .getByRole("button", { name: "Use live data", exact: true })
    .click();
  await go(page, "Today");
  await expect(page.getByText("Live workspace", { exact: true })).toBeVisible();
  await expect(page.getByText("Daily standup", { exact: true })).toHaveCount(0);
  release();
  await expect(
    page.getByText("No calendar events loaded for today.", { exact: false }),
  ).toBeVisible();
});

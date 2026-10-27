import { more } from "./helpers/product";
import { test, expect } from "@playwright/test";
const today = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Kyiv",
}).format(new Date());
const nextDay = new Date(new Date(today + "T12:00:00Z").getTime() + 86400000)
  .toISOString()
  .slice(0, 10);
const scope = "https://www.googleapis.com/auth/calendar.events.readonly";
async function settings(page: any) {
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Налаштування", exact: true })
    .click();
}
async function googleSetup(page: any, outcome = "success") {
  await page.route("**/api/status", (r: any) =>
    r.fulfill({ status: 404, contentType: "text/html", body: "Not found" }),
  );
  await page.route("https://accounts.google.com/gsi/client", (r: any) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `window.google={accounts:{oauth2:{initTokenClient:function(options){window.requestedGoogleScope=options.scope;return {requestAccessToken:function(){${outcome === "cancel" ? "options.error_callback()" : `options.callback({access_token:'direct-private-token',expires_in:3600,scope:'${outcome === "deny" ? "openid" : scope}'})`}}}}}}};`,
    }),
  );
  await page.goto("/");
  await settings(page);
  await page.locator(".connection-direct-setup summary").click();
  await page
    .getByLabel("Google Client ID", { exact: true })
    .fill("test.apps.googleusercontent.com");
  await page
    .getByRole("button", { name: "Зберегти прямий вхід", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Увійти через Календар Google",
      exact: true,
    }),
  ).toBeEnabled();
}
test("direct Google login loads primary calendar into Dayframe, refreshes and keeps tokens out of storage", async ({
  page,
}) => {
  let updated = false;
  const requests: string[] = [];
  await page.route("https://www.googleapis.com/calendar/v3/**", (r) => {
    requests.push(r.request().url());
    expect(r.request().headers().authorization).toBe(
      "Bearer direct-private-token",
    );
    expect(r.request().method()).toBe("GET");
    return r.fulfill({
      json: {
        items: [
          {
            id: "sync",
            summary: updated ? "Оновлена зустріч" : "Реальна подія Google",
            iCalUID: "unique-sync",
            start: { date: today },
            end: { date: nextDay },
          },
          { id: "cancelled", summary: "Скасовано", status: "cancelled" },
        ],
      },
    });
  });
  await googleSetup(page);
  await page
    .getByRole("button", { name: "Увійти через Календар Google", exact: true })
    .click();
  await expect(page.locator(".connection-state.is-connected")).toHaveCount(1);
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Календар", exact: true })
    .click();
  await expect(
    page.locator(".studio-all-day:not(.studio-untimed)"),
  ).toContainText("Реальна подія Google");
  updated = true;
  await more(page);
  await page
    .getByRole("button", { name: "Оновити календарі", exact: true })
    .click();
  await expect(
    page.locator(".studio-all-day:not(.studio-untimed)"),
  ).toContainText("Оновлена зустріч");
  await expect(
    page.getByText("Реальна подія Google", { exact: true }),
  ).toHaveCount(0);
  expect(requests.length).toBeGreaterThan(1);
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain("direct-private-token");
  await settings(page);
  await page.getByRole("button", { name: "Відключити", exact: true }).click();
  await expect(page.locator(".connection-state.is-connected")).toHaveCount(0);
});
for (const outcome of ["cancel", "deny"])
  test(`direct Google ${outcome} never marks an account connected`, async ({
    page,
  }) => {
    await googleSetup(page, outcome);
    await page
      .getByRole("button", {
        name: "Увійти через Календар Google",
        exact: true,
      })
      .click();
    await expect(page.locator(".inline-error")).toBeVisible();
    await expect(page.locator(".connection-state.is-connected")).toHaveCount(0);
  });
test("direct calendar rejects a foreign pagination URL before disclosing its token", async ({
  page,
}) => {
  let leaked = false;
  await page.route("https://untrusted.example/**", (r) => {
    leaked = true;
    return r.fulfill({ json: {} });
  });
  // Google pagination is an opaque token, never an arbitrary next URL.
  await page.route("https://www.googleapis.com/calendar/v3/**", (r) =>
    r.fulfill({
      json: { items: [], nextPageToken: "https://untrusted.example/steal" },
    }),
  );
  await googleSetup(page);
  await page
    .getByRole("button", { name: "Увійти через Календар Google", exact: true })
    .click();
  await expect(page.locator(".workspace-alert")).toContainText(
    "Забагато подій",
  );
  expect(leaked).toBe(false);
});
test("assigned Jira deadlines appear in the calendar and undated tasks can be planned explicitly", async ({
  page,
}) => {
  const issue = {
    id: "site:17",
    key: "ART-17",
    title: "Перевірити матеріал",
    status: "In progress",
    priority: "Normal",
    due: today,
    url: "https://team.atlassian.net/browse/ART-17",
    site: "Команда",
  };
  await page.route("**/api/status", (r) =>
    r.fulfill({
      json: {
        providers: [
          { id: "jira", name: "Jira", configured: true, connected: true },
        ],
        disabled: ["Confluence"],
        sessionStorage: "memory",
        sessionHours: 8,
      },
    }),
  );
  await page.route("**/api/jira", (r) =>
    r.fulfill({
      json: {
        issues: [
          issue,
          {
            ...issue,
            id: "site:18",
            key: "ART-18",
            title: "Ідея без дедлайну",
            due: "",
            url: "https://team.atlassian.net/browse/ART-18",
          },
        ],
        truncated: false,
      },
    }),
  );
  await page.goto("/");
  await expect(
    page.locator(".studio-all-day:not(.studio-untimed)"),
  ).toContainText("ART-17");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Налаштування", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Повідомлення Slack і записи Jira",
      exact: true,
    })
    .click();
  const card = page
    .locator(".jira-plans article")
    .filter({ hasText: "ART-18" });
  await card.getByRole("button", { name: "Запланувати", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Особисте завдання",
    exact: true,
  });
  await expect(dialog.getByLabel("Назва", { exact: true })).toHaveValue(
    "ART-18 · Ідея без дедлайну",
  );
  await dialog.getByRole("button", { name: "Додати", exact: true }).click();
  await expect(
    card.getByRole("button", { name: "У планах", exact: true }),
  ).toBeDisabled();
});

test("Microsoft direct login uses PKCE and separate work and personal authorities without a secret", async ({
  page,
}) => {
  const authorizations: URL[] = [];
  await page.route("**/api/status", (r) =>
    r.fulfill({ status: 404, contentType: "text/html", body: "Not found" }),
  );
  await page.context().route("https://login.microsoftonline.com/**", (r) => {
    const url = new URL(r.request().url());
    if (url.pathname.includes("/discovery/instance"))
      return r.fulfill({
        json: {
          tenant_discovery_endpoint:
            "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
          metadata: [
            {
              preferred_network: "login.microsoftonline.com",
              preferred_cache: "login.windows.net",
              aliases: [
                "login.microsoftonline.com",
                "login.windows.net",
                "login.microsoft.com",
                "sts.windows.net",
              ],
            },
          ],
        },
      });
    const tenant = url.pathname.split("/")[1];
    if (url.pathname.includes("openid-configuration"))
      return r.fulfill({
        json: {
          authorization_endpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
          token_endpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
          end_session_endpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/logout`,
          issuer: "https://login.microsoftonline.com/{tenantid}/v2.0",
          jwks_uri:
            "https://login.microsoftonline.com/common/discovery/v2.0/keys",
        },
      });
    if (url.pathname.endsWith("/authorize")) {
      authorizations.push(url);
      const callback =
        url.searchParams.get("redirect_uri")! +
        "#" +
        new URLSearchParams({
          error: "access_denied",
          state: url.searchParams.get("state")!,
        });
      return r.fulfill({
        contentType: "text/html",
        body: `<script>location.replace(${JSON.stringify(callback)})</script>`,
      });
    }
    return r.fulfill({ status: 400, json: {} });
  });
  await page.goto("/");
  await settings(page);
  await page.locator(".connection-direct-setup summary").click();
  await page
    .getByLabel("Microsoft Application (client) ID", { exact: true })
    .fill("11111111-2222-3333-4444-555555555555");
  await page
    .getByRole("button", { name: "Зберегти прямий вхід", exact: true })
    .click();
  for (const label of ["Outlook · Робочий", "Outlook · Особистий"]) {
    await page
      .getByRole("button", { name: `Увійти через ${label}`, exact: true })
      .click();
    await expect(page.locator(".inline-error")).toBeVisible();
    await expect(
      page.getByRole("button", { name: `Увійти через ${label}`, exact: true }),
    ).toBeEnabled();
  }
  expect(authorizations.map((u) => u.pathname)).toEqual([
    "/organizations/oauth2/v2.0/authorize",
    "/consumers/oauth2/v2.0/authorize",
  ]);
  for (const url of authorizations) {
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
    expect(url.searchParams.get("scope")).toContain("Calendars.Read");
    expect(url.searchParams.has("client_secret")).toBe(false);
    expect(url.searchParams.get("redirect_uri")).toMatch(
      /\/oauth-redirect\.html$/,
    );
  }
  await expect(page.locator(".connection-state.is-connected")).toHaveCount(0);
});

test("Microsoft popup exchanges a PKCE code without a secret and displays Graph events in the calendar", async ({
  page,
}) => {
  const clientId = "11111111-2222-3333-4444-555555555555";
  let nonce = "",
    exchanged = false;
  const b64 = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  await page.addInitScript(
    (id) =>
      localStorage.setItem(
        "dayframe-direct-login",
        JSON.stringify({ microsoft: id, google: "" }),
      ),
    clientId,
  );
  await page.route("**/api/status", (r) =>
    r.fulfill({ status: 404, contentType: "text/html", body: "Not found" }),
  );
  await page.context().route("https://login.microsoftonline.com/**", (r) => {
    const url = new URL(r.request().url()),
      tenant = url.pathname.split("/")[1];
    if (url.pathname.includes("/discovery/instance"))
      return r.fulfill({
        json: {
          tenant_discovery_endpoint:
            "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
          metadata: [
            {
              preferred_network: "login.microsoftonline.com",
              preferred_cache: "login.windows.net",
              aliases: [
                "login.microsoftonline.com",
                "login.windows.net",
                "login.microsoft.com",
                "sts.windows.net",
              ],
            },
          ],
        },
      });
    if (url.pathname.includes("openid-configuration"))
      return r.fulfill({
        json: {
          authorization_endpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
          token_endpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
          end_session_endpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/logout`,
          issuer: "https://login.microsoftonline.com/{tenantid}/v2.0",
          jwks_uri:
            "https://login.microsoftonline.com/common/discovery/v2.0/keys",
        },
      });
    if (url.pathname.endsWith("/authorize")) {
      nonce = url.searchParams.get("nonce")!;
      const callback =
        url.searchParams.get("redirect_uri")! +
        "#" +
        new URLSearchParams({
          code: "fixture-pkce-code",
          state: url.searchParams.get("state")!,
        });
      return r.fulfill({
        contentType: "text/html",
        body: `<script>location.replace(${JSON.stringify(callback)})</script>`,
      });
    }
    if (url.pathname.endsWith("/token")) {
      const body = new URLSearchParams(r.request().postData()!);
      expect(body.get("code_verifier")).toBeTruthy();
      expect(body.has("client_secret")).toBe(false);
      expect(body.get("code")).toBe("fixture-pkce-code");
      exchanged = true;
      const now = Math.floor(Date.now() / 1000),
        tid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
      return r.fulfill({
        json: {
          token_type: "Bearer",
          scope: "https://graph.microsoft.com/Calendars.Read",
          expires_in: 3600,
          access_token: "graph-private-token",
          client_info: b64({ uid: "person", utid: tid }),
          id_token: `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ aud: clientId, iss: `https://login.microsoftonline.com/${tid}/v2.0`, iat: now, nbf: now - 60, exp: now + 3600, nonce, tid, oid: "person", sub: "person", preferred_username: "person@example.com", name: "Person", ver: "2.0" })}.signature`,
        },
      });
    }
    return r.fulfill({ status: 400, json: {} });
  });
  await page.route(
    "https://graph.microsoft.com/v1.0/me/calendarView?*",
    (r) => {
      expect(r.request().headers().authorization).toBe(
        "Bearer graph-private-token",
      );
      return r.fulfill({
        json: {
          value: [
            {
              id: "meeting",
              subject: "Зустріч із Outlook",
              isAllDay: true,
              start: { dateTime: today + "T00:00:00", timeZone: "UTC" },
              end: { dateTime: nextDay + "T00:00:00", timeZone: "UTC" },
              attendees: [],
            },
          ],
        },
      });
    },
  );
  await page.goto("/");
  await settings(page);
  await page
    .getByRole("button", {
      name: "Увійти через Outlook · Робочий",
      exact: true,
    })
    .click();
  await expect(page.locator(".connection-state.is-connected")).toHaveCount(1);
  expect(exchanged).toBe(true);
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Календар", exact: true })
    .click();
  await expect(
    page.locator(".studio-all-day:not(.studio-untimed)"),
  ).toContainText("Зустріч із Outlook");
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain("graph-private-token");
});

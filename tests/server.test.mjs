import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/app.mjs";
import { mapOutlookEvent, mapGoogleEvent } from "../server/mappers.mjs";
const iso = "2026-10-20T09:00:00Z";
async function harness(env = {}, fetcher) {
  const server = createApp({
    env: { DAYFRAME_PUBLIC_URL: "http://localhost:4317", ...env },
    fetcher,
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    server,
    base,
    get: (path, options = {}) =>
      fetch(base + path, { redirect: "manual", ...options }),
    close: () => new Promise((r) => server.close(r)),
  };
}
const appEnv = {
  MICROSOFT_CLIENT_ID: "test-client",
  MICROSOFT_CLIENT_SECRET: "test-secret",
  GOOGLE_CLIENT_ID: "google-test",
  GOOGLE_CLIENT_SECRET: "google-secret",
  SLACK_CLIENT_ID: "slack-test",
  SLACK_CLIENT_SECRET: "slack-secret",
};
async function login(h, id, existingCookie) {
  const start = await h.get(
    `/api/auth/${id}/connect`,
    existingCookie ? { headers: { cookie: existingCookie } } : {},
  );
  assert.equal(start.status, 302);
  const cookie =
    start.headers.get("set-cookie")?.split(";")[0] || existingCookie;
  const location = new URL(start.headers.get("location"));
  const result = await h.get(
    `/api/auth/${id}/callback?state=${location.searchParams.get("state")}&code=fixture-code`,
    { headers: { cookie } },
  );
  assert.equal(result.status, 302);
  return { cookie, location };
}
test("status exposes presence only; unsupported sources are disabled; missing setup fails closed", async () => {
  const h = await harness();
  try {
    const r = await h.get("/api/status");
    const data = await r.json();
    assert.deepEqual(data.disabled, ["Confluence"]);
    assert.equal(data.providers[0].configured, false);
    assert.equal(data.providers[0].connected, false);
    assert.equal((await h.get("/api/auth/outlook-work/connect")).status, 503);
    assert.equal(
      (
        await h.get(
          "/api/calendar/outlook-work?start=" +
            iso +
            "&end=2026-10-21T09:00:00Z",
        )
      ).status,
      401,
    );
    assert.equal((await h.get("/api/jira")).status, 401);
  } finally {
    await h.close();
  }
});
test("Outlook OAuth uses PKCE and readonly scope; state cannot be replayed; token never reaches browser", async () => {
  const calls = [];
  const fixtureTimestamp = String(Date.now() / 1000);
  const h = await harness(appEnv, async (url, options) => {
    calls.push({ url, options });
    return Response.json({
      access_token: "private-access",
      refresh_token: "private-refresh",
      expires_in: 3600,
    });
  });
  try {
    const { cookie, location } = await login(h, "outlook-work");
    assert.equal(location.origin, "https://login.microsoftonline.com");
    assert.equal(location.searchParams.get("code_challenge_method"), "S256");
    assert.equal(
      location.searchParams.get("scope"),
      "offline_access https://graph.microsoft.com/Calendars.Read",
    );
    assert.equal(calls[0].options.body.get("client_secret"), "test-secret");
    assert.ok(calls[0].options.body.get("code_verifier"));
    const status = await (
      await h.get("/api/status", { headers: { cookie } })
    ).json();
    assert.equal(status.providers[0].connected, true);
    assert.ok(!JSON.stringify(status).includes("private-"));
    assert.equal(
      (
        await h.get(
          "/api/auth/outlook-work/callback?state=" +
            location.searchParams.get("state") +
            "&code=again",
          { headers: { cookie } },
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await h.get("/api/auth/outlook-work/disconnect", {
          method: "POST",
          headers: { cookie, Origin: "https://evil.example" },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await h.get("/api/auth/outlook-work/disconnect", {
          method: "POST",
          headers: { cookie, Origin: "http://localhost:4317" },
        })
      ).status,
      200,
    );
    assert.equal(
      (await (await h.get("/api/status", { headers: { cookie } })).json())
        .providers[0].connected,
      false,
    );
  } finally {
    await h.close();
  }
});
test("wrong state is rejected before token exchange and Google cancellation is safe", async () => {
  let called = false;
  const h = await harness(appEnv, async () => {
    called = true;
    return Response.json({});
  });
  try {
    const start = await h.get("/api/auth/google/connect");
    const cookie = start.headers.get("set-cookie").split(";")[0],
      u = new URL(start.headers.get("location"));
    assert.equal(
      u.searchParams.get("scope"),
      "https://www.googleapis.com/auth/calendar.events.readonly",
    );
    assert.equal(u.searchParams.get("access_type"), "offline");
    assert.equal(
      (
        await h.get("/api/auth/google/callback?state=wrong&code=no", {
          headers: { cookie },
        })
      ).status,
      400,
    );
    assert.equal(called, false);
    const cancelled = await h.get(
      `/api/auth/google/callback?state=${u.searchParams.get("state")}&error=access_denied`,
      { headers: { cookie } },
    );
    assert.equal(cancelled.headers.get("location"), "/?connection=cancelled");
    assert.equal(called, false);
  } finally {
    await h.close();
  }
});
test("calendar pagination, cancelled events, range limits, time zone and deduplication", async () => {
  let count = 0;
  const h = await harness(appEnv, async (url) => {
    if (url.includes("/token"))
      return Response.json({ access_token: "private" });
    count++;
    if (count === 1)
      return Response.json({
        value: [
          {
            id: "one",
            subject: "Review",
            start: { dateTime: "2026-10-20T09:00:00", timeZone: "UTC" },
            end: { dateTime: "2026-10-20T10:00:00", timeZone: "UTC" },
          },
          { id: "cancelled", isCancelled: true },
        ],
        "@odata.nextLink": "https://graph.microsoft.com/v1.0/next",
      });
    return Response.json({
      value: [
        {
          id: "one",
          subject: "Review",
          start: { dateTime: "2026-10-20T09:00:00", timeZone: "UTC" },
          end: { dateTime: "2026-10-20T10:00:00", timeZone: "UTC" },
        },
      ],
    });
  });
  try {
    const { cookie } = await login(h, "outlook-work");
    const r = await h.get(
      "/api/calendar/outlook-work?start=" +
        iso +
        "&end=2026-10-21T09:00:00Z&timeZone=Europe%2FKyiv",
      { headers: { cookie } },
    );
    assert.equal(r.status, 200);
    const data = await r.json();
    assert.equal(data.events.length, 1);
    assert.equal(data.events[0].start, "12:00");
    assert.equal(count, 2);
    assert.equal(
      (
        await h.get(
          "/api/calendar/outlook-work?start=" +
            iso +
            "&end=2027-01-01T00:00:00Z",
          { headers: { cookie } },
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await h.get(
          "/api/calendar/outlook-work?start=" +
            iso +
            "&end=2026-10-21T09:00:00Z&timeZone=unknown",
          { headers: { cookie } },
        )
      ).status,
      400,
    );
  } finally {
    await h.close();
  }
});
test("untrusted provider pagination cannot receive bearer tokens", async () => {
  let evil = false;
  const h = await harness(appEnv, async (url) => {
    if (url.includes("/token"))
      return Response.json({ access_token: "private" });
    if (url.startsWith("https://evil.example")) evil = true;
    return Response.json({
      value: [],
      "@odata.nextLink": "https://evil.example/stolen",
    });
  });
  try {
    const { cookie } = await login(h, "outlook-work");
    assert.equal(
      (
        await h.get(
          "/api/calendar/outlook-work?start=" +
            iso +
            "&end=2026-10-21T09:00:00Z",
          { headers: { cookie } },
        )
      ).status,
      502,
    );
    assert.equal(evil, false);
  } finally {
    await h.close();
  }
});
test("Slack uses user search scopes, deduplicates mentions first, excludes old messages, and never writes", async () => {
  const calls = [];
  const fixtureTimestamp = String(Date.now() / 1000);
  const h = await harness(appEnv, async (url, options) => {
    calls.push({ url, method: options.method || "GET" });
    if (url.includes("oauth.v2.access"))
      return Response.json({
        ok: true,
        authed_user: { access_token: "user-token" },
      });
    if (url.includes("auth.test"))
      return Response.json({ ok: true, user_id: "U123" });
    if (url.includes("users.info"))
      return Response.json({
        ok: true,
        user: { profile: { display_name: "Maya" } },
      });
    return Response.json({
      ok: true,
      messages: {
        matches: [
          {
            ts: fixtureTimestamp,
            channel: { id: "C123", name: "ui-team" },
            text: "Can you review this?",
            user: "U234",
            permalink: "https://example.slack.com/archives/C123/p123",
          },
          { ts: "1", channel: { id: "C123" }, text: "old" },
        ],
        paging: { total: 40 },
      },
    });
  });
  try {
    const { cookie, location } = await login(h, "slack");
    assert.equal(
      location.searchParams.get("user_scope"),
      "search:read,users:read",
    );
    assert.equal(location.searchParams.has("scope"), false);
    const data = await (
      await h.get("/api/slack?channels=ui-team", { headers: { cookie } })
    ).json();
    assert.equal(data.items.length, 1);
    assert.equal(data.items[0].group, "Direct mentions");
    assert.equal(data.items[0].author, "Maya");
    assert.equal(data.truncated, true);
    assert.ok(
      calls.every(
        (c) => c.method === "GET" || c.url.includes("oauth.v2.access"),
      ),
    );
    assert.equal(
      (
        await h.get("/api/slack?channels=invalid%20name", {
          headers: { cookie },
        })
      ).status,
      400,
    );
  } finally {
    await h.close();
  }
});
test("provider errors do not expose tokens or provider payloads", async () => {
  const h = await harness(appEnv, async () =>
    Response.json({ error: "contains-private-secret" }, { status: 400 }),
  );
  try {
    const start = await h.get("/api/auth/outlook-work/connect"),
      cookie = start.headers.get("set-cookie").split(";")[0],
      u = new URL(start.headers.get("location"));
    const r = await h.get(
      `/api/auth/outlook-work/callback?state=${u.searchParams.get("state")}&code=private-code`,
      { headers: { cookie } },
    );
    assert.equal(r.status, 502);
    assert.ok(!(await r.text()).includes("private"));
  } finally {
    await h.close();
  }
});
test("mappers preserve all-day dates and account for device timezone", () => {
  const g = mapGoogleEvent(
    {
      id: "all",
      start: { date: "2026-10-20" },
      end: { date: "2026-10-22" },
      summary: "Offsite",
    },
    "America/Los_Angeles",
  );
  assert.equal(g.date, "2026-10-20");
  assert.equal(g.endDate, "2026-10-22");
  assert.equal(g.start, "Увесь день");
  const o = mapOutlookEvent(
    {
      id: "night",
      start: { dateTime: "2026-10-20T23:30:00", timeZone: "UTC" },
      end: { dateTime: "2026-10-21T00:30:00", timeZone: "UTC" },
    },
    "Europe/Kyiv",
  );
  assert.equal(o.date, "2026-10-21");
  assert.equal(o.start, "02:30");
});

test("recurrence handles month ends, leap days and delayed reopening without changing one-time tasks", async () => {
  const { nextOccurrence, reopenDueTasks } = await import(
    "../src/recurrence.ts"
  );
  assert.equal(
    nextOccurrence({ recurrence: "monthly" }, "2026-01-31"),
    "2026-02-28",
  );
  assert.equal(
    nextOccurrence({ recurrence: "yearly" }, "2028-02-29"),
    "2029-02-28",
  );
  assert.equal(
    nextOccurrence({ recurrence: "custom", customDays: 10 }, "2026-10-20"),
    "2026-10-30",
  );
  assert.equal(nextOccurrence({ recurrence: "once" }, "2026-10-20"), undefined);
  const tasks = [
    {
      id: "daily",
      title: "Water plants",
      date: "2026-10-19",
      category: "Day",
      recurrence: "daily",
      priority: "Normal",
      notes: "",
      disabled: false,
      completed: true,
      completedOn: "2026-10-19",
      nextOccurrence: "2026-10-20",
    },
  ];
  assert.equal(reopenDueTasks(tasks, "2026-10-19"), tasks);
  const reopened = reopenDueTasks(tasks, "2026-10-20");
  assert.equal(reopened[0].completed, false);
  assert.equal(reopened[0].date, "2026-10-20");
  assert.equal(reopenDueTasks(reopened, "2026-10-20"), reopened);
  assert.equal(
    reopenDueTasks([{ ...tasks[0], disabled: true }], "2026-10-20")[0]
      .completed,
    true,
  );
});

test("expired tokens are refreshed once for concurrent reads and sessions remain isolated", async () => {
  let refreshes = 0,
    reads = 0;
  const h = await harness(appEnv, async (url, options) => {
    if (url.includes("/token")) {
      if (options.body.get("grant_type") === "refresh_token") {
        refreshes++;
        await new Promise((r) => setTimeout(r, 15));
        assert.equal(options.body.get("refresh_token"), "refresh-old");
        return Response.json({
          access_token: "refreshed-private",
          refresh_token: "refresh-new",
          expires_in: 3600,
        });
      }
      return Response.json({
        access_token: "expired-private",
        refresh_token: "refresh-old",
        expires_in: 1,
      });
    }
    reads++;
    assert.equal(options.headers.Authorization, "Bearer refreshed-private");
    return Response.json({ value: [] });
  });
  try {
    const { cookie } = await login(h, "outlook-work");
    const path =
      "/api/calendar/outlook-work?start=" + iso + "&end=2026-10-21T09:00:00Z";
    const responses = await Promise.all([
      h.get(path, { headers: { cookie } }),
      h.get(path, { headers: { cookie } }),
    ]);
    assert.ok(responses.every((r) => r.status === 200));
    assert.equal(refreshes, 1);
    assert.equal(reads, 2);
    assert.equal((await h.get(path)).status, 401);
    assert.equal(
      (await (await h.get("/api/status")).json()).providers[0].connected,
      false,
    );
  } finally {
    await h.close();
  }
});

test("work and personal Outlook connect simultaneously and disconnect independently", async () => {
  const h = await harness(appEnv, async (url, options) => {
    if (url.includes("/token"))
      return Response.json({
        access_token: options.body
          .get("redirect_uri")
          .includes("outlook-personal")
          ? "personal-token"
          : "work-token",
        expires_in: 3600,
      });
    return Response.json({
      value: [
        {
          id: "same-provider-id",
          subject: options.headers.Authorization.includes("personal")
            ? "Personal appointment"
            : "Work review",
          start: { dateTime: "2026-10-20T09:00:00", timeZone: "UTC" },
          end: { dateTime: "2026-10-20T10:00:00", timeZone: "UTC" },
        },
      ],
    });
  });
  try {
    const work = await login(h, "outlook-work");
    assert.ok(work.location.pathname.startsWith("/organizations/"));
    const personal = await login(h, "outlook-personal", work.cookie);
    assert.ok(personal.location.pathname.startsWith("/consumers/"));
    assert.equal(personal.cookie, work.cookie);
    const current = await (
      await h.get("/api/status", { headers: { cookie: work.cookie } })
    ).json();
    assert.equal(current.providers.filter((p) => p.connected).length, 2);
    const range = "?start=" + iso + "&end=2026-10-21T09:00:00Z";
    const workEvents = await (
      await h.get("/api/calendar/outlook-work" + range, {
        headers: { cookie: work.cookie },
      })
    ).json();
    const personalEvents = await (
      await h.get("/api/calendar/outlook-personal" + range, {
        headers: { cookie: work.cookie },
      })
    ).json();
    assert.notEqual(workEvents.events[0].id, personalEvents.events[0].id);
    assert.equal(personalEvents.events[0].title, "Personal appointment");
    await h.get("/api/auth/outlook-work/disconnect", {
      method: "POST",
      headers: { cookie: work.cookie, Origin: "http://localhost:4317" },
    });
    const after = await (
      await h.get("/api/status", { headers: { cookie: work.cookie } })
    ).json();
    assert.equal(
      after.providers.find((p) => p.id === "outlook-work").connected,
      false,
    );
    assert.equal(
      after.providers.find((p) => p.id === "outlook-personal").connected,
      true,
    );
  } finally {
    await h.close();
  }
});

test("Outlook all-day UTC responses retain the correct day in the device timezone", () => {
  const event = mapOutlookEvent(
    {
      id: "all-day",
      isAllDay: true,
      start: { dateTime: "2026-10-19T21:00:00", timeZone: "UTC" },
      end: { dateTime: "2026-10-20T21:00:00", timeZone: "UTC" },
    },
    "Europe/Kyiv",
  );
  assert.equal(event.date, "2026-10-20");
  assert.equal(event.endDate, "2026-10-21");
  assert.equal(event.start, "Увесь день");
});

test("Jira OAuth reads only assigned tasks through trusted cloud sites and keeps secrets server-side", async () => {
  const requests = [];
  const h = await harness(
    {
      ATLASSIAN_CLIENT_ID: "jira-client",
      ATLASSIAN_CLIENT_SECRET: "jira-secret",
    },
    async (url, options) => {
      requests.push({ url: String(url), options });
      if (url === "https://auth.atlassian.com/oauth/token") {
        const body = JSON.parse(options.body);
        assert.equal(body.client_secret, "jira-secret");
        assert.equal(options.headers["Content-Type"], "application/json");
        return Response.json({
          access_token: "private-jira-token",
          refresh_token: "private-jira-refresh",
          expires_in: 3600,
        });
      }
      assert.equal(options.headers.Authorization, "Bearer private-jira-token");
      if (String(url).endsWith("accessible-resources"))
        return Response.json([
          {
            id: "cloud-1",
            name: "Команда",
            url: "https://team.atlassian.net",
            scopes: ["read:jira-work"],
          },
          {
            id: "cloud-evil",
            url: "https://evil.example",
            scopes: ["read:jira-work"],
          },
        ]);
      assert.ok(
        String(url).startsWith(
          "https://api.atlassian.com/ex/jira/cloud-1/rest/api/3/search/jql?",
        ),
      );
      assert.ok(
        new URL(url).searchParams
          .get("jql")
          .includes("assignee = currentUser()"),
      );
      return Response.json({
        issues: [
          {
            id: "17",
            key: "ART-17",
            fields: {
              summary: "Матеріал",
              status: { name: "In progress" },
              duedate: "2026-10-21",
            },
          },
        ],
      });
    },
  );
  try {
    const { cookie, location } = await login(h, "jira");
    assert.equal(location.origin, "https://auth.atlassian.com");
    assert.equal(
      location.searchParams.get("scope"),
      "read:jira-work offline_access",
    );
    assert.equal(location.searchParams.get("audience"), "api.atlassian.com");
    const data = await (
      await h.get("/api/jira", { headers: { cookie } })
    ).json();
    assert.equal(
      data.issues[0].url,
      "https://team.atlassian.net/browse/ART-17",
    );
    assert.equal(data.issues[0].due, "2026-10-21");
    assert.equal(data.issues.length, 1);
    assert.ok(!JSON.stringify(data).includes("private-jira"));
    assert.equal((await h.get("/api/jira")).status, 401);
    assert.equal(requests.filter((r) => r.options.method === "POST").length, 1);
  } finally {
    await h.close();
  }
});

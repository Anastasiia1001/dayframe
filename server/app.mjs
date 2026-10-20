import { createServer } from "node:http";
import { randomBytes, createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { providerConfig } from "./config.mjs";
import { mapOutlookEvent, mapGoogleEvent, mapSlackMatch } from "./mappers.mjs";
const SESSION_AGE = 8 * 60 * 60 * 1000;
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function createApp({
  env = process.env,
  fetcher = fetch,
  now = () => Date.now(),
} = {}) {
  const providers = providerConfig(env),
    sessions = new Map();
  const publicUrl = new URL(
    env.DAYFRAME_PUBLIC_URL ||
      env.RENDER_EXTERNAL_URL ||
      "http://localhost:4317",
  );
  if (
    !["https:", "http:"].includes(publicUrl.protocol) ||
    (publicUrl.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(publicUrl.hostname))
  )
    throw new Error(
      "DAYFRAME_PUBLIC_URL має використовувати HTTPS (HTTP дозволено лише для localhost)",
    );
  const origin = publicUrl.origin,
    secure = publicUrl.protocol === "https:";
  const dist = resolve(fileURLToPath(new URL("../dist", import.meta.url)));
  const json = (res, status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
  };
  const redirect = (res, url) => {
    res.writeHead(302, { Location: url, "Cache-Control": "no-store" });
    res.end();
  };
  const callback = (id) => `${origin}/api/auth/${id}/callback`;
  const cleanup = setInterval(() => {
    for (const [id, s] of sessions) if (s.expires < now()) sessions.delete(id);
  }, 60000);
  cleanup.unref();
  async function remote(url, options = {}) {
    let r;
    try {
      r = await fetcher(url, {
        ...options,
        signal: AbortSignal.timeout(15000),
        redirect: "error",
      });
    } catch {
      throw new ApiError(
        502,
        "Не вдалося з’єднатися із сервісом. Спробуй ще раз.",
      );
    }
    if (!r.ok)
      throw new ApiError(
        r.status === 401 ? 401 : r.status === 429 ? 429 : 502,
        r.status === 401
          ? "Термін підключення минув. Підключи обліковий запис знову."
          : r.status === 429
            ? "Досягнуто ліміту запитів сервісу. Зачекай перед оновленням."
            : "Сервіс не виконав запит. Перевір дозволи облікового запису та спробуй ще раз.",
      );
    const data = await r.json();
    if (data.error || data.ok === false)
      throw new ApiError(
        502,
        "Сервіс відхилив запит. Перевір дозволи або підключи обліковий запис знову.",
      );
    return data;
  }
  async function access(session, id) {
    const c = session?.connections[id];
    if (!c)
      throw new ApiError(
        401,
        "Спочатку підключи цей обліковий запис у налаштуваннях.",
      );
    if (c.expires > now() + 60000) return c.token;
    if (!c.refresh)
      throw new ApiError(
        401,
        "Термін підключення минув. Підключи обліковий запис знову.",
      );
    // One refresh per connection, even if calendar and status are requested together.
    if (!c.refreshing)
      c.refreshing = (async () => {
        const p = providers[id];
        const body = new URLSearchParams({
          grant_type: "refresh_token",
          client_id: p.clientId,
          client_secret: p.secret,
          refresh_token: c.refresh,
        });
        const t = await remote(p.token, { method: "POST", body });
        c.token = t.access_token;
        c.refresh = t.refresh_token || c.refresh;
        c.expires = now() + (t.expires_in || 3600) * 1000;
        if (!c.token)
          throw new ApiError(401, "Підключи цей обліковий запис знову.");
        return c.token;
      })().finally(() => {
        delete c.refreshing;
      });
    return c.refreshing;
  }
  async function readJson(req) {
    let data = "";
    for await (const chunk of req) {
      data += chunk;
      if (data.length > 4096) throw new ApiError(413, "Запит завеликий");
    }
    try {
      return JSON.parse(data || "{}");
    } catch {
      throw new ApiError(400, "Некоректні дані JSON");
    }
  }
  const server = createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    try {
      const url = new URL(req.url, origin);
      const path = url.pathname;
      if (path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
      let sid = (req.headers.cookie || "")
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("dayframe_session="))
        ?.slice(17);
      let session = sessions.get(sid);
      if (session && session.expires < now()) {
        sessions.delete(sid);
        session = undefined;
      }
      if (req.method === "POST" && req.headers.origin !== origin)
        throw new ApiError(403, "Джерело запиту не відповідає цьому простору.");
      if (path === "/api/status" && req.method === "GET")
        return json(res, 200, {
          providers: Object.entries(providers).map(([id, p]) => ({
            id,
            name: p.name,
            configured: !!(p.clientId && p.secret),
            connected: !!session?.connections[id],
            expiresAt: session?.connections[id]?.expires || null,
            missing: p.required.filter((n) => !env[n]),
            redirectUri: callback(id),
          })),
          disabled: ["Jira", "Confluence"],
          sessionStorage: "memory",
          sessionHours: 8,
        });
      if (path === "/api/health" && req.method === "GET")
        return json(res, 200, { ok: true });
      const auth = path.match(
        /^\/api\/auth\/(outlook-work|outlook-personal|google|slack)\/(connect|callback|disconnect)$/,
      );
      if (auth) {
        const [, id, action] = auth,
          p = providers[id];
        if (action === "disconnect" && req.method === "POST") {
          if (session) {
            delete session.connections[id];
            if (session.pending?.id === id) delete session.pending;
          }
          return json(res, 200, { ok: true });
        }
        if (req.method !== "GET")
          throw new ApiError(405, "Метод запиту не підтримується");
        if (!p.clientId || !p.secret)
          throw new ApiError(
            503,
            `${p.name}: підключення не налаштовано на цьому сервері.`,
          );
        if (action === "connect") {
          if (!session) {
            sid = randomBytes(32).toString("base64url");
            session = { connections: {}, expires: now() + SESSION_AGE };
            sessions.set(sid, session);
            res.setHeader(
              "Set-Cookie",
              `dayframe_session=${sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${secure ? "; Secure" : ""}`,
            );
          }
          const state = randomBytes(32).toString("base64url"),
            verifier = randomBytes(32).toString("base64url");
          session.pending = { state, verifier, id, expires: now() + 600000 };
          const target = new URL(p.authorize);
          target.search = new URLSearchParams({
            client_id: p.clientId,
            redirect_uri: callback(id),
            response_type: "code",
            ...(id.startsWith("outlook-") ? { prompt: "select_account" } : {}),
            state,
            ...(id === "slack" ? { user_scope: p.scope } : { scope: p.scope }),
            ...(p.pkce
              ? {
                  code_challenge: createHash("sha256")
                    .update(verifier)
                    .digest("base64url"),
                  code_challenge_method: "S256",
                }
              : {}),
            ...(id === "google"
              ? { access_type: "offline", prompt: "consent" }
              : {}),
          }).toString();
          return redirect(res, target.href);
        }
        const pending = session?.pending;
        if (
          !pending ||
          pending.id !== id ||
          pending.expires < now() ||
          url.searchParams.get("state") !== pending.state
        )
          throw new ApiError(
            400,
            "Авторизація застаріла або її перевірка не пройшла. Почни знову в налаштуваннях.",
          );
        delete session.pending;
        if (url.searchParams.has("error"))
          return redirect(res, "/?connection=cancelled");
        const code = url.searchParams.get("code");
        if (!code) throw new ApiError(400, "Відсутній код авторизації.");
        const body = new URLSearchParams({
          grant_type: "authorization_code",
          client_id: p.clientId,
          client_secret: p.secret,
          code,
          redirect_uri: callback(id),
          ...(p.pkce ? { code_verifier: pending.verifier } : {}),
        });
        const t = await remote(p.token, { method: "POST", body });
        const token = id === "slack" ? t.authed_user : t;
        if (!token?.access_token)
          throw new ApiError(
            502,
            "Сервіс не повернув токен доступу користувача.",
          );
        session.connections[id] = {
          token: token.access_token,
          refresh: token.refresh_token,
          expires: now() + (token.expires_in || 86400) * 1000,
        };
        return redirect(res, "/?connection=success");
      }
      const cal = path.match(
        /^\/api\/calendar\/(outlook-work|outlook-personal|google)$/,
      );
      if (cal && req.method === "GET") {
        const id = cal[1],
          token = await access(session, id),
          start = url.searchParams.get("start"),
          end = url.searchParams.get("end");
        if (
          !start ||
          !end ||
          !Number.isFinite(Date.parse(start)) ||
          !Number.isFinite(Date.parse(end)) ||
          Date.parse(end) <= Date.parse(start) ||
          Date.parse(end) - Date.parse(start) > 62 * 86400000
        )
          throw new ApiError(
            400,
            "Обери коректний період календаря тривалістю до 62 днів.",
          );
        let target = id.startsWith("outlook-")
          ? `https://graph.microsoft.com/v1.0/me/calendarView?${new URLSearchParams({ startDateTime: start, endDateTime: end, $top: "100", $select: "id,subject,start,end,isAllDay,isCancelled,location,onlineMeeting,attendees,isReminderOn,webLink,iCalUId" })}`
          : `https://www.googleapis.com/calendar/v3/calendars/primary/events?${new URLSearchParams({ timeMin: start, timeMax: end, singleEvents: "true", maxResults: "100", orderBy: "startTime" })}`;
        const timeZone = url.searchParams.get("timeZone") || "UTC";
        try {
          new Intl.DateTimeFormat("en", { timeZone }).format();
        } catch {
          throw new ApiError(400, "Некоректний часовий пояс.");
        }
        const events = [];
        let pages = 0;
        while (target) {
          if (++pages > 20)
            throw new ApiError(
              422,
              "Забагато подій у цьому періоді. Обери коротший проміжок.",
            );
          const data = await remote(target, {
            headers: {
              Authorization: `Bearer ${token}`,
              Prefer: 'outlook.timezone="UTC"',
            },
          });
          events.push(
            ...(id.startsWith("outlook-") ? data.value || [] : data.items || [])
              .filter((e) => !e.isCancelled && e.status !== "cancelled")
              .map((e) =>
                id.startsWith("outlook-")
                  ? {
                      ...mapOutlookEvent(e, timeZone),
                      id: `${id}:${e.id}`,
                      accountLabel: providers[id].name,
                    }
                  : mapGoogleEvent(e, timeZone),
              ),
          );
          if (id.startsWith("outlook-")) {
            const next = data["@odata.nextLink"];
            if (next && new URL(next).origin !== "https://graph.microsoft.com")
              throw new ApiError(
                502,
                "Некоректне посилання на наступну сторінку даних сервісу.",
              );
            target = next || null;
          } else {
            target = data.nextPageToken
              ? `https://www.googleapis.com/calendar/v3/calendars/primary/events?${new URLSearchParams({ timeMin: start, timeMax: end, singleEvents: "true", maxResults: "100", orderBy: "startTime", pageToken: data.nextPageToken })}`
              : null;
          }
        }
        return json(res, 200, {
          events: [...new Map(events.map((e) => [e.id, e])).values()],
        });
      }
      if (path === "/api/slack" && req.method === "GET") {
        const token = await access(session, "slack");
        const headers = { Authorization: `Bearer ${token}` };
        const who = await remote("https://slack.com/api/auth.test", {
          headers,
        });
        const channels = (url.searchParams.get("channels") || "")
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
        if (
          channels.length > 5 ||
          channels.some((c) => !/^[-_a-zA-Z0-9]+$/.test(c))
        )
          throw new ApiError(400, "Укажи до п’яти назв каналів Slack.");
        if (!who.user_id)
          throw new ApiError(
            502,
            "Slack не визначив підключеного користувача.",
          );
        const since = new Date(now() - 86400000).toISOString().slice(0, 10),
          queries = [
            {
              group: "Direct mentions",
              query: `<@${who.user_id}> after:${since}`,
            },
          ];
        for (const channel of channels)
          queries.push({
            group: "My team",
            query: `in:${channel} after:${since}`,
          });
        const items = [];
        let truncated = false;
        for (const q of queries) {
          const data = await remote(
            `https://slack.com/api/search.messages?${new URLSearchParams({ query: q.query, count: "30", sort: "timestamp", sort_dir: "desc" })}`,
            { headers },
          );
          truncated ||= (data.messages?.paging?.total || 0) > 30;
          items.push(
            ...(data.messages?.matches || [])
              .filter((m) => Number(m.ts) * 1000 >= now() - 86400000)
              .map((m) => mapSlackMatch(m, q.group)),
          );
        }
        const unique = new Map();
        for (const item of items)
          if (!unique.has(item.id)) unique.set(item.id, item);
        const authors = [...new Set([...unique.values()].map((i) => i.author))]
          .filter((id) => /^[UW][A-Z0-9]+$/.test(id))
          .slice(0, 15);
        const names = new Map(
          await Promise.all(
            authors.map(async (id) => {
              try {
                const user = await remote(
                  `https://slack.com/api/users.info?${new URLSearchParams({ user: id })}`,
                  { headers },
                );
                return [
                  id,
                  user.user?.profile?.display_name ||
                    user.user?.real_name ||
                    id,
                ];
              } catch {
                return [id, id];
              }
            }),
          ),
        );
        return json(res, 200, {
          items: [...unique.values()].map((i) => ({
            ...i,
            author: names.get(i.author) || i.author,
          })),
          truncated,
        });
      }
      if (path.startsWith("/api/"))
        throw new ApiError(404, "Шлях API не знайдено");
      if (!["GET", "HEAD"].includes(req.method))
        throw new ApiError(405, "Метод запиту не підтримується");
      const file = resolve(dist, "." + decodeURIComponent(path));
      if (!file.startsWith(dist + sep) && file !== dist)
        throw new ApiError(403, "Некоректний шлях");
      let asset = file;
      try {
        if (!(await stat(file)).isFile()) asset = resolve(dist, "index.html");
      } catch {
        asset = resolve(dist, "index.html");
      }
      const data = await readFile(asset);
      const mime =
        {
          ".html": "text/html; charset=utf-8",
          ".js": "text/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".json": "application/json",
          ".webmanifest": "application/manifest+json",
        }[extname(asset)] || "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": mime,
        "Cache-Control":
          extname(asset) === ".html" ? "no-cache" : "public, max-age=3600",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch (e) {
      json(res, e.status || 500, {
        error: e.status ? e.message : "Сталася непередбачена помилка сервера.",
      });
    }
  });
  server.on("close", () => {
    clearInterval(cleanup);
    sessions.clear();
  });
  return server;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const server = createApp();
  server.listen(
    Number(process.env.PORT || 4317),
    process.env.HOST || "0.0.0.0",
    () => console.log("Сервер Dayframe готовий до роботи."),
  );
}

import type { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { mapGoogleEvent, mapOutlookEvent } from "../../server/mappers.mjs";
import type { CalendarEvent } from "../types";
import type { Connection } from "./live";
export type DirectId = "outlook-work" | "outlook-personal" | "google";
const names = {
  "outlook-work": "Outlook · Робочий",
  "outlook-personal": "Outlook · Особистий",
  google: "Календар Google",
};
const tokens = new Map<
  DirectId,
  { token: string; expires: number; account?: AccountInfo }
>();
let microsoft:
  { id: string; ready: Promise<PublicClientApplication> } | undefined;
let googleScript: Promise<void> | undefined;
export function directIds(): { microsoft: string; google: string } {
  try {
    const saved = JSON.parse(
      localStorage.getItem("dayframe-direct-login") || "{}",
    );
    return {
      microsoft: typeof saved.microsoft === "string" ? saved.microsoft : "",
      google: typeof saved.google === "string" ? saved.google : "",
    };
  } catch {
    return { microsoft: "", google: "" };
  }
}
export function saveDirectIds(ids: { microsoft: string; google: string }) {
  const next = { microsoft: ids.microsoft.trim(), google: ids.google.trim() };
  if (
    next.microsoft &&
    !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
      next.microsoft,
    )
  )
    throw new Error("Microsoft Application ID має бути у форматі UUID.");
  if (
    next.google &&
    !/^[\w.-]+\.apps\.googleusercontent\.com$/.test(next.google)
  )
    throw new Error(
      "Google Client ID має закінчуватися на .apps.googleusercontent.com.",
    );
  const old = directIds();
  if (old.microsoft !== next.microsoft) {
    tokens.delete("outlook-work");
    tokens.delete("outlook-personal");
    microsoft = undefined;
  }
  if (old.google !== next.google) tokens.delete("google");
  localStorage.setItem("dayframe-direct-login", JSON.stringify(next));
}
export function directConfigured(id: string): id is DirectId {
  return id === "google"
    ? !!directIds().google
    : (id === "outlook-work" || id === "outlook-personal") &&
        !!directIds().microsoft;
}
export function directRedirect() {
  return new URL("oauth-redirect.html", new URL(".", location.href)).href;
}
export function directStatus(): Connection[] {
  return (Object.keys(names) as DirectId[]).map((id) => ({
    id,
    name: names[id],
    transport: "browser",
    configured: directConfigured(id),
    connected: (tokens.get(id)?.expires || 0) > Date.now(),
    expiresAt: tokens.get(id)?.expires || null,
    missing: [],
    redirectUri: directRedirect(),
  }));
}
async function msal() {
  const id = directIds().microsoft;
  if (!microsoft || microsoft.id !== id) {
    microsoft = {
      id,
      ready: (async () => {
        const { PublicClientApplication } = await import("@azure/msal-browser");
        const app = new PublicClientApplication({
          auth: {
            clientId: id,
            authority: "https://login.microsoftonline.com/common",
            redirectUri: directRedirect(),
          },
          cache: { cacheLocation: "memoryStorage" },
        });
        await app.initialize();
        return app;
      })(),
    };
  }
  return microsoft.ready;
}
type GoogleToken = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  scope?: string;
};
type GoogleIdentity = {
  accounts: {
    oauth2: {
      initTokenClient: (o: {
        client_id: string;
        scope: string;
        callback: (r: GoogleToken) => void;
        error_callback: () => void;
      }) => { requestAccessToken: (o: { prompt: string }) => void };
    };
  };
};
const googleIdentity = () =>
  (window as Window & { google?: GoogleIdentity }).google;
async function loadGoogle() {
  if (googleIdentity()) return;
  if (!googleScript)
    googleScript = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      const fail = () => {
        clearTimeout(timer);
        script.remove();
        googleScript = undefined;
        reject(
          new Error(
            "Не вдалося завантажити офіційний вхід Google. Спробуй ще раз.",
          ),
        );
      };
      const timer = setTimeout(fail, 15000);
      script.onload = () => {
        clearTimeout(timer);
        googleIdentity() ? resolve() : fail();
      };
      script.onerror = fail;
      document.head.append(script);
    });
  await googleScript;
}
export function warmDirectLogin() {
  const ids = directIds();
  if (ids.microsoft) void msal().catch(() => {});
  if (ids.google) void loadGoogle().catch(() => {});
}
export async function connectDirect(id: DirectId) {
  if (!directConfigured(id))
    throw new Error("Для входу ще потрібен публічний Client ID застосунку.");
  try {
    if (id === "google") {
      await loadGoogle();
      const result = await new Promise<GoogleToken>((resolve, reject) => {
        googleIdentity()!
          .accounts.oauth2.initTokenClient({
            client_id: directIds().google,
            scope: "https://www.googleapis.com/auth/calendar.events.readonly",
            callback: (r) =>
              r.error ? reject(new Error("access_denied")) : resolve(r),
            error_callback: () => reject(new Error("popup_closed")),
          })
          .requestAccessToken({ prompt: "select_account" });
      });
      if (
        !result.access_token ||
        !result.scope
          ?.split(" ")
          .includes("https://www.googleapis.com/auth/calendar.events.readonly")
      )
        throw new Error("access_denied");
      tokens.set(id, {
        token: result.access_token,
        expires: Date.now() + (Number(result.expires_in) || 3600) * 1000,
      });
    } else {
      const result = await (
        await msal()
      ).loginPopup({
        authority: `https://login.microsoftonline.com/${id === "outlook-work" ? "organizations" : "consumers"}`,
        scopes: ["https://graph.microsoft.com/Calendars.Read"],
        prompt: "select_account",
      });
      if (!result.accessToken) throw new Error("access_denied");
      tokens.set(id, {
        token: result.accessToken,
        account: result.account,
        expires: result.expiresOn?.getTime() || Date.now() + 3600000,
      });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    throw new Error(
      /AADSTS65001|AADSTS90094|AADSTS65004|admin_consent|consent_required/i.test(
        message,
      )
        ? "Microsoft вимагає дозволу адміністратора організації. Підключення не завершено."
        : /popup|cancel|user_cancelled/i.test(message)
          ? "Вхід скасовано або вікно заблоковано браузером. Спробуй ще раз."
          : /access_denied/i.test(message)
            ? "Дозвіл на читання календаря не надано. Підключення не завершено."
            : "Не вдалося увійти. Перевір Client ID, адресу повернення та дозволи акаунта.",
    );
  }
}
export function disconnectDirect(id: DirectId) {
  tokens.delete(id);
}
async function access(id: DirectId) {
  const c = tokens.get(id);
  if (!c) throw new Error("Увійди в календар у налаштуваннях.");
  if (c.expires > Date.now() + 60000) return c.token;
  if (id !== "google" && c.account) {
    try {
      const result = await (
        await msal()
      ).acquireTokenSilent({
        account: c.account,
        scopes: ["https://graph.microsoft.com/Calendars.Read"],
      });
      tokens.set(id, {
        token: result.accessToken,
        account: c.account,
        expires: result.expiresOn?.getTime() || Date.now() + 3600000,
      });
      return result.accessToken;
    } catch {
      /* Interactive consent must be started by a click. */
    }
  }
  tokens.delete(id);
  throw new Error("Дозвіл календаря сплив. Натисни «Увійти» ще раз.");
}
export async function directCalendar(
  id: DirectId,
  start: Date,
  end: Date,
): Promise<CalendarEvent[]> {
  const bearer = await access(id),
    google = id === "google";
  const initial = google
    ? `https://www.googleapis.com/calendar/v3/calendars/primary/events?${new URLSearchParams({ timeMin: start.toISOString(), timeMax: end.toISOString(), singleEvents: "true", maxResults: "100", orderBy: "startTime" })}`
    : `https://graph.microsoft.com/v1.0/me/calendarView?${new URLSearchParams({ startDateTime: start.toISOString(), endDateTime: end.toISOString(), $top: "100", $select: "id,subject,start,end,isAllDay,isCancelled,location,onlineMeeting,attendees,isReminderOn,webLink,iCalUId" })}`;
  let target: string | null = initial,
    pages = 0;
  const events: CalendarEvent[] = [];
  while (target) {
    if (++pages > 20) throw new Error("Забагато подій. Обери коротший період.");
    if (new URL(target).origin !== new URL(initial).origin)
      throw new Error(
        "Календар повернув некоректну адресу наступної сторінки.",
      );
    const r: Response = await fetch(target, {
      headers: {
        Authorization: `Bearer ${bearer}`,
        ...(!google ? { Prefer: 'outlook.timezone="UTC"' } : {}),
      },
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
    if (!r.ok) {
      if (r.status === 401) tokens.delete(id);
      throw new Error(
        r.status === 401
          ? "Увійди в календар знову."
          : r.status === 403
            ? "Акаунт не дозволив читати календар."
            : "Не вдалося оновити календар.",
      );
    }
    const data = await r.json();
    for (const e of (google ? data.items : data.value) || []) {
      if (e.isCancelled || e.status === "cancelled") continue;
      events.push(
        google
          ? mapGoogleEvent(e, "Europe/Kyiv")
          : {
              ...mapOutlookEvent(e, "Europe/Kyiv"),
              id: `${id}:${e.id}`,
              accountLabel: names[id],
            },
      );
    }
    if (google) {
      const next = new URL(initial);
      if (data.nextPageToken)
        next.searchParams.set("pageToken", data.nextPageToken);
      target = data.nextPageToken ? next.href : null;
    } else target = data["@odata.nextLink"] || null;
  }
  return [...new Map(events.map((e) => [e.id, e])).values()];
}

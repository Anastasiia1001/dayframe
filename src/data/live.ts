import {
  directCalendar,
  directConfigured,
  directStatus,
  disconnectDirect,
} from "./browserConnections";
import type { CalendarEvent, SlackDigestItem } from "../types";
export type IntegrationId =
  | "outlook-work"
  | "outlook-personal"
  | "google"
  | "slack"
  | "jira";
export interface Connection {
  id: IntegrationId;
  name: string;
  configured: boolean;
  connected: boolean;
  missing: string[];
  redirectUri: string;
  expiresAt: number | null;
  transport?: "browser" | "server";
}
export interface WorkspaceStatus {
  providers: Connection[];
  disabled: string[];
  sessionStorage: string;
  sessionHours: number;
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      signal: AbortSignal.timeout(20000),
      headers: { Accept: "application/json", ...init?.headers },
    });
  } catch {
    throw new Error(
      "Не вдалося з’єднатися із сервером. Перевір інтернет-з’єднання та спробуй ще раз.",
    );
  }
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error(
      "Для календарів налаштуй прямий вхід у налаштуваннях. Slack і Jira використовують окреме серверне підключення.",
    );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Не вдалося завантажити дані цього джерела.");
  return data as T;
}
export const live = {
  status: async (): Promise<WorkspaceStatus> => {
    const direct = directStatus();
    if (!direct.some((p) => p.configured))
      return api<WorkspaceStatus>("/api/status");
    let server: WorkspaceStatus | null = null;
    if (!location.hostname.endsWith("github.io")) {
      try {
        server = await api<WorkspaceStatus>("/api/status");
      } catch {
        /* Direct calendars do not need a server. */
      }
    }
    return {
      providers: [
        ...direct.map((p) =>
          p.configured ? p : server?.providers.find((x) => x.id === p.id) || p,
        ),
        ...(server?.providers.filter(
          (p) => !direct.some((d) => d.id === p.id),
        ) || []),
      ],
      disabled: server?.disabled || ["Confluence"],
      sessionStorage: "browser-memory",
      sessionHours: 0,
    };
  },
  calendar: async (
    id: "outlook-work" | "outlook-personal" | "google",
    start: Date,
    end: Date,
  ) => {
    if (directConfigured(id)) return directCalendar(id, start, end);
    const data = await api<{ events: CalendarEvent[] }>(
      `/api/calendar/${id}?${new URLSearchParams({ start: start.toISOString(), end: end.toISOString(), timeZone: "Europe/Kyiv" })}`,
    );
    return data.events;
  },
  jira: () => api<{ issues: JiraPlan[]; truncated: boolean }>("/api/jira"),
  slack: async (channels: string) =>
    api<{ items: SlackDigestItem[]; truncated: boolean }>(
      `/api/slack?${new URLSearchParams({ channels })}`,
    ),
  disconnect: async (id: IntegrationId) => {
    if (directConfigured(id)) {
      disconnectDirect(id);
      return { ok: true };
    }
    return api<{ ok: boolean }>(`/api/auth/${id}/disconnect`, {
      method: "POST",
    });
  },
};
export function calendarRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 42);
  const agendaEnd = new Date(date);
  agendaEnd.setDate(agendaEnd.getDate() + 8);
  if (agendaEnd > end) end.setTime(agendaEnd.getTime());
  return { start, end };
}

export interface JiraPlan {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  due: string;
  url: string;
  site: string;
}

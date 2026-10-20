import type { CalendarEvent, SlackDigestItem } from "../types";
export type IntegrationId =
  "outlook-work" | "outlook-personal" | "google" | "slack";
export interface Connection {
  id: IntegrationId;
  name: string;
  configured: boolean;
  connected: boolean;
  missing: string[];
  redirectUri: string;
  expiresAt: number | null;
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
      "Для реальних підключень потрібен сервер Dayframe. На цьому статичному сайті доступні особисті завдання та деморежим.",
    );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Не вдалося завантажити дані цього джерела.");
  return data as T;
}
export const live = {
  status: () => api<WorkspaceStatus>("/api/status"),
  calendar: async (
    id: "outlook-work" | "outlook-personal" | "google",
    start: Date,
    end: Date,
  ) => {
    const data = await api<{ events: CalendarEvent[] }>(
      `/api/calendar/${id}?${new URLSearchParams({ start: start.toISOString(), end: end.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}`,
    );
    return data.events;
  },
  slack: async (channels: string) =>
    api<{ items: SlackDigestItem[]; truncated: boolean }>(
      `/api/slack?${new URLSearchParams({ channels })}`,
    ),
  disconnect: async (id: IntegrationId) =>
    api<{ ok: boolean }>(`/api/auth/${id}/disconnect`, { method: "POST" }),
};
export function calendarRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 42);
  return { start, end };
}

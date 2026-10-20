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
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    signal: AbortSignal.timeout(20000),
    headers: { Accept: "application/json", ...init?.headers },
  });
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error(
      "Live connections need a hosted Dayframe server. This static site supports personal tasks and demo mode.",
    );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Could not load this source.");
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

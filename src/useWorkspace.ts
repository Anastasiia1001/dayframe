import { useCallback, useEffect, useRef, useState } from "react";
import type { CalendarEvent, SlackDigestItem } from "./types";
import { live, calendarRange, type WorkspaceStatus } from "./data/live";
import { providers } from "./data/providers";
import { useLocal } from "./useLocal";
export function useWorkspace(date: Date) {
  const [mode, setMode] = useLocal<"live" | "demo">(
    "dayframe-data-mode",
    "live",
  );
  const [channels, setChannels] = useLocal("dayframe-slack-channels", "");
  const [status, setStatus] = useState<WorkspaceStatus | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]),
    [slack, setSlack] = useState<SlackDigestItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]),
    [loading, setLoading] = useState(false),
    [updated, setUpdated] = useState<Date | null>(null);
  const [loadedMode, setLoadedMode] = useState<"live" | "demo" | null>(null);
  const generation = useRef(0);
  const month = `${date.getFullYear()}-${date.getMonth()}`;
  const refresh = useCallback(async () => {
    const g = ++generation.current;
    setLoading(true);
    setErrors([]);
    try {
      if (mode === "demo") {
        const [e, s] = await Promise.all([
          providers.calendar.getAll(),
          providers.slack.getAll(),
        ]);
        if (g !== generation.current) return;
        setLoadedMode(mode);
        setEvents(e);
        setSlack(s);
        setUpdated(new Date());
        return;
      }
      const current = await live.status();
      if (g !== generation.current) return;
      setStatus(current);
      const { start, end } = calendarRange(date);
      const selected = current.providers.filter((p) => p.connected);
      const results = await Promise.allSettled(
        selected.map(async (p) =>
          p.id === "slack"
            ? { id: p.id, data: await live.slack(channels) }
            : { id: p.id, data: await live.calendar(p.id, start, end) },
        ),
      );
      if (g !== generation.current) return;
      const nextEvents: CalendarEvent[] = [],
        nextSlack: SlackDigestItem[] = [],
        failures: string[] = [];
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          failures.push(
            `${selected[i].name}: ${r.reason instanceof Error ? r.reason.message : "Could not sync."}`,
          );
          return;
        }
        if (r.value.id === "slack") {
          const d = r.value.data as {
            items: SlackDigestItem[];
            truncated: boolean;
          };
          nextSlack.push(...d.items);
          if (d.truncated)
            failures.push(
              "Slack: showing up to 30 latest results per query. Narrow your channel selection for more focus.",
            );
        } else nextEvents.push(...(r.value.data as CalendarEvent[]));
      });
      const uniqueEvents = new Map<string, CalendarEvent>();
      for (const e of nextEvents) {
        const key = e.externalUid
          ? `${e.externalUid}:${e.date}:${e.start}`
          : e.id;
        if (!uniqueEvents.has(key)) uniqueEvents.set(key, e);
      }
      setLoadedMode(mode);
      setEvents(
        [...uniqueEvents.values()].sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            Number(!!b.allDay) - Number(!!a.allDay) ||
            a.start.localeCompare(b.start),
        ),
      );
      setSlack(nextSlack);
      setErrors(failures);
      setUpdated(new Date());
    } catch (e) {
      if (g === generation.current) {
        setLoadedMode(mode);
        setStatus(null);
        setEvents([]);
        setSlack([]);
        setErrors([
          e instanceof Error
            ? e.message
            : "Could not reach the workspace server.",
        ]);
      }
    } finally {
      if (g === generation.current) setLoading(false);
    }
    // Fetches depend on the visible month, not on every render or intra-month navigation.
  }, [mode, channels, month]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    void refresh();
    return () => {
      generation.current++;
    };
  }, [refresh]);
  useEffect(() => {
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);
  return {
    mode,
    setMode,
    channels,
    setChannels,
    status,
    events: loadedMode === mode ? events : [],
    slack: loadedMode === mode ? slack : [],
    errors,
    loading,
    updated,
    refresh,
  };
}

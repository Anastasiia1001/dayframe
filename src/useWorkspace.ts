import { useCallback, useEffect, useRef, useState } from "react";
import type { CalendarEvent, SlackDigestItem } from "./types";
import {
  live,
  calendarRange,
  type JiraPlan,
  type WorkspaceStatus,
} from "./data/live";
import { providers } from "./data/providers";
import { useLocal } from "./useLocal";
export function useWorkspace(date: Date) {
  const [mode, setMode] = useLocal<"live" | "demo">(
    "dayframe-data-mode",
    "live",
  );
  const [channels, setChannels] = useLocal("dayframe-slack-channels", "");
  const [status, setStatus] = useState<WorkspaceStatus | null>(null);
  const [jira, setJira] = useState<JiraPlan[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]),
    [slack, setSlack] = useState<SlackDigestItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]),
    [loading, setLoading] = useState(false),
    [updated, setUpdated] = useState<Date | null>(null);
  const [loadedMode, setLoadedMode] = useState<"live" | "demo" | null>(null);
  const generation = useRef(0);
  const rangeKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
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
        setJira([]);
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
          p.id === "jira"
            ? { id: p.id, data: await live.jira() }
            : p.id === "slack"
              ? { id: p.id, data: await live.slack(channels) }
              : { id: p.id, data: await live.calendar(p.id, start, end) },
        ),
      );
      if (g !== generation.current) return;
      const nextEvents: CalendarEvent[] = [],
        nextSlack: SlackDigestItem[] = [],
        nextJira: JiraPlan[] = [],
        failures: string[] = [];
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          failures.push(
            `${selected[i].name}: ${r.reason instanceof Error ? r.reason.message : "Не вдалося оновити дані."}`,
          );
          return;
        }
        if (r.value.id === "jira") {
          const data = r.value.data as {
            issues: JiraPlan[];
            truncated: boolean;
          };
          nextJira.push(...data.issues);
          if (data.truncated)
            failures.push(
              "Jira: показано до 500 активних завдань на кожному з перших п’яти сайтів.",
            );
          for (const issue of data.issues)
            if (issue.due) {
              const endDate = new Date(issue.due + "T12:00:00Z");
              endDate.setUTCDate(endDate.getUTCDate() + 1);
              nextEvents.push({
                id: `jira:${issue.id}`,
                title: `${issue.key} · ${issue.title}`,
                source: "Jira",
                date: issue.due,
                start: "Увесь день",
                end: "Увесь день",
                endDate: endDate.toISOString().slice(0, 10),
                allDay: true,
                location: issue.site,
                participants: [],
                reminder: false,
                url: issue.url,
              });
            }
        } else if (r.value.id === "slack") {
          const d = r.value.data as {
            items: SlackDigestItem[];
            truncated: boolean;
          };
          nextSlack.push(...d.items);
          if (d.truncated)
            failures.push(
              "Slack: показано до 30 останніх результатів на запит. Зменш кількість каналів, щоб зосередитися на важливому.",
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
      setJira(nextJira);
      setErrors(failures);
      setUpdated(new Date());
    } catch (e) {
      if (g === generation.current) {
        setLoadedMode(mode);
        setStatus(null);
        setEvents([]);
        setSlack([]);
        setJira([]);
        setErrors([
          e instanceof Error ? e.message : "Не вдалося з’єднатися із сервером.",
        ]);
      }
    } finally {
      if (g === generation.current) setLoading(false);
    }
    // Fetches depend on the selected day, not on every render.
  }, [mode, channels, rangeKey]); // eslint-disable-line react-hooks/exhaustive-deps
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
  useEffect(() => {
    if (mode !== "live" || !status?.providers.some((p) => p.connected)) return;
    const timer = setInterval(
      () => {
        if (!document.hidden) void refresh();
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(timer);
  }, [mode, status, refresh]);
  return {
    mode,
    setMode,
    channels,
    setChannels,
    status,
    events: loadedMode === mode ? events : [],
    slack: loadedMode === mode ? slack : [],
    jira: loadedMode === mode ? jira : [],
    errors,
    loading,
    updated,
    refresh,
  };
}

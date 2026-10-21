import { useEffect, useRef, useState } from "react";
import type { PersonalTask } from "./types";
import { addDays, fromDate, minutes } from "./domain/planning";
import { scheduledEvents } from "./domain/studio";
export type TaskReminder = { id: string; title: string; time: string };
export function useTaskReminders(tasks: PersonalTask[]) {
  const [alerts, setAlerts] = useState<TaskReminder[]>([]);
  const seen = useRef(new Set<string>());
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const today = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Kyiv",
      }).format(now);
      const current = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Kyiv",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(now);
      const enabled = tasks.filter((t) => t.reminderMinutes !== undefined);
      for (const event of scheduledEvents(enabled, today, addDays(today, 1))) {
        const task = enabled.find((t) => t.id === event.taskId)!;
        const delta =
          Math.round(
            (fromDate(event.date).getTime() - fromDate(today).getTime()) /
              86400000,
          ) *
            1440 +
          minutes(event.start) -
          minutes(current);
        const id = `${event.id}:${event.date}:${event.start}:${task.reminderMinutes}`;
        if (
          delta > (task.reminderMinutes || 0) ||
          delta < -5 ||
          seen.current.has(id)
        )
          continue;
        let delivered = false;
        try {
          delivered = !!sessionStorage.getItem("dayframe-reminded:" + id);
        } catch {}
        if (delivered) continue;
        seen.current.add(id);
        try {
          sessionStorage.setItem("dayframe-reminded:" + id, "1");
        } catch {}
        setAlerts((previous) => [
          ...previous,
          { id, title: task.title, time: event.start },
        ]);
      }
    };
    check();
    const timer = setInterval(check, 15000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [tasks]);
  return {
    alerts,
    dismiss: (id: string) =>
      setAlerts((list) => list.filter((alert) => alert.id !== id)),
  };
}

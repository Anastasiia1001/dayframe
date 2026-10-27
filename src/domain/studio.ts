import type { CalendarEvent, PersonalTask } from "../types";
import { addDays, dateKey, minutes } from "./planning.ts";
import { nextOccurrence } from "../recurrence.ts";
export type Section = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
};
export const initialSections: Section[] = [
  { id: "work", name: "Робота", color: "#795875", visible: true },
  { id: "creative", name: "Творчість", color: "#527d6b", visible: true },
  { id: "personal", name: "Особисте", color: "#af653e", visible: true },
  { id: "sport", name: "Спорт", color: "#527e8a", visible: true },
  { id: "ideas", name: "Ідеї та «колись»", color: "#627790", visible: true },
];
export const timeString = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export function quickEntry(text: string, today: string) {
  let date = today;
  if (/завтра/i.test(text)) date = addDays(today, 1);
  if (/післязавтра/i.test(text)) date = addDays(today, 2);
  const explicit = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (explicit && !Number.isNaN(new Date(explicit[1] + "T12:00:00").getTime()))
    date = explicit[1];
  const match = text.match(/(?:о\s+)?([01]?\d|2[0-3]):([0-5]\d)/);
  const duration = text.match(/(\d+)\s*(год(?:ин[аиу]?)?|хв(?:илин[аиу]?)?)/i);
  const length = duration
    ? Number(duration[1]) * (duration[2].startsWith("год") ? 60 : 1)
    : /годин[ау]/i.test(text)
      ? 60
      : 30;
  return {
    date,
    start: match ? `${match[1].padStart(2, "0")}:${match[2]}` : "",
    duration: Math.max(15, Math.min(720, length)),
    title: text
      .replace(/післязавтра|завтра|сьогодні/gi, "")
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, "")
      .replace(/(?:о\s+)?(?:[01]?\d|2[0-3]):[0-5]\d/g, "")
      .replace(/(?:\d+\s*)?(?:годин[ауи]?|хвилин[ауи]?)/gi, "")
      .replace(/[, ]+$/, "")
      .trim(),
  };
}
export type LocalOccurrence = CalendarEvent & {
  taskId: string;
  occurrence: string;
};
export function scheduledEvents(
  tasks: PersonalTask[],
  from: string,
  until: string,
): LocalOccurrence[] {
  const result: LocalOccurrence[] = [];
  for (const task of tasks.filter(
    (t) =>
      !t.isTemplate &&
      !t.disabled &&
      !t.inBacklog &&
      !t.completed &&
      (t.scheduledStart || t.allDay),
  )) {
    let date = task.date,
      count = 0;
    while (date && date <= until && count++ < 20000) {
      const override = task.seriesExceptions?.[date];
      const actual = override?.date || date;
      if (!override?.cancelled && actual >= from && actual <= until) {
        const start = override?.start || task.scheduledStart || "09:00";
        const duration = override?.duration || task.scheduledDuration || 30;
        const end = minutes(start) + duration;
        result.push({
          id: `local:${task.id}:${date}`,
          taskId: task.id,
          occurrence: date,
          title: task.title,
          date: actual,
          start,
          end: timeString(end % 1440),
          endDate: task.allDay || end >= 1440 ? addDays(actual, 1) : undefined,
          allDay: task.allDay,
          source: "Google",
          location: "",
          participants: [],
          reminder: false,
        });
      }
      const next = nextOccurrence(task, date);
      if (!next || next <= date) break;
      date = next;
    }
    // A moved occurrence can enter the window even when its original date is outside it.
    for (const [original, override] of Object.entries(
      task.seriesExceptions || {},
    )) {
      if (
        (original >= from && original <= until) ||
        override.cancelled ||
        override.date < from ||
        override.date > until ||
        result.some((e) => e.taskId === task.id && e.occurrence === original)
      )
        continue;
      const end = minutes(override.start) + override.duration;
      result.push({
        id: `local:${task.id}:${original}`,
        taskId: task.id,
        occurrence: original,
        title: task.title,
        date: override.date,
        start: override.start,
        end: timeString(end % 1440),
        endDate:
          task.allDay || end >= 1440 ? addDays(override.date, 1) : undefined,
        allDay: task.allDay,
        source: "Google",
        location: "",
        participants: [],
        reminder: false,
      });
    }
  }
  return result;
}
export const kyivToday = () => {
  const d = new Date();
  return (
    new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Kyiv" }).format(d) ||
    dateKey(d)
  );
};

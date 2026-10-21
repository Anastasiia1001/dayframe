import type { CalendarEvent, PersonalTask } from "../types";
export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fromDate = (key: string) => new Date(key + "T12:00:00");
export function addDays(key: string, n: number) {
  const d = fromDate(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
export function moveDate(d: Date, view: string, direction: number) {
  const next = new Date(d);
  if (view === "Month") {
    const day = next.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + direction);
    next.setDate(
      Math.min(
        day,
        new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate(),
      ),
    );
  } else next.setDate(next.getDate() + direction * (view === "Week" ? 7 : 1));
  return next;
}
export function activeTasks(tasks: PersonalTask[]) {
  return tasks.filter((t) => !t.isTemplate && !t.disabled && !t.inBacklog);
}
export function sortTasks(tasks: PersonalTask[]) {
  const ranks: Record<string, number> = { High: 0, Normal: 1, Low: 2 };
  return [...tasks].sort(
    (a, b) =>
      Number(a.completed) - Number(b.completed) ||
      a.date.localeCompare(b.date) ||
      (ranks[a.priority] ?? 1) - (ranks[b.priority] ?? 1) ||
      a.title.localeCompare(b.title, "uk"),
  );
}
export function postponedTask(t: PersonalTask, today: string): PersonalTask {
  return {
    ...t,
    date: addDays(!t.inBacklog && t.date > today ? t.date : today, 1),
    inBacklog: false,
    planningHorizon: "day",
    planningAnchor: today,
    completed: false,
    completedOn: undefined,
    nextOccurrence: undefined,
  };
}
export function eventOnDay(e: CalendarEvent, day: string) {
  const end =
    e.endDate || (!e.allDay && e.end < e.start ? addDays(e.date, 1) : e.date);
  if (e.allDay) return e.date <= day && day < (e.endDate || addDays(e.date, 1));
  return (
    e.date <= day &&
    day <= end &&
    !(day === end && day !== e.date && e.end === "00:00")
  );
}
export const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : 0;
};
export interface EventPosition {
  event: CalendarEvent;
  start: number;
  end: number;
  column: number;
  columns: number;
}
export function layoutEvents(
  events: CalendarEvent[],
  day: string,
): EventPosition[] {
  const list = events
    .filter((e) => !e.allDay && eventOnDay(e, day))
    .map((event) => ({
      event,
      start: event.date < day ? 0 : minutes(event.start),
      end:
        (event.endDate && event.endDate > day) ||
        (!event.endDate && event.end < event.start && event.date === day)
          ? 1440
          : minutes(event.end),
      column: 0,
      columns: 1,
    }))
    .sort((a, b) => a.start - b.start || b.end - a.end);
  let group: EventPosition[] = [],
    until = -1;
  const finish = () => {
    const lanes: number[] = [];
    for (const e of group) {
      let col = lanes.findIndex((end) => end <= e.start);
      if (col < 0) col = lanes.length;
      lanes[col] = Math.max(e.end, e.start + 24);
      e.column = col;
    }
    for (const e of group) e.columns = lanes.length;
    group = [];
  };
  for (const e of list) {
    if (e.start >= until) {
      finish();
      until = -1;
    }
    group.push(e);
    until = Math.max(until, e.end, e.start + 24);
  }
  finish();
  return list;
}
export function normalizeStoredTasks(
  tasks: PersonalTask[],
  seeds: PersonalTask[],
  today: string,
) {
  const baselineDate = tasks.find((t) => t.id === "Day-3")?.date;
  let changed = false;
  const next = tasks.map((t) => {
    let value = t;
    const seed = seeds.find((s) => s.id === t.id);
    if (
      t.isTemplate === undefined &&
      seed?.isTemplate &&
      !!baselineDate &&
      t.date === baselineDate &&
      t.title === seed.title &&
      t.category === seed.category &&
      t.recurrence === seed.recurrence &&
      t.priority === seed.priority &&
      !t.completed &&
      !t.disabled &&
      !t.notes
    ) {
      value = { ...value, isTemplate: true };
      changed = true;
    }
    if (t.date === "NaN-NaN-NaN") {
      value = { ...value, date: addDays(today, 1) };
      changed = true;
    }
    return value;
  });
  return changed ? next : tasks;
}

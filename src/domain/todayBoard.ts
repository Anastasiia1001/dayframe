import type { PersonalTask } from "../types";
import { nextOccurrence } from "../recurrence.ts";
export type TodayColumn = "plans" | "today" | "done";
export function todayColumn(
  task: PersonalTask,
  today: string,
): TodayColumn | null {
  if (task.disabled || task.isTemplate) return null;
  if (task.completed)
    return (task.completedOn || task.date) === today ? "done" : null;
  return task.inBacklog || task.date > today ? "plans" : "today";
}
export function moveTodayTask(
  tasks: PersonalTask[],
  id: string,
  column: TodayColumn,
  today: string,
  before?: string,
) {
  const source = tasks.find((t) => t.id === id);
  if (!source || todayColumn(source, today) === null) return tasks;
  const changed: PersonalTask = {
    ...source,
    completed: column === "done",
    completedOn: column === "done" ? today : undefined,
    nextOccurrence:
      column === "done" ? nextOccurrence(source, today) : undefined,
    ...(column === "plans"
      ? {
          inBacklog: true,
          planningHorizon: "backlog",
          date: "",
          scheduledStart: undefined,
          scheduledDuration: undefined,
          allDay: undefined,
        }
      : {
          inBacklog: false,
          planningHorizon: "day",
          planningAnchor: today,
          date: today,
        }),
  };
  const next = tasks.map((t) => (t.id === id ? changed : t));
  const destination = next
    .filter((t) => t.id !== id && todayColumn(t, today) === column)
    .sort(
      (a, b) =>
        (a.plannerRank ?? tasks.indexOf(a) * 1024) -
        (b.plannerRank ?? tasks.indexOf(b) * 1024),
    );
  const index = before ? destination.findIndex((t) => t.id === before) : -1;
  destination.splice(index < 0 ? destination.length : index, 0, changed);
  const ranks = new Map(destination.map((t, index) => [t.id, index * 1024]));
  return next.map((t) =>
    ranks.has(t.id) ? { ...t, plannerRank: ranks.get(t.id) } : t,
  );
}

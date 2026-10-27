import { restOccurrences } from "./rest.ts";
import type { PersonalTask } from "../types";
export const focusedOn = (task: PersonalTask, date: string) =>
  !!task.focusDates?.includes(date);
/** Additive task references: no copied titles, migrations or duplicate records. */
export function chooseFocus(
  tasks: PersonalTask[],
  id: string,
  date: string,
): PersonalTask[] {
  const task = tasks.find((t) => t.id === id);
  if (!task || task.isTemplate) return tasks;
  const chosen = focusedOn(task, date);
  const eligible = new Set(restOccurrences(tasks, date).map((r) => r.task.id));
  if (
    !chosen &&
    tasks.filter(
      (t) =>
        !t.disabled &&
        !t.isTemplate &&
        !t.inBacklog &&
        (eligible.has(t.id) ||
          (t.completed && (t.date === date || t.completedOn === date))) &&
        focusedOn(t, date),
    ).length >= 3
  )
    return tasks;
  return tasks.map((t) =>
    t.id === id
      ? {
          ...t,
          focusDates: chosen
            ? (t.focusDates || []).filter((d) => d !== date)
            : [...(t.focusDates || []), date],
        }
      : t,
  );
}

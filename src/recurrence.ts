import type { PersonalTask } from "./types";
const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** Calendar arithmetic keeps month-end tasks on a valid day rather than skipping a month. */
export function nextOccurrence(
  task: Pick<PersonalTask, "recurrence" | "customDays">,
  from: string,
): string | undefined {
  if (task.recurrence === "once") return undefined;
  const d = new Date(from + "T12:00:00");
  if (!Number.isFinite(d.getTime())) return undefined;
  const months: Record<string, number> = {
    monthly: 1,
    "every 3 months": 3,
    yearly: 12,
  };
  if (months[task.recurrence]) {
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + months[task.recurrence]);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
  } else {
    const days =
      task.recurrence === "daily"
        ? 1
        : task.recurrence === "weekly"
          ? 7
          : task.recurrence === "custom"
            ? Math.max(1, Math.min(36500, Math.floor(task.customDays || 2)))
            : 0;
    if (!days) return undefined;
    d.setDate(d.getDate() + days);
  }
  return key(d);
}
export function reopenDueTasks(
  tasks: PersonalTask[],
  today: string,
): PersonalTask[] {
  let changed = false;
  const next = tasks.map((t) => {
    const due =
      t.nextOccurrence ||
      (t.completed ? nextOccurrence(t, t.completedOn || t.date) : undefined);
    if (t.completed && !t.disabled && !t.inBacklog && due && due <= today) {
      changed = true;
      return {
        ...t,
        completed: false,
        date: due,
        nextOccurrence: undefined,
        completedOn: undefined,
      };
    }
    return t;
  });
  return changed ? next : tasks;
}

import type { PersonalTask } from "../types";
import { addDays, fromDate } from "./planning.ts";
/** Preserve record identity for series edits; detach exactly one occurrence when requested. */
export function applyRecordEdit(
  tasks: PersonalTask[],
  draft: PersonalTask,
  scope = "all",
  occurrence?: string | null,
  newId = () => crypto.randomUUID(),
): PersonalTask[] {
  const value = { ...draft, title: draft.title.trim() };
  const original = tasks.find((t) => t.id === draft.id);
  if (!original) return [...tasks, value];
  if (original.recurrence !== "once" && occurrence && scope === "one") {
    return [
      ...tasks.map((t) =>
        t.id === original.id
          ? {
              ...t,
              seriesExceptions: {
                ...t.seriesExceptions,
                [occurrence]: {
                  date: draft.date,
                  start: draft.scheduledStart || "09:00",
                  duration: draft.scheduledDuration || 30,
                  cancelled: true,
                },
              },
            }
          : t,
      ),
      {
        ...value,
        id: newId(),
        recurrence: "once",
        seriesExceptions: undefined,
      },
    ];
  }
  return tasks.map((t) =>
    t.id === draft.id
      ? {
          ...value,
          date:
            occurrence &&
            original.date &&
            draft.date &&
            !draft.inBacklog &&
            original.recurrence !== "once" &&
            scope === "all"
              ? addDays(
                  original.date,
                  Math.round(
                    (fromDate(draft.date).getTime() -
                      fromDate(occurrence).getTime()) /
                      86400000,
                  ),
                )
              : draft.date,
        }
      : t,
  );
}

export function deleteRecord(
  tasks: PersonalTask[],
  id: string,
  scope: string,
  occurrence: string,
) {
  return tasks.flatMap((task) =>
    task.id !== id
      ? [task]
      : task.recurrence !== "once" && scope === "one" && !!occurrence
        ? [
            {
              ...task,
              seriesExceptions: {
                ...task.seriesExceptions,
                [occurrence]: {
                  date: occurrence,
                  start: task.scheduledStart || "09:00",
                  duration: task.scheduledDuration || 30,
                  cancelled: true,
                },
              },
            },
          ]
        : [],
  );
}

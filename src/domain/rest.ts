import type { PersonalTask } from "../types";
import { nextOccurrence } from "../recurrence.ts";

export const PRIVATE_REST_KEY = "dayframe-private-rest";
export type PrivateNote = { id: string; text: string; updated: string };
export function readPrivateNotes(
  storage: Pick<Storage, "getItem">,
): PrivateNote[] {
  const raw = storage.getItem(PRIVATE_REST_KEY);
  if (!raw) return [];
  const notes: unknown = JSON.parse(raw);
  if (
    !Array.isArray(notes) ||
    !notes.every(
      (n) =>
        n &&
        typeof n.id === "string" &&
        typeof n.text === "string" &&
        typeof n.updated === "string",
    )
  )
    throw Error("invalid private notes");
  return notes;
}
export function writePrivateNotes(
  storage: Pick<Storage, "setItem">,
  notes: PrivateNote[],
) {
  storage.setItem(PRIVATE_REST_KEY, JSON.stringify(notes));
}
export function backupKeyAllowed(key: string) {
  return (
    key.startsWith("dayframe-") && !/token|secret|session|private/i.test(key)
  );
}
export type RestOccurrence = { task: PersonalTask; occurrence: string };
/** Local tasks only. External CalendarEvent records are deliberately not accepted. */
export function restOccurrences(
  tasks: PersonalTask[],
  today: string,
): RestOccurrence[] {
  const rows: RestOccurrence[] = [];
  for (const task of tasks) {
    if (
      task.disabled ||
      task.completed ||
      task.isTemplate ||
      task.inBacklog ||
      !task.date
    )
      continue;
    let date = task.date;
    for (let i = 0; date && date <= today && i < 20000; i++) {
      const exception = task.seriesExceptions?.[date];
      if (!exception?.cancelled && (exception?.date || date) === today)
        rows.push({ task, occurrence: date });
      const next = nextOccurrence(task, date);
      if (!next || next <= date) break;
      date = next;
    }
    for (const [original, exception] of Object.entries(
      task.seriesExceptions || {},
    )) {
      if (original > today && exception.date === today && !exception.cancelled)
        rows.push({ task, occurrence: original });
    }
  }
  return rows;
}
export type RestChoice = {
  id: string;
  occurrence: string;
  action: "keep" | "date" | "backlog";
  date?: string;
  scope: "occurrence" | "series";
};
const validDate = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  Number.isFinite(Date.parse(date + "T12:00:00Z")) &&
  new Date(date + "T12:00:00Z").toISOString().slice(0, 10) === date;
/** Pure, reviewable transaction. All identifiers for explicit occurrence copies are supplied by the caller. */
export function lightenDay(
  tasks: PersonalTask[],
  today: string,
  focusIds: string[],
  choices: RestChoice[],
  newId: () => string,
) {
  const rows = restOccurrences(tasks, today);
  const available = new Set(rows.map((r) => r.task.id));
  if (new Set(focusIds).size > 3 || focusIds.some((id) => !available.has(id)))
    throw Error("Обери до трьох справ поточного дня.");
  if (
    choices.some(
      (c) =>
        !rows.some((r) => r.task.id === c.id && r.occurrence === c.occurrence),
    )
  )
    throw Error("Список справ змінився. Переглянь день ще раз.");
  if (
    choices.some((c) => c.action === "date" && (!c.date || !validDate(c.date)))
  )
    throw Error("Обери коректну дату перенесення.");
  const focus = new Set(focusIds),
    output = tasks.map((t) =>
      available.has(t.id)
        ? {
            ...t,
            focusDates: [
              ...(t.focusDates || []).filter((d) => d !== today),
              ...(focus.has(t.id) ? [today] : []),
            ],
          }
        : t,
    );
  const changes: string[] = [];
  for (const c of choices) {
    if (c.action === "keep" || focus.has(c.id)) continue;
    const index = output.findIndex((t) => t.id === c.id),
      task = output[index];
    const recurring = task.recurrence !== "once";
    const destination = c.action === "backlog" ? "без дати" : c.date!;
    changes.push(
      `${task.title} → ${destination}${recurring ? (c.scope === "series" ? " · уся серія" : " · лише це виконання") : ""}`,
    );
    const patch = {
      date: c.action === "backlog" ? "" : c.date!,
      inBacklog: c.action === "backlog",
      planningHorizon:
        c.action === "backlog" ? ("backlog" as const) : ("day" as const),
      focusDates: (task.focusDates || []).filter((d) => d !== today),
    };
    if (recurring && c.scope === "occurrence") {
      output[index] = {
        ...task,
        seriesExceptions: {
          ...task.seriesExceptions,
          [c.occurrence]: {
            date: today,
            start: task.scheduledStart || "09:00",
            duration: task.scheduledDuration || 30,
            cancelled: true,
          },
        },
      };
      output.push({
        ...task,
        ...patch,
        id: newId(),
        recurrence: "once",
        customDays: undefined,
        seriesExceptions: undefined,
        origin: undefined,
        completedOn: undefined,
        nextOccurrence: undefined,
      });
    } else output[index] = { ...task, ...patch };
  }
  const oldFocus = rows
    .filter((r) => r.task.focusDates?.includes(today))
    .map((r) => r.task.id);
  if (oldFocus.length !== focus.size || oldFocus.some((id) => !focus.has(id)))
    changes.unshift(
      `Головні справи: ${
        focus.size
          ? rows
              .filter((r) => focus.has(r.task.id))
              .map((r) => r.task.title)
              .join(", ")
          : "без обраних"
      }`,
    );
  return { tasks: output, changes };
}

import { isFitnessData, type FitnessData } from "./fitness.ts";
import type { PersonalTask } from "../types";
import type { DailyPlan } from "../dailyPlans";
import type { Section } from "./studio";
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const date = (v: unknown) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(Date.parse(v + "T12:00:00"));
const time = (v: unknown) =>
  typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const image = (v: unknown) =>
  typeof v === "string" && /^data:image\/(png|jpeg|webp|gif);base64,/.test(v);
export function parseBackup(value: unknown): {
  tasks: PersonalTask[];
  fitness?: FitnessData;
  sections?: Section[];
  plans?: Record<string, DailyPlan>;
} {
  if (
    !record(value) ||
    value.format !== "dayframe-backup" ||
    value.version !== 1 ||
    !record(value.data)
  )
    throw Error("format");
  const data = value.data,
    tasks = data["dayframe-tasks"];
  if (
    !Array.isArray(tasks) ||
    !tasks.every(
      (t) =>
        record(t) &&
        typeof t.id === "string" &&
        typeof t.title === "string" &&
        (date(t.date) || (t.inBacklog && t.date === "")) &&
        typeof t.notes === "string" &&
        typeof t.recurrence === "string" &&
        typeof t.completed === "boolean" &&
        typeof t.disabled === "boolean" &&
        (!t.scheduledStart || time(t.scheduledStart)) &&
        (t.scheduledDuration === undefined ||
          (typeof t.scheduledDuration === "number" &&
            t.scheduledDuration >= 15 &&
            t.scheduledDuration <= 1440)) &&
        (!t.cover || image(t.cover)) &&
        (!t.checklist ||
          (Array.isArray(t.checklist) &&
            t.checklist.every(
              (c) =>
                record(c) &&
                typeof c.id === "string" &&
                typeof c.title === "string" &&
                typeof c.done === "boolean",
            ))) &&
        (!t.attachments ||
          (Array.isArray(t.attachments) &&
            t.attachments.every(
              (a) =>
                record(a) &&
                typeof a.name === "string" &&
                typeof a.type === "string" &&
                typeof a.data === "string" &&
                a.data.startsWith("data:"),
            ))) &&
        (!t.links ||
          (Array.isArray(t.links) &&
            t.links.every((l) => typeof l === "string"))) &&
        (!t.seriesExceptions ||
          (record(t.seriesExceptions) &&
            Object.entries(t.seriesExceptions).every(
              ([d, e]) =>
                date(d) &&
                record(e) &&
                date(e.date) &&
                time(e.start) &&
                typeof e.duration === "number" &&
                e.duration >= 15 &&
                e.duration <= 1440,
            ))),
    )
  )
    throw Error("tasks");
  const sections = data["dayframe-sections"];
  if (
    sections !== undefined &&
    (!Array.isArray(sections) ||
      !sections.length ||
      !sections.every(
        (s) =>
          record(s) &&
          typeof s.id === "string" &&
          typeof s.name === "string" &&
          typeof s.visible === "boolean" &&
          typeof s.color === "string" &&
          /^#[a-f\d]{6}$/i.test(s.color),
      ))
  )
    throw Error("sections");
  const plans = data["dayframe-daily-plans"];
  if (
    plans !== undefined &&
    (!record(plans) ||
      !Object.entries(plans).every(
        ([d, p]) =>
          date(d) &&
          record(p) &&
          typeof p.notes === "string" &&
          Array.isArray(p.priorities) &&
          p.priorities.every(
            (v) =>
              record(v) &&
              typeof v.title === "string" &&
              typeof v.done === "boolean",
          ) &&
          Array.isArray(p.reminders) &&
          p.reminders.every(
            (r) =>
              record(r) &&
              typeof r.id === "string" &&
              typeof r.title === "string" &&
              typeof r.time === "string" &&
              typeof r.done === "boolean",
          ),
      ))
  )
    throw Error("plans");
  const fitness = data["dayframe-fitness"];
  if (fitness !== undefined && !isFitnessData(fitness)) throw Error("fitness");
  const unique = new Map((tasks as PersonalTask[]).map((t) => [t.id, t]));
  return {
    tasks: [...unique.values()],
    fitness: fitness as FitnessData | undefined,
    sections: sections as Section[] | undefined,
    plans: plans as Record<string, DailyPlan> | undefined,
  };
}
/** Stage writes with rollback: malformed or over-quota imports never replace current data. */
export function writeBackup(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  values: Record<string, unknown>,
) {
  const previous = new Map(
    Object.keys(values).map((k) => [k, storage.getItem(k)]),
  );
  try {
    for (const [key, value] of Object.entries(values))
      storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    for (const [key, value] of previous) {
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, value);
    }
    throw error;
  }
}

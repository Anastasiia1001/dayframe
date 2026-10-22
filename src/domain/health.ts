import type { FitnessData, Exercise } from "./fitness.ts";
export type HealthSnapshot = {
  from: string;
  to: string;
  readAt: string;
  days: { date: string; steps: number }[];
  workouts: { id: string; date: string; name: string; minutes: number }[];
};
const date = (s: unknown): s is string =>
  typeof s === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(Date.parse(s + "T12:00:00Z")) &&
  new Date(s + "T12:00:00Z").toISOString().slice(0, 10) === s;
export function validateHealthSnapshot(value: unknown): HealthSnapshot {
  const s = value as HealthSnapshot;
  if (
    !s ||
    !date(s.from) ||
    !date(s.to) ||
    s.from > s.to ||
    Date.parse(s.to) - Date.parse(s.from) > 31 * 86400000 ||
    typeof s.readAt !== "string" ||
    Number.isNaN(Date.parse(s.readAt)) ||
    !Array.isArray(s.days) ||
    s.days.length > 31 ||
    !Array.isArray(s.workouts) ||
    s.workouts.length > 10000 ||
    !s.days.every(
      (d) =>
        d &&
        date(d.date) &&
        d.date >= s.from &&
        d.date <= s.to &&
        Number.isInteger(d.steps) &&
        d.steps >= 0 &&
        d.steps <= 200000,
    ) ||
    !s.workouts.every(
      (w) =>
        w &&
        typeof w.id === "string" &&
        w.id.length > 0 &&
        w.id.length < 150 &&
        date(w.date) &&
        w.date >= s.from &&
        w.date <= s.to &&
        typeof w.name === "string" &&
        w.name.trim().length > 0 &&
        w.name.length <= 120 &&
        Number.isInteger(w.minutes) &&
        w.minutes > 0 &&
        w.minutes <= 1440,
    )
  )
    throw Error(
      "Некоректна відповідь Apple Здоров’я. Наявні записи збережено.",
    );
  return s;
}
export function mergeHealth(data: FitnessData, value: unknown): FitnessData {
  const snapshot = validateHealthSnapshot(value);
  const days = { ...data.days };
  // An empty HealthKit result may mean read permission was denied. Never erase records on that basis.
  for (const d of snapshot.days)
    days[d.date] = { ...(days[d.date] || { exercises: [] }), steps: d.steps };
  const seen = new Set<string>();
  for (const workout of snapshot.workouts) {
    if (seen.has(workout.id)) continue;
    seen.add(workout.id);
    const old = days[workout.date] || { steps: 0, exercises: [] };
    const exercise: Exercise = {
      id: `healthkit:${workout.id}`,
      name: workout.name,
      kind: "cardio",
      sets: 1,
      reps: 0,
      weight: 0,
      minutes: workout.minutes,
      done: true,
    };
    const exists = old.exercises.findIndex((e) => e.id === exercise.id);
    days[workout.date] = {
      ...old,
      exercises:
        exists < 0
          ? [...old.exercises, exercise]
          : old.exercises.map((e) => (e.id === exercise.id ? exercise : e)),
    };
  }
  return { ...data, days };
}

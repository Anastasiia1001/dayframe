export type HabitFrequency =
  "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
export type Habit = {
  id: string;
  title: string;
  frequency: HabitFrequency;
  checks: Record<string, boolean>;
};
export const habitFrequencies: [HabitFrequency, string][] = [
  ["daily", "Щодня"],
  ["weekly", "Щотижня"],
  ["monthly", "Щомісяця"],
  ["quarterly", "Щокварталу"],
  ["yearly", "Щороку"],
];
const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function habitCells(
  frequency: HabitFrequency,
  anchor: string,
  year: number,
) {
  const start = new Date(anchor + "T12:00:00");
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  if (frequency === "daily")
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return {
        key: key(d),
        label: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"][i],
        detail: key(d),
      };
    });
  if (frequency === "weekly")
    return [
      {
        key: `week:${key(start)}`,
        label: "Тиждень",
        detail: `Тиждень від ${key(start)}`,
      },
    ];
  if (frequency === "monthly")
    return [
      "Січ",
      "Лют",
      "Бер",
      "Кві",
      "Тра",
      "Чер",
      "Лип",
      "Сер",
      "Вер",
      "Жов",
      "Лис",
      "Гру",
    ].map((label, i) => ({
      key: `${year}-${String(i + 1).padStart(2, "0")}`,
      label,
      detail: `${label} ${year}`,
    }));
  if (frequency === "quarterly")
    return [1, 2, 3, 4].map((i) => ({
      key: `${year}-Q${i}`,
      label: `${i} кв.`,
      detail: `${i} квартал ${year}`,
    }));
  return [{ key: String(year), label: String(year), detail: String(year) }];
}
export function validHabits(value: unknown): value is Habit[] {
  return (
    Array.isArray(value) &&
    value.length <= 500 &&
    new Set(value.map((h) => h?.id)).size === value.length &&
    value.every(
      (h) =>
        h &&
        typeof h.id === "string" &&
        h.id.length > 0 &&
        typeof h.title === "string" &&
        h.title.trim().length > 0 &&
        h.title.length <= 150 &&
        habitFrequencies.some(([id]) => id === h.frequency) &&
        h.checks &&
        typeof h.checks === "object" &&
        !Array.isArray(h.checks) &&
        Object.entries(h.checks).every(
          ([key, value]) =>
            /^(?:\d{4}(?:-(?:\d{2}(?:-\d{2})?|Q[1-4]))?|week:\d{4}-\d{2}-\d{2})$/.test(
              key,
            ) && typeof value === "boolean",
        ),
    )
  );
}

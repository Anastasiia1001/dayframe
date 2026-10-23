export type CareEntry = { mood: number; need: string; notes: string };
export function validCare(value: unknown): value is Record<string, CareEntry> {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.entries(value).every(
      ([date, e]) =>
        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        !Number.isNaN(Date.parse(date + "T12:00:00Z")) &&
        new Date(date + "T12:00:00Z").toISOString().slice(0, 10) === date &&
        e &&
        typeof e === "object" &&
        Number.isInteger(e.mood) &&
        e.mood >= 0 &&
        e.mood <= 5 &&
        ["rest", "focus", "talk"].includes(e.need) &&
        typeof e.notes === "string" &&
        e.notes.length <= 10000,
    )
  );
}

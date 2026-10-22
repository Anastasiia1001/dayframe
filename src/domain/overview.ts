import type { PersonalTask } from "../types";
import { taskHorizon } from "./horizons.ts";
export type OverviewPeriod = "day" | "week" | "month" | "quarter" | "year";
const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function overviewRange(today: string, period: OverviewPeriod) {
  const start = new Date(today + "T12:00:00"),
    end = new Date(start);
  if (period === "week") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 6);
  }
  if (period === "month" || period === "quarter" || period === "year") {
    start.setDate(1);
    if (period === "quarter")
      start.setMonth(Math.floor(start.getMonth() / 3) * 3);
    if (period === "year") start.setMonth(0);
    end.setTime(start.getTime());
    end.setMonth(
      end.getMonth() + (period === "month" ? 1 : period === "quarter" ? 3 : 12),
    );
    end.setDate(0);
  }
  return { from: key(start), to: key(end) };
}
export function overviewTasks(
  tasks: PersonalTask[],
  today: string,
  period: OverviewPeriod,
) {
  const { from, to } = overviewRange(today, period);
  const scopes =
    period === "year"
      ? ["day", "week", "month", "year"]
      : period === "quarter"
        ? ["day", "week", "month", "year"]
        : period === "month"
          ? ["day", "week", "month"]
          : period === "week"
            ? ["day", "week"]
            : ["day"];
  return tasks.filter((t) => {
    if (t.disabled || t.isTemplate) return false;
    if (!t.inBacklog) {
      const date = t.nextOccurrence || t.date;
      return date >= from && date <= to;
    }
    const horizon = taskHorizon(t);
    const anchor = t.planningAnchor || today;
    return (
      scopes.includes(horizon) &&
      horizon !== "backlog" &&
      anchor >= from &&
      anchor <= to &&
      (period !== "quarter" || horizon !== "year" || t.category === "Quarter")
    );
  });
}

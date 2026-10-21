import type { PersonalTask, PlanningHorizon } from "../types";
export const horizons: { id: PlanningHorizon; name: string; hint: string }[] = [
  { id: "backlog", name: "Беклог", hint: "Ідеї без обраного періоду" },
  { id: "year", name: "Рік", hint: "Річні та квартальні справи" },
  { id: "month", name: "Місяць", hint: "Що хочеш зробити цього місяця" },
  { id: "week", name: "Тиждень", hint: "Обери фокус цього тижня" },
  { id: "day", name: "День", hint: "Сьогодні, завтра або конкретна дата" },
];
export function taskHorizon(task: PersonalTask): PlanningHorizon {
  if (task.planningHorizon) return task.planningHorizon;
  if (task.isTemplate) {
    if (task.category === "Year" || task.category === "Quarter") return "year";
    if (task.recurrence === "monthly" || task.category === "Month") return "month";
    if (task.recurrence === "weekly") return "week";
    return "day";
  }
  return task.inBacklog ? "backlog" : "day";
}
export function planInHorizon(task: PersonalTask, horizon: PlanningHorizon, today: string, id: string): PersonalTask {
  return { ...task, id: task.isTemplate ? id : task.id, isTemplate: false,
    planningHorizon: horizon, planningAnchor: today,
    inBacklog: horizon !== "day", date: horizon === "day" ? today : task.date,
    completed: false, completedOn: undefined, nextOccurrence: undefined };
}

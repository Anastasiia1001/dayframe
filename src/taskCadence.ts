import type { PersonalTask } from "./types";
export function taskCadence(task: PersonalTask) {
  const keys: Record<string, string> = { once: "once", daily: "daily", weekly: "weekly", monthly: "monthly", "every 3 months": "quarterly", yearly: "yearly", custom: "custom" };
  return keys[task.recurrence] || "once";
}
export function cadenceLabel(task: PersonalTask) {
  const labels: Record<string, string> = { once: "Разове", daily: "Щодня", weekly: "Щотижня", monthly: "Щомісяця", quarterly: "Щокварталу", yearly: "Щороку", custom: `Кожні ${task.customDays || 2} дн.` };
  return labels[taskCadence(task)];
}

import { useLocal } from "./useLocal";
export type Priority = { title: string; done: boolean };
export type Reminder = {
  id: string;
  title: string;
  time: string;
  done: boolean;
};
export type DailyPlan = {
  priorities: Priority[];
  notes: string;
  reminders: Reminder[];
};
export const blankPlan = (): DailyPlan => ({
  priorities: Array.from({ length: 3 }, () => ({ title: "", done: false })),
  notes: "",
  reminders: [],
});
export function useDailyPlan(date: string) {
  const [plans, setPlans] = useLocal<Record<string, DailyPlan>>(
    "dayframe-daily-plans",
    {},
  );
  const plan = plans[date] || blankPlan();
  const update = (patch: Partial<DailyPlan>) =>
    setPlans((all) => ({
      ...all,
      [date]: { ...(all[date] || blankPlan()), ...patch },
    }));
  return { plan, update };
}

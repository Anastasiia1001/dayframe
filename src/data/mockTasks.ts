import type { PersonalTask, Period } from "../types";
import { today } from "./mockCalendar";
const groups: Record<Period, string[]> = {
  Day: [
    "Полити рослини",
    "Запустити прання",
    "Купити корм для собаки",
    "Помити посуд",
  ],
  Month: [
    "Почистити пральну машину",
    "Помити холодильник",
    "Перевірити аптечку",
    "Упорядкувати гардероб",
    "Переглянути підписки",
    "Ретельно прибрати ванну",
  ],
  Quarter: [
    "Помити вікна",
    "Почистити витяжку",
    "Почистити фільтри кондиціонера",
    "Перебрати сезонний одяг",
    "Прибрати місця зберігання",
    "Перевірити домашні запаси",
    "Переглянути важливі документи",
    "Зробити резервну копію файлів і фото",
    "Почистити пристрої та кабелі",
    "Переглянути підписки",
  ],
  Year: [
    "Переглянути важливі документи",
    "Переглянути страхування",
    "Переглянути підписки",
    "Ретельно перебрати гардероб",
    "Навести лад удома",
    "Упорядкувати цифрові фото",
    "Зробити резервну копію важливих даних",
    "Переглянути витрати за рік",
    "Переглянути особисті цілі",
  ],
};
export const mockTasks: PersonalTask[] = Object.entries(groups).flatMap(
  ([category, titles]) =>
    titles.map((title, i) => ({
      id: `${category}-${i}`,
      title,
      category: category as Period,
      date: today,
      recurrence: {
        Day: "daily",
        Month: "monthly",
        Quarter: "every 3 months",
        Year: "yearly",
      }[category]!,
      priority: i === 2 ? "High" : "Normal",
      notes: "",
      completed: category === "Day" && i === 3,
      disabled: false,
    })),
);

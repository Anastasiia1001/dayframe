import { Dumbbell, Footprints, ArrowRight, Check } from "lucide-react";
import { useLocal } from "../useLocal";
import { useDailyPlan } from "../dailyPlans";
import type { FitnessData } from "../domain/fitness";
import type { PersonalTask, CalendarEvent } from "../types";
import {
  overviewRange,
  overviewTasks,
  type OverviewPeriod,
} from "../domain/overview";
import { HealthConnection } from "./HealthConnection";
export function TodayFitness({
  date,
  onOpen,
}: {
  date: string;
  onOpen: () => void;
}) {
  const [data, setData] = useLocal<FitnessData>("dayframe-fitness", {
    goal: 8000,
    days: {},
  });
  const day = data.days[date] || { steps: 0, exercises: [] };
  return (
    <article
      className="today-card today-fitness"
      aria-label="Спорт на сьогодні"
    >
      <div className="weather-top">
        <h2>
          <Dumbbell size={18} /> Спорт на сьогодні
        </h2>
        <button onClick={onOpen}>
          Відкрити трекер <ArrowRight size={15} />
        </button>
      </div>
      <HealthConnection onData={setData} compact />
      <div className="today-steps">
        <Footprints size={23} />
        <strong>{day.steps.toLocaleString("uk-UA")}</strong>
        <span>/ {data.goal.toLocaleString("uk-UA")} кроків</span>
      </div>
      <progress
        aria-label="Кроки сьогодні"
        value={Math.min(day.steps, data.goal)}
        max={data.goal}
      />
      <ul>
        {day.exercises.map((exercise) => (
          <li key={exercise.id}>
            <button
              className="today-exercise"
              aria-pressed={exercise.done}
              onClick={() =>
                setData((old) => ({
                  ...old,
                  days: {
                    ...old.days,
                    [date]: {
                      ...(old.days[date] || day),
                      exercises: (old.days[date] || day).exercises.map((e) =>
                        e.id === exercise.id ? { ...e, done: !e.done } : e,
                      ),
                    },
                  },
                }))
              }
            >
              <span>
                {exercise.done ? <Check size={16} /> : <Dumbbell size={16} />}
              </span>
              <strong>{exercise.name}</strong>
              <small>
                {exercise.minutes
                  ? `${exercise.minutes} хв`
                  : `${exercise.sets} × ${exercise.reps}`}
              </small>
            </button>
          </li>
        ))}
      </ul>
      {!day.exercises.length && (
        <p>
          Тренування на сьогодні ще не додані. Можна почати з короткої
          прогулянки.
        </p>
      )}
      <button onClick={onOpen}>Додати вправу або кроки</button>
    </article>
  );
}
export function TodayPlan({
  date,
  onCalendar,
}: {
  date: string;
  onCalendar: () => void;
}) {
  const { plan, update } = useDailyPlan(date);
  return (
    <article
      className="today-card today-plan"
      aria-label="Пріоритети та нотатки на сьогодні"
    >
      <div className="weather-top">
        <h2>Мій фокус на сьогодні</h2>
        <button onClick={onCalendar}>
          Розклад <ArrowRight size={15} />
        </button>
      </div>
      <p>Обери до трьох важливих справ. Решта може зачекати.</p>
      <ol>
        {plan.priorities.map((priority, index) => (
          <li key={index}>
            <input
              type="checkbox"
              aria-label={`Виконано пріоритет ${index + 1}`}
              disabled={!priority.title.trim()}
              checked={priority.done}
              onChange={(e) =>
                update({
                  priorities: plan.priorities.map((p, i) =>
                    i === index ? { ...p, done: e.target.checked } : p,
                  ),
                })
              }
            />
            <input
              aria-label={`Пріоритет дня ${index + 1}`}
              value={priority.title}
              placeholder={`Пріоритет ${index + 1}`}
              maxLength={300}
              onChange={(e) =>
                update({
                  priorities: plan.priorities.map((p, i) =>
                    i === index
                      ? {
                          ...p,
                          title: e.target.value,
                          done: e.target.value.trim() ? p.done : false,
                        }
                      : p,
                  ),
                })
              }
            />
          </li>
        ))}
      </ol>
      <label>
        Нотатки дня
        <textarea
          value={plan.notes}
          onChange={(e) => update({ notes: e.target.value })}
          rows={3}
          placeholder="Думки, ідеї або те, що важливо не загубити"
        />
      </label>
      {plan.reminders.length > 0 && (
        <div>
          <h3>Нагадування на сьогодні</h3>
          {plan.reminders.map((r) => (
            <label className="today-reminder" key={r.id}>
              <input
                type="checkbox"
                checked={r.done}
                onChange={(e) =>
                  update({
                    reminders: plan.reminders.map((item) =>
                      item.id === r.id
                        ? { ...item, done: e.target.checked }
                        : item,
                    ),
                  })
                }
              />
              <span>
                {r.time} {r.title}
              </span>
            </label>
          ))}
        </div>
      )}
    </article>
  );
}
export const overviewPeriods: [OverviewPeriod, string][] = [
  ["day", "Сьогодні"],
  ["week", "Тиждень"],
  ["month", "Місяць"],
  ["quarter", "Квартал"],
  ["year", "Рік"],
];
export function PeriodOverview({
  period,
  today,
  tasks,
  events,
  onEdit,
  onToggle,
  onEvent,
}: {
  period: OverviewPeriod;
  today: string;
  tasks: PersonalTask[];
  events: CalendarEvent[];
  onEdit: (t: PersonalTask) => void;
  onToggle: (t: PersonalTask) => void;
  onEvent: (e: CalendarEvent) => void;
}) {
  const range = overviewRange(today, period);
  const selected = overviewTasks(tasks, today, period);
  const meetings = events
    .filter((e) => e.date <= range.to && (e.endDate || e.date) >= range.from)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  return (
    <section className="period-overview" aria-label="Плани на обраний період">
      <header>
        <h2>{overviewPeriods.find(([id]) => id === period)?.[1]}</h2>
        <p>
          {new Date(range.from + "T12:00:00").toLocaleDateString("uk-UA")} —{" "}
          {new Date(range.to + "T12:00:00").toLocaleDateString("uk-UA")}
        </p>
        <span>
          {selected.filter((t) => t.completed).length} / {selected.length} справ
          виконано
        </span>
      </header>
      <div className="today-overview-grid">
        <article className="today-card">
          <h3>Справи цього періоду</h3>
          {selected.map((task) => (
            <div key={task.id} className="period-task">
              <input
                aria-label={`Виконати: ${task.title}`}
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggle(task)}
              />
              <button onClick={() => onEdit(task)}>
                <strong>{task.title}</strong>
                <small>
                  {task.inBacklog
                    ? "Без конкретного дня"
                    : task.nextOccurrence || task.date}
                </small>
              </button>
            </div>
          ))}
          {!selected.length && (
            <p>Поки немає запланованих справ на цей період.</p>
          )}
        </article>
        <article className="today-card">
          <h3>Події календаря</h3>
          {meetings.map((event) => (
            <button
              key={event.id}
              className="period-event"
              onClick={() => onEvent(event)}
            >
              <strong>{event.title}</strong>
              <small>
                {event.date} · {event.allDay ? "Увесь день" : event.start}
              </small>
            </button>
          ))}
          {!meetings.length && (
            <p>
              Подій на цей період немає. Тут відображаються події підключених
              календарів.
            </p>
          )}
        </article>
      </div>
    </section>
  );
}

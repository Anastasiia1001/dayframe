import { dayAvailability } from "../domain/dayAvailability";
import { nextOccurrence } from "../recurrence";
import { useDailyPlan } from "../dailyPlans";
import { useState, useMemo } from "react";
import { Star, Plus, Clock, ChevronDown } from "lucide-react";
import type { PersonalTask, CalendarEvent } from "../types";
import { focusedOn, chooseFocus } from "../domain/focus";
import { scheduledEvents, timeString } from "../domain/studio";
import { eventOnDay, minutes } from "../domain/planning";
export function DayContext(p: {
  date: string;
  today: string;
  tasks: PersonalTask[];
  events: CalendarEvent[];
  onTasks: (tasks: PersonalTask[]) => void;
  onEdit: (task: PersonalTask) => void;
  onEvent?: (event: CalendarEvent) => void;
  onAdd: () => void;
  notes: string;
  onNotes: (notes: string) => void;
  visibleIds?: string[];
  compact?: boolean;
}) {
  const [choosing, setChoosing] = useState(false),
    [notice, setNotice] = useState("");
  const visibleTasks = useMemo(
    () =>
      p.visibleIds
        ? p.tasks.filter((t) => p.visibleIds!.includes(t.id))
        : p.tasks,
    [p.tasks, p.visibleIds],
  );
  const day = visibleTasks.filter(
      (t) => !t.disabled && !t.isTemplate && !t.inBacklog && t.date === p.date,
    ),
    active = day.filter((t) => !t.completed),
    focused = day.filter((t) => focusedOn(t, p.date)),
    completed = day.filter((t) => t.completed);
  const now = new Date().toLocaleTimeString("en-GB", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const events = useMemo(
    () =>
      [...p.events, ...scheduledEvents(visibleTasks, p.date, p.date)]
        .filter((e) => eventOnDay(e, p.date))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [p.events, visibleTasks, p.date],
  );
  const availability = dayAvailability(
    events,
    p.date,
    p.date === p.today ? minutes(now) : 8 * 60,
  );
  const next = availability.next,
    free = availability.free
      ? `${timeString(availability.free.start)}–${timeString(availability.free.end)}`
      : "";
  const focus = (task: PersonalTask) => {
    const next = chooseFocus(p.tasks, task.id, p.date);
    if (next === p.tasks)
      setNotice("Достатньо трьох головних справ. Спершу зніми одну зірочку.");
    else {
      p.onTasks(next);
      setNotice("");
    }
  };
  const row = (task: PersonalTask) => (
    <div
      className={`context-task ${task.completed ? "is-complete" : ""}`}
      key={task.id}
    >
      <input
        type="checkbox"
        aria-label={`Виконано: ${task.title}`}
        checked={task.completed}
        onChange={() =>
          p.onTasks(
            p.tasks.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    completed: !t.completed,
                    completedOn: t.completed ? undefined : p.today,
                    nextOccurrence: t.completed
                      ? undefined
                      : nextOccurrence(t, p.today),
                  }
                : t,
            ),
          )
        }
      />
      <button className="context-task-title" onClick={() => p.onEdit(task)}>
        <strong>{task.title}</strong>
        {task.scheduledStart && <small>{task.scheduledStart}</small>}
      </button>
      <button
        className="context-star"
        aria-label={`Головне: ${task.title}`}
        aria-pressed={focusedOn(task, p.date)}
        onClick={() => focus(task)}
      >
        <Star
          size={16}
          fill={focusedOn(task, p.date) ? "currentColor" : "none"}
        />
      </button>
    </div>
  );
  return (
    <section className="day-context" aria-label="Контекст дня">
      {!p.compact && (
        <h2>
          {new Date(p.date + "T12:00:00").toLocaleDateString("uk-UA", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h2>
      )}
      <div className="context-next">
        <Clock size={16} />
        <div>
          <small>{next ? "Найближча подія" : "Простір для себе"}</small>
          <strong>
            {next
              ? `${next.start} · ${next.title}`
              : "Немає запланованих зустрічей"}
          </strong>
          {free && <span>Вікно без зустрічей: {free}</span>}
        </div>
      </div>
      <div className="context-heading">
        <h3>
          Головне на {p.date === p.today ? "сьогодні" : "день"}{" "}
          <small>
            {focused.filter((t) => t.completed).length}/{focused.length || 3}
          </small>
        </h3>
        <button
          aria-label="Обрати головні справи"
          onClick={() => setChoosing(!choosing)}
        >
          <Star size={16} />
        </button>
      </div>
      {focused.map(row)}
      {!focused.length && (
        <p className="context-empty">
          Обери до трьох посильних справ зірочкою. Решта може зачекати.
        </p>
      )}
      {(choosing || (!p.compact && !focused.length)) && (
        <div className="context-candidates">
          {active.filter((t) => !focusedOn(t, p.date)).map(row)}
          {!active.length && (
            <button className="studio-text-action" onClick={p.onAdd}>
              <Plus size={14} />
              Додати першу справу
            </button>
          )}
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {!p.compact && (
        <>
          <h3>
            Справи дня{" "}
            <small>{active.filter((t) => !focusedOn(t, p.date)).length}</small>
          </h3>
          {!choosing &&
            focused.length > 0 &&
            active.filter((t) => !focusedOn(t, p.date)).map(row)}
          <button className="studio-text-action" onClick={p.onAdd}>
            <Plus size={14} />
            Додати справу
          </button>
        </>
      )}
      <label className="context-notes">
        Нотатка дня
        <textarea
          aria-label="Нотатки дня"
          rows={p.compact ? 2 : 4}
          value={p.notes}
          onChange={(e) => p.onNotes(e.target.value)}
          placeholder="Що важливо не загубити…"
        />
      </label>
      {!p.compact && events.length > 0 && (
        <details className="context-events">
          <summary>Усі події дня · {events.length}</summary>
          {events.map((e) => (
            <button key={e.id} onClick={() => p.onEvent?.(e)}>
              <time>{e.allDay ? "Увесь день" : e.start}</time>
              <span>{e.title}</span>
            </button>
          ))}
        </details>
      )}
      {!p.compact && completed.length > 0 && (
        <details>
          <summary>
            <ChevronDown size={14} />
            Виконані · {completed.length}
          </summary>
          {completed.map(row)}
        </details>
      )}
    </section>
  );
}

export function TodayFocus(
  p: Omit<Parameters<typeof DayContext>[0], "notes" | "onNotes" | "compact">,
) {
  const { plan, update } = useDailyPlan(p.date);
  return (
    <article className="today-card today-focus">
      <DayContext
        {...p}
        compact
        notes={plan.notes}
        onNotes={(notes) => update({ notes })}
      />
      {plan.priorities.some((x) => x.title) && (
        <details className="legacy-priorities">
          <summary>Попередні пріоритети — збережені нотатки</summary>
          <ul>
            {plan.priorities
              .filter((x) => x.title)
              .map((x, i) => (
                <li key={i}>
                  {x.done ? "✓ " : ""}
                  {x.title}
                </li>
              ))}
          </ul>
          <small>
            Нові головні справи обираються зірочкою з наявних завдань.
          </small>
        </details>
      )}
    </article>
  );
}

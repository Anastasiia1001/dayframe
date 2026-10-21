import { useState, type ReactNode } from "react";
import {
  Plus,
  Trash2,
  Check,
  Bell,
  ListChecks,
  NotebookPen,
  Star,
  Clock,
} from "lucide-react";
import { useLocal } from "../useLocal";
import type { PersonalTask } from "../types";
import { TaskList } from "./TaskList";

type Priority = { title: string; done: boolean };
type Reminder = { id: string; title: string; time: string; done: boolean };
type DailyPlan = {
  priorities: Priority[];
  notes: string;
  reminders: Reminder[];
};
const blankPlan = (): DailyPlan => ({
  priorities: Array.from({ length: 3 }, () => ({ title: "", done: false })),
  notes: "",
  reminders: [],
});
export function DayPlanner({
  date,
  today,
  tasks,
  schedule,
  onTask,
  onToggle,
  onAdd,
  onPostpone,
  onDelete,
}: {
  date: string;
  today: string;
  tasks: PersonalTask[];
  schedule: ReactNode;
  onTask: (t: PersonalTask) => void;
  onToggle: (t: PersonalTask) => void;
  onAdd: () => void;
  onPostpone: (t: PersonalTask) => void;
  onDelete: (t: PersonalTask) => void;
}) {
  const [plans, setPlans] = useLocal<Record<string, DailyPlan>>(
    "dayframe-daily-plans",
    {},
  );
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const plan = plans[date] || blankPlan();
  const update = (patch: Partial<DailyPlan>) =>
    setPlans((all) => ({
      ...all,
      [date]: { ...(all[date] || blankPlan()), ...patch },
    }));
  return (
    <div className="day-planner-layout">
      <div className="day-left-column">
        <section
          className="planner-sheet priorities-sheet"
          aria-label="Пріоритети дня"
        >
          <h3 className="sheet-tab">
            <Star size={15} />
            Три головні пріоритети
          </h3>
          <p className="sheet-intro">Що зробить цей день вдалим?</p>
          <ol className="daily-priorities">
            {plan.priorities.map((priority, i) => (
              <li key={i} className={priority.done ? "priority-done" : ""}>
                <button
                  className="priority-check"
                  aria-label={`${priority.done ? "Повернути" : "Виконати"} пріоритет ${i + 1}`}
                  disabled={!priority.title.trim()}
                  aria-pressed={priority.done}
                  onClick={() =>
                    update({
                      priorities: plan.priorities.map((p, n) =>
                        n === i ? { ...p, done: !p.done } : p,
                      ),
                    })
                  }
                >
                  {priority.done ? <Check size={14} /> : `0${i + 1}`}
                </button>
                <input
                  aria-label={`Пріоритет ${i + 1}`}
                  placeholder={
                    i === 0
                      ? "Найважливіше на сьогодні"
                      : "Ще одна важлива справа"
                  }
                  maxLength={180}
                  value={priority.title}
                  onChange={(e) =>
                    update({
                      priorities: plan.priorities.map((p, n) =>
                        n === i
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
          <span className="stationery-sticker bow-sticker" aria-hidden="true" />
        </section>
        <section className="planner-sheet tasks-sheet" aria-label="Справи дня">
          <h3 className="sheet-tab">
            <ListChecks size={15} />
            Мої справи
          </h3>
          <div className="sheet-topline">
            <small>
              {tasks.filter((t) => !t.completed).length} невиконаних
            </small>
            <button className="sheet-add" onClick={onAdd}>
              <Plus size={14} />
              Додати справу
            </button>
          </div>
          {tasks.length ? (
            <TaskList
              tasks={tasks}
              today={today}
              onToggle={onToggle}
              onEdit={onTask}
              onPostpone={onPostpone}
              onDelete={onDelete}
            />
          ) : (
            <p className="sheet-empty">
              Справ поки немає. Залиш місце для життя.
            </p>
          )}
        </section>
      </div>
      <section
        className="planner-sheet schedule-sheet"
        aria-label="Погодинний розклад"
      >
        <h3 className="sheet-tab">
          <Clock size={15} />
          Розклад дня
        </h3>
        <span className="stationery-sticker star-sticker" aria-hidden="true" />
        <div className="schedule-content">{schedule}</div>
      </section>
      <div className="day-right-column">
        <section
          className="planner-sheet notes-sheet"
          aria-label="Аркуш нотаток"
        >
          <h3 className="sheet-tab">
            <NotebookPen size={15} />
            Нотатки
          </h3>
          <span className="paper-tape" aria-hidden="true" />
          <label className="daily-notes-label">
            Думки, ідеї, щось важливе
            <textarea
              aria-label="Нотатки дня"
              value={plan.notes}
              rows={9}
              maxLength={12000}
              placeholder="Залиши тут те, що хочеться пам’ятати…"
              onChange={(e) => update({ notes: e.target.value })}
            />
          </label>
          <small className="autosave-label">
            Зберігається автоматично для цієї дати
          </small>
        </section>
        <section
          className="planner-sheet reminders-sheet"
          aria-label="Нагадування дня"
        >
          <h3 className="sheet-tab">
            <Bell size={15} />
            Не забути
          </h3>
          <span
            className="stationery-sticker pushpin-sticker"
            aria-hidden="true"
          />
          <ul className="daily-reminders">
            {plan.reminders.map((r) => (
              <li key={r.id} className={r.done ? "reminder-done" : ""}>
                <input
                  aria-label={`Виконати нагадування ${r.title}`}
                  type="checkbox"
                  checked={r.done}
                  onChange={() =>
                    update({
                      reminders: plan.reminders.map((item) =>
                        item.id === r.id ? { ...item, done: !item.done } : item,
                      ),
                    })
                  }
                />
                <div className="reminder-value">
                  <input
                    aria-label={`Текст нагадування ${r.title}`}
                    value={r.title}
                    maxLength={240}
                    onChange={(e) =>
                      update({
                        reminders: plan.reminders.map((item) =>
                          item.id === r.id
                            ? { ...item, title: e.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                  <input
                    aria-label={`Час для ${r.title}`}
                    type="time"
                    value={r.time}
                    onChange={(e) =>
                      update({
                        reminders: plan.reminders.map((item) =>
                          item.id === r.id
                            ? { ...item, time: e.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                </div>
                <button
                  aria-label={`Видалити нагадування ${r.title}`}
                  onClick={() =>
                    update({
                      reminders: plan.reminders.filter(
                        (item) => item.id !== r.id,
                      ),
                    })
                  }
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
          <form
            className="reminder-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!reminderTitle.trim()) return;
              update({
                reminders: [
                  ...plan.reminders,
                  {
                    id: crypto.randomUUID(),
                    title: reminderTitle.trim(),
                    time: reminderTime,
                    done: false,
                  },
                ],
              });
              setReminderTitle("");
              setReminderTime("");
            }}
          >
            <input
              aria-label="Нове нагадування"
              placeholder="Про що нагадати собі?"
              maxLength={240}
              required
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
            />
            <div>
              <label>
                Час{" "}
                <input
                  aria-label="Час нагадування"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
              </label>
              <button className="sheet-add" type="submit">
                <Plus size={14} />
                Додати
              </button>
            </div>
          </form>
          <small className="autosave-label">
            Список для цього дня, без сповіщень пристрою
          </small>
          <img
            className="planner-plant"
            src={`${import.meta.env.BASE_URL}assets/planner/plant.png`}
            alt=""
            aria-hidden="true"
          />
        </section>{" "}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { GripVertical, Plus } from "lucide-react";
import type { PersonalTask } from "../types";
import { todayColumn, type TodayColumn } from "../domain/todayBoard";
import { TaskList } from "./TaskList";
import { taskHorizon } from "../domain/horizons";
const columns: [TodayColumn, string][] = [
  ["plans", "Мої плани"],
  ["today", "На сьогодні"],
  ["done", "Готово"],
];
export function TodayTaskBoard({
  tasks,
  today,
  onMove,
  onToggle,
  onEdit,
  onPostpone,
  onAdd,
}: {
  tasks: PersonalTask[];
  today: string;
  onMove: (id: string, column: TodayColumn, before?: string) => void;
  onToggle: (t: PersonalTask) => void;
  onEdit: (t: PersonalTask) => void;
  onPostpone: (t: PersonalTask) => void;
  onAdd: () => void;
}) {
  const [drag, setDrag] = useState<{
      id: string;
      x: number;
      y: number;
      over: TodayColumn | null;
    } | null>(null),
    [message, setMessage] = useState("");
  const gesture = useRef<{
    id: string;
    x: number;
    y: number;
    active: boolean;
    pointer: number;
  } | null>(null);
  const auto = useRef<ReturnType<typeof setInterval> | null>(null);
  const point = useRef({ x: 0, y: 0 });
  const stop = () => {
    if (auto.current) clearInterval(auto.current);
    auto.current = null;
    gesture.current = null;
    setDrag(null);
  };
  useEffect(
    () => () => {
      if (auto.current) clearInterval(auto.current);
    },
    [],
  );
  const commit = (id: string, column: TodayColumn, before?: string) => {
    onMove(id, column, before);
    setMessage(
      `Завдання переміщено: ${columns.find(([key]) => key === column)?.[1]}`,
    );
  };
  return (
    <section
      className="today-task-board"
      aria-label="Дошка завдань на сьогодні"
      id="planner-tasks"
    >
      <header className="planner-section-title">
        <div>
          <span className="eyebrow">ВІД ПЛАНУ ДО МАЛЕНЬКОЇ ПЕРЕМОГИ</span>
          <h2>Мої справи</h2>
          <p>
            Перетягни справу за ручку у свій день або в «Готово». Також можна
            вибрати блок у списку.
          </p>
        </div>
        <button onClick={onAdd}>
          <Plus size={16} />
          Додати завдання
        </button>
      </header>
      <p className="planner-inline-status" role="status">
        {message}
      </p>
      <div className="today-board-columns">
        {columns.map(([id, label]) => {
          const items = tasks
            .filter((t) => todayColumn(t, today) === id)
            .sort(
              (a, b) =>
                (a.plannerRank ?? tasks.indexOf(a) * 1024) -
                (b.plannerRank ?? tasks.indexOf(b) * 1024),
            );
          return (
            <article
              key={id}
              data-planner-column={id}
              className={`today-board-column ${drag?.over === id ? "is-drop-target" : ""}`}
            >
              <h3>
                {label}
                <span>{items.length}</span>
              </h3>
              <div className="today-board-items">
                {items.map((task) => (
                  <article
                    key={task.id}
                    data-planner-task={task.id}
                    className={`today-board-task ${drag?.id === task.id ? "is-dragging" : ""}`}
                  >
                    <div className="today-board-task-tools">
                      <button
                        className="today-drag-handle"
                        aria-label={`Перетягнути: ${task.title}`}
                        onPointerDown={(e) => {
                          if (e.button !== 0 || !e.isPrimary) return;
                          e.currentTarget.setPointerCapture(e.pointerId);
                          gesture.current = {
                            id: task.id,
                            x: e.clientX,
                            y: e.clientY,
                            active: false,
                            pointer: e.pointerId,
                          };
                          point.current = { x: e.clientX, y: e.clientY };
                        }}
                        onPointerMove={(e) => {
                          const g = gesture.current;
                          if (!g || g.pointer !== e.pointerId) return;
                          point.current = { x: e.clientX, y: e.clientY };
                          if (
                            !g.active &&
                            Math.hypot(e.clientX - g.x, e.clientY - g.y) < 8
                          )
                            return;
                          g.active = true;
                          if (!auto.current)
                            auto.current = setInterval(() => {
                              const y = point.current.y;
                              if (y < 90) window.scrollBy(0, -18);
                              else if (y > innerHeight - 90)
                                window.scrollBy(0, 18);
                            }, 40);
                          const element = document.elementFromPoint(
                            e.clientX,
                            e.clientY,
                          );
                          const over = element?.closest<HTMLElement>(
                            "[data-planner-column]",
                          )?.dataset.plannerColumn as TodayColumn | undefined;
                          setDrag({
                            id: task.id,
                            x: e.clientX,
                            y: e.clientY,
                            over: over || null,
                          });
                        }}
                        onPointerUp={(e) => {
                          const g = gesture.current;
                          if (g?.active) {
                            const target = document.elementFromPoint(
                              e.clientX,
                              e.clientY,
                            );
                            const column = target?.closest<HTMLElement>(
                              "[data-planner-column]",
                            )?.dataset.plannerColumn as TodayColumn | undefined;
                            const card = target?.closest<HTMLElement>(
                              "[data-planner-task]",
                            );
                            let before = card?.dataset.plannerTask;
                            if (
                              card &&
                              e.clientY >
                                card.getBoundingClientRect().top +
                                  card.getBoundingClientRect().height / 2
                            ) {
                              const next =
                                card.nextElementSibling as HTMLElement | null;
                              before = next?.dataset.plannerTask;
                            }
                            if (column && before !== g.id)
                              commit(g.id, column, before);
                          }
                          stop();
                        }}
                        onPointerCancel={stop}
                        onLostPointerCapture={stop}
                      >
                        <GripVertical size={17} />
                      </button>
                      <span className="today-horizon">
                        {
                          {
                            backlog: "Беклог",
                            year: "Рік / квартал",
                            month: "Місяць",
                            week: "Тиждень",
                            day: "День",
                          }[taskHorizon(task)]
                        }
                      </span>
                      <label
                        className="sr-only"
                        htmlFor={`board-move-${task.id}`}
                      >
                        Перемістити: {task.title}
                      </label>
                      <select
                        id={`board-move-${task.id}`}
                        aria-label={`Перемістити: ${task.title}`}
                        value={id}
                        onChange={(e) =>
                          commit(task.id, e.target.value as TodayColumn)
                        }
                      >
                        {columns.map(([key, name]) => (
                          <option key={key} value={key}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <TaskList
                      tasks={[task]}
                      today={today}
                      onToggle={onToggle}
                      onEdit={onEdit}
                      onPostpone={onPostpone}
                      compact
                    />
                  </article>
                ))}
              </div>
              {!items.length && (
                <p className="today-drop-empty">
                  {id === "done"
                    ? "Тут збиратимуться зроблені справи."
                    : id === "plans"
                      ? "Тут плани без дати й майбутні справи."
                      : "Перетягни сюди те, що хочеш зробити сьогодні."}
                </p>
              )}
            </article>
          );
        })}
      </div>
      {drag && (
        <div
          className="today-drag-preview"
          style={{ left: drag.x + 12, top: drag.y + 12 }}
          aria-hidden="true"
        >
          {tasks.find((t) => t.id === drag.id)?.title}
        </div>
      )}
    </section>
  );
}

import { useRef, useState } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocal } from "../useLocal";
import {
  habitCells,
  habitFrequencies,
  type Habit,
  type HabitFrequency,
} from "../domain/habits";
import "../planner-desk.css";
export function HabitTracker({ today }: { today: string }) {
  const [habits, setHabits] = useLocal<Habit[]>("dayframe-habits", []);
  const [anchor, setAnchor] = useState(today),
    [year, setYear] = useState(Number(today.slice(0, 4)));
  const [title, setTitle] = useState(""),
    [frequency, setFrequency] = useState<HabitFrequency>("daily"),
    [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const moveWeek = (offset: number) => {
    const d = new Date(anchor + "T12:00:00");
    d.setDate(d.getDate() + offset * 7);
    setAnchor(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  };
  return (
    <section
      className="habit-tracker"
      aria-label="Трекер звичок"
      id="planner-habits"
    >
      <header className="planner-section-title">
        <div>
          <span className="eyebrow">МАЛЕНЬКІ КРОКИ, ВЛАСНИЙ РИТМ</span>
          <h2>Мій трекер</h2>
          <p>
            Відмічай зроблене. Порожня клітинка — місце для наступної спроби, а
            не штраф.
          </p>
        </div>
        <label>
          Рік трекера
          <select
            aria-label="Рік трекера"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: 101 }, (_, i) => (
              <option key={i} value={2000 + i}>
                {2000 + i}
              </option>
            ))}
          </select>
        </label>
      </header>
      <form
        className="habit-add"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || habits.length >= 500) return;
          setHabits((old) => [
            ...old,
            {
              id: crypto.randomUUID(),
              title: title.trim(),
              frequency,
              checks: {},
            },
          ]);
          setTitle("");
          setMessage("Звичку додано до трекера");
        }}
      >
        <label>
          Нова звичка
          <input
            ref={input}
            aria-label="Нова звичка"
            placeholder="Наприклад, прогулянка або читання"
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Як часто
          <select
            aria-label="Як часто"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
          >
            {habitFrequencies.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={habits.length >= 500}>
          <Plus size={16} />
          Додати звичку
        </button>
      </form>
      <p role="status" className="planner-inline-status">
        {message}
      </p>
      <div className="habit-grid">
        {habitFrequencies.map(([id, label]) => {
          const rows = habits.filter((h) => h.frequency === id),
            cells = habitCells(id, anchor, year);
          return (
            <details
              key={id}
              className={`habit-sheet habit-${id}`}
              open={id === "daily" || rows.length > 0}
            >
              <summary>
                {label} · {rows.length} звичок
              </summary>
              <header>
                <h3>{label}</h3>
                {id === "daily" ? (
                  <div className="habit-week-nav">
                    <button
                      aria-label="Попередній тиждень трекера"
                      onClick={() => moveWeek(-1)}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span>
                      {cells[0].detail.slice(5)} — {cells[6].detail.slice(5)}
                    </span>
                    <button
                      aria-label="Наступний тиждень трекера"
                      onClick={() => moveWeek(1)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ) : id === "weekly" ? (
                  <small>{habitCells("weekly", anchor, year)[0].detail}</small>
                ) : (
                  <small>{year}</small>
                )}
              </header>
              <div
                className="habit-table-scroll"
                role="region"
                aria-label={`${label}: відмітки`}
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Звичка</th>
                      {cells.map((cell) => (
                        <th scope="col" key={cell.key} title={cell.detail}>
                          {cell.label}
                        </th>
                      ))}
                      <th scope="col">
                        <span className="sr-only">Дії</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((habit) => (
                      <tr key={habit.id}>
                        <th scope="row">
                          <input
                            aria-label={`Назва звички: ${habit.title}`}
                            maxLength={150}
                            value={habit.title}
                            onChange={(e) => {
                              const value = e.target.value;
                              setHabits((all) =>
                                all.map((h) =>
                                  h.id === habit.id
                                    ? { ...h, title: value }
                                    : h,
                                ),
                              );
                            }}
                            onBlur={() => {
                              if (!habit.title.trim())
                                setHabits((all) =>
                                  all.map((h) =>
                                    h.id === habit.id
                                      ? { ...h, title: "Моя звичка" }
                                      : h,
                                  ),
                                );
                            }}
                          />
                        </th>
                        {cells.map((cell) => (
                          <td key={cell.key}>
                            <input
                              type="checkbox"
                              checked={!!habit.checks[cell.key]}
                              aria-label={`${habit.title}: ${cell.detail}`}
                              onChange={(e) =>
                                setHabits((all) =>
                                  all.map((h) =>
                                    h.id === habit.id
                                      ? {
                                          ...h,
                                          checks: {
                                            ...h.checks,
                                            [cell.key]: e.target.checked,
                                          },
                                        }
                                      : h,
                                  ),
                                )
                              }
                            />
                          </td>
                        ))}
                        <td>
                          <button
                            aria-label={`Видалити звичку: ${habit.title}`}
                            onClick={() => {
                              setHabits((all) =>
                                all.filter((h) => h.id !== habit.id),
                              );
                              setMessage("Звичку видалено");
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!rows.length && (
                <p className="habit-empty">
                  Додай те, що хочеться робити {label.toLocaleLowerCase("uk")}.
                </p>
              )}
              <button
                className="habit-add-row"
                onClick={() => {
                  setFrequency(id);
                  input.current?.focus();
                }}
              >
                ＋ Додати рядок
              </button>
            </details>
          );
        })}
      </div>
    </section>
  );
}

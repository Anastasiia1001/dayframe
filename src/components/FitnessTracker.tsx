import { HealthConnection } from "./HealthConnection";
import { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Footprints,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useLocal } from "../useLocal";
import "../fitness.css";
import type { FitnessData } from "../domain/fitness";
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const empty = {
  kind: "strength" as "strength" | "cardio",
  name: "",
  sets: 3,
  reps: 10,
  weight: 0,
  minutes: 0,
};
export function FitnessTracker() {
  const [data, setData] = useLocal<FitnessData>("dayframe-fitness", {
    goal: 8000,
    days: {},
  });
  const [goalDraft, setGoalDraft] = useState(String(data.goal));
  const [date, setDate] = useState(dateKey(new Date()));
  const [draft, setDraft] = useState(empty),
    [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const day = data.days[date] || { steps: 0, exercises: [] };
  const update = (patch: Partial<FitnessData["days"][string]>) =>
    setData((old) => ({
      ...old,
      days: {
        ...old.days,
        [date]: {
          ...(old.days[date] || { steps: 0, exercises: [] }),
          ...patch,
        },
      },
    }));
  const move = (offset: number) => {
    const next = new Date(date + "T12:00:00");
    next.setDate(next.getDate() + offset);
    setDate(dateKey(next));
    setEditing(null);
    setDraft(empty);
    setMessage("");
  };
  const done = day.exercises.filter((e) => e.done);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() - 6 + i);
    const key = dateKey(d);
    return { key, date: d, steps: data.days[key]?.steps || 0 };
  });
  return (
    <section className="fitness-tracker" aria-label="Трекер спорту">
      <div className="fitness-date">
        <div>
          <span className="eyebrow">РУХ У ТВОЄМУ РИТМІ</span>
          <h2>Кожен крок має значення</h2>
          <p>Плануй вправи, відзначай виконане й спостерігай за прогресом.</p>
        </div>
        <div className="fitness-date-controls">
          <button aria-label="Попередній день спорту" onClick={() => move(-1)}>
            <ChevronLeft size={18} />
          </button>
          <label>
            Дата
            <input
              aria-label="Дата тренування"
              type="date"
              required
              value={date}
              onChange={(e) => {
                if (e.target.value) {
                  setDate(e.target.value);
                  setDraft(empty);
                  setEditing(null);
                }
              }}
            />
          </label>
          <button aria-label="Наступний день спорту" onClick={() => move(1)}>
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => {
              setDate(dateKey(new Date()));
              setDraft(empty);
              setEditing(null);
            }}
          >
            Сьогодні
          </button>
        </div>
      </div>
      <HealthConnection onData={setData} />
      <p role="status" className="muted">
        {message}
      </p>
      <div className="fitness-grid">
        <article className="fitness-card fitness-steps">
          <div className="fitness-card-title">
            <Footprints size={22} />
            <h3>Кроки за день</h3>
          </div>
          <div className="fitness-step-total">
            {day.steps.toLocaleString("uk-UA")}
            <small> / {data.goal.toLocaleString("uk-UA")}</small>
          </div>
          <progress
            aria-label="Прогрес кроків"
            max={data.goal}
            value={Math.min(day.steps, data.goal)}
          />
          <p>
            {day.steps >= data.goal
              ? "Ціль досягнута. Чудова робота!"
              : `До цілі ще ${(data.goal - day.steps).toLocaleString("uk-UA")} кроків`}
          </p>
          <label>
            Усього кроків за обрану дату
            <input
              aria-label="Кроки за день"
              type="number"
              min="0"
              max="200000"
              step="1"
              value={day.steps}
              onChange={(e) => {
                const n = e.target.valueAsNumber;
                if (Number.isInteger(n) && n >= 0 && n <= 200000)
                  update({ steps: n });
              }}
            />
          </label>
          <div className="fitness-quick">
            <button
              onClick={() =>
                update({ steps: Math.min(200000, day.steps + 500) })
              }
            >
              +500 кроків
            </button>
            <button
              onClick={() =>
                update({ steps: Math.min(200000, day.steps + 1000) })
              }
            >
              +1000 кроків
            </button>
          </div>
          <form
            className="fitness-goal"
            onSubmit={(e) => {
              e.preventDefault();
              const goal = Number(goalDraft);
              if (Number.isInteger(goal) && goal >= 100 && goal <= 100000) {
                setData((old) => ({ ...old, goal }));
                setMessage("Ціль кроків збережено");
              }
            }}
          >
            <label>
              Щоденна ціль
              <input
                aria-label="Щоденна ціль кроків"
                type="number"
                required
                min="100"
                max="100000"
                step="1"
                value={goalDraft}
                onChange={(e) => setGoalDraft(e.target.value)}
              />
            </label>
            <button type="submit">Зберегти ціль</button>
          </form>
          <small>Вводь кількість із телефона або годинника вручну.</small>
        </article>
        <article className="fitness-card fitness-exercises">
          <div className="fitness-card-title">
            <Dumbbell size={22} />
            <h3>Мої вправи</h3>
            <span>
              {done.length} / {day.exercises.length}
            </span>
          </div>
          {!day.exercises.length && (
            <p className="fitness-empty">
              Сьогодні все починається з однієї вправи. Додай свою нижче.
            </p>
          )}
          <ul>
            {day.exercises.map((exercise) => (
              <li key={exercise.id} className={exercise.done ? "is-done" : ""}>
                <button
                  className="fitness-check"
                  aria-label={`Виконано: ${exercise.name}`}
                  aria-pressed={exercise.done}
                  onClick={() =>
                    update({
                      exercises: day.exercises.map((e) =>
                        e.id === exercise.id ? { ...e, done: !e.done } : e,
                      ),
                    })
                  }
                >
                  {exercise.done ? <Check size={18} /> : <span />}
                </button>
                <div>
                  <strong>{exercise.name}</strong>
                  <small>
                    {exercise.kind === "cardio"
                      ? "Кардіо"
                      : `${exercise.sets} підх. × ${exercise.reps} повт.`}
                    {exercise.kind !== "cardio" && exercise.weight > 0
                      ? ` · ${exercise.weight} кг`
                      : ""}
                    {exercise.minutes > 0 ? ` · ${exercise.minutes} хв` : ""}
                  </small>
                </div>
                <button
                  aria-label={`Редагувати: ${exercise.name}`}
                  onClick={() => {
                    setEditing(exercise.id);
                    setDraft({
                      ...exercise,
                      kind: exercise.kind || "strength",
                    });
                  }}
                >
                  <Pencil size={15} />
                </button>
                <button
                  aria-label={`Видалити: ${exercise.name}`}
                  onClick={() => {
                    update({
                      exercises: day.exercises.filter(
                        (e) => e.id !== exercise.id,
                      ),
                    });
                    if (editing === exercise.id) {
                      setEditing(null);
                      setDraft(empty);
                    }
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.name.trim()) return;
              const item = {
                ...draft,
                name: draft.name.trim(),
                id: editing || crypto.randomUUID(),
                done: editing
                  ? day.exercises.find((e) => e.id === editing)?.done || false
                  : false,
              };
              update({
                exercises: editing
                  ? day.exercises.map((e) => (e.id === editing ? item : e))
                  : [...day.exercises, item],
              });
              setMessage(editing ? "Вправу оновлено" : "Вправу додано");
              setDraft(empty);
              setEditing(null);
            }}
          >
            <h4>{editing ? "Редагування вправи" : "Додати вправу"}</h4>
            <label>
              Назва вправи
              <input
                aria-label="Назва вправи"
                placeholder="Наприклад, присідання або прогулянка"
                required
                maxLength={120}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label className="fitness-kind">
              Тип вправи
              <select
                value={draft.kind}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    kind: e.target.value as "strength" | "cardio",
                  })
                }
              >
                <option value="strength">Силова вправа</option>
                <option value="cardio">Кардіо / ходьба</option>
              </select>
            </label>
            <div className="fitness-fields">
              {(
                [
                  ["sets", "Підходи", 1, 100],
                  ["reps", "Повторення", 0, 1000],
                  ["weight", "Вага, кг", 0, 1000],
                  ["minutes", "Тривалість, хв", 0, 1440],
                ] as const
              )
                .filter(([key]) => draft.kind !== "cardio" || key === "minutes")
                .map(([key, label, min, max]) => (
                  <label key={key}>
                    {label}
                    <input
                      type="number"
                      required
                      min={min}
                      max={max}
                      step={key === "weight" ? 0.5 : 1}
                      value={draft[key]}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          [key]:
                            e.target.value === "" ? "" : e.target.valueAsNumber,
                        })
                      }
                    />
                  </label>
                ))}
            </div>
            <div className="fitness-quick">
              <button className="primary" type="submit">
                <Plus size={16} />
                {editing ? "Зберегти вправу" : "Додати вправу"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setDraft(empty);
                  }}
                >
                  Скасувати
                </button>
              )}
            </div>
          </form>
        </article>
        <article className="fitness-card fitness-week">
          <div className="fitness-card-title">
            <Footprints size={22} />
            <h3>Останні 7 днів</h3>
            <span>
              {week
                .reduce((sum, d) => sum + d.steps, 0)
                .toLocaleString("uk-UA")}{" "}
              кроків
            </span>
          </div>
          <div className="fitness-bars">
            {week.map((d) => (
              <button
                key={d.key}
                aria-label={`${d.key}: ${d.steps} кроків`}
                onClick={() => {
                  setDate(d.key);
                  setDraft(empty);
                  setEditing(null);
                }}
                className={d.key === date ? "selected" : ""}
              >
                <span className="fitness-bar-value">
                  {d.steps.toLocaleString("uk-UA")}
                </span>
                <span className="fitness-bar-track">
                  <span
                    style={{
                      height: `${Math.min(100, (d.steps / Math.max(data.goal, ...week.map((d) => d.steps))) * 100)}%`,
                    }}
                  />
                </span>
                <span>
                  {d.date.toLocaleDateString("uk-UA", { weekday: "short" })}
                </span>
                <small>{d.date.getDate()}</small>
              </button>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

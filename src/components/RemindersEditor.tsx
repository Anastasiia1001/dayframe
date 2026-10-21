import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Reminder } from "../dailyPlans";
export function RemindersEditor({
  reminders,
  onChange,
}: {
  reminders: Reminder[];
  onChange: (items: Reminder[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const patch = (id: string, values: Partial<Reminder>) =>
    onChange(reminders.map((r) => (r.id === id ? { ...r, ...values } : r)));
  return (
    <>
      <ul className="daily-reminders">
        {reminders.map((r) => (
          <li key={r.id} className={r.done ? "reminder-done" : ""}>
            <input
              type="checkbox"
              aria-label={`Виконати нагадування ${r.title}`}
              checked={r.done}
              onChange={() => patch(r.id, { done: !r.done })}
            />
            <div className="reminder-value">
              <input
                aria-label={`Текст нагадування ${r.title}`}
                value={r.title}
                maxLength={240}
                onChange={(e) => patch(r.id, { title: e.target.value })}
              />
              <input
                aria-label={`Час для ${r.title}`}
                type="time"
                value={r.time}
                onChange={(e) => patch(r.id, { time: e.target.value })}
              />
            </div>
            <button
              aria-label={`Видалити нагадування ${r.title}`}
              onClick={() =>
                onChange(reminders.filter((item) => item.id !== r.id))
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
          if (!title.trim()) return;
          onChange([
            ...reminders,
            { id: crypto.randomUUID(), title: title.trim(), time, done: false },
          ]);
          setTitle("");
          setTime("");
        }}
      >
        <input
          aria-label="Нове нагадування"
          placeholder="Про що нагадати собі?"
          required
          maxLength={240}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div>
          <label>
            Час{" "}
            <input
              aria-label="Час нагадування"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
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
    </>
  );
}

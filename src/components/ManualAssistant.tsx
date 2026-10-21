import { useRef, useState } from "react";
import {
  Bell,
  Search,
  Sparkles,
  X,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import type { PersonalTask } from "../types";
import { addDays, minutes } from "../domain/planning";
import { timeString } from "../domain/studio";
export function ManualAssistant({
  tasks,
  date,
  today,
  onCreate,
}: {
  tasks: PersonalTask[];
  date: string;
  today: string;
  onCreate: (task: PersonalTask) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const [text, setText] = useState(""),
    [mode, setMode] = useState<"search" | "chat" | "reminder">("search");
  const [reminderDate, setReminderDate] = useState(date),
    [time, setTime] = useState("09:00"),
    [feedback, setFeedback] = useState("");
  const prompt = `Допоможи виконати завдання українською мовою. Запропонуй конкретні кроки та, якщо потрібно, постав уточнювальні запитання.\n\n${text.trim()}`;
  const close = () => {
    dialog.current?.close();
    trigger.current?.focus();
  };
  return (
    <>
      <button
        ref={trigger}
        className="studio-helper-trigger"
        aria-label="Відкрити ручного помічника"
        onClick={() => {
          setFeedback("");
          const current = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Europe/Kyiv",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          }).format(new Date());
          const next = minutes(current) + 15;
          const baseDate = date < today ? today : date;
          setReminderDate(
            baseDate === today && next >= 1440 ? addDays(today, 1) : baseDate,
          );
          setTime(date <= today ? timeString(next % 1440) : "09:00");
          dialog.current?.showModal();
        }}
      >
        <Sparkles size={17} />
        <span>Помічник</span>
      </button>
      <dialog
        ref={dialog}
        className="studio-editor manual-assistant"
        aria-label="Ручний помічник"
        onCancel={close}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (
              mode !== "reminder" ||
              !text.trim() ||
              feedback.startsWith("Нагадування додано")
            )
              return;
            const current = new Intl.DateTimeFormat("en-GB", {
              timeZone: "Europe/Kyiv",
              hour: "2-digit",
              minute: "2-digit",
              hourCycle: "h23",
            }).format(new Date());
            if (
              reminderDate < today ||
              (reminderDate === today && time <= current)
            ) {
              setFeedback("Обери майбутній час нагадування.");
              return;
            }
            onCreate({
              id: crypto.randomUUID(),
              title: text.trim(),
              category: "Day",
              date: reminderDate,
              scheduledStart: time,
              scheduledDuration: 15,
              reminderMinutes: 0,
              planningHorizon: "day",
              planningAnchor: reminderDate,
              sectionId: "personal",
              recurrence: "once",
              priority: "Normal",
              notes: "Додано ручним помічником",
              completed: false,
              disabled: false,
              inBacklog: false,
            });
            setFeedback(
              "Нагадування додано в календар. Воно спрацює, доки Dayframe відкритий.",
            );
          }}
        >
          <header>
            <div>
              <span className="studio-eyebrow">ТИ КЕРУЄШ ДІЯМИ</span>
              <h2>Ручний помічник</h2>
            </div>
            <button
              type="button"
              aria-label="Закрити ручного помічника"
              onClick={close}
            >
              <X size={20} />
            </button>
          </header>
          <p className="studio-helper">
            Обери справу або напиши запит. Пошук і ChatGPT відкриваються в
            окремій вкладці.
          </p>
          <label>
            Взяти назву справи
            <select
              aria-label="Справа для помічника"
              defaultValue=""
              onChange={(e) => {
                const task = tasks.find((t) => t.id === e.target.value);
                if (task) {
                  setText(task.title);
                  setFeedback("");
                }
              }}
            >
              <option value="">Власний запит</option>
              {tasks
                .filter((t) => !t.completed && !t.disabled)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Текст запиту
            <textarea
              autoFocus
              aria-label="Запит помічнику"
              required
              maxLength={3000}
              rows={3}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setFeedback("");
              }}
              placeholder="Знайти приклади шейдерів води для Unity…"
            />
          </label>
          <div className="manual-assistant-modes">
            {[
              { id: "search", name: "Пошук", icon: Search },
              { id: "chat", name: "ChatGPT", icon: Sparkles },
              { id: "reminder", name: "Нагадати", icon: Bell },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={mode === item.id}
                onClick={() => {
                  setMode(item.id as typeof mode);
                  setFeedback("");
                }}
              >
                <item.icon size={16} />
                {item.name}
              </button>
            ))}
          </div>
          {mode === "search" && (
            <>
              <p className="studio-helper">
                Google шукатиме саме текст, який ти бачиш вище.
              </p>
              <a
                className={`primary assistant-external ${!text.trim() ? "is-disabled" : ""}`}
                aria-disabled={!text.trim()}
                href={
                  text.trim()
                    ? `https://www.google.com/search?q=${encodeURIComponent(text.trim())}`
                    : undefined
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                Пошукати в Google
                <ExternalLink size={15} />
              </a>
            </>
          )}
          {mode === "chat" && (
            <>
              <label>
                Запит для ChatGPT
                <textarea
                  aria-label="Підготовлений запит ChatGPT"
                  readOnly
                  rows={5}
                  value={prompt}
                />
              </label>
              <p className="studio-helper">
                Відкриється ChatGPT із підготовленим запитом. Перевір його й
                натисни «Надіслати» у ChatGPT.
              </p>
              <div className="assistant-actions">
                <button
                  type="button"
                  disabled={!text.trim()}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(prompt);
                      setFeedback("Запит скопійовано.");
                    } catch {
                      setFeedback("Виділи й скопіюй запит із поля вище.");
                    }
                  }}
                >
                  <Copy size={15} />
                  Копіювати
                </button>
                <a
                  className={`primary assistant-external ${!text.trim() ? "is-disabled" : ""}`}
                  aria-disabled={!text.trim()}
                  href={
                    text.trim()
                      ? `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`
                      : undefined
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Відкрити в ChatGPT
                  <ExternalLink size={15} />
                </a>
              </div>
            </>
          )}
          {mode === "reminder" && (
            <>
              <div className="studio-editor-grid">
                <label>
                  Дата нагадування
                  <input
                    aria-label="Дата нагадування помічника"
                    required
                    type="date"
                    min={today}
                    value={reminderDate}
                    onChange={(e) => {
                      setReminderDate(e.target.value);
                      setFeedback("");
                    }}
                  />
                </label>
                <label>
                  Час у Києві
                  <input
                    aria-label="Час нагадування помічника"
                    required
                    type="time"
                    value={time}
                    onChange={(e) => {
                      setTime(e.target.value);
                      setFeedback("");
                    }}
                  />
                </label>
              </div>
              <p className="studio-helper">
                Нагадування зберігається локально та працює у відкритому
                Dayframe. Його можна змінити чи вимкнути в редакторі події.
              </p>
              <button
                className="primary"
                type="submit"
                disabled={
                  !text.trim() || feedback.startsWith("Нагадування додано")
                }
              >
                <Bell size={15} />
                {feedback.startsWith("Нагадування додано")
                  ? "Додано в календар"
                  : "Створити нагадування"}
              </button>
            </>
          )}
          {feedback && (
            <p role="status" className="assistant-feedback">
              <Check size={14} />
              {feedback}
            </p>
          )}
        </form>
      </dialog>
    </>
  );
}

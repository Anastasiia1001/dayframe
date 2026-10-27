import { initialSections, type Section } from "../domain/studio";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { PersonalTask } from "../types";
import { TaskChecklist } from "./TaskChecklist";
export function QuickTaskEditor({
  task,
  onChange,
  onClose,
  onSave,
  onDelete,
}: {
  task: PersonalTask;
  onChange: (task: PersonalTask) => void;
  onClose: () => void;
  onSave: () => string | void;
  onDelete?: () => void;
}) {
  const [error, setError] = useState("");
  const [sections] = useState<Section[]>(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("dayframe-sections") || "null",
      );
      return Array.isArray(stored) &&
        stored.every(
          (s) => typeof s.id === "string" && typeof s.name === "string",
        )
        ? stored
        : initialSections;
    } catch {
      return initialSections;
    }
  });
  const ref = useRef<HTMLDialogElement>(null),
    title = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    title.current?.focus();
    return () => {
      ref.current?.close();
      previous?.isConnected && previous.focus();
    };
  }, []);
  const patch = (value: Partial<PersonalTask>) =>
    onChange({ ...task, ...value });
  return (
    <dialog
      ref={ref}
      className="quick-task-editor"
      aria-label="Особисте завдання"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (task.title.trim()) {
            setError("");
            const issue = onSave();
            if (issue) setError(issue);
          }
        }}
      >
        <header>
          <h2>{onDelete ? "Редагувати справу" : "Нова справа"}</h2>
          <button type="button" aria-label="Закрити завдання" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <label>
          Назва
          <input
            ref={title}
            required
            maxLength={500}
            value={task.title}
            placeholder="Що хочеш зробити?"
            onChange={(e) => patch({ title: e.target.value })}
          />
        </label>
        <div className="quick-fields">
          <label>
            Дата
            <input
              type="date"
              aria-label="Дата справи"
              disabled={!!task.inBacklog}
              required={!task.inBacklog}
              value={task.date}
              onChange={(e) => patch({ date: e.target.value })}
            />
          </label>
          <label>
            Категорія
            <select
              aria-label="Категорія справи"
              value={task.sectionId || "personal"}
              onChange={(e) => patch({ sectionId: e.target.value })}
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="quick-check">
          <input
            type="checkbox"
            checked={!!task.inBacklog}
            onChange={(e) =>
              patch({
                inBacklog: e.target.checked,
                planningHorizon: e.target.checked ? "backlog" : "day",
                scheduledStart: e.target.checked
                  ? undefined
                  : task.scheduledStart,
              })
            }
          />
          Без дати · ідея на потім
        </label>
        {!task.inBacklog && (
          <div className="quick-fields">
            <label>
              Час · необов’язково
              <input
                type="time"
                aria-label="Час справи"
                value={task.scheduledStart || ""}
                onChange={(e) =>
                  patch({
                    scheduledStart: e.target.value || undefined,
                    scheduledDuration: task.scheduledDuration || 30,
                  })
                }
              />
            </label>
            {task.scheduledStart && (
              <label>
                Тривалість, хв
                <input
                  type="number"
                  aria-label="Тривалість справи"
                  min="15"
                  max="720"
                  step="15"
                  value={task.scheduledDuration || 30}
                  onChange={(e) =>
                    patch({ scheduledDuration: Number(e.target.value) })
                  }
                />
              </label>
            )}
          </div>
        )}
        <details className="quick-advanced">
          <summary>Більше параметрів</summary>
          <div className="quick-fields">
            <label>
              Повторення
              <select
                aria-label="Повторення"
                value={task.recurrence}
                onChange={(e) => patch({ recurrence: e.target.value })}
              >
                {[
                  ["once", "Один раз"],
                  ["daily", "Щодня"],
                  ["weekly", "Щотижня"],
                  ["monthly", "Щомісяця"],
                  ["every 3 months", "Щокварталу"],
                  ["yearly", "Щороку"],
                  ["custom", "Власний інтервал"],
                ].map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Дедлайн
              <input
                type="date"
                aria-label="Дедлайн справи"
                value={task.deadline || ""}
                onChange={(e) =>
                  patch({ deadline: e.target.value || undefined })
                }
              />
            </label>
          </div>
          {task.recurrence === "custom" && (
            <label>
              Повторювати кожні днів
              <input
                type="number"
                min="1"
                max="36500"
                value={task.customDays || 2}
                onChange={(e) => patch({ customDays: Number(e.target.value) })}
              />
            </label>
          )}
          <label>
            Пріоритет
            <select
              value={task.priority}
              onChange={(e) => patch({ priority: e.target.value })}
            >
              <option value="Low">Низький</option>
              <option value="Normal">Звичайний</option>
              <option value="High">Важливе</option>
            </select>
          </label>
          <label>
            Нотатки
            <textarea
              rows={3}
              value={task.notes}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </label>
          <TaskChecklist
            items={task.checklist}
            onChange={(checklist) => patch({ checklist })}
          />
          <label>
            Посилання
            <textarea
              rows={2}
              value={(task.links || []).join("\n")}
              onChange={(e) => patch({ links: e.target.value.split("\n") })}
            />
          </label>
          <label className="quick-check">
            <input
              type="checkbox"
              checked={task.disabled}
              onChange={(e) => patch({ disabled: e.target.checked })}
            />
            Призупинити справу
          </label>
        </details>
        {error && <p role="alert">{error}</p>}
        <footer>
          {onDelete && (
            <button type="button" className="danger" onClick={onDelete}>
              Видалити
            </button>
          )}
          <button type="button" className="secondary" onClick={onClose}>
            Скасувати
          </button>
          <button type="submit" className="primary">
            {onDelete ? "Зберегти" : "Додати"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}

import type { PersonalTask } from "../types";
export function TaskChecklist({
  items = [],
  onChange,
}: {
  items?: PersonalTask["checklist"];
  onChange: (items: NonNullable<PersonalTask["checklist"]>) => void;
}) {
  return (
    <fieldset className="task-checklist">
      <legend>
        Чекліст · {items.filter((x) => x.done).length}/{items.length}
      </legend>
      {items.map((item) => (
        <div className="checklist-entry" key={item.id}>
          <input
            type="checkbox"
            aria-label={`Виконано: ${item.title || "пункт"}`}
            checked={item.done}
            onChange={(e) =>
              onChange(
                items.map((x) =>
                  x.id === item.id ? { ...x, done: e.target.checked } : x,
                ),
              )
            }
          />
          <input
            aria-label="Пункт чекліста"
            maxLength={500}
            value={item.title}
            onChange={(e) =>
              onChange(
                items.map((x) =>
                  x.id === item.id ? { ...x, title: e.target.value } : x,
                ),
              )
            }
          />
          <button
            type="button"
            aria-label={`Прибрати пункт: ${item.title || "новий"}`}
            onClick={() => onChange(items.filter((x) => x.id !== item.id))}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="secondary"
        onClick={() =>
          onChange([
            ...items,
            { id: crypto.randomUUID(), title: "", done: false },
          ])
        }
      >
        + Додати пункт
      </button>
    </fieldset>
  );
}

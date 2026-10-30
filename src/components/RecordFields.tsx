import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { PersonalTask } from "../types";
import { quickEntry, type Section, timeString } from "../domain/studio";
import { minutes } from "../domain/planning";
import { taskHorizon } from "../domain/horizons";
import { overviewRange } from "../domain/overview";
export function RecordFields({
  draft,
  onChange,
  sections,
  today,
  selectedDate,
  existing = false,
  occurrence,
  scope = "all",
  onScope,
}: {
  draft: PersonalTask;
  onChange: (task: PersonalTask) => void;
  sections: Section[];
  today: string;
  selectedDate?: string;
  existing?: boolean;
  occurrence?: string | null;
  scope?: string;
  onScope?: (scope: string) => void;
}) {
  const [quick, setQuick] = useState(""),
    [checkTitle, setCheckTitle] = useState(""),
    [attachmentError, setAttachmentError] = useState("");
  const titleInput = useRef<HTMLInputElement>(null);
  const latest = useRef(draft),
    active = useRef(true);
  latest.current = draft;
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    titleInput.current?.focus();
  }, [draft.id]);
  const key = selectedDate || today;
  const setDraft = (
    value: PersonalTask | ((current: PersonalTask) => PersonalTask | null),
  ) => {
    if (!active.current) return;
    const next = typeof value === "function" ? value(latest.current) : value;
    if (next) onChange(next);
  };
  const setScope = (value: string) => onScope?.(value);
  const scopeOf = (task: PersonalTask) =>
    taskHorizon(task) === "year" && task.category === "Quarter"
      ? "quarter"
      : taskHorizon(task);
  const scopeGroups = [
    { id: "week", name: "Тиждень" },
    { id: "month", name: "Місяць" },
    { id: "quarter", name: "Квартал" },
    { id: "year", name: "Рік" },
  ];
  return (
    <>
      {!existing && (
        <details className="quick-phrase">
          <summary>Додати фразою</summary>
          <label className="studio-quick">
            Швидке введення
            <div>
              <input
                aria-label="Швидке введення фразою"
                value={quick}
                onChange={(e) => setQuick(e.target.value)}
                placeholder="Завтра о 15:00 перевірити префаби, година"
              />
              <button
                type="button"
                onClick={() => {
                  const parsed = quickEntry(quick, today);
                  setDraft({
                    ...draft,
                    title: parsed.title,
                    date: parsed.date,
                    scheduledStart: parsed.start,
                    planningHorizon: "day",
                    planningAnchor: parsed.date,
                    scheduledDuration: parsed.duration,
                    inBacklog: false,
                  });
                }}
              >
                Розпізнати
              </button>
            </div>
            <small>
              Перевір дату, час і тривалість нижче перед збереженням.
            </small>
          </label>
        </details>
      )}
      <label>
        Назва
        <input
          ref={titleInput}
          autoFocus
          required
          maxLength={500}
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
      </label>
      <div className="studio-editor-grid">
        <label>
          Категорія
          <select
            aria-label="Категорія"
            value={draft.sectionId || "personal"}
            onChange={(e) => setDraft({ ...draft, sectionId: e.target.value })}
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="quick-check">
        <input
          type="checkbox"
          checked={!!draft.inBacklog}
          onChange={(e) =>
            setDraft({
              ...draft,
              inBacklog: e.target.checked,
              planningHorizon: e.target.checked ? "backlog" : "day",
              date: draft.date || key,
              scheduledStart: e.target.checked
                ? undefined
                : draft.scheduledStart,
              allDay: false,
            })
          }
        />
        Без дати
      </label>
      {draft.inBacklog && (
        <label>
          Горизонт плану
          <select
            aria-label="Горизонт плану"
            value={scopeOf(draft)}
            onChange={(e) =>
              setDraft({
                ...draft,
                planningHorizon:
                  e.target.value === "quarter"
                    ? "year"
                    : (e.target.value as PersonalTask["planningHorizon"]),
                category:
                  e.target.value === "quarter"
                    ? "Quarter"
                    : e.target.value === "year"
                      ? "Year"
                      : e.target.value === "month"
                        ? "Month"
                        : "Day",
                planningAnchor: key,
              })
            }
          >
            <option value="backlog">Колись · без періоду</option>
            {scopeGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {draft.inBacklog && scopeOf(draft) !== "backlog" && (
        <label>
          Період плану
          <input
            type="date"
            aria-label="Період плану"
            required
            value={draft.planningAnchor || key}
            onChange={(e) =>
              setDraft({ ...draft, planningAnchor: e.target.value })
            }
          />
          <small>
            {(() => {
              const range = overviewRange(
                draft.planningAnchor || key,
                scopeOf(draft) as "week" | "month" | "quarter" | "year",
              );
              return `${range.from} — ${range.to}`;
            })()}
          </small>
        </label>
      )}
      {!draft.inBacklog && (
        <>
          <div className="studio-editor-grid">
            <label>
              Дата
              <input
                aria-label="Дата запису"
                type="date"
                required
                value={draft.date}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    date: e.target.value,
                    planningAnchor: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Час · необов’язково
              <input
                aria-label="Початок події"
                type="time"
                disabled={!!draft.allDay}
                value={draft.scheduledStart || ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    scheduledStart: e.target.value || undefined,
                    scheduledDuration: draft.scheduledDuration || 30,
                  })
                }
              />
            </label>
            {draft.scheduledStart && (
              <label>
                Завершення
                <input
                  aria-label="Завершення події"
                  type="time"
                  required
                  value={timeString(
                    (minutes(draft.scheduledStart) +
                      (draft.scheduledDuration || 30)) %
                      1440,
                  )}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      scheduledDuration:
                        (minutes(e.target.value) -
                          minutes(draft.scheduledStart!) +
                          1440) %
                          1440 || 1440,
                    })
                  }
                />
                <small>
                  Тривалість: {draft.scheduledDuration || 30} хв
                  {minutes(draft.scheduledStart) +
                    (draft.scheduledDuration || 30) >=
                  1440
                    ? " · наступного дня"
                    : ""}
                </small>
              </label>
            )}
          </div>
          <label className="quick-check">
            <input
              type="checkbox"
              checked={!!draft.allDay}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  allDay: e.target.checked,
                  scheduledStart: e.target.checked
                    ? undefined
                    : draft.scheduledStart,
                })
              }
            />
            Увесь день
          </label>
        </>
      )}
      {!draft.inBacklog && draft.scheduledStart && (
        <>
          <label>
            Нагадати
            <select
              aria-label="Нагадування запису"
              value={
                draft.reminderMinutes === undefined
                  ? "off"
                  : draft.reminderMinutes
              }
              onChange={(e) =>
                setDraft({
                  ...draft,
                  reminderMinutes:
                    e.target.value === "off"
                      ? undefined
                      : Number(e.target.value),
                })
              }
            >
              <option value="off">Вимкнено</option>
              <option value="0">На початку</option>
              <option value="5">За 5 хвилин</option>
              <option value="15">За 15 хвилин</option>
              <option value="60">За годину</option>
            </select>
            <small>
              Нагадування з’являється всередині відкритого Dayframe. При
              закритій вкладці доставка не працює. Дозвіл браузера не потрібен.
            </small>
          </label>
        </>
      )}
      {occurrence && draft.recurrence !== "once" && (
        <label>
          Застосувати зміни
          <select
            aria-label="Обсяг змін серії"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            <option value="one">Лише це входження</option>
            <option value="all">Усю серію</option>
          </select>
        </label>
      )}
      <details
        className="studio-advanced"
        open={
          !!(
            draft.notes ||
            draft.checklist?.length ||
            draft.recurrence !== "once" ||
            draft.deadline
          )
        }
      >
        <summary>Більше параметрів</summary>
        {draft.scheduledStart && (
          <label>
            Тривалість, хв
            <input
              aria-label="Тривалість події"
              type="number"
              min={15}
              max={1440}
              step={15}
              value={draft.scheduledDuration || 30}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  scheduledDuration: Number(e.target.value),
                })
              }
            />
          </label>
        )}
        <div className="studio-editor-grid">
          <label>
            Дедлайн (окремо від плану)
            <input
              aria-label="Дедлайн"
              type="date"
              value={draft.deadline || ""}
              onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
            />
          </label>
          <label>
            Повторення
            <select
              aria-label="Повторення запису"
              value={draft.recurrence}
              onChange={(e) =>
                setDraft({ ...draft, recurrence: e.target.value })
              }
            >
              {[
                ["once", "Не повторювати"],
                ["daily", "Щодня"],
                ["weekly", "Щотижня"],
                ["monthly", "Щомісяця"],
                ["yearly", "Щороку"],
                ["every 3 months", "Щокварталу"],
                ["custom", "Власний інтервал"],
              ].map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {draft.recurrence === "custom" && (
          <label>
            Інтервал повторення, днів
            <input
              type="number"
              min={1}
              max={36500}
              value={draft.customDays || 2}
              onChange={(e) =>
                setDraft({ ...draft, customDays: Number(e.target.value) })
              }
            />
          </label>
        )}
        <label>
          Пріоритет
          <select
            aria-label="Пріоритет"
            value={draft.priority}
            onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
          >
            <option value="Low">Низький</option>
            <option value="Normal">Звичайний</option>
            <option value="High">Важливе</option>
          </select>
        </label>
        <label className="quick-check">
          <input
            type="checkbox"
            checked={!!draft.disabled}
            onChange={(e) => setDraft({ ...draft, disabled: e.target.checked })}
          />
          Призупинити справу
        </label>
        <label>
          Нотатки
          <textarea
            aria-label="Нотатки запису"
            rows={3}
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />
        </label>
        <fieldset>
          <legend>Чекліст</legend>
          {(draft.checklist || []).map((item) => (
            <div className="studio-check-item" key={item.id}>
              <input
                aria-label={`Готово: ${item.title}`}
                type="checkbox"
                checked={item.done}
                onChange={() =>
                  setDraft({
                    ...draft,
                    checklist: draft.checklist?.map((x) =>
                      x.id === item.id ? { ...x, done: !x.done } : x,
                    ),
                  })
                }
              />
              <input
                aria-label="Текст пункту"
                value={item.title}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    checklist: draft.checklist?.map((x) =>
                      x.id === item.id ? { ...x, title: e.target.value } : x,
                    ),
                  })
                }
              />
              <button
                type="button"
                aria-label={`Видалити пункт ${item.title}`}
                onClick={() =>
                  setDraft({
                    ...draft,
                    checklist: draft.checklist?.filter((x) => x.id !== item.id),
                  })
                }
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <div className="studio-check-item">
            <input
              aria-label="Новий пункт чекліста"
              value={checkTitle}
              onChange={(e) => setCheckTitle(e.target.value)}
            />
            <button
              type="button"
              disabled={!checkTitle.trim()}
              onClick={() => {
                setDraft({
                  ...draft,
                  checklist: [
                    ...(draft.checklist || []),
                    {
                      id: crypto.randomUUID(),
                      title: checkTitle.trim(),
                      done: false,
                    },
                  ],
                });
                setCheckTitle("");
              }}
            >
              Додати пункт
            </button>
          </div>
        </fieldset>
        <details>
          <summary>Посилання та вкладення</summary>
          <label>
            Посилання (по одному в рядку)
            <textarea
              aria-label="Посилання запису"
              value={(draft.links || []).join("\n")}
              onChange={(e) =>
                setDraft({ ...draft, links: e.target.value.split("\n") })
              }
            />
          </label>
          {draft.links
            ?.filter((url) => /^https?:\/\//.test(url))
            .map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                {url}
              </a>
            ))}
          <label>
            Вкладення (до 1 МБ сумарно на запис)
            <input
              type="file"
              aria-label="Додати вкладення"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (
                  file.size +
                    (draft.attachments || []).reduce(
                      (n, a) => n + a.data.length * 0.75,
                      0,
                    ) >
                  1024 * 1024
                ) {
                  setAttachmentError(
                    "Завеликий файл: до 1 МБ сумарно. Для великих референсів додай посилання.",
                  );
                  return;
                }
                try {
                  const data = await new Promise<string>((resolve, reject) => {
                    const r = new FileReader();
                    r.onload = () => resolve(String(r.result));
                    r.onerror = reject;
                    r.readAsDataURL(file);
                  });
                  setDraft((d) =>
                    d
                      ? {
                          ...d,
                          attachments: [
                            ...(d.attachments || []),
                            { name: file.name, data, type: file.type },
                          ],
                        }
                      : d,
                  );
                  setAttachmentError("");
                } catch {
                  setAttachmentError(
                    "Не вдалося прочитати файл. Спробуй додати його ще раз.",
                  );
                }
              }}
            />
          </label>
          {attachmentError && <p role="alert">{attachmentError}</p>}
          {draft.attachments?.map((file, i) => (
            <div className="studio-attachment" key={i}>
              <a href={file.data} download={file.name}>
                {file.name}
              </a>
              {/^image\/(png|jpeg|webp|gif)$/.test(file.type) && (
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, cover: file.data })}
                >
                  На обкладинку
                </button>
              )}
              <button
                type="button"
                aria-label={`Видалити вкладення ${file.name}`}
                onClick={() =>
                  setDraft({
                    ...draft,
                    attachments: draft.attachments?.filter((_, j) => j !== i),
                    cover: draft.cover === file.data ? undefined : draft.cover,
                  })
                }
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {draft.cover && (
            <div className="studio-cover">
              <img src={draft.cover} alt="Обкладинка референсу" />
              <button
                type="button"
                onClick={() => setDraft({ ...draft, cover: undefined })}
              >
                Прибрати обкладинку
              </button>
            </div>
          )}
        </details>
      </details>
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Wind,
  NotebookPen,
  CalendarHeart,
  Play,
  Pause,
  Square,
  Star,
  Trash2,
  Plus,
} from "lucide-react";
import type { PersonalTask } from "../types";
import {
  lightenDay,
  readPrivateNotes,
  writePrivateNotes,
  restOccurrences,
  type PrivateNote,
  type RestChoice,
} from "../domain/rest";
import { addDays } from "../domain/planning";

function Breathing() {
  const [duration, setDuration] = useState(1),
    [elapsed, setElapsed] = useState(0),
    [running, setRunning] = useState(false),
    [showTime, setShowTime] = useState(true),
    [started, setStarted] = useState(false);
  const total = duration * 60000;
  useEffect(() => {
    if (!running) return;
    const began = Date.now() - elapsed;
    const timer = window.setInterval(() => {
      const next = Math.min(total, Date.now() - began);
      setElapsed(next);
      if (next >= total) setRunning(false);
    }, 250);
    return () => clearInterval(timer);
  }, [running, total]);
  const left = Math.ceil((total - elapsed) / 1000),
    complete = started && elapsed >= total;
  return (
    <section className="rest-breath" aria-label="Спокійне дихання">
      <h2>Можна зробити паузу</h2>
      <p>Дихай у комфортному темпі. Можна просто спостерігати.</p>
      <label>
        Тривалість{" "}
        <select
          aria-label="Тривалість перепочинку"
          disabled={started}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        >
          {[1, 2, 3].map((n) => (
            <option key={n} value={n}>
              {n} хв
            </option>
          ))}
        </select>
      </label>
      <div
        className={`breath-orb ${started ? "has-started" : ""}`}
        style={{ animationPlayState: running ? "running" : "paused" }}
        aria-hidden="true"
      >
        <Wind size={40} />
      </div>
      <p className="breath-instruction" aria-live="off">
        {complete
          ? "Пауза завершена. Можна повертатися у своєму темпі."
          : !started
            ? "Почни, коли буде зручно"
            : !running
              ? "Пауза"
              : elapsed % 8000 < 4000
                ? "М’який вдих"
                : "Спокійний видих"}
      </p>
      <label className="rest-check">
        <input
          type="checkbox"
          checked={showTime}
          onChange={(e) => setShowTime(e.target.checked)}
        />
        Показувати таймер
      </label>
      <div className="breath-clock" aria-hidden={!showTime}>
        {showTime
          ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`
          : ""}
      </div>
      <div className="rest-actions">
        {!complete && (
          <button
            className="primary"
            onClick={() => {
              setStarted(true);
              setRunning(!running);
            }}
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
            {running ? "Пауза" : started ? "Продовжити" : "Почати"}
          </button>
        )}
        {started && (
          <button
            className="secondary"
            onClick={() => {
              setRunning(false);
              setStarted(false);
              setElapsed(0);
            }}
          >
            <Square size={16} />
            {complete ? "Ще одна пауза" : "Завершити"}
          </button>
        )}
      </div>
    </section>
  );
}

type Props = {
  today: string;
  tasks: PersonalTask[];
  onCommit: (tasks: PersonalTask[]) => string | void;
  onExit: () => void;
};
export function RestCorner(p: Props) {
  const [mode, setMode] = useState<"home" | "breathe" | "write" | "lighten">(
    "home",
  );
  const [notes, setNotes] = useState<PrivateNote[]>(() => {
    try {
      return readPrivateNotes(localStorage);
    } catch {
      return [];
    }
  });
  const [readError] = useState(() => {
    try {
      readPrivateNotes(localStorage);
      return false;
    } catch {
      return true;
    }
  });
  const [text, setText] = useState(""),
    [baseline, setBaseline] = useState(""),
    [editing, setEditing] = useState<string | null>(null),
    [message, setMessage] = useState("");
  const dirty = text !== baseline,
    dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const [pending, setPending] = useState<null | (() => void)>(null),
    guard = useRef<HTMLDialogElement>(null),
    [deleting, setDeleting] = useState<string | null>(null),
    deleteDialog = useRef<HTMLDialogElement>(null);
  const request = (action: () => void) => {
    if (dirtyRef.current) setPending(() => action);
    else action();
  };
  useEffect(() => {
    const navigate = (event: Event) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      setPending(
        () => (event as CustomEvent<{ resume: () => void }>).detail.resume,
      );
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("dayframe-before-navigate", navigate);
    window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("dayframe-before-navigate", navigate);
      window.removeEventListener("beforeunload", unload);
    };
  }, []);
  useEffect(() => {
    if (pending) guard.current?.showModal();
    else guard.current?.close();
  }, [pending]);
  useEffect(() => {
    if (deleting) deleteDialog.current?.showModal();
    else deleteDialog.current?.close();
  }, [deleting]);
  const saveNote = () => {
    if (readError) {
      setMessage(
        "Не вдалося прочитати збережені записи. Нічого не перезаписано.",
      );
      return false;
    }
    if (!text.trim()) {
      setMessage("Спершу напиши кілька слів.");
      return false;
    }
    const note = {
      id: editing || crypto.randomUUID(),
      text,
      updated: new Date().toISOString(),
    };
    try {
      const current = readPrivateNotes(localStorage);
      if (editing && current.find((n) => n.id === editing)?.text !== baseline) {
        setNotes(current);
        setMessage(
          "Не вдалося зберегти: запис змінено в іншій вкладці. Відкрий його знову; твоя чернетка залишається тут.",
        );
        return false;
      }
      const next = [note, ...current.filter((n) => n.id !== note.id)];
      writePrivateNotes(localStorage, next);
      setNotes(next);
      setEditing(note.id);
      setBaseline(text);
      dirtyRef.current = false;
      setMessage("Збережено лише на цьому пристрої.");
      return true;
    } catch {
      setMessage(
        "Не вдалося зберегти. Чернетка залишається тут; можна повторити спробу.",
      );
      return false;
    }
  };
  const changeMode = (next: typeof mode) =>
    request(() => {
      setMode(next);
      setMessage("");
    });
  const finishPending = (save: boolean) => {
    if (save && !saveNote()) return;
    dirtyRef.current = false;
    setText("");
    setBaseline("");
    setEditing(null);
    const action = pending;
    setPending(null);
    action?.();
  };
  return (
    <div className="rest-corner">
      <header className="rest-header">
        <div>
          <span className="rest-eyebrow">ТВІЙ ТИХИЙ КУТОЧОК</span>
          <h1>Перепочинок</h1>
        </div>
        <button className="secondary" onClick={() => request(p.onExit)}>
          <ArrowLeft size={17} />
          До календаря
        </button>
      </header>
      {mode !== "home" && (
        <button className="rest-back" onClick={() => changeMode("home")}>
          <ArrowLeft size={16} />
          Інший спосіб перепочити
        </button>
      )}
      {mode === "home" && (
        <section className="rest-welcome">
          <h2>Що тобі зараз потрібно?</h2>
          <p>Необов’язково завершувати все зараз.</p>
          <div className="rest-options">
            <button onClick={() => changeMode("breathe")}>
              <Wind size={28} />
              <strong>Видихнути</strong>
              <span>Кілька спокійних хвилин</span>
            </button>
            <button onClick={() => changeMode("write")}>
              <NotebookPen size={28} />
              <strong>Вивантажити думки</strong>
              <span>Місце для всього, що в голові</span>
            </button>
            <button onClick={() => changeMode("lighten")}>
              <CalendarHeart size={28} />
              <strong>Полегшити день</strong>
              <span>Обрати головне, решту відкласти</span>
            </button>
          </div>
        </section>
      )}
      {mode === "breathe" && <Breathing />}
      {mode === "write" && (
        <section className="rest-writing" aria-label="Особисті думки">
          <h2>Можна написати все, що зараз у голові</h2>
          <p>
            Чернетка тимчасова. Лише після натискання «Зберегти» запис
            залишиться в цьому браузері. Він не синхронізується, не входить у
            пошук, календарний експорт і загальну резервну копію.
          </p>
          {readError && (
            <p role="alert">
              Збережені записи не вдалося прочитати. Їх не змінено; збереження
              зараз недоступне.
            </p>
          )}
          <label className="sr-only" htmlFor="rest-thoughts">
            Твої думки
          </label>
          <textarea
            id="rest-thoughts"
            value={text}
            placeholder="Можна написати все, що зараз у голові"
            onChange={(e) => {
              setText(e.target.value);
              setMessage("");
            }}
          />
          <div className="rest-actions">
            <button
              className="primary"
              disabled={readError || !text.trim()}
              onClick={saveNote}
            >
              Зберегти на цьому пристрої
            </button>
            <button
              className="secondary"
              onClick={() =>
                request(() => {
                  setText("");
                  setBaseline("");
                  setEditing(null);
                  setMessage("");
                })
              }
            >
              <Plus size={16} />
              Нова чернетка
            </button>
          </div>
          <p className="rest-save-status" role="status">
            {message ||
              (dirty
                ? "Незбережена чернетка"
                : editing
                  ? "Збережений запис"
                  : "Запис нікуди не надсилається")}
          </p>
          {notes.length > 0 && (
            <div className="rest-saved">
              <h3>Збережені на цьому пристрої</h3>
              {notes.map((n) => (
                <article key={n.id}>
                  <button
                    onClick={() =>
                      request(() => {
                        setText(n.text);
                        setBaseline(n.text);
                        setEditing(n.id);
                        setMessage("");
                      })
                    }
                  >
                    <time>
                      {new Date(n.updated).toLocaleString("uk-UA", {
                        timeZone: "Europe/Kyiv",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    <span>{n.text}</span>
                  </button>
                  <button
                    aria-label={`Видалити запис від ${new Date(n.updated).toLocaleDateString("uk-UA")}`}
                    onClick={() => setDeleting(n.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
      {mode === "lighten" && <LightenDay {...p} />}
      <dialog
        ref={guard}
        className="rest-dialog"
        aria-label="Незбережена чернетка"
        onCancel={() => setPending(null)}
      >
        <h2>Залишити цю чернетку?</h2>
        <p>Вона ще не збережена на цьому пристрої.</p>
        {message && <p role="alert">{message}</p>}
        <div className="rest-actions">
          <button className="secondary" onClick={() => setPending(null)}>
            Залишитися
          </button>
          <button className="primary" onClick={() => finishPending(true)}>
            Зберегти й перейти
          </button>
          <button onClick={() => finishPending(false)}>
            Відкинути й перейти
          </button>
        </div>
      </dialog>
      <dialog
        ref={deleteDialog}
        className="rest-dialog"
        aria-label="Видалити особистий запис"
        onCancel={() => setDeleting(null)}
      >
        <h2>Видалити запис назавжди?</h2>
        {message.startsWith("Не вдалося") && <p role="alert">{message}</p>}
        <p>
          Цей запис не входить до резервної копії. Після видалення відновити
          його тут не вдасться.
        </p>
        <div className="rest-actions">
          <button className="secondary" onClick={() => setDeleting(null)}>
            Залишити запис
          </button>
          <button
            onClick={() => {
              try {
                const next = readPrivateNotes(localStorage).filter(
                  (n) => n.id !== deleting,
                );
                writePrivateNotes(localStorage, next);
                setNotes(next);
                if (editing === deleting) {
                  setEditing(null);
                  setText("");
                  setBaseline("");
                }
                setDeleting(null);
                setMessage("Запис видалено.");
              } catch {
                setMessage("Не вдалося видалити запис. Повтори спробу.");
              }
            }}
          >
            Видалити назавжди
          </button>
        </div>
      </dialog>
    </div>
  );
}

function LightenDay(p: Props) {
  const rows = restOccurrences(p.tasks, p.today);
  const [focus, setFocus] = useState<string[]>(() =>
    rows
      .filter((r) => r.task.focusDates?.includes(p.today))
      .map((r) => r.task.id)
      .slice(0, 3),
  );
  const [choices, setChoices] = useState<RestChoice[]>([]),
    [error, setError] = useState(""),
    [preview, setPreview] = useState<null | {
      tasks: PersonalTask[];
      changes: string[];
      before: string;
    }>(null),
    [undo, setUndo] = useState<null | {
      before: PersonalTask[];
      after: string;
    }>(null);
  const [restBlock, setRestBlock] = useState(false),
    [start, setStart] = useState("15:00"),
    [duration, setDuration] = useState(30);
  const choice = (id: string, occurrence: string): RestChoice =>
    choices.find((c) => c.id === id && c.occurrence === occurrence) || {
      id,
      occurrence,
      action: "keep",
      scope: "occurrence",
      date: addDays(p.today, 1),
    };
  const update = (c: RestChoice) => {
    setChoices([
      ...choices.filter((x) => x.id !== c.id || x.occurrence !== c.occurrence),
      c,
    ]);
    setPreview(null);
  };
  const prepare = () => {
    try {
      const result = lightenDay(p.tasks, p.today, focus, choices, () =>
        crypto.randomUUID(),
      );
      if (restBlock) {
        result.tasks.push({
          id: crypto.randomUUID(),
          title: "Перепочинок",
          date: p.today,
          category: "Day",
          recurrence: "once",
          priority: "Normal",
          notes: "",
          completed: false,
          disabled: false,
          scheduledStart: start,
          scheduledDuration: duration,
          sectionId: "personal",
        });
        result.changes.push(`Додати блок відпочинку: ${start}, ${duration} хв`);
      }
      setPreview({ ...result, before: JSON.stringify(p.tasks) });
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не вдалося підготувати зміни.",
      );
    }
  };
  return (
    <section className="rest-lighten">
      <h2>Що сьогодні можна відкласти?</h2>
      <p>
        Обери до трьох головних справ зірочкою. Решту можна залишити сьогодні,
        перенести або лишити без дати. Зовнішні зустрічі тут не змінюються.
      </p>
      {!rows.length && (
        <p className="rest-empty">
          Сьогодні немає активних особистих справ. Можна просто зробити паузу.
        </p>
      )}
      <div className="rest-task-list">
        {rows.map(({ task, occurrence }) => {
          const c = choice(task.id, occurrence),
            selected = focus.includes(task.id);
          return (
            <article key={task.id + occurrence}>
              <div className="rest-task-name">
                <button
                  className="context-star"
                  aria-pressed={selected}
                  aria-label={`Головне: ${task.title}`}
                  onClick={() => {
                    if (!selected && focus.length >= 3) {
                      setError(
                        "Достатньо трьох головних справ. Спершу зніми одну зірочку.",
                      );
                      return;
                    }
                    setFocus(
                      selected
                        ? focus.filter((id) => id !== task.id)
                        : [...focus, task.id],
                    );
                    setPreview(null);
                    setError("");
                  }}
                >
                  <Star size={20} fill={selected ? "currentColor" : "none"} />
                </button>
                <strong>{task.title}</strong>
                {task.recurrence !== "once" && (
                  <small>Повторювана справа</small>
                )}
              </div>
              {selected ? (
                <span className="rest-focus-label">
                  Залишається головною сьогодні
                </span>
              ) : (
                <div className="rest-task-options">
                  <label>
                    Що зробити
                    <select
                      aria-label={`Дія: ${task.title}`}
                      value={c.action}
                      onChange={(e) =>
                        update({
                          ...c,
                          action: e.target.value as RestChoice["action"],
                        })
                      }
                    >
                      <option value="keep">Залишити сьогодні</option>
                      <option value="date">Перенести на дату</option>
                      <option value="backlog">Залишити без дати</option>
                    </select>
                  </label>
                  {c.action === "date" && (
                    <label>
                      Дата
                      <input
                        aria-label={`Дата: ${task.title}`}
                        type="date"
                        value={c.date}
                        onChange={(e) => update({ ...c, date: e.target.value })}
                      />
                    </label>
                  )}
                  {c.action !== "keep" && task.recurrence !== "once" && (
                    <label>
                      Що змінити
                      <select
                        aria-label={`Обсяг: ${task.title}`}
                        value={c.scope}
                        onChange={(e) =>
                          update({
                            ...c,
                            scope: e.target.value as RestChoice["scope"],
                          })
                        }
                      >
                        <option value="occurrence">Лише це виконання</option>
                        <option value="series">Усю серію</option>
                      </select>
                      <small>
                        {c.scope === "occurrence"
                          ? "Окреме виконання буде перенесено; наступні повторення залишаться."
                          : "Зміниться початок усієї серії. Без дати — серія залишиться у планах до призначення дати."}
                      </small>
                    </label>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
      <div className="rest-block-option">
        <label className="rest-check">
          <input
            type="checkbox"
            checked={restBlock}
            onChange={(e) => {
              setRestBlock(e.target.checked);
              setPreview(null);
            }}
          />
          Додати блок відпочинку в календар
        </label>
        {restBlock && (
          <div className="rest-actions">
            <label>
              Початок
              <input
                aria-label="Початок відпочинку"
                type="time"
                required
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  setPreview(null);
                }}
              />
            </label>
            <label>
              Тривалість
              <select
                value={duration}
                onChange={(e) => {
                  setDuration(Number(e.target.value));
                  setPreview(null);
                }}
              >
                {[15, 30, 60].map((n) => (
                  <option key={n} value={n}>
                    {n} хв
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      <button
        className="primary"
        disabled={restBlock && !/^([01]\d|2[0-3]):[0-5]\d$/.test(start)}
        onClick={prepare}
      >
        Переглянути зміни
      </button>
      {preview && (
        <section className="rest-preview" aria-label="Попередній перегляд змін">
          <h3>Що зміниться</h3>
          {preview.changes.length ? (
            <ul>
              {preview.changes.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          ) : (
            <p>Усе залишається як є.</p>
          )}
          <div className="rest-actions">
            <button
              className="primary"
              disabled={!preview.changes.length}
              onClick={() => {
                if (JSON.stringify(p.tasks) !== preview.before) {
                  setError(
                    "Справи змінилися. Сформуй попередній перегляд ще раз.",
                  );
                  setPreview(null);
                  return;
                }
                const issue = p.onCommit(preview.tasks);
                if (issue) {
                  setError(issue);
                  return;
                }
                setUndo({
                  before: p.tasks,
                  after: JSON.stringify(preview.tasks),
                });
                setPreview(null);
                setChoices([]);
                setRestBlock(false);
                setError("");
              }}
            >
              Застосувати зміни
            </button>
            <button className="secondary" onClick={() => setPreview(null)}>
              Повернутися до вибору
            </button>
          </div>
        </section>
      )}
      {undo && (
        <div className="rest-undo" role="status">
          <span>Зміни збережені на цьому пристрої.</span>
          <button
            onClick={() => {
              if (JSON.stringify(p.tasks) !== undo.after) {
                setError(
                  "Після цього справи вже змінювалися. Скасування не перезапише нові зміни.",
                );
                return;
              }
              const issue = p.onCommit(undo.before);
              if (issue) setError(issue);
              else {
                setUndo(null);
                setFocus(
                  undo.before
                    .filter((t) => t.focusDates?.includes(p.today))
                    .map((t) => t.id)
                    .slice(0, 3),
                );
              }
            }}
          >
            Скасувати зміни
          </button>
        </div>
      )}
    </section>
  );
}

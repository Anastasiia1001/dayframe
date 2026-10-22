import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Upload, X } from "lucide-react";
import {
  mergeKeepNotes,
  readKeepFiles,
  type KeepNote,
} from "../domain/keepImport";
import type { PersonalTask } from "../types";
import type { Section } from "../domain/studio";
export function KeepImport({
  tasks,
  sections,
  onImport,
}: {
  tasks: PersonalTask[];
  sections: Section[];
  onImport: (tasks: PersonalTask[], sections: Section[], count: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    input = useRef<HTMLInputElement>(null),
    folder = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState<KeepNote[]>([]),
    [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [skipped, setSkipped] = useState(0),
    [archived, setArchived] = useState(false),
    [page, setPage] = useState(0);
  const existing = new Set(
    tasks
      .filter((t) => t.origin?.source === "GoogleKeep")
      .map((t) => t.origin!.id),
  );
  const visible = notes.filter((n) => archived || !n.archived),
    chosen = notes.filter(
      (n) => selected.includes(n.id) && !existing.has(n.id),
    );
  const currentNames = new Set(
    sections.map((s) => s.name.trim().toLocaleLowerCase("uk")),
  );
  const newNames = [
    ...new Set(
      chosen.flatMap((n) => (n.labels.length ? n.labels : ["Нотатки Keep"])),
    ),
  ].filter(
    (n) => !currentNames.has(n.trim().slice(0, 80).toLocaleLowerCase("uk")),
  );
  const read = async (files: File[]) => {
    setBusy(true);
    setError("");
    setNotes([]);
    setSelected([]);
    setPage(0);
    setArchived(false);
    try {
      const result = await readKeepFiles(files);
      setNotes(result.notes);
      setSkipped(result.skipped);
      setSelected(
        result.notes
          .filter((n) => !n.archived && !existing.has(n.id))
          .map((n) => n.id),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не вдалося прочитати експорт Keep.",
      );
    } finally {
      setBusy(false);
    }
  };
  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  const update = (id: string, patch: Partial<KeepNote>) =>
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  return (
    <>
      <button
        className="keep-import-trigger"
        aria-label="Імпорт Google Keep"
        title="Імпорт Google Keep"
        onClick={() => dialog.current?.showModal()}
      >
        <Upload size={14} />
        <span>Google Keep</span>
      </button>
      {createPortal(
        <dialog
          ref={dialog}
          className="keep-import-dialog"
          aria-labelledby="keep-import-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) dialog.current?.close();
          }}
        >
          <div className="keep-import-content">
            <header>
              <div>
                <span className="eyebrow">ЛОКАЛЬНЕ ПЕРЕНЕСЕННЯ</span>
                <h2 id="keep-import-title">Google Keep → Dayframe</h2>
              </div>
              <button
                aria-label="Закрити імпорт Keep"
                onClick={() => dialog.current?.close()}
              >
                <X size={20} />
              </button>
            </header>
            <p>
              Обери експорт Keep із Google Takeout. Файли читаються тільки в
              цьому браузері й нікуди не надсилаються.
            </p>
            <div className="keep-import-actions">
              <button
                className="primary"
                disabled={busy}
                onClick={() => input.current?.click()}
              >
                {busy ? "Читаємо…" : "Вибрати ZIP або JSON"}
              </button>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => folder.current?.click()}
              >
                Вибрати теку Keep
              </button>
              <a
                href="https://takeout.google.com/"
                target="_blank"
                rel="noreferrer"
              >
                Експорт із Google Takeout
              </a>
            </div>
            <input
              ref={input}
              hidden
              type="file"
              multiple
              accept=".zip,.json,application/zip,application/json"
              aria-label="Файли експорту Keep"
              onChange={(e) => {
                if (e.target.files?.length)
                  void read(Array.from(e.target.files));
                e.target.value = "";
              }}
            />
            <input
              ref={(node) => {
                folder.current = node;
                node?.setAttribute("webkitdirectory", "");
              }}
              hidden
              type="file"
              multiple
              aria-label="Тека експорту Keep"
              onChange={(e) => {
                if (e.target.files?.length)
                  void read(
                    Array.from(e.target.files).filter((f) =>
                      /\.json$/i.test(f.name),
                    ),
                  );
                e.target.value = "";
              }}
            />
            {!!notes.length && (
              <>
                <p role="status">
                  Прочитано: {notes.length}. Вибрано: {chosen.length}. Пропущено
                  порожніх, видалених або повторних у файлах: {skipped}.
                </p>
                <div className="keep-import-actions">
                  <label>
                    <input
                      type="checkbox"
                      checked={archived}
                      onChange={(e) => {
                        setArchived(e.target.checked);
                        setPage(0);
                        if (!e.target.checked)
                          setSelected((ids) =>
                            ids.filter(
                              (id) => !notes.find((n) => n.id === id)?.archived,
                            ),
                          );
                      }}
                    />
                    Показати архівні
                  </label>
                  <button
                    onClick={() =>
                      setSelected(
                        visible
                          .filter((n) => !existing.has(n.id))
                          .map((n) => n.id),
                      )
                    }
                  >
                    Вибрати показані
                  </button>
                  <button onClick={() => setSelected([])}>Зняти вибір</button>
                </div>
                <p>
                  Мітки створять відсутні розділи:{" "}
                  {newNames.length
                    ? newNames.join(", ")
                    : "нових розділів немає"}
                  . За кількох міток нотатка потрапить у перший розділ; усі
                  мітки збережуться в тексті.
                </p>
                <p>
                  Знайдені в тексті дати — лише пропозиції: перевір їх. Без дати
                  нотатка потрапить у беклог, з датою без часу — на весь день.
                  Дата створення нотатки не використовується як дата завдання.
                </p>
                <div className="keep-import-list">
                  {visible.slice(page * 25, page * 25 + 25).map((note) => (
                    <article key={note.id}>
                      <label className="keep-import-note">
                        <input
                          type="checkbox"
                          checked={
                            selected.includes(note.id) && !existing.has(note.id)
                          }
                          disabled={existing.has(note.id)}
                          onChange={() => toggle(note.id)}
                        />
                        <strong>{note.title}</strong>
                        {existing.has(note.id) && (
                          <small>Уже імпортовано</small>
                        )}
                      </label>
                      <p className="keep-import-text">
                        {note.text ||
                          note.checklist
                            .map((i) => `${i.done ? "✓" : "□"} ${i.title}`)
                            .join("\n")}
                      </p>
                      <small>
                        {note.labels.join(" · ") || "Нотатки Keep"}
                        {note.archived ? " · Архів" : ""}
                        {note.checklist.length
                          ? ` · Пунктів: ${note.checklist.length}`
                          : ""}
                      </small>
                      <div className="keep-import-dates">
                        <label>
                          Дата
                          <input
                            type="date"
                            aria-label={`Дата: ${note.title}`}
                            value={note.date}
                            onChange={(e) =>
                              update(note.id, {
                                date: e.target.value,
                                ...(!e.target.value ? { time: "" } : {}),
                              })
                            }
                          />
                        </label>
                        <label>
                          Час
                          <input
                            type="time"
                            aria-label={`Час: ${note.title}`}
                            disabled={!note.date}
                            value={note.time}
                            onChange={(e) =>
                              update(note.id, { time: e.target.value })
                            }
                          />
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
                {visible.length > 25 && (
                  <div className="keep-import-actions">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Попередні
                    </button>
                    <span>
                      {page + 1} / {Math.ceil(visible.length / 25)}
                    </span>
                    <button
                      disabled={(page + 1) * 25 >= visible.length}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Наступні
                    </button>
                  </div>
                )}
              </>
            )}
            <p className="muted">
              Зображення, аудіо та вкладення не переносяться. Повторно
              імпортовані нотатки пропускаються; наявні завдання не
              перезаписуються.
            </p>
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
            <footer>
              <button
                className="secondary"
                onClick={() => dialog.current?.close()}
              >
                Скасувати
              </button>
              <button
                className="primary"
                disabled={busy || !chosen.length}
                onClick={() => {
                  try {
                    const merged = mergeKeepNotes(chosen, tasks, sections);
                    onImport(merged.tasks, merged.sections, merged.added);
                    dialog.current?.close();
                    setNotes([]);
                    setSelected([]);
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : "Не вдалося зберегти. Перевір вільне місце.",
                    );
                  }
                }}
              >
                Перенести вибрані ({chosen.length})
              </button>
            </footer>
          </div>
        </dialog>,
        document.body,
      )}
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import type { PersonalTask } from "./types";
/** Record drafts are kept separately from saved tasks; no task is created until Save. */
export function useDraftGuard(
  task: PersonalTask | null,
  close: () => void,
  occurrence?: string | null,
) {
  const initial = useRef<{ id: string; value: string; date: string } | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const dirty =
    !!task &&
    initial.current?.id === task.id &&
    initial.current.value !== JSON.stringify(task);
  if (task && initial.current?.id !== task.id)
    initial.current = {
      id: task.id,
      value: JSON.stringify(task),
      date: task.date,
    };
  if (!task) initial.current = null;
  const requestClose = () => {
    if (dirty) setPending(true);
    else close();
  };
  useEffect(() => {
    if (!task || !dirty) return;
    try {
      localStorage.setItem("dayframe-record-draft", JSON.stringify(task));
      localStorage.setItem(
        "dayframe-record-draft-context",
        JSON.stringify({
          id: task.id,
          occurrence: occurrence || initial.current?.date || task.date,
        }),
      );
      window.dispatchEvent(new Event("dayframe-draft-updated"));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const navigate = (e: Event) => {
      e.preventDefault();
      setPending(true);
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("dayframe-before-navigate", navigate);
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("dayframe-before-navigate", navigate);
    };
  }, [task, dirty, occurrence]);
  const prompt = pending && (
    <div
      className="draft-confirmation"
      role="alertdialog"
      aria-label="Незбережені зміни"
    >
      <p>
        У записі є незбережені зміни. Можна продовжити редагування або закрити,
        залишивши чернетку на цьому пристрої.
      </p>
      {storageError && (
        <p role="alert">
          Не вдалося зберегти чернетку на пристрої. Редактор залишається
          відкритим: скопіюй текст або звільни місце.
        </p>
      )}
      <button type="button" onClick={() => setPending(false)}>
        Продовжити редагування
      </button>
      <button
        type="button"
        disabled={storageError}
        onClick={() => {
          setPending(false);
          close();
        }}
      >
        Закрити зі збереженням чернетки
      </button>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.removeItem("dayframe-record-draft");
            localStorage.removeItem("dayframe-record-draft-context");
            window.dispatchEvent(new Event("dayframe-draft-updated"));
          } catch {}
          setPending(false);
          close();
        }}
      >
        Відкинути незбережені зміни
      </button>
    </div>
  );
  return { requestClose, prompt };
}

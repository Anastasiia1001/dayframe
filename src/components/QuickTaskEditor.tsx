import { useDraftGuard } from "../useDraftGuard";
import { RecordFields } from "./RecordFields";
import { initialSections, type Section } from "../domain/studio";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { PersonalTask } from "../types";
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
  onSave: (scope: string, occurrence: string) => string | void;
  onDelete?: (scope: string, occurrence: string) => void;
}) {
  const occurrenceDate = useRef(
    (() => {
      try {
        const context = JSON.parse(
          localStorage.getItem("dayframe-record-draft-context") || "null",
        );
        return context?.id === task.id ? context.occurrence : task.date;
      } catch {
        return task.date;
      }
    })(),
  );
  const guard = useDraftGuard(task, onClose, occurrenceDate.current);
  const [scope, setScope] = useState("one");
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
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      previous?.isConnected && previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="quick-task-editor studio-editor"
      aria-label="Особисте завдання"
      onCancel={(e) => {
        e.preventDefault();
        guard.requestClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) guard.requestClose();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (task.title.trim()) {
            setError("");
            const issue = onSave(scope, occurrenceDate.current);
            if (issue) setError(issue);
          }
        }}
      >
        <header>
          <h2>{onDelete ? "Редагувати запис" : "Новий запис"}</h2>
          <button
            type="button"
            aria-label="Закрити завдання"
            onClick={guard.requestClose}
          >
            <X size={20} />
          </button>
        </header>
        <RecordFields
          draft={task}
          onChange={onChange}
          sections={sections}
          today={new Intl.DateTimeFormat("sv-SE", {
            timeZone: "Europe/Kyiv",
          }).format(new Date())}
          existing={!!onDelete}
          occurrence={
            onDelete && task.recurrence !== "once" ? task.date : undefined
          }
          scope={scope}
          onScope={setScope}
        />
        {guard.prompt}
        {error && <p role="alert">{error}</p>}
        <footer>
          {onDelete && (
            <button
              type="button"
              className="danger"
              onClick={() => onDelete?.(scope, occurrenceDate.current)}
            >
              Видалити
            </button>
          )}
          <button
            type="button"
            className="secondary"
            onClick={guard.requestClose}
          >
            Скасувати
          </button>
          <button type="submit" className="primary">
            Зберегти
          </button>
        </footer>
      </form>
    </dialog>
  );
}

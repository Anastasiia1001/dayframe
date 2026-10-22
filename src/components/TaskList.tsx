import { taskCadence, cadenceLabel } from "../taskCadence";
import {
  Check,
  Repeat2,
  Flag,
  SkipForward,
  Pencil,
  Trash2,
} from "lucide-react";
import type { PersonalTask } from "../types";
import { shortDate } from "../locale";
export function TaskList({
  tasks,
  today,
  onToggle,
  onEdit,
  onPostpone,
  onDelete,
  compact = false,
}: {
  tasks: PersonalTask[];
  today: string;
  onToggle: (t: PersonalTask) => void;
  onEdit: (t: PersonalTask) => void;
  onPostpone: (t: PersonalTask) => void;
  onDelete?: (t: PersonalTask) => void;
  compact?: boolean;
}) {
  return (
    <div className={`task-list purposeful-tasks ${compact ? "compact" : ""}`}>
      {tasks.map((t) => (
        <div
          className={`task-row ${t.completed ? "completed" : ""} ${t.priority === "High" && !t.completed ? "is-important" : ""} ${t.disabled ? "disabled" : ""}`}
          key={t.id}
          data-cadence={taskCadence(t)}
        >
          <button
            className={`checkbox ${t.completed ? "checked" : ""}`}
            aria-label={`${t.completed ? "Позначити невиконаним" : "Виконати"} ${t.title}`}
            onClick={() => onToggle(t)}
          >
            {t.completed && <Check size={14} />}
          </button>
          <button className="task-title" onClick={() => onEdit(t)}>
            <strong>{t.title}</strong>
            <span className="task-facts">
              <span
                className={`task-due ${!t.inBacklog && t.date < today && !t.completed ? "overdue" : ""}`}
              >
                {!t.inBacklog && t.date < today && !t.completed ? "Прострочено · " : ""}
                {t.inBacklog ? "Без конкретної дати" : t.date === today ? "Сьогодні" : shortDate(t.date)}
              </span>
              <span className="task-repeat cadence-badge">
                {t.recurrence !== "once" && <Repeat2 size={12} />}
                {cadenceLabel(t)}
              </span>
              {t.origin?.source === "Slack" && <span>Додано зі Slack</span>}
              {t.origin?.source === "GoogleKeep" && <span>З Google Keep</span>}
              {t.priority === "High" && (
                <span className="task-priority">
                  <Flag size={11} />
                  Важливе
                </span>
              )}
              {t.priority === "Low" && <span>Без поспіху</span>}
              {t.disabled && <span>Призупинено</span>}
            </span>
          </button>
          <div className="task-actions">
            {t.jiraUrl?.startsWith("https://") && <a href={t.jiraUrl} target="_blank" rel="noopener noreferrer" aria-label={`Відкрити тікет ${t.title}`}>Jira ↗</a>}
            {!t.completed && (
              <button
                title="Перенести на наступний день"
                aria-label={`Перенести ${t.title}`}
                onClick={() => onPostpone(t)}
              >
                <SkipForward size={15} />
              </button>
            )}
            {!compact && (
              <>
                <button
                  aria-label={`Редагувати ${t.title}`}
                  onClick={() => onEdit(t)}
                >
                  <Pencil size={14} />
                </button>
                {onDelete && (
                  <button
                    aria-label={`Видалити ${t.title}`}
                    onClick={() => onDelete(t)}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

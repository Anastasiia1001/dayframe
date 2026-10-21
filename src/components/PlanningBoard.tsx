import { useState } from "react";
import type { PersonalTask, PlanningHorizon } from "../types";
import { addDays, fromDate, sortTasks } from "../domain/planning";
import { horizons, taskHorizon } from "../domain/horizons";
import { cadenceLabel, taskCadence } from "../taskCadence";
import { locale, shortDate } from "../locale";

type Props = {
  tasks: PersonalTask[]; today: string;
  onSchedule: (task: PersonalTask, date: string) => void;
  onPlan: (task: PersonalTask, horizon: PlanningHorizon) => void;
  onDelete: (task: PersonalTask) => void;
  onEdit: (task: PersonalTask) => void;
  onToggle: (task: PersonalTask) => void;
};
function periodLabel(task: PersonalTask, today: string) {
  const horizon = taskHorizon(task), anchor = task.planningAnchor || today;
  if (task.isTemplate) return "Шаблон · можна брати повторно";
  if (horizon === "year") return `План на ${fromDate(anchor).getFullYear()} рік`;
  if (horizon === "month") return fromDate(anchor).toLocaleDateString(locale, { month:"long", year:"numeric" });
  if (horizon === "week") {
    const offset = (fromDate(anchor).getDay() + 6) % 7;
    const start = addDays(anchor, -offset);
    return `Тиждень ${shortDate(start)} — ${shortDate(addDays(start, 6))}`;
  }
  if (horizon === "backlog") return "Без обраного періоду";
  return `${task.date < today ? "Прострочено · " : ""}${task.date === today ? "Сьогодні" : task.date === addDays(today, 1) ? "Завтра" : shortDate(task.date)}`;
}
export function PlanningBoard({ tasks, today, onSchedule, onPlan, onEdit, onToggle, onDelete }: Props) {
  const [over, setOver] = useState("");
  const [query, setQuery] = useState("");
  const visible = tasks.filter(t => !t.completed && !t.disabled && t.title.toLocaleLowerCase("uk").includes(query.toLocaleLowerCase("uk")));
  return <>
    <div className="task-list-toolbar"><input aria-label="Пошук на дошці" placeholder="Знайти справу чи шаблон…" value={query} onChange={e => setQuery(e.target.value)} /></div>
    <p className="planning-help">Розкладай справи від року до дня: перетягуй картку або обирай блок у її меню. Місяць і тиждень — плани без конкретної дати. Позначка «Щороку» чи «Щотижня» показує повторення й не змінюється при перенесенні. Шаблони створюють копію.</p>
    <div className="planning-columns horizon-columns">
      {horizons.map(column => {
        const list = sortTasks(visible.filter(t => taskHorizon(t) === column.id));
        return <section key={column.id} data-horizon={column.id} className={`planning-column ${over === column.id ? "drop-active" : ""}`} aria-label={column.name}
          onDragOver={e => { if (e.dataTransfer.types.includes("application/x-dayframe-task")) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOver(column.id); } }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(""); }}
          onDrop={e => { e.preventDefault(); setOver(""); const task = tasks.find(t => t.id === e.dataTransfer.getData("application/x-dayframe-task")); if (task && !task.completed && !task.disabled && taskHorizon(task) !== column.id) onPlan(task, column.id); }}>
          <h2>{column.name} <span>{list.length}</span></h2><small>{column.hint}</small>
          {list.map(t => <article className="planning-card" data-cadence={taskCadence(t)} key={t.id} draggable onDragStart={e => { e.currentTarget.dataset.dragging="true"; e.dataTransfer.setData("application/x-dayframe-task", t.id); e.dataTransfer.effectAllowed = "copyMove"; }} onDragEnd={e => { delete e.currentTarget.dataset.dragging; setOver(""); }}>
            <span className="cadence-badge"><span className="drag-grip" aria-hidden="true" title="Перетягнути картку">⠿ </span>{cadenceLabel(t)}</span>
            <button className="planning-title" onClick={() => onEdit(t)}>{t.title}</button>
            {t.origin?.source === "Slack" && <small>Додано зі Slack</small>}
            {t.priority === "High" && <small>⚑ Важливе</small>}
            <small>{periodLabel(t, today)}</small>
            {t.jiraUrl?.startsWith("https://") && <a href={t.jiraUrl} target="_blank" rel="noopener noreferrer">Тікет Jira ↗</a>}
            <label className="horizon-destination">Перемістити до<select aria-label={`Блок для ${t.title}`} value={column.id} onChange={e => onPlan(t, e.target.value as PlanningHorizon)}>{horizons.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
            <label className="planning-date">Конкретна дата<input type="date" aria-label={`Дата для ${t.title}`} value="" onChange={e => { if (e.target.value) onSchedule(t, e.target.value); }} /></label>
            <div className="planning-actions"><button onClick={() => onSchedule(t, today)}>На сьогодні</button><button onClick={() => onSchedule(t, addDays(today, 1))}>На завтра</button>{!t.isTemplate && <button aria-label={`Виконати ${t.title}`} onClick={() => onToggle(t)}>✓ Готово</button>}<button aria-label={`Редагувати ${t.title}`} onClick={() => onEdit(t)}>Змінити</button><button aria-label={`Видалити ${t.title}`} onClick={() => onDelete(t)}>Видалити</button></div>
          </article>)}
          {!list.length && <p className="planning-empty">Перетягни сюди справу</p>}
        </section>;
      })}
    </div>
  </>;
}

import { useState } from "react";
import type { PersonalTask } from "../types";
import { addDays, sortTasks } from "../domain/planning";
import { cadenceLabel, taskCadence } from "../taskCadence";

type Props = {
  tasks: PersonalTask[]; today: string;
  onSchedule: (task: PersonalTask, date: string) => void;
  onEdit: (task: PersonalTask) => void;
  onToggle: (task: PersonalTask) => void;
};
export function PlanningBoard({ tasks, today, onSchedule, onEdit, onToggle }: Props) {
  const [over, setOver] = useState("");
  const [query, setQuery] = useState("");
  const tomorrow = addDays(today, 1);
  const columns = [
    { id: "library", name: "Ідеї та шаблони", date: "", hint: "Обери справу будь-якого циклу" },
    { id: "today", name: "Сьогодні", date: today, hint: "Також прострочені справи" },
    { id: "tomorrow", name: "Завтра", date: tomorrow, hint: "Залиши місце для відпочинку" },
    { id: "later", name: "Пізніше", date: addDays(today, 7), hint: "Перетягування планує через 7 днів" },
  ];
  const visible = tasks.filter(t => !t.completed && !t.disabled && t.title.toLocaleLowerCase("uk").includes(query.toLocaleLowerCase("uk")));
  return <>
    <div className="task-list-toolbar"><input aria-label="Пошук на дошці" placeholder="Знайти справу чи шаблон…" value={query} onChange={e => setQuery(e.target.value)} /></div>
    <p className="planning-help">Перетягуй картки між днями або обирай дату в картці. Шаблон створює окреме завдання й залишається в бібліотеці.</p>
    <div className="planning-columns">
      {columns.map(column => {
        const list = sortTasks(visible.filter(t => column.id === "library" ? t.isTemplate : !t.isTemplate && (column.id === "today" ? t.date <= today : column.id === "tomorrow" ? t.date === tomorrow : t.date > tomorrow)));
        return <section key={column.id} className={`planning-column ${over === column.id ? "drop-active" : ""}`} aria-label={column.name}
          onDragOver={e => { if (column.date && e.dataTransfer.types.includes("application/x-dayframe-task")) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOver(column.id); } }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(""); }}
          onDrop={e => { e.preventDefault(); setOver(""); const task = tasks.find(t => t.id === e.dataTransfer.getData("application/x-dayframe-task")); if (task && column.date && !task.completed && !task.disabled) onSchedule(task, column.date); }}>
          <h2>{column.name} <span>{list.length}</span></h2><small>{column.hint}</small>
          {list.map(t => <article className="planning-card" data-cadence={taskCadence(t)} key={t.id} draggable onDragStart={e => { e.dataTransfer.setData("application/x-dayframe-task", t.id); e.dataTransfer.effectAllowed = "copyMove"; }} onDragEnd={() => setOver("")}>
            <span className="cadence-badge"><span className="drag-grip" aria-hidden="true" title="Перетягнути картку">⠿ </span>{cadenceLabel(t)}</span>
            <button className="planning-title" onClick={() => onEdit(t)}>{t.title}</button>
            {!t.isTemplate && <small>{t.date < today ? "Прострочено · " : ""}{t.date}</small>}
            {t.jiraUrl?.startsWith("https://") && <a href={t.jiraUrl} target="_blank" rel="noopener noreferrer">Тікет Jira ↗</a>}
            <label className="planning-date">{t.isTemplate ? "Запланувати" : "Перенести"}<input type="date" aria-label={`Дата для ${t.title}`} value="" onChange={e => { if (e.target.value) onSchedule(t, e.target.value); }} /></label>
            <div className="planning-actions"><button onClick={() => onSchedule(t, today)}>На сьогодні</button><button onClick={() => onSchedule(t, tomorrow)}>На завтра</button>{!t.isTemplate && <button aria-label={`Виконати ${t.title}`} onClick={() => onToggle(t)}>✓ Готово</button>}</div>
          </article>)}
          {!list.length && <p className="planning-empty">{column.date ? "Перетягни сюди справу" : "Шаблони з’являться тут"}</p>}
        </section>;
      })}
    </div>
  </>;
}

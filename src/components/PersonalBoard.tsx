import { PlanningBoard } from "./PlanningBoard";
import { useState } from "react";
import type { PersonalTask } from "../types";
import { TaskList } from "./TaskList";
type Props = {
  tasks: PersonalTask[];
  today: string;
  onToggle: (t: PersonalTask) => void;
  onEdit: (t: PersonalTask) => void;
  onPostpone: (t: PersonalTask) => void;
  onDelete: (t: PersonalTask) => void;
  onSchedule: (t: PersonalTask, date: string) => void;
  onImportJira: (title: string, url: string) => void;
  onAddBacklog: () => void;
};
export function PersonalBoard(p: Props) {
  const [importing, setImporting] = useState(false);
  const [jiraTitle, setJiraTitle] = useState("");
  const [jiraUrl, setJiraUrl] = useState("");
  const completed = p.tasks.filter(t => !t.isTemplate && t.completed);
  const paused = p.tasks.filter(t => !t.isTemplate && t.disabled && !t.completed);
  return <section className="personal-board unified-planning">
    <div className="planning-toolbar"><button className="secondary" onClick={p.onAddBacklog}>＋ У беклог</button><button className="secondary" onClick={() => setImporting(v => !v)}>Додати з Jira вручну</button></div>
      {importing && <form className="jira-copy-form" onSubmit={e => { e.preventDefault(); if (!jiraTitle.trim()) return; p.onImportJira(jiraTitle.trim(), jiraUrl.trim()); setJiraTitle(""); setJiraUrl(""); setImporting(false); }}>
        <h2>Скопіюй назву тікета</h2>
        <p>Локальне завдання без підключення до Jira. Назву вставляєш самостійно; статус і зміни не синхронізуються.</p>
        <label>Назва тікета<input required maxLength={300} value={jiraTitle} onChange={e => setJiraTitle(e.target.value)} /></label>
        <label>Посилання на тікет (необов’язково)<input type="url" pattern="https://.*" placeholder="https://company.atlassian.net/browse/TEAM-123" value={jiraUrl} onChange={e => setJiraUrl(e.target.value)} /></label>
        <button className="primary" type="submit">Додати у беклог</button><button type="button" className="text-button" onClick={() => setImporting(false)}>Скасувати</button>
      </form>}

    <PlanningBoard tasks={p.tasks} today={p.today} onSchedule={p.onSchedule} onEdit={p.onEdit} onToggle={p.onToggle} onDelete={p.onDelete} />
    {completed.length > 0 && <details className="completed-group"><summary>Показати виконані · {completed.length}</summary><TaskList tasks={completed} today={p.today} onToggle={p.onToggle} onEdit={p.onEdit} onPostpone={p.onPostpone} onDelete={p.onDelete} /></details>}
    {paused.length > 0 && <details className="completed-group"><summary>Призупинені · {paused.length}</summary><TaskList tasks={paused} today={p.today} onToggle={p.onToggle} onEdit={p.onEdit} onPostpone={p.onPostpone} onDelete={p.onDelete} /></details>}
  </section>;
}

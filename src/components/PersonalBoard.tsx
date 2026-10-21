import { PlanningBoard } from "./PlanningBoard";
import { taskCadence } from "../taskCadence";
import { useState } from "react";
import { Plus, Search, CheckCheck, BookOpen } from "lucide-react";
import type { PersonalTask, Period } from "../types";
import { uk } from "../locale";
import { addDays, sortTasks } from "../domain/planning";
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
  onAdd: () => void;
  onUseTemplate: (t: PersonalTask) => void;
};
export function PersonalBoard(p: Props) {
  const [view, setView] = useState("today"),
    [query, setQuery] = useState(""),
    [showDone, setShowDone] = useState(false),
    [period, setPeriod] = useState<Period>("Month");
  const [importing, setImporting] = useState(false);
  const [jiraTitle, setJiraTitle] = useState("");
  const [jiraUrl, setJiraUrl] = useState("");
  const current = p.tasks.filter((t) => !t.isTemplate),
    open = current.filter((t) => !t.completed && !t.disabled),
    templates = p.tasks.filter((t) => t.isTemplate);
  const views = [
    { id: "board", name: "Дошка", count: open.length },
    {
      id: "today",
      name: "Сьогодні",
      count: open.filter((t) => t.date <= p.today).length,
    },
    {
      id: "upcoming",
      name: "Найближчі 7 днів",
      count: open.filter(
        (t) => t.date > p.today && t.date <= addDays(p.today, 7),
      ).length,
    },
    { id: "all", name: "Усі завдання", count: open.length },
    { id: "templates", name: "Шаблони", count: templates.length },
  ];
  const libraryPeriods = (
    ["Day", "Month", "Quarter", "Year"] as Period[]
  ).filter((k) => templates.some((t) => t.category === k));
  const shownPeriod = libraryPeriods.includes(period)
    ? period
    : libraryPeriods[0];
  const relevant = current.filter(
    (t) =>
      (view === "today"
        ? t.date <= p.today && !t.disabled
        : view === "upcoming"
          ? t.date > p.today && t.date <= addDays(p.today, 7) && !t.disabled
          : true) &&
      t.title.toLocaleLowerCase("uk").includes(query.toLocaleLowerCase("uk")),
  );
  const rows = sortTasks(relevant.filter((t) => !t.completed)),
    completed = relevant.filter((t) => t.completed);
  const groups =
    view === "today"
      ? ([
          ["Прострочені", rows.filter((t) => t.date < p.today)],
          ["На сьогодні", rows.filter((t) => t.date === p.today)],
        ] as const)
      : view === "upcoming"
        ? ([["Заплановані на тиждень", rows]] as const)
        : ([
            ["Активні", rows.filter((t) => !t.disabled)],
            ["Призупинені", rows.filter((t) => t.disabled)],
          ] as const);
  return (
    <section className="personal-board">
      <div className="planning-toolbar"><button className="secondary" onClick={() => setImporting(v => !v)}>Додати з Jira вручну</button></div>
      {importing && <form className="jira-copy-form" onSubmit={e => { e.preventDefault(); if (!jiraTitle.trim()) return; p.onImportJira(jiraTitle.trim(), jiraUrl.trim()); setJiraTitle(""); setJiraUrl(""); setImporting(false); }}>
        <h2>Скопіюй назву тікета</h2>
        <p>Локальне завдання без підключення до Jira. Назву вставляєш самостійно; статус і зміни не синхронізуються.</p>
        <label>Назва тікета<input required maxLength={300} value={jiraTitle} onChange={e => setJiraTitle(e.target.value)} /></label>
        <label>Посилання на тікет (необов’язково)<input type="url" pattern="https://.*" placeholder="https://company.atlassian.net/browse/TEAM-123" value={jiraUrl} onChange={e => setJiraUrl(e.target.value)} /></label>
        <button className="primary" type="submit">Додати на сьогодні</button><button type="button" className="text-button" onClick={() => setImporting(false)}>Скасувати</button>
      </form>}
      <div
        className="task-view-tabs"
        role="tablist"
        aria-label="Списки завдань"
      >
        {views.map((v) => (
          <button
            key={v.id}
            role="tab"
            aria-selected={view === v.id}
            onClick={() => {
              setView(v.id);
              setQuery("");
            }}
          >
            {v.id === "templates" && <BookOpen size={15} />} {v.name}
            <span>{v.count}</span>
          </button>
        ))}
      </div>
      {view === "board" ? <PlanningBoard tasks={p.tasks} today={p.today} onSchedule={p.onSchedule} onEdit={p.onEdit} onToggle={p.onToggle} /> : view === "templates" ? (
        <>
          <div className="library-heading">
            <div>
              <h2>Справи, про які легко забути</h2>
              <p>
                Це ідеї, а не зобов’язання. Вони з’являться у твоєму списку лише
                після додавання.
              </p>
            </div>
          </div>
          <div className="period-tabs">
            {libraryPeriods.map((k) => (
              <button
                key={k}
                className={shownPeriod === k ? "active" : ""}
                onClick={() => setPeriod(k)}
              >
                {uk(k)}
              </button>
            ))}
          </div>
          <div className="template-library">
            {templates
              .filter((t) => t.category === shownPeriod)
              .map((t) => (
                <article key={t.id} data-cadence={taskCadence(t)}>
                  <div>
                    <strong>{t.title}</strong>
                    <small>{uk(t.recurrence)}</small>
                  </div>
                  <button
                    className="secondary"
                    aria-label={`Запланувати ${t.title}`}
                    onClick={() => p.onUseTemplate(t)}
                  >
                    <Plus size={15} />
                    Запланувати
                  </button>
                  <button
                    className="text-button"
                    aria-label={`Редагувати шаблон ${t.title}`}
                    onClick={() => p.onEdit(t)}
                  >
                    Змінити
                  </button>
                </article>
              ))}
            {!templates.some((t) => t.category === shownPeriod) && (
              <p className="board-empty">Для цього періоду шаблонів немає.</p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="task-list-toolbar">
            <label>
              <Search size={16} />
              <input
                aria-label="Пошук у завданнях"
                placeholder="Знайти завдання…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <span>Спочатку дата, потім важливість</span>
          </div>
          {groups.map(
            ([name, list]) =>
              list.length > 0 && (
                <section className="task-group" key={name}>
                  <h2>
                    {name}
                    <span>{list.length}</span>
                  </h2>
                  <TaskList
                    tasks={list}
                    today={p.today}
                    onToggle={p.onToggle}
                    onEdit={p.onEdit}
                    onPostpone={p.onPostpone}
                    onDelete={p.onDelete}
                  />
                </section>
              ),
          )}
          {rows.length === 0 && (!query || completed.length === 0) && (
            <div className="board-empty">
              <CheckCheck size={28} />
              <h2>
                {query ? "Нічого не знайдено" : "На цей період усе зроблено"}
              </h2>
              <p>
                {query
                  ? "Спробуй іншу назву."
                  : "Додай одну конкретну справу або заплануй її на інший день."}
              </p>
              <button className="primary" onClick={p.onAdd}>
                <Plus size={16} />
                Додати завдання
              </button>
            </div>
          )}
          {completed.length > 0 && (
            <div className="completed-group">
              <button
                className="text-button"
                onClick={() => setShowDone((v) => !v)}
              >
                <CheckCheck size={16} />
                {showDone ? "Приховати" : "Показати"} виконані ·{" "}
                {completed.length}
              </button>
              {showDone && (
                <TaskList
                  tasks={completed}
                  today={p.today}
                  onToggle={p.onToggle}
                  onEdit={p.onEdit}
                  onPostpone={p.onPostpone}
                  onDelete={p.onDelete}
                />
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

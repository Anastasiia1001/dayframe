import { useEffect, useRef, useId, useState, type CSSProperties } from "react";
import {
  CalendarDays,
  ListChecks,
  NotebookPen,
  Bell,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import type { DailyPlan } from "../dailyPlans";
import type { PersonalTask } from "../types";
import {
  addDays,
  dateKey,
  fromDate,
  moveDate,
  sortTasks,
} from "../domain/planning";
import { locale, shortDate } from "../locale";
import { TaskList } from "./TaskList";
import { RemindersEditor } from "./RemindersEditor";
type Panel = "date" | "tasks" | "notes" | "reminders";
type Props = {
  date: string;
  today: string;
  plan: DailyPlan;
  onUpdate: (patch: Partial<DailyPlan>) => void;
  onDate: (date: Date) => void;
  tasks: PersonalTask[];
  onTask: (t: PersonalTask) => void;
  onToggle: (t: PersonalTask) => void;
  onPostpone: (t: PersonalTask) => void;
  onDelete: (t: PersonalTask) => void;
  onAdd: () => void;
};
export function CalendarDock(p: Props) {
  const popupId=useId();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [month, setMonth] = useState(() => fromDate(p.date));
  const [position, setPosition] = useState({ left: 16, top: 16 });
  const popup = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const dock = useRef<HTMLDivElement>(null);
  const close = () => {
    popup.current?.hidePopover();
    setPanel(null);
    trigger.current?.focus();
  };
  useEffect(() => {
    if (!panel || !popup.current) return;
    const node = popup.current;
    if (!node.matches(":popover-open")) node.showPopover();
    const locate = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const w = Math.min(390, innerWidth - 24);
      const h = Math.min(node.scrollHeight, innerHeight - 32);
      setPosition({
        left: Math.max(12, Math.min(rect.left, innerWidth - w - 12)),
        top: Math.max(12, Math.min(rect.bottom + 8, innerHeight - h - 16)),
      });
    };
    locate();
    const observer = new ResizeObserver(locate);
    observer.observe(node);
    window.addEventListener("resize", locate);
    window.addEventListener("scroll", locate, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", locate);
      window.removeEventListener("scroll", locate, true);
    };
  }, [panel, p.date]);
  const entries = [
    {
      id: "date" as const,
      name: "Дата",
      title: "Перейти до дати",
      Icon: CalendarDays,
      count: undefined,
    },
    {
      id: "tasks" as const,
      name: "Справи",
      title: "Справи вибраного дня",
      Icon: ListChecks,
      count: p.tasks.filter((t) => !t.completed).length,
    },
    {
      id: "notes" as const,
      name: "Нотатки",
      title: "Нотатки вибраного дня",
      Icon: NotebookPen,
      count: p.plan.notes ? "•" : undefined,
    },
    {
      id: "reminders" as const,
      name: "Нагадування",
      title: "Нагадування вибраного дня",
      Icon: Bell,
      count: p.plan.reminders.filter((r) => !r.done).length,
    },
  ];
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const choose = (value: string) => {
    p.onDate(fromDate(value));
    close();
  };
  return (
    <div className="calendar-dock" ref={dock}>
      <div
        className="calendar-pocket-tabs"
        aria-label="Швидкі віконця календаря"
      >
        {entries.map(({ id, name, title, Icon, count }) => (
          <button
            key={id}
            aria-label={
              id === "date" ? "Відкрити мінікалендар" : `Відкрити: ${title}`
            }
            aria-haspopup="dialog"
              aria-controls={popupId}
            aria-expanded={panel === id}
            className={panel === id ? "pocket-active" : ""}
            onClick={(e) => {
              if (panel === id) {
                close();
                return;
              }
              trigger.current = e.currentTarget;
              if (id === "date") setMonth(fromDate(p.date));
              setPanel(id);
            }}
          >
            <Icon size={15} />
            <span>{name}</span>
            {count !== undefined && <small>{count}</small>}
          </button>
        ))}
      </div>
      <div
        ref={popup}
        id={popupId}
        popover="auto"
        className="calendar-pocket"
        role="dialog"
        aria-label={
          entries.find((e) => e.id === panel)?.title || "Віконце календаря"
        }
        style={{ left: position.left, top: position.top } as CSSProperties}
        onToggle={(e) => {
          if ((e.nativeEvent as ToggleEvent).newState === "closed")
            setPanel(null);
        }}
      >
        {panel && (
          <>
            <header className="pocket-header">
              <div>
                <h2>{entries.find((e) => e.id === panel)!.title}</h2>
                <small>{shortDate(p.date)}</small>
              </div>
              <button aria-label="Закрити віконце" onClick={close} autoFocus>
                <X size={18} />
              </button>
            </header>
            {panel === "date" && (
              <div className="mini-month">
                <div className="mini-month-heading">
                  <button
                    aria-label="Попередній місяць у віконці"
                    onClick={() => setMonth(moveDate(month, "Month", -1))}
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <strong>
                    {month.toLocaleDateString(locale, {
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                  <button
                    aria-label="Наступний місяць у віконці"
                    onClick={() => setMonth(moveDate(month, "Month", 1))}
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
                <div className="mini-weekdays">
                  {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((d) => (
                    <small key={d}>{d}</small>
                  ))}
                </div>
                <div className="mini-date-grid">
                  {Array.from({ length: 42 }, (_, i) => {
                    const key = addDays(dateKey(first), i);
                    return (
                      <button
                        key={key}
                        className={`${fromDate(key).getMonth() !== month.getMonth() ? "mini-outside" : ""} ${key === p.today ? "mini-today" : ""}`}
                        aria-label={`Обрати ${shortDate(key)}`}
                        aria-pressed={key === p.date}
                        aria-current={key === p.today ? "date" : undefined}
                        onClick={() => choose(key)}
                      >
                        {fromDate(key).getDate()}
                      </button>
                    );
                  })}
                </div>
                <div className="mini-date-footer">
                  <button className="secondary" onClick={() => choose(p.today)}>
                    Сьогодні
                  </button>
                  <label>
                    Точна дата
                    <input
                      aria-label="Точна дата у віконці"
                      type="date"
                      value={p.date}
                      onChange={(e) => {
                        if (e.target.value) choose(e.target.value);
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
            {panel === "tasks" && (
              <div className="pocket-content">
                <button
                  className="secondary"
                  onClick={() => {
                    close();
                    p.onAdd();
                  }}
                >
                  <Plus size={15} />
                  Додати справу на цю дату
                </button>
                {p.tasks.length ? (
                  <TaskList
                    tasks={sortTasks(p.tasks)}
                    today={p.today}
                    onToggle={p.onToggle}
                    onEdit={(t) => {
                      close();
                      p.onTask(t);
                    }}
                    onPostpone={p.onPostpone}
                    onDelete={p.onDelete}
                  />
                ) : (
                  <p className="pocket-empty">
                    На цю дату справ немає. Додай одну конкретну дію.
                  </p>
                )}
              </div>
            )}
            {panel === "notes" && (
              <div className="pocket-content">
                <label className="pocket-notes-label">
                  Думки й важливі дрібниці
                  <textarea
                    aria-label="Нотатки у віконці"
                    rows={9}
                    maxLength={12000}
                    value={p.plan.notes}
                    placeholder="Що хочеться пам’ятати?"
                    onChange={(e) => p.onUpdate({ notes: e.target.value })}
                  />
                </label>
                <small className="autosave-label">
                  Зберігається автоматично для цієї дати
                </small>
              </div>
            )}
            {panel === "reminders" && (
              <div className="pocket-content">
                <RemindersEditor
                  key={p.date}
                  reminders={p.plan.reminders}
                  onChange={(reminders) => p.onUpdate({ reminders })}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

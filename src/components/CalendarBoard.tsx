import {useDailyPlan} from "../dailyPlans";
import {CalendarDock} from "./CalendarDock";
import { CalendarCompanion } from "./CalendarCompanion";
import { DayPlanner } from "./DayPlanner";
import { themes, type MascotId } from "../appearance";
import { taskCadence } from "../taskCadence";
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Clock,
} from "lucide-react";
import type { CalendarEvent, PersonalTask } from "../types";
import { locale, shortDate } from "../locale";
import {
  dateKey,
  fromDate,
  addDays,
  moveDate,
  eventOnDay,
  layoutEvents,
} from "../domain/planning";
type Props = {
  theme: string;
  mascot: MascotId;
  onTheme: (theme: string) => void;
  events: CalendarEvent[];
  tasks: PersonalTask[];
  today: string;
  date: Date;
  onDate: (d: Date) => void;
  view: string;
  onView: (v: string) => void;
  filters: string[];
  onFilters: (s: string[]) => void;
  onEvent: (e: CalendarEvent) => void;
  onTask: (t: PersonalTask) => void;
  onPostpone: (t: PersonalTask) => void;
  onDelete: (t: PersonalTask) => void;
  onToggleTask: (t: PersonalTask) => void;
  onAdd: (date: string) => void;
  loading: boolean;
  hasCalendar: boolean;
  onConnect: () => void;
};
export function CalendarBoard(p: Props) {
  const [mobile, setMobile] = useState(() => innerWidth <= 600);
  const [compact, setCompact] = useState(() => innerWidth <= 1000);
  useEffect(() => {
    const media = matchMedia("(max-width:1000px)"),
      change = () => setCompact(media.matches);
    const small = matchMedia("(max-width:600px)");
    const changeSmall = () => setMobile(small.matches);
    media.addEventListener("change", change);
    small.addEventListener("change", changeSmall);
    return () => {
      media.removeEventListener("change", change);
      small.removeEventListener("change", changeSmall);
    };
  }, []);
  const pane = useRef<HTMLDivElement>(null);
  const key = dateKey(p.date);
  const {plan,update} = useDailyPlan(key);
  const first = new Date(p.date);
  if (p.view === "Month") first.setDate(1);
  if (p.view === "Month" || p.view === "Week")
    first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const days = Array.from(
    { length: p.view === "Month" ? 42 : p.view === "Week" ? 7 : 1 },
    (_, i) => addDays(dateKey(first), i),
  );
  const events = p.events.filter((e) => p.filters.includes(e.source));
  const tasks = p.tasks.filter(
    (t) =>
      !t.completed &&
      !t.disabled &&
      !t.isTemplate &&
      !t.inBacklog &&
      p.filters.includes("Personal"),
  );
  const positions = days.map((d) => layoutEvents(events, d));
  const startHour = Math.min(
    8,
    ...positions.flat().map((e) => Math.floor(e.start / 60)),
  );
  const endHour = Math.max(
    20,
    ...positions.flat().map((e) => Math.ceil(e.end / 60)),
  );
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => i + startHour,
  );
  useEffect(() => {
    if (pane.current) pane.current.scrollTop = 0;
  }, [p.view, key]);
  const selectDay = (d: string) => {
    p.onDate(fromDate(d));
    p.onView("Day");
  };
  const selectMonthDay = (d: string) => {
    if (mobile) p.onDate(fromDate(d));
    else selectDay(d);
  };
  const taskButton = (t: PersonalTask) => (
    <div key={t.id} className="calendar-task" data-cadence={taskCadence(t)}>
      <button
        aria-label={`Виконати ${t.title}`}
        onClick={() => p.onToggleTask(t)}
      >
        <span className="small-check" />
      </button>
      <button onClick={() => p.onTask(t)}>{t.title}</button>
    </div>
  );
  const eventChip = (e: CalendarEvent) => (
    <button
      aria-label={`${e.allDay ? "Увесь день" : e.start} · ${e.title} · ${e.source}`}
      className={`calendar-event source-${e.source.toLowerCase()}`}
      key={e.id}
      onClick={() => p.onEvent(e)}
    >
      <span className="calendar-event-time">
        {e.allDay ? "Увесь день" : e.start}
      </span>
      <strong>{e.title}</strong>
    </button>
  );
  const agenda = (day: string) => {
    const list = events.filter((e) => eventOnDay(e, day)),
      dailyTasks = tasks.filter((t) => t.date === day);
    return (
      <section className="agenda-day" key={day}>
        <button className="agenda-date" onClick={() => selectDay(day)}>
          <strong>
            {fromDate(day).toLocaleDateString(locale, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </strong>
          {day === p.today && <span>Сьогодні</span>}
        </button>
        {list.map((e) => (
          <button
            key={e.id}
            className={`agenda-event source-${e.source.toLowerCase()}`}
            onClick={() => p.onEvent(e)}
          >
            <time>
              {e.allDay ? "Увесь день" : e.date < day ? "00:00" : e.start}
              <small>
                {e.allDay ? "" : e.endDate && e.endDate > day ? "24:00" : e.end}
              </small>
            </time>
            <div>
              <strong>{e.title}</strong>
              <small>
                {e.accountLabel || e.source}
                {e.location &&
                !["No location", "Місце не вказано"].includes(e.location)
                  ? " · " + e.location
                  : ""}
              </small>
            </div>
          </button>
        ))}
        {dailyTasks.length > 0 && (
          <div className="agenda-tasks">
            <small>Завдання без часу</small>
            {dailyTasks.map(taskButton)}
          </div>
        )}
        {!list.length && !dailyTasks.length && (
          <p className="agenda-empty">
            Нічого не заплановано.
            <button onClick={() => p.onAdd(day)}>Додати завдання</button>
          </p>
        )}
      </section>
    );
  };
  const calendarContent =
    p.view === "Month" ? (
      <>
        <div className="month-weekdays">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="calendar-grid view-month">
          {days.map((day) => {
            const entries = events.filter((e) => eventOnDay(e, day)),
              dailyTasks = tasks.filter((t) => t.date === day);
            const total = entries.length + dailyTasks.length;
            return (
              <div
                className={`calendar-cell ${day === key ? "is-selected" : ""} ${day === p.today ? "is-today" : ""} ${fromDate(day).getMonth() !== p.date.getMonth() ? "outside-month" : ""}`}
                key={day}
              >
                <button
                  className="month-day"
                  aria-label={`Відкрити ${shortDate(day)}`}
                  aria-current={day === p.today ? "date" : undefined}
                  aria-pressed={day === key}
                  onClick={() => selectMonthDay(day)}
                >
                  {fromDate(day).getDate()}
                </button>
                {mobile && total > 0 && (
                  <button
                    className="month-indicators"
                    aria-label={`${entries.length} подій, ${dailyTasks.length} завдань`}
                    onClick={() => selectMonthDay(day)}
                  >
                    <span>
                      {entries.length > 0 && <i className="event-indicator" />}
                      {dailyTasks.length > 0 && (
                        <i className="task-indicator" />
                      )}
                    </span>
                    <small>{total}</small>
                  </button>
                )}
                {!mobile && entries.slice(0, 2).map(eventChip)}
                {!mobile &&
                  entries.length < 2 &&
                  dailyTasks.slice(0, 2 - entries.length).map(taskButton)}
                {!mobile && total > 2 && (
                  <button className="month-more" onClick={() => selectDay(day)}>
                    +{total - 2} ще
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {mobile && <div className="month-mobile-preview">{agenda(key)}</div>}
      </>
    ) : p.view === "Agenda" || (compact && p.view === "Week") ? (
      <div className="calendar-agenda">
        {(p.view === "Agenda"
          ? Array.from({ length: 7 }, (_, i) => addDays(key, i))
          : days
        ).map(agenda)}
      </div>
    ) : (
      <>
        <div
          className="time-day-head"
          style={{
            gridTemplateColumns: `48px repeat(${days.length},minmax(0,1fr))`,
          }}
        >
          <div
            className="time-zone-label"
            title={Intl.DateTimeFormat().resolvedOptions().timeZone}
          >
            <Clock size={14} />
          </div>
          {days.map((day) => (
            <button
              key={day}
              onClick={() => selectDay(day)}
              className={day === p.today ? "today" : ""}
              aria-pressed={day === key}
              aria-current={day === p.today ? "date" : undefined}
            >
              <small>
                {fromDate(day).toLocaleDateString(locale, {
                  weekday: "short",
                })}
              </small>
              <strong>{fromDate(day).getDate()}</strong>
            </button>
          ))}
        </div>
        <div
          className="untimed-band"
          style={{
            gridTemplateColumns: `48px repeat(${days.length},minmax(0,1fr))`,
          }}
        >
          <span>Без часу</span>
          {days.map((day) => (
            <div key={day}>
              {events
                .filter((e) => e.allDay && eventOnDay(e, day))
                .map(eventChip)}
              {p.view !== "Day" &&
                tasks
                  .filter((t) => t.date === day)
                  .slice(0, 3)
                  .map(taskButton)}
              {p.view !== "Day" &&
                tasks.filter((t) => t.date === day).length > 3 && (
                  <button
                    className="month-more"
                    onClick={() => {
                      p.onDate(fromDate(day));
                      p.onView("Agenda");
                    }}
                  >
                    Усі завдання · {tasks.filter((t) => t.date === day).length}
                  </button>
                )}
            </div>
          ))}
        </div>
        <div className="time-scroll" ref={pane}>
          <div
            className="time-canvas"
            style={{
              height: hours.length * 60,
              gridTemplateColumns: `48px repeat(${days.length},minmax(0,1fr))`,
            }}
          >
            <div className="time-axis">
              {hours.map((h) => (
                <span key={h} style={{ top: (h - startHour) * 60 }}>
                  {String(h).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            {days.map((day, i) => (
              <div
                className={`time-day ${day === p.today ? "is-today" : ""}`}
                key={day}
              >
                {hours.map((h) => (
                  <div
                    className="hour-line"
                    key={h}
                    style={{ top: (h - startHour) * 60 }}
                  />
                ))}
                {positions[i].map((pos) => (
                  <button
                    key={pos.event.id}
                    className={`calendar-event timed-event ${pos.end - pos.start < 45 ? "short-event" : ""} source-${pos.event.source.toLowerCase()}`}
                    title={`${pos.event.start}–${pos.event.end} · ${pos.event.title}`}
                    style={{
                      top: pos.start - startHour * 60,
                      height: Math.max(23, pos.end - pos.start - 2),
                      left: `calc(${(pos.column / pos.columns) * 100}% + 3px)`,
                      width: `calc(${100 / pos.columns}% - 6px)`,
                    }}
                    onClick={() => p.onEvent(pos.event)}
                  >
                    <span className="calendar-event-time">
                      {String(Math.floor(pos.start / 60)).padStart(2, "0")}:
                      {String(pos.start % 60).padStart(2, "0")}–
                      {String(Math.floor(pos.end / 60)).padStart(2, "0")}:
                      {String(pos.end % 60).padStart(2, "0")}
                    </span>
                    <strong>{pos.event.title}</strong>
                    {pos.end - pos.start >= 50 && (
                      <small>
                        {pos.event.accountLabel || pos.event.source}
                      </small>
                    )}
                  </button>
                ))}
                {day === p.today &&
                  new Date().getHours() >= startHour &&
                  new Date().getHours() < endHour && (
                    <div
                      className="now-line"
                      aria-label="Поточний час"
                      style={{
                        top:
                          new Date().getHours() * 60 +
                          new Date().getMinutes() -
                          startHour * 60,
                      }}
                    />
                  )}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  return (
    <section
      className={`calendar-board planner-view-${p.view.toLowerCase()} ${p.view === "Day" || (p.view === "Week" && !compact) ? "is-timed" : ""}`}
      aria-label="Календар"
    >
      <div className="planner-cover">
        <div className="planner-cover-title">
          <span className="planner-kicker">ПЕРСОНАЛЬНИЙ ПЛАНЕР</span>
          <h1>
            {p.date.toLocaleDateString(
              locale,
              p.view === "Day"
                ? { weekday: "long", day: "numeric", month: "long" }
                : { month: "long", year: "numeric" },
            )}
          </h1>
          <p>
            {p.view === "Day"
              ? "Один день. Достатньо місця для важливого."
              : "Твої зустрічі й справи, дбайливо впорядковані."}
          </p>
        </div>
        <CalendarCompanion theme={p.theme} mascot={p.mascot}/>
        <label className="planner-theme-picker">
          Оформлення
          <select
            aria-label="Оформлення планера"
            value={p.theme}
            onChange={(e) => p.onTheme(e.target.value)}
          >
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="calendar-top">
        <div className="calendar-controls">
          <button
            aria-label="Попередній період"
            onClick={() => p.onDate(moveDate(p.date, p.view, -1))}
          >
            <ChevronLeft size={19} />
          </button>
          <button onClick={() => p.onDate(new Date())}>Сьогодні</button>
          <button
            aria-label="Наступний період"
            onClick={() => p.onDate(moveDate(p.date, p.view, 1))}
          >
            <ChevronRight size={19} />
          </button>
        </div>
        <label className="date-jump">
          <CalendarDays size={14} />
          <span>{shortDate(key)}</span>
          <input
            aria-label="Перейти до дати"
            type="date"
            value={key}
            onClick={(e) => {
              try {
                e.currentTarget.showPicker?.();
              } catch {}
            }}
            onChange={(e) => {
              if (e.target.value) p.onDate(fromDate(e.target.value));
            }}
          />
        </label>
        <button className="primary" onClick={() => p.onAdd(key)}>
          <Plus size={15} />
          Завдання
        </button>
      </div>
      <div className="calendar-toolbar">
        <div className="segmented">
          {[
            ["Month", "Місяць"],
            ["Week", "Тиждень"],
            ["Day", "День"],
            ["Agenda", "Список"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={p.view === id ? "active" : ""}
              aria-pressed={p.view === id}
              onClick={() => p.onView(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="calendar-filters">
          {[
            ["Outlook", "Outlook"],
            ["Google", "Google"],
            ["Jira", "Jira"],
            ["Personal", "Завдання"],
          ]
            .filter(
              ([source]) =>
                source === "Personal" ||
                p.events.some((e) => e.source === source),
            )
            .map(([source, label]) => (
              <label key={source}>
                <input
                  type="checkbox"
                  checked={p.filters.includes(source)}
                  onChange={() =>
                    p.onFilters(
                      p.filters.includes(source)
                        ? p.filters.filter((s) => s !== source)
                        : [...p.filters, source],
                    )
                  }
                />
                <span
                  className={`calendar-source-dot source-${source.toLowerCase()}`}
                />
                {label}
              </label>
            ))}
        </div>
      </div>
      <CalendarDock date={key} today={p.today} plan={plan} onUpdate={update} onDate={p.onDate}
        tasks={p.tasks.filter(t=>!t.isTemplate && !t.inBacklog && !t.disabled && t.date===key)}
        onTask={p.onTask} onToggle={p.onToggleTask} onPostpone={p.onPostpone} onDelete={p.onDelete} onAdd={()=>p.onAdd(key)} />
      {!p.hasCalendar && !p.loading && (
        <div className="calendar-connection-hint">
          <CalendarDays size={17} />
          <span>
            Особисті завдання вже доступні. Для подій підключи календар.
          </span>
          <button onClick={p.onConnect}>Підключити</button>
        </div>
      )}
      {p.loading && (
        <div className="calendar-loading" role="status">
          Оновлюємо події…
        </div>
      )}
      {p.view === "Day" ? (
        <DayPlanner
          plan={plan} update={update}
          key={key}
          date={key}
          today={p.today}
          tasks={p.tasks.filter(
            (t) =>
              t.date === key &&
              !t.isTemplate &&
              !t.inBacklog &&
              !t.disabled &&
              p.filters.includes("Personal"),
          )}
          onTask={p.onTask}
          onToggle={p.onToggleTask}
          onAdd={() => p.onAdd(key)}
          onPostpone={p.onPostpone}
          onDelete={p.onDelete}
          schedule={calendarContent}
        />
      ) : (
        <div
          className={`planner-calendar-surface mode-${p.view.toLowerCase()}`}
        >
          {calendarContent}
        </div>
      )}
      <div className="calendar-caption">
        {Intl.DateTimeFormat().resolvedOptions().timeZone} · Події лише для
        читання · Завдання без часу показані окремо
      </div>
    </section>
  );
}

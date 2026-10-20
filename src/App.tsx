import { uk, locale, shortDate, plural } from "./locale";
import { nextOccurrence, reopenDueTasks } from "./recurrence";
import { IntegrationSettings } from "./components/IntegrationSettings";
import { useWorkspace } from "./useWorkspace";
import { CozyCompanion, HappyPetals } from "./components/CozyCompanion";
import { Source, Section } from "./components/Primitives";
import { useLocal } from "./useLocal";
import { useEffect, useState } from "react";
import {
  Sun,
  CalendarDays,
  BriefcaseBusiness,
  Check,
  Plus,
  Search,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  X,
  Video,
  MapPin,
  MoreHorizontal,
  Leaf,
  CircleHelp,
  Sparkles,
  CheckCheck,
  PanelLeftClose,
  MessageSquare,
  Circle,
  Trash2,
  Pencil,
  SkipForward,
} from "lucide-react";
import type { CalendarEvent, PersonalTask, Period } from "./types";

import { mockTasks } from "./data/mockTasks";

const nav = [
  ["Today", Sun],
  ["Calendar", CalendarDays],
  ["Work", BriefcaseBusiness],
  ["Personal", CheckCheck],
] as const;
const themes = [
  "Default",
  "Graphite",
  "Blue",
  "Green",
  "Purple",
  "Warm",
  "Dark",
  "Blossom",
];
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export default function App() {
  const [now, setNow] = useState(() => new Date());
  const today = dateKey(now);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const [displayName, setDisplayName] = useLocal("dayframe-display-name", "");
  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "♡";
  const [burst, setBurst] = useState(0);
  const [page, setPage] = useState("Today");
  const [theme, setTheme] = useLocal("dayframe-theme", "Default");
  const [tasks, setTasks] = useLocal<PersonalTask[]>(
    "dayframe-tasks",
    mockTasks,
  );
  useEffect(() => {
    setTasks((current) => reopenDueTasks(current, today));
  }, [today, tasks, setTasks]);
  const [period, setPeriod] = useState<Period>("Day");
  const [modal, setModal] = useState<PersonalTask | null>(null);
  const [detail, setDetail] = useState<{
    title: string;
    body: string;
    source: string;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [read, setRead] = useLocal<string[]>("dayframe-read", []);
  const [digestGroup, setDigestGroup] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filters, setFilters] = useLocal<string[]>("dayframe-filters", [
    "Outlook",
    "Google",
    "Personal",
  ]);
  const [calendarView, setCalendarView] = useState("Week");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [toast, setToast] = useState("");
  const [prefs, setPrefs] = useLocal("dayframe-prefs", {
    showPersonal: true,
    defaultRecurrence: "once",
    cozyMode: true,
  });
  const workspace = useWorkspace(
    page === "Calendar" ? calendarDate : new Date(),
  );
  const { events, slack } = workspace;
  const visibleEvents = events.filter(
    (e) =>
      e.date === today ||
      (e.allDay && e.date < today && !!e.endDate && e.endDate > today),
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setModal(null);
        setDetail(null);
        setNotifications(false);
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href),
      result = url.searchParams.get("connection");
    if (!result) return;
    if (result === "success") {
      workspace.setMode("live");
      setToast("Обліковий запис підключено. Оновлюємо дані.");
    } else if (result === "cancelled")
      setToast("Підключення скасовано. Спробуй ще раз у налаштуваннях.");
    url.searchParams.delete("connection");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);
  const openMock = (title: string, body: string, source: string) =>
    setDetail({ title, body, source });
  const openItem = (
    title: string,
    body: string,
    source: string,
    url?: string,
  ) => {
    if (workspace.mode === "live" && url) {
      try {
        const u = new URL(url);
        if (u.protocol === "https:") {
          window.open(u.href, "_blank", "noopener,noreferrer");
          return;
        }
      } catch {}
    }
    openMock(title, body, source);
  };
  const addTask = () =>
    setModal({
      id: crypto.randomUUID(),
      title: "",
      category: period,
      date: today,
      recurrence: prefs.defaultRecurrence,
      priority: "Normal",
      notes: "",
      completed: false,
      disabled: false,
    });
  const toggleTask = (t: PersonalTask) => {
    setTasks((ts) =>
      ts.map((x) =>
        x.id === t.id
          ? {
              ...x,
              completed: !x.completed,
              completedOn: x.completed ? undefined : today,
              nextOccurrence: x.completed
                ? undefined
                : nextOccurrence(x, today),
            }
          : x,
      ),
    );
    if (!t.completed) {
      setBurst((b) => b + 1);
      setToast("Маленька перемога. Ти молодець! ♡");
    }
  };
  const postpone = (t: PersonalTask) => {
    const d = new Date(`${shortDate(t.date)}T12:00:00`);
    d.setDate(d.getDate() + 1);
    setTasks((ts) =>
      ts.map((x) =>
        x.id === t.id
          ? {
              ...x,
              date: dateKey(d),
              completed: false,
              completedOn: undefined,
              nextOccurrence: undefined,
            }
          : x,
      ),
    );
    setToast(
      "Завдання перенесено на " +
        d.toLocaleDateString(locale, { month: "short", day: "numeric" }),
    );
  };
  const todaysTasks = tasks.filter(
    (t) => t.category === "Day" && !t.disabled && t.date <= today,
  );
  useEffect(() => {
    setTasks((current) => {
      let changed = false;
      const localized = current.map((t) => {
        if (!/^(Day|Month|Quarter|Year)-\d+$/.test(t.id)) return t;
        const title = uk(t.title);
        if (title === t.title) return t;
        changed = true;
        return { ...t, title };
      });
      return changed ? localized : current;
    });
  }, [setTasks]);
  const done = todaysTasks.filter((t) => t.completed).length;
  const taskRows = (list: PersonalTask[], full = false) => (
    <div className="task-list">
      {list.length === 0 && (
        <p className="empty">
          Тут усе зроблено. Додай те, про що хочеш подбати.
        </p>
      )}
      {list.map((t) => (
        <div
          className={`task-row ${t.completed ? "completed" : ""} ${t.disabled ? "disabled" : ""}`}
          key={t.id}
        >
          <button
            aria-label={`${t.completed ? "Позначити невиконаним" : "Виконати"} ${t.title}`}
            className={`checkbox ${t.completed ? "checked" : ""}`}
            onClick={() => toggleTask(t)}
          >
            {t.completed && <Check size={12} />}
          </button>
          <button className="task-title" onClick={() => setModal(t)}>
            {t.title}
            {full && (
              <small>
                {uk(t.recurrence)}
                {t.recurrence === "custom"
                  ? ` · кожні ${t.customDays || 2} ${plural(t.customDays || 2, "день", "дні", "днів")}`
                  : ""}{" "}
                · {shortDate(t.date)}
                {t.disabled ? " · Призупинено" : ""}
              </small>
            )}
          </button>
          {full ? (
            <div className="task-actions">
              <button
                aria-label={`Перенести ${t.title}`}
                onClick={() => postpone(t)}
              >
                <SkipForward size={15} />
              </button>
              <button
                aria-label={`Редагувати ${t.title}`}
                onClick={() => setModal(t)}
              >
                <Pencil size={14} />
              </button>
              <button
                aria-label={`Видалити ${t.title}`}
                onClick={() =>
                  setTasks((ts) => ts.filter((x) => x.id !== t.id))
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <span className="recurrence">{uk(t.recurrence)}</span>
          )}
        </div>
      ))}
    </div>
  );
  const schedule = (list: CalendarEvent[]) =>
    list.map((e, i) => (
      <button
        className={`event ${e.source === "Google" ? "google" : ""}`}
        key={e.id}
        onClick={() =>
          openItem(
            e.title,
            `${shortDate(e.date)} · ${e.start}–${e.end}\n${e.location}\n${e.participants.length ? e.participants.join(", ") : "Час для себе"}\n${e.reminder ? "Нагадування за 10 хвилин" : "Без нагадування"}`,
            e.source,
            e.url,
          )
        }
      >
        <div className="event-time">
          {e.start}
          <small>{e.allDay ? "" : e.end}</small>
        </div>
        <div className="event-line" />
        <div className="event-info">
          <strong>{e.title}</strong>
          <small>
            {e.location.includes("Teams") || e.location.includes("Meet") ? (
              <Video size={12} />
            ) : (
              <MapPin size={12} />
            )}{" "}
            {e.location}
          </small>
        </div>
        {e.participants.length > 1 ? (
          <div className="avatars">
            {e.participants.slice(0, 3).map((p, j) => (
              <span
                key={uk(p)}
                style={{ background: ["#e8e3da", "#dce4e1", "#e7dce3"][j] }}
              >
                {p[0]}
              </span>
            ))}
          </div>
        ) : (
          <span className="event-source">{e.accountLabel || e.source}</span>
        )}
        {e.date === today &&
          !e.allDay &&
          e.start > new Date().toTimeString().slice(0, 5) &&
          !list
            .slice(0, i)
            .some(
              (x) =>
                !x.allDay && x.start > new Date().toTimeString().slice(0, 5),
            ) && <span className="soon">НЕЗАБАРОМ</span>}
      </button>
    ));
  const digest = () => (
    <>
      <div className="digest-tabs">
        {["All", "Direct mentions", "Could help here"].map((g) => (
          <button
            className={digestGroup === g ? "active" : ""}
            key={uk(g)}
            onClick={() => setDigestGroup(g)}
          >
            {uk(g)}
            {g === "Direct mentions" && (
              <span>{slack.filter((s) => s.group === g).length}</span>
            )}
          </button>
        ))}
        <select
          aria-label="Категорія огляду"
          value={digestGroup}
          onChange={(e) => setDigestGroup(e.target.value)}
        >
          <option value="All">Усе</option>
          {slack.map((s) => (
            <option key={s.id} value={s.group}>
              {uk(s.group)}
            </option>
          ))}
        </select>
      </div>
      <div className="digest-list">
        {slack.length === 0 && (
          <div className="empty">
            <MessageSquare size={22} />
            <p>
              {workspace.mode === "live"
                ? "Дані Slack не завантажено. Підключи Slack у налаштуваннях або онови джерела."
                : "Відповідних повідомлень немає."}
            </p>
          </div>
        )}
        {slack
          .filter((s) => digestGroup === "All" || s.group === digestGroup)
          .map((s) => (
            <article key={s.id} className="digest-item">
              <button
                className="digest-toggle"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                <span
                  className={`digest-symbol ${s.group === "Could help here" ? "help-symbol" : ""}`}
                >
                  {s.group === "Could help here" ? (
                    <Sparkles size={16} />
                  ) : (
                    <MessageSquare size={16} />
                  )}
                </span>
                <div className="grow">
                  <div className="digest-meta">
                    <strong>{uk(s.group)}</strong>
                    <span>#{s.channel}</span>
                    <span>
                      {workspace.mode === "live"
                        ? new Date(s.time).toLocaleString(locale, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        : s.time}
                    </span>
                  </div>
                  <p>{s.summary}</p>
                </div>
                <ChevronRight
                  size={16}
                  className={expanded === s.id ? "rotate" : ""}
                />
              </button>
              {expanded === s.id && (
                <div className="digest-expanded">
                  <p>
                    <strong>{s.author}</strong> · {s.why}
                  </p>
                  <button
                    className="text-button"
                    onClick={() =>
                      openItem(
                        "#" + s.channel,
                        s.summary + "\n\n" + s.why,
                        "Slack",
                        s.url,
                      )
                    }
                  >
                    Відкрити у Slack <ArrowUpRight size={13} />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      if (tasks.some((t) => t.notes === s.id)) {
                        setToast("Уже є серед твоїх завдань");
                        return;
                      }
                      setTasks((ts) => [
                        ...ts,
                        {
                          id: crypto.randomUUID(),
                          title: s.summary,
                          category: "Day",
                          date: today,
                          recurrence: "once",
                          priority: "Normal",
                          notes: s.id,
                          completed: false,
                          disabled: false,
                        },
                      ]);
                      setToast("Додано до особистих завдань");
                    }}
                  >
                    <Plus size={13} />
                    Додати до завдань
                  </button>
                </div>
              )}
            </article>
          ))}
      </div>
    </>
  );
  const attention = slack
    .filter((s) => s.group === "Direct mentions")
    .slice(0, 3)
    .map((s) => ({
      id: s.id,
      source: "Slack",
      title: s.summary,
      summary: `#${s.channel} · ${s.author}`,
      badge: "Згадка",
      body: s.why,
      url: s.url,
    }));
  const notificationsList = [
    ...attention.map((a, i) => ({
      id: "mention-" + a.id,
      title: a.title,
      body: a.summary,
      source: a.source,
    })),
    ...visibleEvents.slice(0, 2).map((e) => ({
      id: e.id,
      title: e.title,
      body: `${e.start} · ${e.location}`,
      source: e.source,
    })),
    ...todaysTasks
      .filter((t) => !t.completed)
      .slice(0, 1)
      .map((t) => ({
        id: t.id,
        title: t.title,
        body: "Особисте завдання · " + uk(t.recurrence),
        source: "Personal",
      })),
  ];
  const searchGroups = [
    {
      source: "Calendar",
      items: events.map((x) => ({
        id: x.id,
        title: x.title,
        body: `${x.start} · ${x.source} · ${x.location}`,
      })),
    },
    {
      source: "Slack",
      items: slack.map((x) => ({
        id: x.id,
        title: x.summary,
        body: `#${x.channel} · ${x.author}`,
      })),
    },
    {
      source: "Personal",
      items: tasks.map((x) => ({
        id: x.id,
        title: x.title,
        body: `${uk(x.category)} · ${uk(x.recurrence)}`,
      })),
    },
  ].map((g) => ({
    ...g,
    items: g.items.filter((x) =>
      (x.title + " " + x.body).toLowerCase().includes(query.toLowerCase()),
    ),
  }));
  function calendar() {
    const d = new Date(calendarDate);
    let days: Date[] = [];
    if (calendarView === "Month") {
      d.setDate(1);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      days = Array.from({ length: 42 }, (_, i) => {
        const x = new Date(d);
        x.setDate(d.getDate() + i);
        return x;
      });
    } else if (calendarView === "Week") {
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      days = Array.from({ length: 7 }, (_, i) => {
        const x = new Date(d);
        x.setDate(d.getDate() + i);
        return x;
      });
    } else days = [d];
    return (
      <Section
        title={calendarDate.toLocaleDateString(locale, {
          month: "long",
          year: "numeric",
        })}
        action={
          <div className="calendar-controls">
            <button
              aria-label="Попередній період"
              onClick={() => {
                const d = new Date(calendarDate);
                calendarView === "Month"
                  ? d.setMonth(d.getMonth() - 1)
                  : d.setDate(d.getDate() - (calendarView === "Week" ? 7 : 1));
                setCalendarDate(d);
              }}
            >
              <ChevronLeft size={17} />
            </button>
            <button onClick={() => setCalendarDate(new Date())}>
              Сьогодні
            </button>
            <button
              aria-label="Наступний період"
              onClick={() => {
                const d = new Date(calendarDate);
                calendarView === "Month"
                  ? d.setMonth(d.getMonth() + 1)
                  : d.setDate(d.getDate() + (calendarView === "Week" ? 7 : 1));
                setCalendarDate(d);
              }}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        }
      >
        <div className="calendar-toolbar">
          <div className="segmented">
            {["Month", "Week", "Day"].map((v) => (
              <button
                key={uk(v)}
                className={calendarView === v ? "active" : ""}
                onClick={() => setCalendarView(v)}
              >
                {uk(v)}
              </button>
            ))}
          </div>
          <div className="calendar-filters">
            {["Outlook", "Google", "Personal"].map((s) => (
              <label key={uk(s)}>
                <input
                  type="checkbox"
                  checked={filters.includes(s)}
                  onChange={() =>
                    setFilters((f) =>
                      f.includes(s) ? f.filter((x) => x !== s) : [...f, s],
                    )
                  }
                />
                {uk(s)}
              </label>
            ))}
          </div>
        </div>
        <div className={`calendar-grid view-${calendarView.toLowerCase()}`}>
          {days.map((day) => {
            const key = dateKey(day);
            return (
              <div
                className={`calendar-cell ${key === today ? "is-today" : ""}`}
                key={key}
              >
                <div className="cell-date">
                  <small>
                    {day.toLocaleDateString(locale, { weekday: "short" })}
                  </small>
                  <b>{day.getDate()}</b>
                </div>
                {events
                  .filter(
                    (e) =>
                      (e.date === key ||
                        (e.allDay &&
                          e.date < key &&
                          !!e.endDate &&
                          e.endDate > key)) &&
                      filters.includes(e.source),
                  )
                  .map((e) => (
                    <button
                      className={`calendar-event ${e.source === "Google" ? "google" : ""}`}
                      key={e.id}
                      onClick={() =>
                        openItem(
                          e.title,
                          `${e.start}–${e.end} · ${e.location}`,
                          e.source,
                          e.url,
                        )
                      }
                    >
                      <small>
                        {e.start}–{e.end}
                      </small>
                      <strong>{e.title}</strong>
                      <small>{e.accountLabel || e.source}</small>
                    </button>
                  ))}
                {filters.includes("Personal") &&
                  tasks
                    .filter(
                      (t) => t.date === key && !t.disabled && !t.completed,
                    )
                    .map((t) => (
                      <button
                        className="calendar-task"
                        key={t.id}
                        onClick={() => setModal(t)}
                      >
                        ○ {t.title}
                      </button>
                    ))}
              </div>
            );
          })}
        </div>
      </Section>
    );
  }
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("Today");
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            ✿
          </span>
          dayframe<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-avatar">{initials}</span>
          <div>
            {displayName.trim()
              ? displayName.trim() + " — мій простір"
              : "Твій простір"}
            <small>Особистий простір</small>
          </div>
          <span className="workspace-chevron">⌄</span>
        </div>
        <div className="nav-label">ТВІЙ ПРОСТІР</div>
        <nav>
          {nav.map(([name, Icon]) => (
            <button
              key={uk(name)}
              className={page === name ? "selected" : ""}
              onClick={() => setPage(name)}
            >
              <Icon size={18} />
              {uk(name)}
              {name === "Today" && attention.length > 0 && (
                <span className="nav-count">{attention.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="nav-label">
          ТВОЇ ДЖЕРЕЛА{" "}
          <span>
            {workspace.mode === "demo"
              ? "ДЕМО"
              : workspace.status?.providers.filter((p) => p.connected).length ||
                0}
          </span>
        </div>
        <div className="connections">
          {["Outlook", "Google", "Slack"].map((s) => (
            <button key={uk(s)} onClick={() => setPage("Settings")}>
              <Source name={s} />
              {s === "Google"
                ? "Календар Google"
                : s === "Outlook"
                  ? "Календар Outlook"
                  : s}
              <i
                className={
                  workspace.mode === "live" &&
                  workspace.status?.providers.some(
                    (p) =>
                      (s === "Outlook"
                        ? p.id.startsWith("outlook-")
                        : p.id === s.toLowerCase()) && p.connected,
                  )
                    ? "connected"
                    : "disconnected"
                }
              />
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="quiet-note">
            <Leaf size={18} />
            <p>
              Трохи менше шуму.
              <br />
              <strong>Трохи більше радості. ♡</strong>
            </p>
          </div>
          <button
            onClick={() => setPage("Settings")}
            className={page === "Settings" ? "selected" : ""}
          >
            <Settings size={17} />
            Налаштування
          </button>
          <button
            onClick={() =>
              openMock(
                "Спокійний початок дня",
                "Dayframe збирає твій день в одному місці. Підключи Outlook, Календар Google і Slack у налаштуваннях або спробуй деморежим. Зовнішні джерела доступні лише для читання; Jira та Confluence вимкнені. Особисті завдання зберігаються в цьому браузері.",
                "Dayframe",
              )
            }
          >
            <CircleHelp size={17} />
            Допомога й перші кроки
            <ArrowUpRight size={13} />
          </button>
          <button className="profile" onClick={() => setPage("Settings")}>
            <span className="profile-avatar">{initials}</span>
            <span>
              {displayName.trim() || "Особистий профіль"}
              <small>Залиши місце для важливого</small>
            </span>
            <MoreHorizontal size={16} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <PanelLeftClose size={17} />
            <span className="crumb-divider" />
            Твій простір <ChevronRight size={13} />
            <strong>{uk(page)}</strong>
          </div>
          <div className="top-actions">
            <button
              className="search-trigger"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={16} />
              <span>Знайти щось…</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className="top-divider" />
            <button
              className="notification-trigger"
              aria-label="Сповіщення"
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={19} />
              {notificationsList.some((n) => !read.includes(n.id)) && <i />}
            </button>
            <button
              className="mini-avatar"
              onClick={() => setPage("Settings")}
              aria-label="Налаштування профілю"
            >
              {initials}
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="date-eyebrow">
                {new Date().toLocaleDateString(locale, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <h1>
                {page === "Today"
                  ? "Трохи ясності у твоєму дні."
                  : page === "Personal"
                    ? "Залиши місце для життя."
                    : page === "Work"
                      ? "Твоя робота — як на долоні."
                      : page === "Calendar"
                        ? "Трохи простору для планів."
                        : "Почувайся як удома."}
              </h1>
              <p>
                {page === "Today"
                  ? "Твій розклад, твої пріоритети й трохи простору для себе."
                  : page === "Personal"
                    ? "Маленькі справи. Більше спокою."
                    : page === "Work"
                      ? "Усе потрібне — без зайвого шуму."
                      : page === "Calendar"
                        ? "Робота, життя й усе між ними — в одному календарі."
                        : "Налаштуй Dayframe так, як зручно саме тобі."}
              </p>
            </div>
            {page === "Today" ? (
              <button
                className="today-date-chip"
                onClick={() => setPage("Calendar")}
              >
                <CalendarDays size={20} />
                <span>
                  Сьогодні
                  <small>
                    {visibleEvents.length}{" "}
                    {plural(visibleEvents.length, "подія", "події", "подій")} у
                    календарі
                  </small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ) : page === "Personal" ? (
              <button className="primary" onClick={addTask}>
                <Plus size={16} />
                Додати завдання
              </button>
            ) : null}
          </div>
          <div className="workspace-toolbar">
            <span
              className={`mode-badge ${workspace.mode === "demo" ? "demo" : ""}`}
            >
              <span className="live-dot" />
              {workspace.mode === "demo"
                ? "Демонстраційні дані"
                : "Власні дані"}
            </span>
            <span className="sync-time">
              {workspace.updated
                ? "Оновлено о " +
                  workspace.updated.toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : "Очікуємо підключення"}
            </span>
            <button
              className="secondary"
              onClick={() => void workspace.refresh()}
              disabled={workspace.loading}
            >
              {workspace.loading ? "Оновлюємо…" : "Оновити"}
            </button>
            <button className="primary quick-add" onClick={addTask}>
              <Plus size={16} />
              Додати завдання
            </button>
          </div>
          {prefs.cozyMode !== false && <CozyCompanion />}
          {workspace.errors.map((e) => (
            <div className="workspace-alert" key={e} role="status">
              <CircleHelp size={18} />
              <p>{e}</p>
              <button onClick={() => setPage("Settings")}>
                Підключення <ArrowRight size={15} />
              </button>
            </div>
          ))}
          {page === "Today" && (
            <>
              <div className="day-summary">
                <span>
                  <span className="summary-dot" />
                  ТВІЙ ДЕНЬ КОРОТКО
                </span>
                <div>
                  <CalendarDays size={15} />
                  <b>{visibleEvents.length}</b>{" "}
                  {plural(visibleEvents.length, "подія", "події", "подій")}
                  <span className="summary-divider" />
                  <Circle size={14} />
                  <b>{attention.length}</b>{" "}
                  {plural(attention.length, "згадка", "згадки", "згадок")}
                  <span className="summary-divider" />
                  <CheckCheck size={16} />
                  <b>{todaysTasks.filter((t) => !t.completed).length}</b>{" "}
                  {plural(
                    todaysTasks.filter((t) => !t.completed).length,
                    "особисте завдання",
                    "особисті завдання",
                    "особистих завдань",
                  )}
                </div>
                <span className="summary-end">
                  Одна справа за раз.
                  <Leaf size={14} />
                </span>
              </div>
              <div className="dashboard">
                <div className="dashboard-main">
                  <Section
                    title="Твій розклад"
                    eyebrow="ТРОХИ ПОРЯДКУ"
                    action={
                      <button
                        className="text-button"
                        onClick={() => setPage("Calendar")}
                      >
                        Відкрити календар <ArrowUpRight size={14} />
                      </button>
                    }
                  >
                    <div className="schedule-caption">
                      <span>
                        Сьогодні,{" "}
                        {new Date().toLocaleDateString(locale, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <div>
                        <i className="legend outlook" />
                        Outlook
                        <i className="legend google" />
                        Google
                      </div>
                    </div>
                    <div className="schedule-list">
                      {visibleEvents.length ? (
                        schedule(visibleEvents)
                      ) : (
                        <div className="empty schedule-empty">
                          <CalendarDays size={25} />
                          <strong>У твоєму дні є простір.</strong>
                          <p>
                            {workspace.mode === "live"
                              ? "Події на сьогодні не завантажено. Підключи Outlook або Календар Google у налаштуваннях."
                              : "На сьогодні подій не заплановано."}
                          </p>
                          <button
                            className="text-button"
                            onClick={() => setPage("Settings")}
                          >
                            Налаштувати календарі <ArrowRight size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="schedule-footer">
                      <Leaf size={14} />
                      <span>Час указано в часовому поясі твого пристрою.</span>
                    </div>
                  </Section>
                  <Section
                    title="Важливе для тебе у Slack"
                    eyebrow="ТВІЙ ОГЛЯД SLACK"
                    className="slack-card"
                    action={
                      <span className="ai-label">
                        <Sparkles size={13} />
                        {workspace.mode === "demo"
                          ? "Демонстраційний огляд"
                          : "Останні 24 години · Результати пошуку"}
                      </span>
                    }
                  >
                    {digest()}
                    <div className="card-footer">
                      <span>
                        {workspace.mode === "demo"
                          ? "Приклади оглядів для знайомства із застосунком."
                          : "Повідомлення лише для читання. Ти обираєш важливе."}
                      </span>
                      <button
                        className="text-button"
                        onClick={() => setPage("Work")}
                      >
                        Усі повідомлення <ArrowRight size={14} />
                      </button>
                    </div>
                  </Section>
                </div>
                <div className="dashboard-side">
                  <Section
                    title="Варте твоєї уваги"
                    action={
                      <span className="number-badge">{attention.length}</span>
                    }
                  >
                    <p className="section-description">
                      Кілька речей, які можна переглянути.
                    </p>
                    {attention.length === 0 && (
                      <p className="section-description">
                        Прямих згадок не завантажено. Нічого не позначається
                        пропущеним автоматично.
                      </p>
                    )}
                    {attention.map((a) => (
                      <button
                        className="attention-item"
                        key={a.source}
                        onClick={() =>
                          openItem(a.title, a.body, a.source, a.url)
                        }
                      >
                        <Source name={a.source} />
                        <div>
                          <div className="attention-source">
                            {a.source}
                            <span
                              className={a.badge === "На сьогодні" ? "due" : ""}
                            >
                              {uk(a.badge)}
                            </span>
                          </div>
                          <strong>{a.title}</strong>
                          <p>{a.summary}</p>
                        </div>
                        <ArrowUpRight size={13} />
                      </button>
                    ))}
                  </Section>
                  {prefs.showPersonal && (
                    <Section
                      title="Для тебе, поза роботою"
                      className="personal-card"
                      action={<Leaf size={18} />}
                    >
                      <div className="personal-caption">
                        <span>МОЇ ЗАВДАННЯ</span>
                        <span>
                          Виконано {done} із {todaysTasks.length}
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          style={{
                            width: `${todaysTasks.length ? (done / todaysTasks.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      {taskRows(todaysTasks)}
                      <button className="add-task-inline" onClick={addTask}>
                        <Plus size={15} />
                        Додати особисте завдання
                      </button>
                      <div className="card-footer">
                        <span>Маленькі справи теж важливі.</span>
                        <button
                          aria-label="Відкрити особисті завдання"
                          onClick={() => setPage("Personal")}
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </Section>
                  )}
                  <section className="review-card">
                    <span className="review-icon">
                      <Sun size={21} />
                    </span>
                    <div className="eyebrow">ПЕРЕД ЗАВЕРШЕННЯМ ДНЯ</div>
                    <h2>Заверши день зі спокоєм.</h2>
                    <p>
                      {attention.length}{" "}
                      {plural(
                        attention.length,
                        "пряма згадка для перегляду.",
                        "прямі згадки для перегляду.",
                        "прямих згадок для перегляду.",
                      )}
                      <br />
                      Невиконаних особистих завдань:{" "}
                      {todaysTasks.filter((t) => !t.completed).length}.
                    </p>
                    <button
                      onClick={() =>
                        openMock(
                          "Підсумки твого дня",
                          `Згадок для перегляду: ${attention.length}.\nНевиконаних особистих завдань: ${todaysTasks.filter((t) => !t.completed).length}.\n\n${attention.map((a) => a.title).join("\n")}\n\nЗустрічі не позначаються пропущеними автоматично. Невиконані завдання можна перенести в розділі «Особисте».`,
                          "Підсумки дня",
                        )
                      }
                    >
                      Переглянути підсумки дня <ArrowRight size={15} />
                    </button>
                  </section>
                </div>
              </div>
              <div className="page-footer">
                <span>
                  <span className="live-dot" />
                  {workspace.mode === "demo"
                    ? "Деморежим · Приклади активності"
                    : "Лише читання · Твої облікові записи залишаються твоїми"}
                </span>
                <span>Для дня з турботою про себе.</span>
              </div>
            </>
          )}
          {page === "Calendar" && calendar()}
          {page === "Personal" && (
            <>
              <div className="personal-intro">
                <Leaf size={20} />
                <span>
                  Місце для маленьких справ, які підтримують лад у житті.
                </span>
                <span className="muted">Твої списки, твій ритм.</span>
              </div>
              <div className="period-tabs">
                {(["Day", "Month", "Quarter", "Year"] as Period[]).map((p) => (
                  <button
                    className={period === p ? "active" : ""}
                    onClick={() => setPeriod(p)}
                    key={uk(p)}
                  >
                    {uk(p)}
                    <span>
                      {
                        tasks.filter(
                          (t) =>
                            t.category === p && !t.completed && !t.disabled,
                        ).length
                      }
                    </span>
                  </button>
                ))}
              </div>
              <Section
                title={
                  {
                    Day: "Щоденні справи",
                    Month: "Щомісячне оновлення",
                    Quarter: "Трохи сезонної турботи",
                    Year: "Важливе на рік",
                  }[period]
                }
                action={
                  <span className="muted">
                    Початкові списки можна редагувати
                  </span>
                }
              >
                {taskRows(
                  tasks.filter((t) => t.category === period),
                  true,
                )}
              </Section>
            </>
          )}
          {page === "Work" && (
            <div className="work-stack">
              <Section
                title="Slack · Важливе для тебе"
                action={
                  <span className="ai-label">
                    {workspace.mode === "demo"
                      ? "Демонстраційні огляди"
                      : "Лише читання · Без ШІ-огляду"}
                  </span>
                }
              >
                {digest()}
              </Section>
              <div className="disabled-work">
                <Source name="Jira" />
                <Source name="Confluence" />
                <p>
                  Jira та Confluence вимкнені. Доступ не запитується, дані не
                  завантажуються.
                </p>
              </div>
            </div>
          )}
          {page === "Settings" && (
            <div className="settings-stack">
              <Section title="Твій профіль">
                <label className="setting-row">
                  <div>
                    <strong>Ім’я у застосунку</strong>
                    <small>Зберігається лише в цьому браузері.</small>
                  </div>
                  <input
                    aria-label="Ім’я у застосунку"
                    maxLength={40}
                    placeholder="Твоє ім’я"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </label>
              </Section>
              <Section title="Оформлення" eyebrow="ТВІЙ ПРОСТІР, ТВІЙ СТИЛЬ">
                <p className="section-description">
                  Обери кольори під свій настрій.
                </p>
                <div className="theme-grid">
                  {themes.map((t, i) => (
                    <button
                      key={t}
                      className={`theme-choice ${theme === t ? "chosen" : ""}`}
                      onClick={() => setTheme(t)}
                    >
                      <span
                        className="theme-preview"
                        style={{
                          background: [
                            "#f7f8f5",
                            "#e9e9e9",
                            "#eff4f9",
                            "#eff5ef",
                            "#f4eff8",
                            "#faf2e9",
                            "#232827",
                            "#f6efff",
                          ][i],
                        }}
                      >
                        <i
                          style={{
                            background: [
                              "#63806d",
                              "#5c6570",
                              "#5079a6",
                              "#507b55",
                              "#8b6baa",
                              "#b88954",
                              "#9bb9a1",
                              "#a77dba",
                            ][i],
                          }}
                        />
                        <span />
                        <span />
                      </span>
                      <b>{uk(t)}</b>
                      {theme === t && <Check size={14} />}
                    </button>
                  ))}
                </div>
                <p className="muted">
                  Тема визначає кольори акцентів, фону, тексту, вибраних
                  елементів і календаря.
                </p>
              </Section>
              <IntegrationSettings workspace={workspace} />
              <Section title="Dayframe на твоєму Mac">
                <div className="mac-install">
                  <strong>Окреме вікно. Маленька квіточка в Dock.</strong>
                  <p>
                    У Safari на macOS Sonoma або новішій відкрий Dayframe та
                    вибери <b>Файл → Додати до Dock</b>. Для підключення
                    облікових записів використовуй серверну версію.
                  </p>
                  <small>
                    Вебзастосунок може мати окреме сховище: завдання не
                    переносяться автоматично. Окремого інсталятора .dmg поки
                    немає.
                  </small>
                  <a
                    href="https://github.com/Anastasiia1001/dayframe/blob/main/docs/MAC.md"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Як установити на Mac <ArrowUpRight size={14} />
                  </a>
                </div>
              </Section>
              <Section title="Особисті завдання">
                <label className="setting-row">
                  <div>
                    <strong>Показувати маленького помічника</strong>
                    <small>
                      Залиш трохи підтримки або приховай її, щоб зосередитися.
                    </small>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.cozyMode !== false}
                    onChange={(e) =>
                      setPrefs({ ...prefs, cozyMode: e.target.checked })
                    }
                  />
                </label>
                <label className="setting-row">
                  <div>
                    <strong>Показувати особисті завдання на сьогодні</strong>
                    <small>
                      Залиши трохи місця для життя поряд із роботою.
                    </small>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.showPersonal}
                    onChange={(e) =>
                      setPrefs({ ...prefs, showPersonal: e.target.checked })
                    }
                  />
                </label>
                <label className="setting-row">
                  <div>
                    <strong>Типове повторення</strong>
                    <small>Використовується для нових особистих завдань.</small>
                  </div>
                  <select
                    value={prefs.defaultRecurrence}
                    onChange={(e) =>
                      setPrefs({ ...prefs, defaultRecurrence: e.target.value })
                    }
                  >
                    {[
                      "once",
                      "daily",
                      "weekly",
                      "monthly",
                      "every 3 months",
                      "yearly",
                      "custom",
                    ].map((r) => (
                      <option key={r} value={r}>
                        {uk(r)}
                      </option>
                    ))}
                  </select>
                </label>
              </Section>
            </div>
          )}
        </main>
      </div>
      <nav className="mobile-nav">
        {nav.map(([n, I]) => (
          <button
            className={page === n ? "active" : ""}
            key={n}
            onClick={() => setPage(n)}
          >
            <I size={20} />
            <span>{uk(n)}</span>
          </button>
        ))}
        <button
          className={page === "Settings" ? "active" : ""}
          aria-label="Налаштування"
          onClick={() => setPage("Settings")}
        >
          <Settings size={20} />
          <span>Опції</span>
        </button>
      </nav>
      {notifications && (
        <>
          <div
            className="panel-scrim"
            onClick={() => setNotifications(false)}
          />
          <aside className="notification-panel">
            <div className="section-head">
              <h2>Сповіщення</h2>
              <button
                aria-label="Закрити сповіщення"
                onClick={() => setNotifications(false)}
              >
                <X size={18} />
              </button>
            </div>
            <button
              className="text-button"
              onClick={() => setRead(notificationsList.map((n) => n.id))}
            >
              <CheckCheck size={15} />
              Позначити все прочитаним
            </button>
            {notificationsList.length === 0 && (
              <p className="empty">
                Нових сповіщень немає. Можна трохи видихнути.
              </p>
            )}
            {notificationsList.map((n) => (
              <button
                key={n.id}
                className={`notification-item ${read.includes(n.id) ? "read" : ""}`}
                onClick={() => {
                  setRead((r) => [...r, n.id]);
                  openMock(n.title, n.body, n.source);
                }}
              >
                <Source name={n.source} />
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                </div>
                {!read.includes(n.id) && <i className="live-dot" />}
              </button>
            ))}
          </aside>
        </>
      )}
      {searchOpen && (
        <div className="overlay" onClick={() => setSearchOpen(false)}>
          <section
            className="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Пошук усюди"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-input">
              <Search size={20} />
              <input
                autoFocus
                placeholder="Пошук серед подій, повідомлень і завдань…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                aria-label="Закрити пошук"
                onClick={() => setSearchOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="search-results">
              {searchGroups.map(
                (g) =>
                  g.items.length > 0 && (
                    <div key={uk(g.source)}>
                      <div className="eyebrow">{uk(g.source)}</div>
                      {g.items.slice(0, 8).map((i) => (
                        <button
                          key={i.id}
                          onClick={() => {
                            setSearchOpen(false);
                            g.source === "Personal"
                              ? setModal(tasks.find((t) => t.id === i.id)!)
                              : openMock(i.title, i.body, g.source);
                          }}
                        >
                          <Source name={g.source} />
                          <div>
                            <strong>{i.title}</strong>
                            <small>{i.body}</small>
                          </div>
                          <ArrowUpRight size={14} />
                        </button>
                      ))}
                    </div>
                  ),
              )}
              {searchGroups.every((g) => !g.items.length) && (
                <p className="empty">
                  Нічого не знайдено за запитом «{query}». Спробуй назву, ім’я
                  або канал.
                </p>
              )}
            </div>
            <div className="search-foot">
              Пошук серед усіх доступних джерел <kbd>Esc — закрити</kbd>
            </div>
          </section>
        </div>
      )}
      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <form
            onInvalidCapture={(e) => {
              const field = e.target as HTMLInputElement;
              field.setCustomValidity(
                field.validity.valueMissing
                  ? "Заповни це поле."
                  : "Перевір значення цього поля.",
              );
            }}
            onInputCapture={(e) =>
              (e.target as HTMLInputElement).setCustomValidity?.("")
            }
            className="task-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Особисте завдання"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (!modal.title.trim()) return;
              setTasks((ts) =>
                ts.some((t) => t.id === modal.id)
                  ? ts.map((t) =>
                      t.id === modal.id
                        ? { ...modal, title: modal.title.trim() }
                        : t,
                    )
                  : [...ts, { ...modal, title: modal.title.trim() }],
              );
              setModal(null);
              setToast("Завдання збережено");
            }}
          >
            <div className="section-head">
              <div>
                <span className="eyebrow">МАЛЕНЬКА СПРАВА ДЛЯ СЕБЕ</span>
                <h2>
                  {tasks.some((t) => t.id === modal.id)
                    ? "Редагувати завдання"
                    : "Додати особисте завдання"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Закрити завдання"
                onClick={() => setModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            <label>
              Назва
              <input
                autoFocus
                required
                value={modal.title}
                placeholder="Про що хочеш подбати?"
                onChange={(e) => setModal({ ...modal, title: e.target.value })}
              />
            </label>
            <div className="form-grid">
              <label>
                Категорія
                <select
                  aria-label="Категорія"
                  value={modal.category}
                  onChange={(e) =>
                    setModal({ ...modal, category: e.target.value as Period })
                  }
                >
                  {["Day", "Month", "Quarter", "Year"].map((p) => (
                    <option key={p} value={p}>
                      {uk(p)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Дата
                <input
                  type="date"
                  required
                  value={modal.date}
                  onChange={(e) => setModal({ ...modal, date: e.target.value })}
                />
              </label>
              <label>
                Повторення
                <select
                  aria-label="Повторення"
                  value={modal.recurrence}
                  onChange={(e) =>
                    setModal({ ...modal, recurrence: e.target.value })
                  }
                >
                  {[
                    "once",
                    "daily",
                    "weekly",
                    "monthly",
                    "every 3 months",
                    "yearly",
                    "custom",
                  ].map((r) => (
                    <option key={r} value={r}>
                      {uk(r)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Пріоритет
                <select
                  aria-label="Пріоритет"
                  value={modal.priority}
                  onChange={(e) =>
                    setModal({ ...modal, priority: e.target.value })
                  }
                >
                  {["Low", "Normal", "High"].map((r) => (
                    <option key={r} value={r}>
                      {uk(r)}
                    </option>
                  ))}
                </select>
              </label>
              {modal.recurrence === "custom" && (
                <label>
                  Повторювати кожні (днів)
                  <input
                    type="number"
                    min="1"
                    required
                    value={modal.customDays || 2}
                    onChange={(e) =>
                      setModal({ ...modal, customDays: Number(e.target.value) })
                    }
                  />
                </label>
              )}
            </div>
            <label>
              Нотатки
              <textarea
                rows={3}
                value={modal.notes}
                onChange={(e) => setModal({ ...modal, notes: e.target.value })}
                placeholder="Що корисно пам’ятати"
              />
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={modal.disabled}
                onChange={(e) =>
                  setModal({ ...modal, disabled: e.target.checked })
                }
              />
              Призупинити це завдання
            </label>
            <div className="modal-footer">
              {tasks.some((t) => t.id === modal.id) && (
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    setTasks((ts) => ts.filter((t) => t.id !== modal.id));
                    setModal(null);
                  }}
                >
                  <Trash2 size={15} />
                  Видалити
                </button>
              )}
              <button
                type="button"
                className="secondary"
                onClick={() => setModal(null)}
              >
                Скасувати
              </button>
              <button className="primary" type="submit">
                Зберегти завдання <Check size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
      {detail && (
        <div className="overlay" onClick={() => setDetail(null)}>
          <section
            className="detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label={detail.title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="section-head">
              <span className="source-label">
                <Source name={detail.source} />
                {uk(detail.source)}
              </span>
              <button
                aria-label="Закрити подробиці"
                onClick={() => setDetail(null)}
              >
                <X size={20} />
              </button>
            </div>
            <h2>{detail.title}</h2>
            <p className="detail-body">{detail.body}</p>
            <div className="demo-notice">
              <CircleHelp size={16} />
              <span>
                {workspace.mode === "demo"
                  ? "Демонстраційний перегляд · Приклади даних."
                  : "Твій простір · Дані джерел лише для читання."}
              </span>
            </div>
            <button className="primary" onClick={() => setDetail(null)}>
              Зрозуміло <Check size={15} />
            </button>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      <HappyPetals burst={burst} />
    </div>
  );
}

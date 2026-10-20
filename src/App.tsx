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
      setToast("Account connected. Refreshing your sources.");
    } else if (result === "cancelled")
      setToast("Connection cancelled. You can try again in Settings.");
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
      setToast("A tiny win. Look at you go! ♡");
    }
  };
  const postpone = (t: PersonalTask) => {
    const d = new Date(`${t.date}T12:00:00`);
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
      "Task postponed to " +
        d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    );
  };
  const todaysTasks = tasks.filter(
    (t) => t.category === "Day" && !t.disabled && t.date <= today,
  );
  const done = todaysTasks.filter((t) => t.completed).length;
  const taskRows = (list: PersonalTask[], full = false) => (
    <div className="task-list">
      {list.length === 0 && (
        <p className="empty">
          All clear here. Add something you’d like to take care of.
        </p>
      )}
      {list.map((t) => (
        <div
          className={`task-row ${t.completed ? "completed" : ""} ${t.disabled ? "disabled" : ""}`}
          key={t.id}
        >
          <button
            aria-label={`${t.completed ? "Uncomplete" : "Complete"} ${t.title}`}
            className={`checkbox ${t.completed ? "checked" : ""}`}
            onClick={() => toggleTask(t)}
          >
            {t.completed && <Check size={12} />}
          </button>
          <button className="task-title" onClick={() => setModal(t)}>
            {t.title}
            {full && (
              <small>
                {t.recurrence}
                {t.recurrence === "custom"
                  ? ` · every ${t.customDays || 2} days`
                  : ""}{" "}
                · {t.date}
                {t.disabled ? " · Disabled" : ""}
              </small>
            )}
          </button>
          {full ? (
            <div className="task-actions">
              <button
                aria-label={`Postpone ${t.title}`}
                onClick={() => postpone(t)}
              >
                <SkipForward size={15} />
              </button>
              <button
                aria-label={`Edit ${t.title}`}
                onClick={() => setModal(t)}
              >
                <Pencil size={14} />
              </button>
              <button
                aria-label={`Delete ${t.title}`}
                onClick={() =>
                  setTasks((ts) => ts.filter((x) => x.id !== t.id))
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <span className="recurrence">
              {t.recurrence === "daily" ? "Daily" : t.recurrence}
            </span>
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
            `${e.date} · ${e.start}–${e.end}\n${e.location}\n${e.participants.length ? e.participants.join(", ") : "Time for yourself"}\n${e.reminder ? "Reminder: 10 minutes before" : "No reminder"}`,
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
                key={p}
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
            ) && <span className="soon">UP NEXT</span>}
      </button>
    ));
  const digest = () => (
    <>
      <div className="digest-tabs">
        {["All", "Direct mentions", "Could help here"].map((g) => (
          <button
            className={digestGroup === g ? "active" : ""}
            key={g}
            onClick={() => setDigestGroup(g)}
          >
            {g}
            {g === "Direct mentions" && (
              <span>{slack.filter((s) => s.group === g).length}</span>
            )}
          </button>
        ))}
        <select
          aria-label="Digest category"
          value={digestGroup}
          onChange={(e) => setDigestGroup(e.target.value)}
        >
          <option>All</option>
          {slack.map((s) => (
            <option key={s.id}>{s.group}</option>
          ))}
        </select>
      </div>
      <div className="digest-list">
        {slack.length === 0 && (
          <div className="empty">
            <MessageSquare size={22} />
            <p>
              {workspace.mode === "live"
                ? "No Slack activity loaded. Connect Slack in Settings, or refresh your sources."
                : "No matching activity."}
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
                    <strong>{s.group}</strong>
                    <span>#{s.channel}</span>
                    <span>
                      {workspace.mode === "live"
                        ? new Date(s.time).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
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
                    Open in Slack <ArrowUpRight size={13} />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      if (tasks.some((t) => t.notes === s.id)) {
                        setToast("Already in your tasks");
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
                      setToast("Added to your personal tasks");
                    }}
                  >
                    <Plus size={13} /> Add to tasks
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
      badge: "Mention",
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
        body: "Personal task · " + t.recurrence,
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
        body: `${x.category} · ${x.recurrence}`,
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
        title={calendarDate.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        })}
        action={
          <div className="calendar-controls">
            <button
              aria-label="Previous period"
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
            <button onClick={() => setCalendarDate(new Date())}>Today</button>
            <button
              aria-label="Next period"
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
                key={v}
                className={calendarView === v ? "active" : ""}
                onClick={() => setCalendarView(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="calendar-filters">
            {["Outlook", "Google", "Personal"].map((s) => (
              <label key={s}>
                <input
                  type="checkbox"
                  checked={filters.includes(s)}
                  onChange={() =>
                    setFilters((f) =>
                      f.includes(s) ? f.filter((x) => x !== s) : [...f, s],
                    )
                  }
                />
                {s}
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
                    {day.toLocaleDateString(undefined, { weekday: "short" })}
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
              ? displayName.trim() + "’s space"
              : "Your space"}
            <small>Personal workspace</small>
          </div>
          <span className="workspace-chevron">⌄</span>
        </div>
        <div className="nav-label">YOUR SPACE</div>
        <nav>
          {nav.map(([name, Icon]) => (
            <button
              key={name}
              className={page === name ? "selected" : ""}
              onClick={() => setPage(name)}
            >
              <Icon size={18} />
              {name}
              {name === "Today" && attention.length > 0 && (
                <span className="nav-count">{attention.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="nav-label">
          YOUR SOURCES{" "}
          <span>
            {workspace.mode === "demo"
              ? "DEMO"
              : workspace.status?.providers.filter((p) => p.connected).length ||
                0}
          </span>
        </div>
        <div className="connections">
          {["Outlook", "Google", "Slack"].map((s) => (
            <button key={s} onClick={() => setPage("Settings")}>
              <Source name={s} />
              {s === "Google"
                ? "Google Calendar"
                : s === "Outlook"
                  ? "Outlook Calendar"
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
              A little less noise.
              <br />
              <strong>A little more joy. ♡</strong>
            </p>
          </div>
          <button
            onClick={() => setPage("Settings")}
            className={page === "Settings" ? "selected" : ""}
          >
            <Settings size={17} />
            Settings
          </button>
          <button
            onClick={() =>
              openMock(
                "A calmer place to start",
                "Dayframe brings your day together. Connect Outlook, Google Calendar and Slack in Settings, or explore demo mode. External sources are read-only; Jira and Confluence are disabled. Your personal tasks stay in this browser.",
                "Dayframe",
              )
            }
          >
            <CircleHelp size={17} />
            Help & getting started
            <ArrowUpRight size={13} />
          </button>
          <button className="profile" onClick={() => setPage("Settings")}>
            <span className="profile-avatar">{initials}</span>
            <span>
              {displayName.trim() || "Personal profile"}
              <small>Make room for what matters</small>
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
            Your space <ChevronRight size={13} />
            <strong>{page}</strong>
          </div>
          <div className="top-actions">
            <button
              className="search-trigger"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={16} />
              <span>Search anything...</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className="top-divider" />
            <button
              className="notification-trigger"
              aria-label="Notifications"
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={19} />
              {notificationsList.some((n) => !read.includes(n.id)) && <i />}
            </button>
            <button
              className="mini-avatar"
              onClick={() => setPage("Settings")}
              aria-label="Profile settings"
            >
              {initials}
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="date-eyebrow">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <h1>
                {page === "Today"
                  ? "A little clarity for your day."
                  : page === "Personal"
                    ? "Make room for your life."
                    : page === "Work"
                      ? "Your work, in perspective."
                      : page === "Calendar"
                        ? "A little space to plan."
                        : "Make yourself at home."}
              </h1>
              <p>
                {page === "Today"
                  ? "Your schedule, your priorities, and a little room to breathe."
                  : page === "Personal"
                    ? "Small responsibilities. A lighter mind."
                    : page === "Work"
                      ? "The context you need, without all the noise."
                      : page === "Calendar"
                        ? "One view for work, life, and everything in between."
                        : "A few thoughtful choices to make Dayframe yours."}
              </p>
            </div>
            {page === "Today" ? (
              <button
                className="today-date-chip"
                onClick={() => setPage("Calendar")}
              >
                <CalendarDays size={20} />
                <span>
                  Today<small>{visibleEvents.length} calendar events</small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ) : page === "Personal" ? (
              <button className="primary" onClick={addTask}>
                <Plus size={16} /> Add task
              </button>
            ) : null}
          </div>
          <div className="workspace-toolbar">
            <span
              className={`mode-badge ${workspace.mode === "demo" ? "demo" : ""}`}
            >
              <span className="live-dot" />
              {workspace.mode === "demo" ? "Demo data" : "Live workspace"}
            </span>
            <span className="sync-time">
              {workspace.updated
                ? "Updated " +
                  workspace.updated.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Waiting for connections"}
            </span>
            <button
              className="secondary"
              onClick={() => void workspace.refresh()}
              disabled={workspace.loading}
            >
              {workspace.loading ? "Refreshing…" : "Refresh"}
            </button>
            <button className="primary quick-add" onClick={addTask}>
              <Plus size={16} />
              Add task
            </button>
          </div>
          {prefs.cozyMode !== false && <CozyCompanion />}
          {workspace.errors.map((e) => (
            <div className="workspace-alert" key={e} role="status">
              <CircleHelp size={18} />
              <p>{e}</p>
              <button onClick={() => setPage("Settings")}>
                Connections <ArrowRight size={15} />
              </button>
            </div>
          ))}
          {page === "Today" && (
            <>
              <div className="day-summary">
                <span>
                  <span className="summary-dot" /> YOUR DAY AT A GLANCE
                </span>
                <div>
                  <CalendarDays size={15} />
                  <b>{visibleEvents.length}</b> events
                  <span className="summary-divider" />
                  <Circle size={14} />
                  <b>{attention.length}</b> mentions
                  <span className="summary-divider" />
                  <CheckCheck size={16} />
                  <b>{todaysTasks.filter((t) => !t.completed).length}</b>{" "}
                  personal tasks
                </div>
                <span className="summary-end">
                  One thing at a time.
                  <Leaf size={14} />
                </span>
              </div>
              <div className="dashboard">
                <div className="dashboard-main">
                  <Section
                    title="Your schedule"
                    eyebrow="A LITTLE STRUCTURE"
                    action={
                      <button
                        className="text-button"
                        onClick={() => setPage("Calendar")}
                      >
                        Open calendar <ArrowUpRight size={14} />
                      </button>
                    }
                  >
                    <div className="schedule-caption">
                      <span>
                        Today,{" "}
                        {new Date().toLocaleDateString("en-US", {
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
                          <strong>Your day has room.</strong>
                          <p>
                            {workspace.mode === "live"
                              ? "No calendar events loaded for today. Connect Outlook or Google Calendar in Settings."
                              : "No events scheduled for today."}
                          </p>
                          <button
                            className="text-button"
                            onClick={() => setPage("Settings")}
                          >
                            Manage calendars <ArrowRight size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="schedule-footer">
                      <Leaf size={14} />
                      <span>
                        All times are shown in your device’s time zone.
                      </span>
                    </div>
                  </Section>
                  <Section
                    title="Your relevant Slack activity"
                    eyebrow="YOUR SLACK DIGEST"
                    className="slack-card"
                    action={
                      <span className="ai-label">
                        <Sparkles size={13} />
                        {workspace.mode === "demo"
                          ? "Demo summary"
                          : "Last 24 hours · Search results"}
                      </span>
                    }
                  >
                    {digest()}
                    <div className="card-footer">
                      <span>
                        {workspace.mode === "demo"
                          ? "Sample summaries, for exploration."
                          : "Read-only messages. You decide what matters."}
                      </span>
                      <button
                        className="text-button"
                        onClick={() => setPage("Work")}
                      >
                        All activity <ArrowRight size={14} />
                      </button>
                    </div>
                  </Section>
                </div>
                <div className="dashboard-side">
                  <Section
                    title="Worth your attention"
                    action={
                      <span className="number-badge">{attention.length}</span>
                    }
                  >
                    <p className="section-description">
                      A few things you may want to look at.
                    </p>
                    {attention.length === 0 && (
                      <p className="section-description">
                        No direct mentions loaded. Nothing is automatically
                        marked as missed.
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
                              className={a.badge === "Due today" ? "due" : ""}
                            >
                              {a.badge}
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
                      title="For you, outside of work"
                      className="personal-card"
                      action={<Leaf size={18} />}
                    >
                      <div className="personal-caption">
                        <span>MY TASKS</span>
                        <span>
                          {done} of {todaysTasks.length} done
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
                        Add a personal task
                      </button>
                      <div className="card-footer">
                        <span>Little things count, too.</span>
                        <button
                          aria-label="Open personal tasks"
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
                    <div className="eyebrow">BEFORE YOU CALL IT A DAY</div>
                    <h2>Leave with a clear mind.</h2>
                    <p>
                      {attention.length} direct mentions to review.
                      <br />
                      {todaysTasks.filter((t) => !t.completed).length} personal
                      tasks still open.
                    </p>
                    <button
                      onClick={() =>
                        openMock(
                          "Your daily review",
                          `${attention.length} direct mentions may need a look.\n${todaysTasks.filter((t) => !t.completed).length} personal tasks remain open.\n\n${attention.map((a) => a.title).join("\n")}\n\nNo meetings are automatically marked as missed. You can postpone unfinished tasks from Personal.`,
                          "Daily review",
                        )
                      }
                    >
                      Review your day <ArrowRight size={15} />
                    </button>
                  </section>
                </div>
              </div>
              <div className="page-footer">
                <span>
                  <span className="live-dot" />
                  {workspace.mode === "demo"
                    ? "Demo workspace · Sample activity"
                    : "Read-only connections · Your accounts stay yours"}
                </span>
                <span>Made for a more intentional day.</span>
              </div>
            </>
          )}
          {page === "Calendar" && calendar()}
          {page === "Personal" && (
            <>
              <div className="personal-intro">
                <Leaf size={20} />
                <span>
                  A home for the little things that keep life running.
                </span>
                <span className="muted">Your lists, your pace.</span>
              </div>
              <div className="period-tabs">
                {(["Day", "Month", "Quarter", "Year"] as Period[]).map((p) => (
                  <button
                    className={period === p ? "active" : ""}
                    onClick={() => setPeriod(p)}
                    key={p}
                  >
                    {p}
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
                    Day: "The everyday things",
                    Month: "A monthly reset",
                    Quarter: "A little seasonal care",
                    Year: "The bigger picture",
                  }[period]
                }
                action={<span className="muted">Editable starter library</span>}
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
                title="Slack · Your relevant activity"
                action={
                  <span className="ai-label">
                    {workspace.mode === "demo"
                      ? "Demo summaries"
                      : "Read-only · Not an AI digest"}
                  </span>
                }
              >
                {digest()}
              </Section>
              <div className="disabled-work">
                <Source name="Jira" />
                <Source name="Confluence" />
                <p>
                  Jira and Confluence are disabled. No access is requested and
                  no data is loaded.
                </p>
              </div>
            </div>
          )}
          {page === "Settings" && (
            <div className="settings-stack">
              <Section title="Your profile">
                <label className="setting-row">
                  <div>
                    <strong>Display name</strong>
                    <small>Only stored in this browser.</small>
                  </div>
                  <input
                    aria-label="Display name"
                    maxLength={40}
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </label>
              </Section>
              <Section title="Appearance" eyebrow="YOUR SPACE, YOUR STYLE">
                <p className="section-description">
                  Choose the palette that feels right for your day.
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
                      <b>{t}</b>
                      {theme === t && <Check size={14} />}
                    </button>
                  ))}
                </div>
                <p className="muted">
                  Theme controls accents, surfaces, text, selected states and
                  calendar colors.
                </p>
              </Section>
              <IntegrationSettings workspace={workspace} />
              <Section title="Dayframe on your Mac">
                <div className="mac-install">
                  <strong>Your own window. A little flower in the Dock.</strong>
                  <p>
                    In Safari on macOS Sonoma or later, open Dayframe and choose{" "}
                    <b>File → Add to Dock</b>. Use the hosted live workspace for
                    account connections.
                  </p>
                  <small>
                    Tasks may use a separate browser store; they are not
                    automatically transferred. A native .dmg installer is not
                    included.
                  </small>
                  <a
                    href="https://github.com/Anastasiia1001/dayframe/blob/main/docs/MAC.md"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mac installation guide <ArrowUpRight size={14} />
                  </a>
                </div>
              </Section>
              <Section title="Personal task preferences">
                <label className="setting-row">
                  <div>
                    <strong>Show the little companion</strong>
                    <small>
                      Keep a little encouragement, or hide it for more focus.
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
                    <strong>Show personal tasks on Today</strong>
                    <small>Keep a little room for life alongside work.</small>
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
                    <strong>Default recurrence</strong>
                    <small>Used when creating a new personal task.</small>
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
                      <option key={r}>{r}</option>
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
            <span>{n}</span>
          </button>
        ))}
        <button
          className={page === "Settings" ? "active" : ""}
          onClick={() => setPage("Settings")}
        >
          <Settings size={20} />
          <span>Settings</span>
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
              <h2>Notifications</h2>
              <button
                aria-label="Close notifications"
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
              Mark all as read
            </button>
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
            aria-label="Global search"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-input">
              <Search size={20} />
              <input
                autoFocus
                placeholder="Search your day, work, and life..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="search-results">
              {searchGroups.map(
                (g) =>
                  g.items.length > 0 && (
                    <div key={g.source}>
                      <div className="eyebrow">{g.source}</div>
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
                  No results for “{query}”. Try a title, person, or channel.
                </p>
              )}
            </div>
            <div className="search-foot">
              Search across all five sources <kbd>esc to close</kbd>
            </div>
          </section>
        </div>
      )}
      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <form
            className="task-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Personal task"
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
              setToast("Task saved");
            }}
          >
            <div className="section-head">
              <div>
                <span className="eyebrow">A LITTLE THING FOR YOU</span>
                <h2>
                  {tasks.some((t) => t.id === modal.id)
                    ? "Edit task"
                    : "Add a personal task"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close task"
                onClick={() => setModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            <label>
              Title
              <input
                autoFocus
                required
                value={modal.title}
                placeholder="What would you like to take care of?"
                onChange={(e) => setModal({ ...modal, title: e.target.value })}
              />
            </label>
            <div className="form-grid">
              <label>
                Category
                <select
                  aria-label="Category"
                  value={modal.category}
                  onChange={(e) =>
                    setModal({ ...modal, category: e.target.value as Period })
                  }
                >
                  {["Day", "Month", "Quarter", "Year"].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input
                  type="date"
                  required
                  value={modal.date}
                  onChange={(e) => setModal({ ...modal, date: e.target.value })}
                />
              </label>
              <label>
                Recurrence
                <select
                  aria-label="Recurrence"
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
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  aria-label="Priority"
                  value={modal.priority}
                  onChange={(e) =>
                    setModal({ ...modal, priority: e.target.value })
                  }
                >
                  {["Low", "Normal", "High"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              {modal.recurrence === "custom" && (
                <label>
                  Repeat every (days)
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
              Notes
              <textarea
                rows={3}
                value={modal.notes}
                onChange={(e) => setModal({ ...modal, notes: e.target.value })}
                placeholder="Anything useful to remember"
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
              Pause this task
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
                  <Trash2 size={15} /> Delete
                </button>
              )}
              <button
                type="button"
                className="secondary"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button className="primary" type="submit">
                Save task <Check size={15} />
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
                {detail.source}
              </span>
              <button
                aria-label="Close details"
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
                  ? "Demo preview · Sample data."
                  : "Your workspace · Read-only source data."}
              </span>
            </div>
            <button className="primary" onClick={() => setDetail(null)}>
              Got it <Check size={15} />
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
